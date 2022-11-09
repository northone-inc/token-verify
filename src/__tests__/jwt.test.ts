import createJWKSMock from 'mock-jwks'
import supertest from 'supertest'
import type Koa from 'koa'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { jwtClient as jwtSourceClient } from '../jwt'
import { createApp } from '../test-server'

type TJwksMock = ReturnType<typeof createJWKSMock>
type TRequest = supertest.SuperTest<supertest.Test>
type TServer = ReturnType<Koa<Koa.DefaultState, Koa.DefaultContext>['listen']>

const testAudience = 'private'
const testIssuers = ['primary', 'secondary']

class ImportError extends Error {}

describe('jwtClient', () => {
  let jwksMock: TJwksMock
  let request: TRequest
  let server: TServer
  let tokenClient: ReturnType<typeof jwtSourceClient>
  let client: typeof jwtSourceClient

  const createContext = () => {
    const jwksUri = 'https://test.com/.well-known/jwks.json'
    const jwksMock = createJWKSMock('https://test.com')
    const server = createApp({ jwksUri }).listen()
    const request = supertest(server)
    const tokenClient = client({
      audience: testAudience,
      issuer: testIssuers,
      jwksUri,
    })
    return {
      jwksMock,
      request,
      server,
      tokenClient,
    }
  }
  const tearDown = async ({ jwksMock, server }: { jwksMock: TJwksMock; server: TServer }) => {
    await server.close()
    await jwksMock.stop()
  }

  beforeAll(async () => {
    // If env var "VITEST_USE_DIST" has any truthy value (not "false" and not "0")
    // run tests against the built dist client instead of typescreipt
    // default is using default typescript client
    client = jwtSourceClient
    const sourceModulePath = '../../dist/jwt'
    if (process.env.VITEST_USE_DIST
        && process.env.VITEST_USE_DIST.length > 0
        && process.env.VITEST_USE_DIST.toString().toLowerCase() !== 'false'
        && process.env.VITEST_USE_DIST !== '0'
    ) {
      try {
        client = await import(sourceModulePath)
      }
      catch (e) {
        throw new ImportError(`Unable to import module ${sourceModulePath}. You must build first to process.env.DIST`)
      }
    }
  })

  beforeEach(() => {
    ({ jwksMock, server, request, tokenClient } = createContext())
  })
  afterEach(async () => await tearDown({ jwksMock, server }))

  describe('jwksMock', () => {
    it('should not get access without correct token', async () => {
      jwksMock.start()
      const { status } = await request.get('/')
      expect(status).toEqual(401)
    })

    it('should get access with mock token when jwksMock is running', async () => {
      jwksMock.start()
      const access_token = jwksMock.token({
        aud: testAudience,
        iss: testIssuers[0],
      })
      const { status } = await request.get('/').set('Authorization', `Bearer ${access_token}`)
      expect(status).toEqual(200)
    })
  })

  describe('token verify', () => {
    it.each(testIssuers)('should verify and decode token with valid audience and issuer', async (iss: string) => {
      jwksMock.start()
      const claims = {
        aud: testAudience,
        iss,
      }
      const accessToken = jwksMock.token(claims)
      const decodedToken = await tokenClient.verifyAndDecode(accessToken)
      expect(decodedToken).toEqual(expect.objectContaining(claims))
    })

    it('should throw an error if token is expired', async () => {
      jwksMock.start()
      const claims = {
        aud: testAudience,
        iss: testIssuers[0],
        exp: 0,
      }
      const accessToken = jwksMock.token(claims)
      try {
        await tokenClient.verifyAndDecode(accessToken)
      }
      catch (e) {
        expect(e).toMatchInlineSnapshot('[TokenExpiredError: jwt expired]')
      }
      expect.hasAssertions()
    })

    it('should throw an error if token audience is incorrect', async () => {
      jwksMock.start()
      const accessToken = jwksMock.token({
        aud: 'incorrect',
        iss: testIssuers[0],
      })
      try {
        await tokenClient.verifyAndDecode(accessToken)
      }
      catch (e) {
        expect(e).toMatchInlineSnapshot('[JsonWebTokenError: jwt audience invalid. expected: private]')
      }
      expect.hasAssertions()
    })

    it('should throw an error if token issuer is not valid', async () => {
      jwksMock.start()
      const accessToken = jwksMock.token({
        aud: testAudience,
        iss: 'incorrect',
      })
      try {
        await tokenClient.verifyAndDecode(accessToken)
      }
      catch (e) {
        expect(e).toMatchInlineSnapshot('[JsonWebTokenError: jwt issuer invalid. expected: primary,secondary]')
      }
      expect.hasAssertions()
    })
  })

  describe('token signature', () => {
    it('should throw an error if token signature is invalid', async () => {
      jwksMock.start()
      const accessToken = jwksMock.token({
        aud: testAudience,
        iss: testIssuers[0],
      })
      const [header, payload, signature] = accessToken.split('.')

      const invalidSignature = `${signature}nonsense`
      const invalidToken = [header, payload, invalidSignature].join('.')

      try {
        await tokenClient.verifyAndDecode(invalidToken)
      }
      catch (e) {
        expect(e).toMatchInlineSnapshot('[JsonWebTokenError: invalid signature]')
      }
      expect.hasAssertions()
    })
  })
})
