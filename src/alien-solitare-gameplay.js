//  A L I E N - S O L I T A R E   \\
 //                                  \\
// - - - - - - - - - [ pure web ] - - \\

// @ts-check

import { setup, cardCollection } from './alien.js';
import { zignal, monitor, DIRECT, delay } from './old-bird-soft.js';

/** @typedef {import('./alien').State} State */
/** @typedef {import('./alien').Phases} Phases */
/** @typedef {import('./alien').SlotId} SlotId */
/** @typedef {import('./alien').Slot} Slot */
/** @typedef {import('./alien').Card} Card */
/** @typedef {import('./alien').Move} Move */

/**
 * @typedef { |
 *  'FRONT' | 'STRANGE' | 'HERO' | 'ACTIVE' | 'STORE' | 'DROP' | 'DECK' |
 *  'FIX' | 'WORTH' | 'GUARD' | 'SKILL' | 'ENGAGE' | 'NEUTRAL' | 'ALLY'
 * } Keywords
 */

/**
 * @typedef {{
 *   moveCardTo: (card: HTMLElement) => Promise<void>,
 *   getCardElement: (cardId: string) => HTMLElement | null,
 *   renderRef: Record<string, any>,
 * }} ViewContext
 */

/** @type {(state:State) => void} */
const simpleStateMonitor = (_root, _target, _prop, _value) => monitor({
  ...alien,
  deck: [alien?.deck?.length],
  render: ['-mock-']
});

/** @type {State} */
export const alien = zignal(simpleStateMonitor)(structuredClone({ _over_: [], ...setup }));

/** @type {ViewContext | null} */
let viewContext = null;

/** @type {SlotId[]} */
const forntline = ["L1", "L2", "L3", "L4"];
/** @type {SlotId[]} */
const heroLine = ["HE", "A1", "A2", "S1"];
/** @type {SlotId[]} */
const activeLine = ["A1", "A2"];

// ---- Card property access (replaces string split) ----

/** @type {(card: Card) => number} */
const getPower = (card) => card.power;

// ---- Slot predicates ----

/** @type {(slot: Slot) => boolean} */
const isFrontline = (slot) => forntline.includes(slot.id);

/** @type {(slot: Slot) => boolean} */
const isActiveSlot = (slot) => activeLine.includes(slot.id);

/** @type {(slot: Slot) => boolean} */
const isStoreSlot = (slot) => slot.id === "S1";

/** @type {(slot: Slot) => boolean} */
const isDropSlot = (slot) => slot.id === "DR";

// ---- Combined predicates (replacing front/active/fromStore/toCheck) ----

/** @type {(slot: Slot, query: string) => boolean} */
const front = (slot, query) =>
  isFrontline(slot) && slot.card != null && slot.card.side === query;

/** @type {(slot: Slot, query: string) => boolean} */
const active = (slot, query) =>
  isActiveSlot(slot) && slot.card != null && slot.card.work === query;

/** @type {(slot: Slot, check: string) => boolean} */
const toCheck = (slot, check) =>
  slot.card != null && (slot.card.type === check || slot.card.work === check);

/** @type {(slot: Slot, check: string) => boolean} */
const fromStore = (slot, check) =>
  isStoreSlot(slot) && slot.card != null &&
  (slot.card.side === check || slot.card.work === check);

/** @type {(slot: Slot) => boolean} */
const toEmptyActive = (slot) => isActiveSlot(slot) && slot.card === null;

/** @type {(slot: Slot) => boolean} */
const toEmptyStore = (slot) => isStoreSlot(slot) && slot.card === null;

/** @type {(slot: Slot) => boolean} */
const toDrop = (slot) => isDropSlot(slot);

// ---- Shared predicate compositions ----

/** @type {(slot: Slot) => boolean} */
const isFrontMovable = (slot) =>
  front(slot, 'ALLY') || front(slot, 'NEUTRAL') || front(slot, 'SKILL');

/** @type {(slot: Slot) => boolean} */
const isStoreMovable = (slot) =>
  fromStore(slot, 'ALLY') || fromStore(slot, 'NEUTRAL') || fromStore(slot, 'SKILL');

/** @type {(slot: Slot) => boolean} */
const isAnyMovable = (slot) => isStoreMovable(slot) || isFrontMovable(slot);

// ---- Conflict resolution (operates on Card objects directly) ----

/** @type {(engage: Card, guard: Card) => { gHealth: number, eHealth: number }} */
const conflict = (engage, guard) => {
  const problem = engage.power;
  const solution = guard.power;
  const gHealth = Math.max(solution - problem, 0);
  const eHealth = Math.max(problem - solution, 0);
  guard.power = gHealth;
  engage.power = eHealth;
  return { gHealth, eHealth };
};

// ---- Action functions (stubs) ----

const engageCaptain = (p) => p;
const engageGuard = (p) => p;
const engageStrange = (p) => p;
const fixCaptain = (p) => p;
const gainScore = (p) => p;
const storeSomething = (p) => p;
const dropSomething = (p) => p;
const prepare = (p) => p;

