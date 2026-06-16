// @ts-check

import { cardCollection } from "./alien.js";
import { zignal, monitor, delay, fragment, STATIC, monitorView } from './old-bird-soft.js';
import { createGameplay } from "./alien-solitare-gameplay.js";

/** @typedef {import('./alien.js').State} State */

// ──────────────────────────────────────────────
// Slot factory
//
// Responsibilities:
//   1. Create DOM element (from #slot template) and position it
//   2. Provide moveCardTo / teleportCardTo helpers (animation)
//   3. Forward user events (click / hover) to the gameplay layer
//
// Game-logic decisions (what can move where) live entirely in gameplay.
// ──────────────────────────────────────────────

/** @type {Record<string, ReturnType<typeof createSlot>>} */
let tableOfSlots = {};
/** @type {ReturnType<typeof createGameplay> | null} */
let gameplay = null;

/**
 * @type {(
 *   parent: string,
 *   id: string,
 *   name: string,
 *   topRem: number,
 *   leftRem: number,
 * ) => {
 *   slotEl: HTMLElement,
 *   moveCardTo: (card: HTMLElement) => Promise<void>,
 *   teleportCardTo: (card: HTMLElement) => void,
 *   topRem: number,
 *   leftRem: number,
 * }}
 */
const createSlot = (parent, id, name, topRem, leftRem) => {
  const slotEl = fragment('#slot', parent, id);
  /** @type {HTMLElement | null} */
  const nameEl = slotEl.querySelector('#name');
  if (nameEl?.innerText) { nameEl.innerText = name; }

  /** @type {(card: HTMLElement) => Promise<void>} */
  const moveCardTo = async (card) => {
    card.parentElement.appendChild(card);
    await delay(7);
    card.style.top = `${topRem}rem`;
    card.style.left = `${leftRem}rem`;
    setTimeout(() => (card.style.transform = `translateZ(0)`), 100);
  };

  /** @type {(card: HTMLElement) => void} */
  const teleportCardTo = (card) => {
    card.parentElement.appendChild(card);
    card.style.top = `${topRem}rem`;
    card.style.left = `${leftRem}rem`;
  };

  // ── Event forwarding (no game logic here) ──

  slotEl.onclick = async () => {
    if (gameplay) gameplay.handleSlotClick(id);
  };

  slotEl.onmouseover = async () => {
    if (!gameplay) return;
    try {
      const mm = gameplay.handleSlotHover(id);
      mm.forEach(([, , target]) => {
        const ts = tableOfSlots[target.id];
        if (ts) ts.slotEl.dataset.possible = '1';
      });
    } catch (error) {
      console.warn(error);
    }
  };

  slotEl.onmouseleave = async () => {
    try {
      Object.values(tableOfSlots).forEach(({ slotEl }) =>
        slotEl.removeAttribute('data-possible')
      );
    } catch (error) {
      console.warn(error);
    }
  };

  return { slotEl, moveCardTo, topRem, leftRem, teleportCardTo, [STATIC]: true };
};

// ──────────────────────────────────────────────
// Build the table
// ──────────────────────────────────────────────

fragment('#empty', '#table');
const DK = createSlot('#table', 'DK', 'Deck', 1, 15);
const DR = createSlot('#table', 'DR', 'Drop', 1, 15 + 13.5);

const L1 = createSlot('#incoming', 'L1', 'Line 1', 19.5, 1);
const L2 = createSlot('#incoming', 'L2', 'Line 2', 19.5, 15);
const L3 = createSlot('#incoming', 'L3', 'Line 3', 19.5, 15 + 13.5);
const L4 = createSlot('#incoming', 'L4', 'Line 4', 19.5, 15 + 27);

const HE = createSlot('#player', 'HE', 'Hero', 19 + 19, 1);
const A1 = createSlot('#player', 'A1', 'Action 1', 19 + 19, 15);
const A2 = createSlot('#player', 'A2', 'Action 2', 19 + 19, 15 + 13.5);
const S1 = createSlot('#player', 'S1', 'Store 1', 19 + 19, 15 + 27);

tableOfSlots = { DK, DR, L1, L2, L3, L4, HE, A1, A2, S1 };

/** @type {<T extends Array>(arr: T) => T} */
export const pick = (arr) => arr[(Math.random() * arr.length) | 0];

// ──────────────────────────────────────────────
// Card render middleware
//
// zignal watcher signature: (root, target, prop, value)
// ──────────────────────────────────────────────

