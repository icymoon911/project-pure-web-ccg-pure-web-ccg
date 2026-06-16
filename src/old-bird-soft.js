//   O L D - B I R D - S O F T    \\
 //                                  \\
// - - - - - - - - - [ pure web ] - - \\

/** @type {HTMLElement} */
export const monitorView = document.getElementById('monitor');

/** @type {(state: any) => void} */
export const monitor = state => {
  if (!monitorView || monitorView.style.visibility === 'hidden') return;
  try {
    monitorView.innerText = JSON.stringify(state, null, 2);
  } catch (error) {
    console.error(console.error());
    monitorView.innerText = error;
  }
};

/** @type {(ms:number) => Promise<void>} */
export const delay = (ms) => {
  return new Promise((release) => {
    const start = performance.now();
    /** @type {(now: number) => void} */
    const tick = (now) => {
      if (now - start >= ms) {
        release();
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  });
};

export const STATIC = Symbol('static');
export const DIRECT = Symbol('direct');

/** @typedef {(root:any, target?: any, prop?:string | Symbol, value?:any) => void} Watcher */

/** @type {<T>(watcher?: Watcher) => (state?: T) => T} */
export const zignal = (watcher = () => { }) => (state) => {
  let root;
  /** @type {<U>(state?: U) => U} */
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
    // @ts-ignore
    return proxy;
  }
  const end = innerSignal(state);
  root = end;
  watcher(end);
  return root;
};

/** @type {(templateId:string, parent:string, id?:string, query?:string) => HTMLElement | null} */
export const fragment = (templateId, parent, id, query = 'section') => {
  /** @type {HTMLTemplateElement} */
  const tE = document.querySelector(templateId);
  /** @type {Node | null} */
  const frag = tE?.content ? tE.content.cloneNode(true) : null;
  if (frag === null) return null;
  // @ts-ignore
  const result = frag.querySelector(query);
  if (id) { result.id = id; }
  document.querySelector(parent)?.appendChild(frag);
  return result;
};