// ---- Declarative rule table ----

/**
 * @typedef {{
 *   name: string,
 *   condition: (from: Slot, to: Slot) => boolean,
 *   action: function,
 * }} Rule
 */

/** @type {Rule[]} */
const rules = [
  {
    name: 'engageCaptain',
    condition: (from, to) => front(from, 'STRANGE') && toCheck(to, 'HERO'),
    action: engageCaptain,
  },
  {
    name: 'engageGuard',
    condition: (from, to) => front(from, 'STRANGE') && toCheck(to, 'GUARD'),
    action: engageGuard,
  },
  {
    name: 'engageStrange',
    condition: (from, to) => active(from, 'ENGAGE') && toCheck(to, 'STRANGE'),
    action: engageStrange,
  },
  {
    name: 'fixCaptain_front',
    condition: (from, to) => front(from, 'FIX') && toEmptyActive(to),
    action: fixCaptain,
  },
  {
    name: 'fixCaptain_store',
    condition: (from, to) => fromStore(from, 'FIX') && toEmptyActive(to),
    action: fixCaptain,
  },
  {
    name: 'gainScore_active',
    condition: (from, to) => front(from, 'WORTH') && toEmptyActive(to),
    action: gainScore,
  },
  {
    name: 'gainScore_store',
    condition: (from, to) => front(from, 'WORTH') && toEmptyStore(to),
    action: gainScore,
  },
  {
    name: 'storeSomething',
    condition: (from, to) => toEmptyStore(to) && isFrontMovable(from),
    action: storeSomething,
  },
  {
    name: 'prepare',
    condition: (from, to) => toEmptyActive(to) && isAnyMovable(from),
    action: prepare,
  },
  {
    name: 'dropSomething',
    condition: (from, to) => toDrop(to) && isAnyMovable(from),
    action: dropSomething,
  },
];

/** @type {(from: Slot, to: Slot) => Move | null} */
const moveByRule = (from, to) => {
  if (from.card === null) return null;
  const match = rules.find(rule => rule.condition(from, to));
  if (!match) return null;
  return [match.action.name, from, to];
};

/** @type {(slot: Slot) => Move[]} */
const computeMoveMap = (slot) =>
  Object.keys(alien.table)
    .map(key => moveByRule(slot, alien.table[key]))
    .filter(Boolean);

// ---- Game animation (uses injected viewContext) ----

/** @type {(prop: string, _: any, next: Slot) => void} */
const gameAnimation = (prop, _, next) => {
  try {
    if (next?.card && viewContext) {
      const cardElement = viewContext.getCardElement(next.card.id);
      if (cardElement) {
        viewContext.moveCardTo(cardElement, prop);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

// ---- Game setup and flow ----

const createDeck = () => {
  const cards = structuredClone(cardCollection);
  const [hero, ...rest] = cards;
  const shuffled = rest.sort(() => Math.random() - 0.5);
  alien.deck = [hero, ...shuffled];
};

const emptyTable = () =>
  [...forntline, ...heroLine, "DR", "DK"].forEach(
    slotId => alien.table[slotId] = { id: slotId, card: null }
  );

const hero = () => {
  alien.table.HE = { id: 'HE', card: alien.deck.shift() };
};

const dealCards = async () => {
  /** @type {SlotId[]} */
  const emptySlots = forntline.filter(id => !alien.table[id].card);
  for (const id of emptySlots) {
    alien.table[id] = { id, card: alien.deck.shift() };
    await delay(400);
  }
};

const gameRule = () => {
  alien.phases = "BEGIN";
  emptyTable();
  createDeck();
  alien.table[DIRECT] = gameAnimation;
};

/** @type {() => Promise<void>} */
export const goingForward = async () => {
  await delay(300);
  hero();
  await delay(600);
  alien.phases = "STORY_GOES_ON";
  dealCards();
};

// ---- Click handler (called by view layer) ----

/**
 * Handles a slot click: executes a pending move, or selects a new card.
 * @param {string} slotId
 */
export const handleSlotClick = (slotId) => {
  if (alien.fly?.id) {
    const found = alien.fly.moves
      .find(([, from, to]) => from.id == alien.fly.id && to.id == slotId);
    if (found) {
      const { card } = alien.table[alien.fly.id];
      alien.table[alien.fly.id].card = null;
      alien.table[slotId] = { id: slotId, card };
    }
    alien.fly = null;
    alien._over_ = [];
  }
  if (alien._over_?.[0]?.[1]?.id) {
    alien.fly = { id: slotId, moves: alien._over_ };
    console.log(alien.fly.id, alien.fly.moves[0][1].card);
  }
};

// ---- Public API ----

/**
 * Initialize gameplay with a view context.
 * Must be called by the view layer before game starts.
 * @param {ViewContext} ctx
 */
export const initGameplay = (ctx) => {
  viewContext = ctx;
  gameRule();
};

export { moveByRule, computeMoveMap };
