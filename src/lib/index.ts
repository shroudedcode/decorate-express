import * as Express from 'express'
import 'reflect-metadata'

export class RouteMetadata {
  method: string
  path: string
  key: string | symbol
  handlers: (Express.Handler | Express.RequestParamHandler)[]
}


export type Middleware = Express.Handler | string | symbol

export const routesKey = Symbol('routesKey')
export const basePathKey = Symbol('basePathKey')


export function getRouteMetadata(target) {
  let routes: RouteMetadata[] = Reflect.getMetadata(routesKey, target)

  if (!routes) {
    routes = []
    Reflect.defineMetadata(routesKey, routes, target)
  }

  return routes
}


export function Route(method: string, path: string, middleware: Middleware[] = []) {
  return <T extends Express.Handler>(target: Object, key: string | symbol, descriptor: TypedPropertyDescriptor<T>) => {
    let routes = getRouteMetadata(target)

    let handlers = <Express.Handler[]> middleware
      .map((m) => getMiddleware(target, m))

    routes.push({method, path, key, handlers: [...handlers, descriptor.value]})
    return descriptor
  }
}


export function BasePath(path: string) {
  return Reflect.metadata(basePathKey, path)
}


export function Get(path: string = '*', middleware: Middleware[] = []) {
  return Route('get', path, middleware)
}


export function Post(path: string = '*', middleware: Middleware[] = []) {
  return Route('post', path, middleware)
}


export function Put(path: string = '*', middleware: Middleware[] = []) {
  return Route('put', path, middleware)
}


export function Patch(path: string = '*', middleware: Middleware[] = []) {
  return Route('patch', path, middleware)
}


export function Delete(path: string = '*', middleware: Middleware[] = []) {
  return Route('delete', path, middleware)
}


export function Options(path: string = '*', middleware: Middleware[] = []) {
  return Route('options', path, middleware)
}


export function Head(path: string = '*', middleware: Middleware[] = []) {
  return Route('head', path, middleware)
}


export function Use(path: string = '*') {
  return Route('use', path)
}


export function All(path: string = '*', middleware: Middleware[] = []) {
  return Route('all', path, middleware)
}


export function Param(param: string) {
  return <T extends Express.RequestParamHandler>(target: Object, key: string | symbol, descriptor: TypedPropertyDescriptor<T>) => {
    let routes = getRouteMetadata(target)

    routes.push({method: 'param', path: param, key, handlers: [descriptor.value]})
    return descriptor
  }
}


export function Middleware(fn: Middleware) {
  return <T extends Express.Handler>(target: Object, key: string | symbol, descriptor: TypedPropertyDescriptor<T>) => {
    let routes = getRouteMetadata(target)
    let middleware = getMiddleware(target, fn)

    routes.push({method: null, path: null, key, handlers: [middleware]})
    return descriptor
  }
}


function getMiddleware(target: Object, fn: Middleware): Express.Handler {
  if (fn instanceof Function) {
    return fn

  } else {
    let middleware = target[fn]

    if (!middleware)
      throw new Error(`Could not find middlware method ${fn.toString()}!`)

    return middleware
  }
}


function trimslash(s) {
  return s[s.length - 1] === '/'
    ? s.slice(0, s.length - 1)
    : s
}


export function getRoutes(target: Object): RouteMetadata[] {
  let routes: RouteMetadata[] = Reflect.getMetadata(routesKey, target) || []
  let basePath = Reflect.getMetadata(basePathKey, target.constructor)

  if (basePath) {
    routes = routes.map(({method, path, key, handlers}) =>
      ({method, path: method === 'param' ? path : trimslash(basePath) + path, key, handlers}))
  }

  let groups: {[id: string]: RouteMetadata[]} = routes
    .reduce((groups, route) => {
      if (!groups[route.key])
        groups[route.key] = []

      groups[route.key].push(route)
      return groups
    }, {})

  routes = []

  for (let k in groups) {
    let group = groups[k]

    let middleware = group
      .filter((x) => x.method === null)
      .map(({handlers}) => handlers[0])

    let notMiddleware = group
      .filter((x) => x.method !== null)
      .map(({method, path, key, handlers}) =>
        ({method, path, key, handlers: [...middleware, ...handlers].map((h) => h.bind(target))}))

    Array.prototype.push.apply(routes, notMiddleware)
  }

  return routes
}


export function registerRoutes(router: Express.Router, target: Object) {
  let routes = getRoutes(target)

  for (let route of routes) {
    let args = [route.path, ...route.handlers]
    router[route.method].apply(router, args)
  }
}
