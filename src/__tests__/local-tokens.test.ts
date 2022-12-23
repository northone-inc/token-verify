import { LocalTokenServer } from 'local-tokens'
import { describe, expect, it } from 'vitest'
import { JwtClient } from '../jwt'

describe('local-tokens', () => {
  it('should work', async () => {
    const audience = 'apiAudience'
    const server = new LocalTokenServer(audience)
    const { jwksUri, issuerUri } = await server.start()
    const client = new JwtClient({
      audience,
      jwksUri,
      issuer: [issuerUri],
    })

    const { ClientCredentials } = await server.buildClients()
    const res = await ClientCredentials.getToken({
      scope: 'email',
    })

    const token = res.token.access_token
    const decoded = await client.verifyAndDecode(token)
    expect(decoded).toBeTruthy()
    expect(decoded.aud).toContain(audience)
    expect(decoded.scope).toContain('email')
  })
})
