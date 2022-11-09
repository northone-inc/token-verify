import * as jwks from 'jwks-rsa'
import * as jwt from 'jsonwebtoken'

export const jwtClient = ({
  audience,
  jwksUri,
  issuer,
}: {
  /**
   * The intended audience to verify on incoming tokens
   */
  audience: jwt.VerifyOptions['audience']
  /**
   * The intended issuer(s) to verify on incoming tokens
   */
  issuer: jwt.VerifyOptions['issuer']
  /**
   * URI where jwt public key is stored
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

  const verifyAndDecode = async (token: string): Promise<string | jwt.JwtPayload> => {
    const pubKey = await getPublicKey()

    const decodedToken = jwt.verify(token, pubKey, {
      audience,
      issuer,
    })
    return decodedToken
  }


  return {
    verifyAndDecode,
  }
}
