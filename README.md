# decorate-express

> This is a fork of [@stewartml](https://github.com/stewartml)'s [express-decorators](https://github.com/stewartml/express-decorators) package which is no longer actively maintained.

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

### `basePath(path: string)`

Class decorator to add a base path to every route defined in the class.

### `middleware(fn: Middleware)`

If `fn` is a function, then the function is added as route-specific middleware for the action.  Note that the middleware will be bound to the controller instance.

If `fn` is a string, then the method with that name will be exectued as route-specific middleware when the action is invoked.


### `route(method: string, path: string, middleware: Middleware[])`

Marks the method as a handler for the specified path and http method.  The `route` parameter is just passed straight to the relevant express method, so whatever is valid there is valid here.

There are shortcuts for the methods below.  I.e., instead of `route('get', '/')` you can use `get('/')`.

 * `all`
 * `delete` (called `del` so it compiles)
 * `get`
 * `options`
 * `param`
 * `patch`
 * `post`
 * `put`
 * `use`

### `getRoutes(target: Object): Route[]`

Gets the route metadata for the target object.  Paths are automatically prefixed with a base path if one was defined.

### `register(router: Express.Router, target: Object)`

Registers the routes found on the target object with an express Router instance.

## Questions, comments?

Please feel free to start an issue or offer a pull request.
