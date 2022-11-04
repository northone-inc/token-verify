import JwksClient from 'jwks-rsa'
import * as jwt from 'jsonwebtoken'
import { CustomJWTPayload } from './types'

const jwksClient = (ISSUER_DOMAIN: string) =>
  JwksClient({
    jwksUri: `https://${ISSUER_DOMAIN}/.well-known/jwks.json`,
  })

let publicKey: string | undefined

/**
 *
 * @param ISSUER_DOMAIN The domain returning the public key - `https://${ISSUER_DOMAIN}/.well-known/jwks.json`
 * @returns publicKey
 */
const getPublicKey = async (ISSUER_DOMAIN: string): Promise<string> => {
  const client = jwksClient(ISSUER_DOMAIN)
  if (publicKey) {
    return publicKey
  }

  const signingKeys = await client.getSigningKeys()
  if (!signingKeys || !signingKeys[0]) {
    throw new Error('No keys returned')
  }
  const keyInfo = signingKeys[0]

  publicKey = 'publicKey' in keyInfo ? keyInfo.publicKey : keyInfo.rsaPublicKey

  return publicKey
}

export const verifyAndDecodeJWT = async <T extends {}>({
  token,
  audience,
  publicKeyIssuerDomain,
  otherIssuerDomains,
  onError,
}: {
  token: string
  audience: string
  publicKeyIssuerDomain: string
  otherIssuerDomains: string[]
  onError?: (err: unknown) => void
}): Promise<CustomJWTPayload<T>> => {
  try {
    const pubKey = await getPublicKey(publicKeyIssuerDomain)
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

export const hasClaim = <T extends {}>(payload: CustomJWTPayload<T>, claim: any): claim is keyof CustomJWTPayload<T> =>
  claim in payload
