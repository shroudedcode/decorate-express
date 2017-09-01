import * as chai from 'chai'
const chaiHttp = require('chai-http')
import { expect } from 'chai'
import * as web from '../lib'
import * as express from 'express'
import * as supertest from 'supertest-as-promised'

chai.use(chaiHttp)

const methods = ['get', 'post', 'put', 'patch', 'del', 'options', 'head', 'use', 'all']


describe('The @route decorator', () => {
  class Test {
    @web.route('get', '/test') getTest() {}
  }

  const routes = web.getRoutes(new Test())
  const route = routes[0]

  it('should return the correct amount of routes',
    () => expect(routes).to.have.lengthOf(1))

  it('should assign the correct key',
    () => expect(route.key).to.equal('getTest'))

  it('should assign a handler',
    () => expect(route.handlers).to.have.lengthOf(1))

  it('should assign the correct method',
    () => expect(route.method.toLowerCase()).to.equal('get'))

  it('should assign the correct path',
    () => expect(route.path).to.equal('/test'))
})


describe('The method shortcut decorator', () => {
  for(let method of methods) {
    describe(`@${method}`, () => {
      const decorator = web[method]
      class Test {
        @decorator('/test') getTest() {}
      }
      const route = web.getRoutes(new Test())[0]
      it('should work',
        () => expect(route.method.toLowerCase()).to.equal(method))
    })
  }
})


describe('Multiple decorated routes', () => {
  class Test {
    @web.get('/test') getTest() {}
    @web.post('/test') postTest() {}
  }

  const routes = web.getRoutes(new Test())
  it('should work as well',
    () => expect(routes).to.have.lengthOf(2))
})


describe('The @basePath decorator', () => {
  @web.basePath('/test')
  class Test {
    @web.get('/foo') getTest() {}
  }

  const route = web.getRoutes(new Test())[0]
  it('should prepend all routes in the decorated class',
    () => expect(route.path).to.equal('/test/foo'))
})


describe('The @middleware decorator', () => {
  @web.basePath('/test')
  class Test {
    @web.middleware('testMiddleware')
    @web.get('/foo') getTest() {}

    testMiddleware() {}
  }

  const route = web.getRoutes(new Test())[0]
  it('should assign itself to routes',
    () => expect(route.handlers).to.have.lengthOf(2))
  it('should not affect @basePath\'s',
    () => expect(route.path).to.equal('/test/foo'))
})


describe('A decorated class', () => {
  @web.basePath('/test')
  class Test {
    bar = 'hello'

    @web.use()
    setup(request, response, next) {
      request.foo = 8
      it('should make default class properties accessible in @use middleware',
        () => expect(this.bar).to.equal('hello'))
      next()
    }

    @web.param('id')
    idParam(request, response, next, id) {
      request.params.id = parseInt(request.params.id)
      it('should make default class properties accessible in @param middleware',
        () => expect(this.bar).to.equal('hello'))
      next()
    }

    @web.get('/foo/:id')
    foo(request, response) {
      it('should make use of middleware decorated with @param when needed',
        () => expect(request.params.id).to.equal(5))
      it('should make use of middleware decorated with @use',
        () => expect(request.foo).to.equal(8))
      it('should make default class properties accessible in @param middleware',
        () => expect(this.bar).to.equal('hello'))
      response.send()
    }
  }

  const app = express()
  const controller = new Test()
  web.register(app, controller)

  it('should work without errors inside an express app', (done) => {
    chai.request(app)
      .get('/test/foo/5')
      .end((err, res) => {
        expect(err).to.be.null
        expect(res).to.have.status(200)
        done()
      })
  })
})
