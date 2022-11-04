import JwksClient from 'jwks-rsa'
import * as jwt from 'jsonwebtoken'
import { CustomJWTPayload } from './types'

/**
 * @param param0
 * @returns
 */
export const jwtClient = ({
  audience,
  publicKeyIssuerDomain,
  otherIssuerDomains,
}: {
  audience: string
  publicKeyIssuerDomain: string
  otherIssuerDomains: string[]
}) => {
  const jwksClient = JwksClient({
    jwksUri: `https://${publicKeyIssuerDomain}/.well-known/jwks.json`,
  })
  let publicKey: string | undefined

  const getPublicKey = async (): Promise<string> => {
    if (publicKey) {
      return publicKey
    }

    const signingKeys = await jwksClient.getSigningKeys()
    if (!signingKeys || !signingKeys[0]) {
      throw new Error('No keys returned')
    }
    const keyInfo = signingKeys[0]

    publicKey = 'publicKey' in keyInfo ? keyInfo.publicKey : keyInfo.rsaPublicKey

    return publicKey
  }

  const verifyAndDecode = async <T extends {}>(
    token: string,
    onError?: (err: unknown) => void,
  ): Promise<CustomJWTPayload<T>> => {
    try {
      const pubKey = await getPublicKey()
      const decodedToken = jwt.verify(token, pubKey, {
        audience,
        issuer: [publicKeyIssuerDomain, ...otherIssuerDomains],
      }) as CustomJWTPayload<T>

      return decodedToken
    } catch (err) {
      onError && onError(err)
      throw err
    }
  }

  return {
    getPublicKey,
    verifyAndDecode,
  }
}