/** @type {import("./old-bird-soft.js").Watcher} */
const cardMiddleware = async (_root, target, prop, value) => {
  if (prop === 'mov') {
    /** @type {{ card: HTMLElement }} */
    const { card } = target;
    card.parentElement.appendChild(card);
    await delay(7);
    value.moveCardTo(card);
  }
};

// ──────────────────────────────────────────────
// Sprite sheet positions
// ──────────────────────────────────────────────

const spriteSheet = [4, 26, 50, 74, 96]
  .map((horizontal) =>
    [4, 36, 69, 103].map((vertical) => `${horizontal}% ${vertical}%`)
  )
  .flat();

// ──────────────────────────────────────────────
// Render state (standalone reactive map, keyed by card name)
// ──────────────────────────────────────────────

const render = zignal(() => {})({ [STATIC]: true });

// ──────────────────────────────────────────────
// Initialise gameplay with injected view-context
// ──────────────────────────────────────────────

gameplay = createGameplay({ tableOfSlots, render });
const alien = gameplay.alien;

// ──────────────────────────────────────────────
// Build card DOM from deck (card objects, no string split)
// ──────────────────────────────────────────────

const cardList = [...alien.deck]
  .reverse()
  .map((cardData, index) => {
    const { power, name, work } = cardData;
    const cardEl = fragment('#card', '#desk', name);
    render[name] = zignal(cardMiddleware)({ card: cardEl });
    render[name].mov = tableOfSlots.DK;
    tableOfSlots.DK.teleportCardTo(cardEl);
    cardEl.style.backgroundPosition = spriteSheet[index % spriteSheet.length];
    cardEl.querySelector('#name').innerHTML = name;
    cardEl.querySelector('#power').innerHTML = power;
    cardEl.querySelector('#work').innerHTML = work;
    return cardEl;
  });

// ──────────────────────────────────────────────
// Debug namespace — single object, no flat globalThis pollution
// ──────────────────────────────────────────────

globalThis.__debug = {
  ...(globalThis.__debug || {}),
  view: {
    cardList,
    cardCollection,
    tableOfSlots,
    render,
    fragment,
  },
};

// ──────────────────────────────────────────────
// Monitor toggle
// ──────────────────────────────────────────────

const debugSwitch = document.querySelector('code');
debugSwitch.onclick = () =>
  (monitorView.style.visibility =
    monitorView.style.visibility === 'hidden' ? 'visible' : 'hidden');
monitorView.style.visibility = 'hidden';

// ──────────────────────────────────────────────
// Teaser web-component
// ──────────────────────────────────────────────

class TeaserAnimation extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = `
      <article class="
        hidden
        absolute
        top-12
        right-12
        p-16
        bg-zinc-800
        transition-all duration-500
        hover:-translate-x-96
      ">
        <h1 class="text-orange-500 text-2xl">
          Some information
        </h1>
        Some really inefficent Teaser article
        <p>Maybe some trick we using</p>
        <br>
        Lets right solution of design system
        <br>
        sometimes it is too complicated
      </article>
    `;
  }
}

customElements.define('teaser-animation', TeaserAnimation);

// ──────────────────────────────────────────────
// Fly animation (cosmetic)
// ──────────────────────────────────────────────

/** @type {(range: number) => number} */
const rnd = (range) => (Math.random() * range) | 0;

const fly = () => {
  [...document.querySelectorAll('.card-front')].map((card) =>
    setTimeout(
      () =>
        (card.style.transform = `
      translateX(${rnd(40) - 20}rem)
      translateZ(${rnd(10) - 5}rem)
      translateY(${rnd(40) - 20}rem)
      rotateY(${rnd(20) - 10}deg)
    `),
      rnd(1000)
    )
  );
};

// ──────────────────────────────────────────────
// Board / camera controls
// ──────────────────────────────────────────────

/** @type {HTMLElement} */
const duckGirl = document.querySelector('.duck-girl');

/** @type {import("./old-bird-soft.js").Watcher} */
const useOrigo = (_root, target) => {
  board(target.z, target.x, target.y);
  // @ts-ignore
  duckGirl.style = `
    transform:
      translateZ(10rem)
      rotateX(-90deg)
      rotateY(${target.z}deg)
    ;
    top: ${target.top}rem;
    left: ${target.left}rem;
  `;
};

const origo = zignal(useOrigo)({ x: -10, y: 40, z: 0, top: 0, left: 0 });

/** @type {(z?: number, x?: number, y?: number) => void} */
const controllOrigo = (z, x, y) => {
  origo.x = x;
  origo.y = y;
  origo.z = z;
};

