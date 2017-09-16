import * as chai from 'chai'
const chaiHttp = require('chai-http')
import { expect } from 'chai'
import * as decorateExpress from '../lib'
import * as express from 'express'

const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1)

chai.use(chaiHttp)

const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'use', 'all']

describe('The @Route decorator', () => {
  class Test {
    @decorateExpress.Route('get', '/test') getTest() {}
  }

  const routes = decorateExpress.getRoutes(new Test())
  const route = routes[0]

  it('should return the correct amount of routes',
    () => expect(routes).to.have.lengthOf(1))

  it('should assign the correct key',
    () => expect(route.key).to.equal('getTest'))

  it('should assign a handler',
    () => expect(route.handlers).to.have.lengthOf(1))

  it('should assign the correct method',
    () => expect(route.method).to.equal('get'))

  it('should assign the correct path',
    () => expect(route.path).to.equal('/test'))
})


describe('The method shortcut decorator', () => {
  for(let method of methods) {
    const decoratorName = capitalize(method)
    describe(`@${decoratorName}`, () => {
      const Decorator = decorateExpress[decoratorName]
      class Test {
        @Decorator('/test') getTest() {}
      }
      const route = decorateExpress.getRoutes(new Test())[0]
      it('should work',
        () => expect(route.method).to.equal(method))
    })
  }
})


describe('Multiple decorated routes', () => {
  class Test {
    @decorateExpress.Get('/test') getTest() {}
    @decorateExpress.Post('/test') postTest() {}
  }

  const routes = decorateExpress.getRoutes(new Test())
  it('should work as well',
    () => expect(routes).to.have.lengthOf(2))
})


describe('The @BasePath decorator', () => {
  @decorateExpress.BasePath('/test')
  class Test {
    @decorateExpress.Get('/foo') getTest() {}
  }

  const route = decorateExpress.getRoutes(new Test())[0]
  it('should prepend all routes in the decorated class',
    () => expect(route.path).to.equal('/test/foo'))
})


describe('The @Middleware decorator', () => {
  @decorateExpress.BasePath('/test')
  class Test {
    @decorateExpress.Middleware('testMiddleware')
    @decorateExpress.Get('/foo') getTest() {}

    testMiddleware() {}
  }

  const route = decorateExpress.getRoutes(new Test())[0]
  it('should assign itself to routes',
    () => expect(route.handlers).to.have.lengthOf(2))
  it('should not affect @basePath\'s',
    () => expect(route.path).to.equal('/test/foo'))
})


describe('A decorated class', () => {
  @decorateExpress.BasePath('/test')
  class Test {
    bar = 'hello'
    tests: any = { cp: {}, mw: {}}

    @decorateExpress.Use()
    setup(request, response, next) {
      request.foo = 8
      this.tests.cp.use = expect(this.bar).to.equal('hello')
      next()
    }

    @decorateExpress.Param('id')
    idParam(request, response, next, id) {
      request.params.id = parseInt(request.params.id)
      this.tests.cp.param = expect(this.bar).to.equal('hello')
      next()
    }

    @decorateExpress.Get('/foo/:id')
    foo(request, response) {
      this.tests.mw.param = expect(request.params.id).to.equal(5)
      this.tests.mw.use = expect(request.foo).to.equal(8)
      this.tests.cp.get = expect(this.bar).to.equal('hello')
      response.send()
    }
  }

  const app = express()
  const controller = new Test()

  describe('should make default class properties available in routes with the', () => {
    it('@Use decorator',
      () => controller.tests.cp.use)
    it('@Param decorator',
      () => controller.tests.cp.param)
    it('@Get decorator',
      () => controller.tests.cp.get)
  })

  describe('should make use of the', () => {
    it('@Param middleware when needed',
      () => controller.tests.mw.param)
    it('@Use middleware',
      () => controller.tests.mw.use)
  })

  decorateExpress.registerRoutes(app, controller)

  it('should work without errors inside an Express app', (done) => {
    chai.request(app)
      .get('/test/foo/5')
      .end((err, res) => {
        expect(err).to.be.null
        expect(res).to.have.status(200)
        done()
      })
  })
})
