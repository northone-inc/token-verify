import JwksClient from 'jwks-rsa'
import * as jwt from 'jsonwebtoken'
import { CustomJWTPayload } from './types'

export const jwtClient = ({
  audience,
  jwksUri,
  issuers,
}: {
  audience: string
  /**
   * Format without https or trailing backslash, i.e 'issuerdomain.com'
   */
  jwksUri: string
  issuers: string[]
}) => {
  const jwksClient = JwksClient({
    jwksUri,
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

  const verifyAndDecode = async <T extends {}>(token: string): Promise<CustomJWTPayload<T>> => {
    const pubKey = await getPublicKey()

    const decodedToken = jwt.verify(token, pubKey, {
      audience,
      issuer: issuers,
    }) as CustomJWTPayload<T>

    return decodedToken
  }

  return {
    verifyAndDecode,
  }
}
