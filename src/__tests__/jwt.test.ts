import createJWKSMock from 'mock-jwks'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import * as SourceModule from '../jwt'

const testAudience = 'private'
const testIssuers = ['primary', 'secondary']

class ImportError extends Error {}

describe('jwtClient', async () => {
  let jwksMock: ReturnType<typeof createJWKSMock>
  // let tokenClient: ReturnType<typeof SourceModule.JwtClient>
  let tokenClient: SourceModule.JwtClient
  let Client = SourceModule.JwtClient

  // If env var "VITEST_USE_DIST" has any truthy value (not "false" and not "0")
  // run tests against the built dist client instead of typescreipt
  // default is using default typescript client
  const sourceModulePath = '../../dist/jwt'
  if (process.env.VITEST_USE_DIST
      && process.env.VITEST_USE_DIST.length > 0
      && process.env.VITEST_USE_DIST.toString().toLowerCase() !== 'false'
      && process.env.VITEST_USE_DIST !== '0'
  ) {
    try {
      const DistModule = await import(sourceModulePath)
      Client = DistModule.JwtClient
    }
    catch (e) {
      throw new ImportError(`Unable to import module ${sourceModulePath}. You must build first to process.env.DIST`)
    }
  }

  const createContext = () => {
    const jwksUri = 'https://test.com/.well-known/jwks.json'
    jwksMock = createJWKSMock('https://test.com')
    tokenClient = new Client({
      audience: testAudience,
      issuer: testIssuers,
      jwksUri,
    })
  }

  beforeEach(() => {
    createContext()
  })
  afterEach(async () => await jwksMock.stop())

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
