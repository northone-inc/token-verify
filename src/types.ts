import { AuthResponseContext as WeakAuthResponseContext } from 'aws-lambda'

export const USER_CLAIM = 'https://northone.com/userId'
export const BUSINESS_CLAIM = 'https://northone.com/business'
export const TERMS_ACCEPTED_CLAIM = 'https://northone.com/termsAccepted'
export const EMAIL_VERIFIED_CLAIM = 'https://northone.com/emailVerified'
export const TOKEN_TYPE_CLAIM = 'https://northone.com/tokenType'
export const NORTHONE_CLAIMS = [
  USER_CLAIM,
  BUSINESS_CLAIM,
  TERMS_ACCEPTED_CLAIM,
  EMAIL_VERIFIED_CLAIM,
  TOKEN_TYPE_CLAIM,
]

export interface JWTPayload {
  iss: string
  sub: string
  aud: string
  iat: number
  exp: number
  azp: string
  scope: string
  gty: string
}

export interface RATPayload extends JWTPayload {
  [EMAIL_VERIFIED_CLAIM]: boolean
  [TERMS_ACCEPTED_CLAIM]: boolean
}

export interface BATPayload extends RATPayload {
  [TOKEN_TYPE_CLAIM]: 'BAT'
  [BUSINESS_CLAIM]: string
  [USER_CLAIM]: string
}

export type TokenClaims = Partial<keyof BATPayload>
export type PartialBat = Partial<BATPayload>

/**
 * More accurate AuthResponseContext than the type provided by aws-sdk.
 * This type constrains the values to boolean | number | string.
 *
 * https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-lambda-authorizer-output.html
 */
export interface AuthResponseContext extends WeakAuthResponseContext {
  [key: string]: boolean | number | string | undefined
}

export interface InternalNorthOneAuthorizerResponseContext extends AuthResponseContext {
  bearerToken: string
  emailVerified?: boolean
  termsAccepted?: boolean
  businessId?: string
  userId?: string
  scope?: string
}