/** @type {(angleZ?: number, angleX?: number, scale?: number) => void} */
const board = (angleZ = 0, angleX = 30, scale = 0) => {
  // @ts-ignore
  document.querySelector('main#desk').style = `
    transform-style: preserve-3d;
    transform:
      perspective(70vh)
      rotateX(${angleX}deg)
      rotateY(0deg)
      rotateZ(${angleZ}deg)
      scale(0.64)
      translateZ(${scale}rem);
    pointer-events: none;
  `;
};

const playWithTable = () => {
  alien.deck.map((cardData, idx) => {
    const cardEl = render[cardData.name]?.card;
    if (cardEl) {
      cardEl.style.transform = `
        translateZ(${(alien.deck.length - idx) / 5}rem)
        translateX(${(alien.deck.length - idx) / 2}rem)
        rotateY(${(alien.deck.length - idx) * 2}deg)
      `;
    }
  });
  const ss = setInterval(() => (origo.z += 1.3), 15);
  setTimeout(() => clearTimeout(ss), 3500);
  return ss;
};

/** @type {(id: string, setFunc?: (v: number) => void) => void} */
const gimbalRotate = (id, setFunc = () => {}) => {
  /** @type {HTMLInputElement} */
  const el = document.querySelector(id);
  // @ts-ignore
  document.querySelector(`${id} + label`).innerText = el.value;
  el.oninput = (_) => {
    // @ts-ignore
    document.querySelector(`${id} + label`).innerText = el.value;
    setFunc(+el.value);
  };
};

// @ts-ignore
gimbalRotate('#rotateX', (v) => controllOrigo(v, origo.x, origo.y));
// @ts-ignore
gimbalRotate('#rotateY', (v) => controllOrigo(origo.z, v, origo.y));
// @ts-ignore
gimbalRotate('#rotateZ', (v) => controllOrigo(origo.z, origo.x, v));

controllOrigo(0, 40, -10);

// ──────────────────────────────────────────────
// Floor tiles
// ──────────────────────────────────────────────

const addFloor = (x = 0, y = 0, id = Math.random().toString(36).slice(-7)) => {
  /** @type {HTMLElement} */
  const frg = fragment('#floor', '#desk', id);
  let u = 0;
  let v = 0;

  let mx = x;
  let my = y;
  /** @type {(x: number, y: number) => void} */
  const move = (x, y) => {
    mx = x;
    my = y;
    frg.style.transform = `translate3D(${x}rem, ${y}rem, -.2rem) scale(1)`;
  };
  move(x, y);
  let isDrag = false;
  const rndSheet = () => [0, 50, 100][rnd(3)];

  frg.onmousedown = ({ layerX, layerY }) => {
    u = layerX;
    v = layerY;
    isDrag = true;
    origo.top = my + 7;
    origo.left = mx + 42;
  };
  frg.onmouseup = () => (isDrag = false);
  frg.onmouseleave = () => (isDrag = false);
  frg.onmousemove = ({ layerX, layerY }) => {
    if (!isDrag) return;
    x += (layerX - u) / 100;
    y += (layerY - v) / 100;
    move(x, y);
    origo.top = my + 7;
    origo.left = mx + 42;
  };
  frg.style.backgroundPosition = `${rndSheet()}% ${rndSheet()}%`;
  return frg;
};

const floorSet = new Set();
const putDownANewFloor = () => {
  const pos = [(rnd(6) - 3) * 30, (rnd(7) - 2) * 30];
  if (!floorSet.has(pos.join())) {
    addFloor(...pos);
    floorSet.add(pos.join());
  }
};
document.getElementById('show-set').onclick = putDownANewFloor;

Array(20).fill().map(putDownANewFloor);

const [c1, c2] = [
  fragment('#coin', '#desk', 'coin-001'),
  fragment('#coin', '#desk', 'coin-002'),
];
c2.style.backgroundColor = '#678';
c1.style.backgroundColor = '#456';
c1.style.transform = 'translateZ(1rem)';
c2.style.transform = 'translateZ(2rem)';

// Extend debug namespace with view-side utilities
globalThis.__debug = {
  ...(globalThis.__debug || {}),
  view: {
    ...(globalThis.__debug?.view || {}),
    fly,
    playWithTable,
    addFloor,
    origo,
  },
};

// ──────────────────────────────────────────────
// Begin the game
// ──────────────────────────────────────────────

setTimeout(() => {
  alien.deck.map((cardData, idx) => {
    const cardEl = render[cardData.name]?.card;
    if (cardEl) {
      cardEl.style.transform = `translateZ(${(alien.deck.length - idx) / 7}rem)`;
    }
  });
}, 500);
setTimeout(() => gameplay.goingForward(), 1000);
