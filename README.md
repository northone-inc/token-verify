> **Warning**
> This project is still experimental, not for production use - FEATURES MAY CHANGE WITHOUT WARNING

# Token Verifier
[![CI](https://github.com/northone-inc/token-verify/actions/workflows/ci.yml/badge.svg?event=push)](https://github.com/northone-inc/token-verify/actions/workflows/ci.yml)

This project exports a JWT client with capabilities to verify and decode tokens encrypted by RSA. The package uses [jsonwebtokens](https://www.npmjs.com/package/jsonwebtoken) and [jwks-rsa](https://www.npmjs.com/package/jwks-rsa).

## Usage Requirements
- Node 14 || 16 || 18

## Creating a JWT Client

To create a new client, provide the expected audience, public key issuer (jwksUri), and token issuers to the `jwtClient`.

```typescript
const client = new wtClient({
  audience: 'apiAudience',
  jwksUri: 'pub-key.auth-issuer.com/.well-known/jwks.json',
  issuer: ['primary-issuer.com', 'secondary-issuer.com'],
  // jwt: {... advanced options escape-hatch} 
  // jwks: {...advanced options escape-hatch}
})
```

### Verifying and Decoding Tokens

The `verifyAndDecode` method can by used by passing in the jwt as a single argument.

```typescript
const payload = client.verifyAndDecode(token)

//Check for custom claims using hasClaim method
const hasEmailVerifiedClaim = hasClaim(payload, 'emailVerified')
```

## [Contributors](CONTRIBUTORS.md)