import * as jwtoken from 'jsonwebtoken'
import jwksRsa = require('jwks-rsa')

export class JwtClient {
  private jwksClient: jwksRsa.JwksClient
  private publicKey: string | undefined
  private audience: jwtoken.VerifyOptions['audience']
  private issuer: jwtoken.VerifyOptions['issuer']
  private jwt: jwtoken.VerifyOptions | undefined

  constructor({
    audience,
    jwksUri,
    issuer,
    jwks,
    jwt,
  }: {
    /**
     * The audience to be verified on incoming tokens
     */
    audience: jwtoken.VerifyOptions['audience']
    /**
     * The issuer(s) to be verified on incoming tokens
     */
    issuer: jwtoken.VerifyOptions['issuer']
    /**
     * URI where jwt public key is stored
     */
    jwksUri: jwksRsa.Options['jwksUri']
    /**
     * Advanced: Escape hatch to for full JwksClient options
     */
    jwks?: jwksRsa.Options
    /**
     * Advanced: Escape hatch to configure jwt with VerifyOptions
     */
    jwt?: jwtoken.VerifyOptions
  }) {
    this.jwksClient = jwksRsa({ jwksUri, ...(jwks || {}) })
    this.audience = audience
    this.issuer = issuer
    this.jwt = jwt
  }

  private async getPublicKey(): Promise<string> {
    if (this.publicKey) {
      return this.publicKey
    }

    try {
      const signingKeys = await this.jwksClient.getSigningKeys()

      if (!signingKeys || !signingKeys[0]) {
        throw new Error('No keys returned')
      }

      const keyInfo = signingKeys[0]
      this.publicKey = 'publicKey' in keyInfo ? keyInfo.publicKey : keyInfo.rsaPublicKey

      return this.publicKey
    }
    catch (e) {
      throw new Error(`Error gettings signing keys: ${e}`)
    }
  }

  public async verifyAndDecode(token: string): Promise<jwtoken.JwtPayload> {
    const pubKey = await this.getPublicKey()

    const decodedToken = jwtoken.verify(token, pubKey, {
      audience: this.audience,
      issuer: this.issuer,
      ...(this.jwt || {}),
    })
    if (typeof decodedToken === 'string') {
      throw new TypeError('Error verifying token')
    }

    return decodedToken
  }
}

export const hasClaim = (payload: jwtoken.JwtPayload, claim: string): boolean => {
  return claim in payload && payload[claim] !== undefined
}
