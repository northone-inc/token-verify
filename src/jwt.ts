import * as jwks from 'jwks-rsa'
import * as jwt from 'jsonwebtoken'

export interface JwtPayload extends jwt.JwtPayload {
  iss: string
  sub: string
  aud: string | string[]
  iat: number
  exp: number
  azp: string
  scope: string
  gty: string | string[]
  [k: string]: any
}

/**
 * Adds custom claims to base JWT payload
 */
export type CustomJwtPayload<T extends {}> = T & JwtPayload

export const jwtClient = ({
  audience,
  jwksUri,
  issuer,
}: {
  /**
   * JWT Audience defines...
   */
  audience: jwt.VerifyOptions['audience']
  /**
   * JWT Issuer defines..
   */
  issuer: jwt.VerifyOptions['issuer']
  /**
   * Format without https or trailing backslash, i.e 'issuerdomain.com'
   */
  jwksUri: jwks.Options['jwksUri']
  /**
   * Advanced: Escape catch to for full JwksClient options
   */
  jwks?: jwks.Options
  /**
   * Advanced: Escape catch to configure jwt with VerifyOptions
   */
  jwt?: jwt.VerifyOptions
}) => {
  const jwksClient = new jwks.JwksClient({ jwksUri, ...(jwks || {}) })
  let publicKey: string | undefined

  const getPublicKey = async (): Promise<string> => {
    if (publicKey)
      return publicKey

    const signingKeys = await jwksClient.getSigningKeys()

    if (!signingKeys || !signingKeys[0]) {
      throw new Error('No keys returned')
    }

    const keyInfo = signingKeys[0]
    publicKey = 'publicKey' in keyInfo ? keyInfo.publicKey : keyInfo.rsaPublicKey

    return publicKey
  }

  const verifyAndDecode = async <T extends {}>(token: string): Promise<CustomJwtPayload<T>> => {
    const pubKey = await getPublicKey()

    const decodedToken = jwt.verify(token, pubKey, {
      audience,
      issuer,
      ...(jwt || {}),
    }) as CustomJwtPayload<T>

    return decodedToken
  }

  return {
    verifyAndDecode,
  }
}
