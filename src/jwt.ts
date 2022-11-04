import JwksClient from 'jwks-rsa'
import * as jwt from 'jsonwebtoken'
import {
  BATPayload,
  InternalNorthOneAuthorizerResponseContext,
  JWTPayload,
  NORTHONE_CLAIMS,
  PartialBat,
  RATPayload,
  TokenClaims,
} from './types'

export const ALLOWED_ISSUERS = (AUTH0_DOMAIN: string, NORTHONE_AUTH_DOMAIN: string) => [
  `https://${AUTH0_DOMAIN}/`,
  `https://${NORTHONE_AUTH_DOMAIN}/`,
]

const NORTHONE_DOMAIN = 'https://northone.com/'

const auth0JwksClient = (AUTH0_DOMAIN: string) =>
  JwksClient({
    jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
  })

let auth0PublicKey: string | undefined
/**
 * Return the public key used to verify an Auth0 JWT
 */
const getAuth0PublicKey = async (AUTH0_DOMAIN: string): Promise<string> => {
  const client = auth0JwksClient(AUTH0_DOMAIN)
  if (auth0PublicKey) {
    return auth0PublicKey
  }

  const signingKeys = await client.getSigningKeys()
  if (!signingKeys || !signingKeys[0]) {
    throw new Error('No keys returned')
  }
  const keyInfo = signingKeys[0]

  auth0PublicKey = 'publicKey' in keyInfo ? keyInfo.publicKey : keyInfo.rsaPublicKey

  return auth0PublicKey
}

export const decodeAndVerifyJWT = async ({
  token,
  AUTH0_AUDIENCE,
  AUTH0_DOMAIN,
  NORTHONE_AUTH_DOMAIN,
}: {
  token: string
  AUTH0_AUDIENCE: string
  AUTH0_DOMAIN: string
  NORTHONE_AUTH_DOMAIN: string
}): Promise<JWTPayload | RATPayload | BATPayload> => {
  const pubKey = await getAuth0PublicKey(AUTH0_DOMAIN)
  const decodedToken = jwt.verify(token, pubKey, {
    audience: AUTH0_AUDIENCE,
    issuer: [AUTH0_DOMAIN, NORTHONE_AUTH_DOMAIN],
  }) as JWTPayload | RATPayload | BATPayload

  return decodedToken
}

export const hasClaim = (payload: PartialBat, claim: TokenClaims): claim is TokenClaims => claim in payload

const getField = (claim: TokenClaims) => {
  let field
  if (claim.includes(NORTHONE_DOMAIN)) {
    field = claim.split(NORTHONE_DOMAIN)[1]
  }
  if (claim.includes('business') || claim.includes('user')) {
    field += 'Id'
  }
  return field || claim
}

export const introspectToken = ({
  tokenPayload,
  bearerToken,
}: {
  tokenPayload: PartialBat
  bearerToken: string
}): InternalNorthOneAuthorizerResponseContext => {
  const res: InternalNorthOneAuthorizerResponseContext = { bearerToken }

  for (const claim of [...NORTHONE_CLAIMS, 'scope'] as TokenClaims[]) {
    if (hasClaim(tokenPayload, claim)) {
      res[getField(claim)] = tokenPayload[claim]
    }
  }

  return res
}
