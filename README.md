# Token Verifier

This project exports a JWT client with capabilities to verify and decode tokens encrypted by RSA. The package uses [jsonwebtokens](https://www.npmjs.com/package/
jsonwebtoken) and [jwks-rsa](https://www.npmjs.com/package/jwks-rsa).

## Usage Requirements
- Node 14 || 16 || 18

## Creating a JWT Client

To create a new client, provide the expected audience, public key issuer (jwksUri), and token issuers to the `jwtClient`.

```typescript
const client = jwtClient({
  audience: 'apiAudience',
  jwksUri: 'pub-key.auth-issuer.com/.well-known/jwks.json',
  issuer: ['primary-issuer.com', 'secondary-issuer.com'],
  // jwt: {... advanced options escape-hatch} 
  // jwks: {...advanced options escape-hatch}
})
```

### Verifying and Decoding Tokens

The `verifyAndDecode` method can by used by passing in the jwt as a single argument.

It accepts a generic response type which extends the base JWT claims.

```typescript
interface CustomPayload {
  buyPizzaClaim?: boolean
}

const payload = client.verifyAndDecode<CustomPayload>(token)

//Editor can now use intellisense for custom payload
const buyPizzaClaimValue = payload?.buyPizzaClaim

//Inferred payload type will include base JWT claims
const aud = payload.aud
```

## [Contributors](CONTRIBUTORS.md)