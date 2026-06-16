// @ts-check

import { cardCollection } from "./alien.js";
import { zignal, monitor, delay, fragment, STATIC, DIRECT, monitorView } from './old-bird-soft.js';
import { alien, initGameplay, goingForward, computeMoveMap, handleSlotClick } from './alien-solitare-gameplay.js';

/** @typedef {import('./alien.js').State} State */

// ---- View context: bridge between gameplay and view layers ----

/** @type {import('./alien-solitare-gameplay.js').ViewContext} */
const viewContext = {
  moveCardTo: (cardElement, slotId) => {
    const s = tableOfSlots[slotId];
    if (s) s.moveCardTo(cardElement);
  },
  getCardElement: (cardId) => alien.render?.[cardId]?.card ?? null,
  renderRef: null, // set after alien.render is created
};

// ---- Slot factory (DOM creation + user interaction only) ----

/**
 * @type {(
 *   parent: string,
 *   id: string,
 *   name: string,
 *   topRem: number,
 *   leftRem: number
 * ) => {
 *   slot: HTMLElement,
 *   moveCardTo: (card: HTMLElement) => Promise<void>,
 *   teleportCardTo: (card: HTMLElement) => void,
 *   topRem: number,
 *   leftRem: number,
 * }}
 */
const slot = (parent, id, name, topRem, leftRem) => {
  const slot = fragment('#slot', parent, id);
  /** @type {HTMLElement} */
  const element = slot.querySelector('#name');
  if (element?.innerText) { element.innerText = name; }

  /** @type {(card: HTMLElement) => Promise<void>} */
  const moveCardTo = async (card) => {
    card.parentElement.appendChild(card);
    await delay(7);
    card.style.top = `${topRem}rem`;
    card.style.left = `${leftRem}rem`;
    setTimeout(() => card.style.transform = `translateZ(0)`, 100);
  };

  /** @type {(card: HTMLElement) => void} */
  const teleportCardTo = (card) => {
    card.parentElement.appendChild(card);
    card.style.top = `${topRem}rem`;
    card.style.left = `${leftRem}rem`;
  };

  // Slot click: forward user intent to gameplay layer
  slot.onclick = () => {
    handleSlotClick(id);
  };

  // Slot hover: compute possible moves, highlight target slots
  slot.onmouseover = async () => {
    try {
      const mm = computeMoveMap(alien.table[id]);
      alien._over_ = mm;
      mm.forEach(([, , target]) => {
        tableOfSlots[target.id]?.slot.setAttribute('data-possible', '1');
      });
    } catch (error) {
      alien._over_ = error;
    }
  };

  slot.onmouseleave = async () => {
    try {
      Object.values(tableOfSlots).forEach(({ slot }) =>
        slot.removeAttribute('data-possible')
      );
    } catch (error) {
      console.warn(error);
    }
  };

  return { slot, moveCardTo, topRem, leftRem, teleportCardTo };
};

// ---- Board layout ----

fragment('#empty', '#table');
const DK = slot('#table', 'DK', 'Deck', 1, 15);
const DR = slot('#table', 'DR', 'Drop', 1, 15 + 13.5);

const L1 = slot('#incoming', 'L1', 'Line 1', 19.5, 1);
const L2 = slot('#incoming', 'L2', 'Line 2', 19.5, 15);
const L3 = slot('#incoming', 'L3', 'Line 3', 19.5, 15 + 13.5);
const L4 = slot('#incoming', 'L4', 'Line 4', 19.5, 15 + 27);

const HE = slot('#player', 'HE', 'Hero', 19 + 19, 1);
const A1 = slot('#player', 'A1', 'Action 1', 19 + 19, 15);
const A2 = slot('#player', 'A2', 'Action 2', 19 + 19, 15 + 13.5);
const S1 = slot('#player', 'S1', 'Store 1', 19 + 19, 15 + 27);

const tableOfSlots = {
  DK, DR,
  L1, L2, L3, L4,
  HE, A1, A2, S1,
};

// Wire up viewContext now that tableOfSlots exists
viewContext.renderRef = alien.render;

/** @type {<T extends Array>(arr: T) => T} */
export const pick = arr => arr[Math.random() * arr.length | 0];

// ---- Sprite sheet ----

const spriteSheet =
  [4, 26, 50, 74, 96].map((horizontal) =>
    [4, 36, 69, 103].map((vertical) => `${horizontal}% ${vertical}%`)
  ).flat();

// ---- Initialize render state ----

alien.render = { [STATIC]: true };
viewContext.renderRef = alien.render;

// ---- Initialize gameplay with view context ----

initGameplay(viewContext);

// ---- Card rendering (uses zignal with DIRECT handler per card) ----

