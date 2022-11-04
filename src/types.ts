export interface JWTPayload {
  iss: string
  sub: string
  aud: string | string[]
  iat: number
  exp: number
  azp: string
  scope: string
  gty: string | string[]
}

export type CustomJWTPayload<T extends {}> = T & JWTPayload
