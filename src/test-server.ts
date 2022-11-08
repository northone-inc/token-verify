import Koa from 'koa'
import Router from 'koa-router'
import jwt from 'koa-jwt'
import JwksRsa from 'jwks-rsa'
import { jwtClient } from './jwt'

export const createApp = ({ jwksUri }: { jwksUri: string }) => {
  const app = new Koa()
  app.use(
    jwt({
      secret: JwksRsa.koaJwtSecret({
        cache: false,
        jwksUri,
      }),
      audience: 'private',
      issuer: ['primary', 'secondary'],
      algorithms: ['RS256'],
    }),
  )

  const tokenClient = jwtClient({
    audience: 'private',
    jwksUri,
    issuers: ['master'],
  })

  const router = new Router()
  router
    .get('/', (ctx) => {
      ctx.body = 'Authenticated!'
    })
    .get('/verifyAndDecode', async (ctx) => {
      const token = ctx.header.authorization?.split('Bearer ')[1]
      if (!token) {
        throw new Error('No token in auth header')
      }
      try {
        const decodedToken = await tokenClient.verifyAndDecode(token)
        ctx.body = decodedToken
      } catch (err: any) {
        ctx.status = 400
        ctx.body = { error: err }
      }
    })

  app.use(router.routes())
  app.use(router.middleware())
  return app
}