const cardList = [...alien.deck].reverse()
  .map((card, index) => {
    const cardElement = fragment('#card', "#desk", card.id);
    const cardState = zignal(() => {})({ card: cardElement });

    // Install DIRECT handler for movement animation
    cardState[DIRECT] = async (prop, _oldValue, newValue) => {
      if (prop === 'mov') {
        cardElement.parentElement.appendChild(cardElement);
        await delay(7);
        newValue.moveCardTo(cardElement);
      }
    };

    alien.render[card.id] = cardState;
    alien.render[card.id].mov = tableOfSlots.DK;
    tableOfSlots.DK.teleportCardTo(cardElement);
    cardElement.style.backgroundPosition = spriteSheet[index % spriteSheet.length];
    cardElement.querySelector('#name').innerHTML = card.name;
    cardElement.querySelector('#power').innerHTML = card.power;
    cardElement.querySelector('#work').innerHTML = card.work;
    return cardElement;
  });

// ---- Debug namespace (single object instead of flat globalThis) ----

globalThis.__debug = {
  cardList,
  cardCollection,
  ts: tableOfSlots,
  render: alien.render,
  fragment,
  alien,
};

// ---- Monitor toggle ----

const debugSwitch = document.querySelector('code');
debugSwitch.onclick = () => monitorView.style.visibility
  = monitorView.style.visibility === 'hidden'
  ? 'visible'
  : 'hidden';
monitorView.style.visibility = 'hidden';

// ---- Teaser web component ----

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
        <p>Maybe some trick we can using</p>
        <br>
        Lets right solution of design system
        <br>
        sometimes it is too complicated
      </article>
    `;
  }
}

customElements.define('teaser-animation', TeaserAnimation);

// ---- Fly animation (purely visual) ----

/** @type {(range: number) => number} */
const rnd = (range) => (Math.random() * range) | 0;

const fly = () => {
  [...document.querySelectorAll('.card-front')].forEach(card =>
    setTimeout(() =>
      card.style.transform = `
        translateX(${rnd(40) - 20}rem)
        translateZ(${rnd(10) - 5}rem)
        translateY(${rnd(40) - 20}rem)
        rotateY(${rnd(20) - 10}deg)
      `,
      rnd(1000)
    )
  );
};

// ---- Board rotation (origo) ----

/** @type {HTMLElement} */
const duckGirl = document.querySelector(".duck-girl");

/** @type {import("./old-bird-soft.js").Watcher} */
const useOrigo = (_root, o, p, v) => {
  o[p] = v;
  board(o.z, o.x, o.y);
  duckGirl.style = `
    transform:
      translateZ(10rem)
      rotateX(-90deg)
      rotateY(${o.z}deg)
    ;
    top: ${o.top}rem;
    left: ${o.left}rem;
  `;
  return o;
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
  document.querySelector("main#desk").style = `
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
  alien.deck.forEach((card, idx) => {
    alien.render[card.id].card.style.transform = `
      translateZ(${(alien.deck.length - idx) / 5}rem)
      translateX(${(alien.deck.length - idx) / 2}rem)
      rotateY(${(alien.deck.length - idx) * 2}deg)
    `;
  });
  let aZ = 0;
  let ss = setInterval(() => origo.z += 1.3, 15);
  setTimeout(() => clearTimeout(ss), 3500);
  return ss;
};

// ---- Gimbal controls ----

/** @type {(id: string, setFunc?: function) => void} */
const gimbalRotate = (id, setFunc = () => { }) => {
  /** @type {HTMLInputElement} */
  const el = document.querySelector(id);
  document.querySelector(`${id} + label`).innerText = el.value;
  el.oninput = _ => {
    document.querySelector(`${id} + label`).innerText = el.value;
    setFunc(+el.value);
  };
};

gimbalRotate('#rotateX', v => controllOrigo(v, origo.x, origo.y));
gimbalRotate('#rotateY', v => controllOrigo(origo.z, v, origo.y));
gimbalRotate('#rotateZ', v => controllOrigo(origo.z, origo.x, v));

controllOrigo(0, 40, -10);

// ---- Floor tiles ----

const addFloor = (x = 0, y = 0, id = Math.random().toString(36).slice(-7)) => {
  /** @type {HTMLElement} */
  const frg = fragment("#floor", "#desk", id);
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
  frg.onmouseup = () => isDrag = false;
  frg.onmouseleave = () => isDrag = false;
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
  const pos = [
    (rnd(6) - 3) * 30,
    (rnd(7) - 2) * 30
  ];
  if (!floorSet.has(pos.join())) {
    addFloor(...pos);
    floorSet.add(pos.join());
  }
};
document.getElementById("show-set").onclick = putDownANewFloor;
Array(20).fill().map(putDownANewFloor);

// ---- Coins ----

const [c1, c2] = [fragment("#coin", "#desk", 'coin-001'), fragment("#coin", "#desk", 'coin-002')];
c2.style.backgroundColor = "#678";
c1.style.backgroundColor = "#456";
c1.style.transform = 'translateZ(1rem)';
c2.style.transform = 'translateZ(2rem)';

// ---- Game start sequence ----

setTimeout(() => {
  alien.deck.forEach((card, idx) => {
    alien.render[card.id].card.style.transform =
      `translateZ(${(alien.deck.length - idx) / 7}rem)`;
  });
}, 500);
setTimeout(() => goingForward(), 1000);
