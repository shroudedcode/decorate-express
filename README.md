# decorate-express [![Travis CI](https://img.shields.io/travis/shroudedcode/decorate-express.svg)](https://travis-ci.org/shroudedcode/decorate-express) [![NPM](https://img.shields.io/npm/v/decorate-express.svg)](https://npm.im/decorate-express)

> This is a fork of [@stewartml](https://github.com/stewartml)'s no longer actively maintained [`express-decorators` package](https://github.com/stewartml/express-decorators).

Decorators for easily wiring up controller classes to [Express](http://expressjs.com/) routes.

## Installation

```
$ npm install --save express-decorators
```

## Example

```js
import * as web from 'decorate-express'
import myMiddlewareFunction from './middleware'
import express from 'express'

@web.basePath('/test')
public class TestController {
  constructor(target) {
    this.target = target
  }

  @web.get('/hello', myMiddlewareFunction)
  async sayHelloAction(request, response) {
    response.send(`Hello, ${this.target}!`)
  }

  @web.use()
  async otherMiddleware(request, response, next) {
    // This middleware will be called for every action.
    next()
  }
}

let app = express()
let test = new TestController('world')
web.register(app, test)
```

When can now go to `/test/hello` and get `Hello, world!` back.

## Notes

 * Actions are called with the correct context (i.e. `this` is an instance of the class).
 * Actions can return [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)'s or be [`async` functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) and errors will get handled properly.


## API

### `@basePath(path: string)`

Class decorator to add a base path to every route defined in the class.

### `@middleware(fn: Middleware)`

If `fn` is a function, then the function is added as route-specific middleware for the action.  Note that the middleware will be bound to the controller instance.

If `fn` is a string, then the method with that name will be exectued as route-specific middleware when the action is invoked.

### `@param(param: string)`

Marks the method as a handler for all routes that use the specified parameter. This can be useful if you want to do something with it before it's passed on to the actual route handler, for example converting a string to an integer:

```js
@param('id')
idParam(request, response, next, id) {
  request.params.id = parseInt(request.params.id)
  next()
}
```

### `@route(method: string, path: string, middleware: Middleware[])`

Marks the method as a handler for the specified path and HTTP method.

#### HTTP method shortcuts

Instead of passing the HTTP method into the `@route` decorator you can also use one of the provided shortcuts. `@get('/path')` for example is equivalent to `@route('get', '/path')`.

 * `@all`
 * `@del` (not `@delete` because of [the `delete` operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/delete))
 * `@get`
 * `@options`
 * `@patch`
 * `@post`
 * `@put`
 * `@use`

### `getRoutes(target: Object): Route[]`

Gets the route metadata for the target object. Paths are automatically prefixed with a base path if one was defined.

### `register(router: Express.Router, target: Object)`

Registers the routes found on the target object with an express Router instance.

## Questions, comments?

Please feel free to start an issue or offer a pull request.
