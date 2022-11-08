import { createApp } from '../test-server'
import createJWKSMock from 'mock-jwks'
import supertest from 'supertest'
import Koa from 'koa'
import { jwtClient } from '../jwt'

type TJwksMock = ReturnType<typeof createJWKSMock>
type TRequest = supertest.SuperTest<supertest.Test>
type TServer = ReturnType<Koa<Koa.DefaultState, Koa.DefaultContext>['listen']>

const createContext = () => {
  const jwksUri = 'https://northone-test.auth0.com/.well-known/jwks.json'
  const jwksMock = createJWKSMock('https://northone-test.auth0.com')
  const server = createApp({ jwksUri }).listen()
  const request = supertest(server)
  const tokenClient = jwtClient({
    audience: 'private',
    issuers: ['primary', 'secondary'],
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

describe('jwtClient', () => {
  let jwksMock: TJwksMock
  let request: TRequest
  let server: TServer
  let tokenClient: ReturnType<typeof jwtClient>

  beforeEach(() => {
    ;({ jwksMock, server, request, tokenClient } = createContext())
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
        aud: 'private',
        iss: 'primary',
      })
      const { status } = await request.get('/').set('Authorization', `Bearer ${access_token}`)
      expect(status).toEqual(200)
    })
  })

  describe('token verify', () => {
    it.each(['primary', 'secondary'])(
      'should verify and decode token with valid audience and issuer',
      async (iss: string) => {
        jwksMock.start()
        const claims = {
          aud: 'private',
          iss,
        }
        const accessToken = jwksMock.token(claims)
        const decodedToken = await tokenClient.verifyAndDecode(accessToken)
        expect(decodedToken).toEqual(expect.objectContaining(claims))
      },
    )

    it('should throw an error if token is expired', async () => {
      jwksMock.start()
      const claims = {
        aud: 'private',
        iss: 'primary',
        exp: 0,
      }
      const accessToken = jwksMock.token(claims)
      try {
        await tokenClient.verifyAndDecode(accessToken)
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`[TokenExpiredError: jwt expired]`)
      }
      expect.hasAssertions()
    })

    it('should throw an error if token audience is incorrect', async () => {
      jwksMock.start()
      const claims = {
        aud: 'incorrect',
        iss: 'primary',
      }
      const accessToken = jwksMock.token(claims)
      try {
        await tokenClient.verifyAndDecode(accessToken)
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`[JsonWebTokenError: jwt audience invalid. expected: private]`)
      }
      expect.hasAssertions()
    })

    it('should throw an error if token issuer isn not valid', async () => {
      jwksMock.start()
      const claims = {
        aud: 'private',
        iss: 'incorrect',
      }
      const accessToken = jwksMock.token(claims)
      try {
        await tokenClient.verifyAndDecode(accessToken)
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`[JsonWebTokenError: jwt issuer invalid. expected: primary,secondary]`)
      }
      expect.hasAssertions()
    })
  })

  describe('token signature', () => {
    it('should throw an error if token signature is invalid', async () => {
      jwksMock.start()
      const accessToken =
        jwksMock.token({
          aud: 'private',
          iss: 'primary',
        }) + 'L89EeDgZiD94m'

      try {
        await tokenClient.verifyAndDecode(accessToken)
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`[JsonWebTokenError: invalid signature]`)
      }
      expect.hasAssertions()
    })
  })
})
