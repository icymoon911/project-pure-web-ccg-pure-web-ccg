# repro-js 
_no-compile minimal reactive JS Framework_

## main goal:
- typesafe by jsDoc
- can be using by cdn link
- minimal function numbers
- based on Proxy, <template>, taged template string
- can be coded a Alien Solitare game much lighter than React
- watch is don't belong to view / render
- raise my understandig, how can create this stuff better.
- try the Web Animation API nature way.
- will joining to Pure Web Fundation ??
- I can use of dev-tools full power under development time
- sprite sheet setup are easy, can final touch by dev-tools

## zignal 

The name is: Z I G N A L :: a gamechanger function;

```js
export const STATIC = Symbol('static');
export const DIRECT = Symbol('direct');

/** @typedef {(root:any, target: any, prop:string, value:any) => void} Watcher */

/** @type {<T>(watcher?: Watcher) => (state?: T | object) => T} */
export const zignal = (watcher = () => { }) => (state = {}) => {
  let root;
  /** @type {<T>(state?: T | object) => T} */
  const innerSignal = (state) => { 
    const proxy = new Proxy(
      Array.isArray(state) ? [] : {}, 
      {
        get: (target, prop) => target[prop],
        set: (target, prop, value) => {
          if (target?.[DIRECT]) {
            target[DIRECT](prop, target[prop], value);
          }
          target[prop] = (value !== null && typeof value === 'object' && !value[STATIC] && !value[DIRECT]) 
            ? innerSignal(value)
            : value
            ;
          watcher(root, target, prop, value);
          return true;
      }
    });
    Object.entries(state).map(([key, val]) => proxy[key] = val);
    return proxy;
  } 
  const end = innerSignal(state); 
  root = end;
  watcher(end);
  return root;
};
```

## TODO
- figure out invisible extra 2nd. layer of spot
- fix game mechanic 
- make a full functional gameplay
- make some component to build a whole game frame
- figure out what is the next game.
- universal cardgame engine
- teaser animation with Web Animaiton API
 
_grug no able see complexity demon, but grug sense presence in code base_
(https://grugbrain.dev/)

