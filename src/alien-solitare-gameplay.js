//  A L I E N - S O L I T A R E   \\
//                                  \\
// - - - - - - - - - [ pure web ] - - \\

// @ts-check

import { setup, cardCollection } from './alien.js';
import { zignal, monitor, DIRECT, STATIC, delay } from './old-bird-soft.js';

/** @typedef {import('./alien').State} State */
/** @typedef {import('./alien').Phases} Phases */
/** @typedef {import('./alien').SlotId} SlotId */
/** @typedef {import('./alien').Slot} Slot */
/** @typedef {import('./alien').Card} Card */

/**
 * @typedef {State & {
 *  addHandler: (p:any) => any,
 *  effect: (p:any) => any,
 *  match: any[],
 *  calculateOutcome: (p:any) => any,
 * }} AlienState
 */

/**
 * @typedef { |
 *  'FRONT' | 'STRANGE' | 'HERO' | 'ACTIVE' | 'STORE' | 'DROP' | 'DECK' |
 *  'FIX' | 'WORTH' | 'GUARD' | 'SKILL' | 'ENGAGE' | 'NEUTRAL' | 'ALLY'
 * } Keywords
 */

// ──────────────────────────────────────────────
// Slot zones
// ──────────────────────────────────────────────

/** @type {SlotId[]} */
const forntline = ["L1", "L2", "L3", "L4"];
/** @type {SlotId[]} */
const heroLine = ["HE", "A1", "A2", "S1"];
/** @type {SlotId[]} */
const activeLine = ["A1", "A2"];

// ──────────────────────────────────────────────
// Card predicates — work with Card objects (no string split)
// ──────────────────────────────────────────────

/** @type {(card: Card, keyword: Keywords) => boolean} */
const matchesKeyword = (card, keyword) =>
  card.side === keyword || card.work === keyword || card.type === keyword;

/** @type {(from: Slot, query: Keywords) => boolean} */
const front = (from, query) =>
  forntline.includes(from.id)
  && from.card !== null
  && matchesKeyword(from.card, query);

/** @type {(from: Slot, query: Keywords) => boolean} */
const active = (from, query) =>
  activeLine.includes(from.id)
  && from.card !== null
  && matchesKeyword(from.card, query);

/** @type {(to: Slot, check: Keywords) => boolean} */
const toCheck = (to, check) => to.card !== null && matchesKeyword(to.card, check);

/** @type {(from: Slot, check: Keywords) => boolean} */
const fromStore = (from, check) => from.id === "S1" && from.card !== null && matchesKeyword(from.card, check);

/** @type {(to: Slot) => boolean} */
const toEmptyActive = (to) => activeLine.includes(to.id) && to.card === null;

/** @type {(to: Slot) => boolean} */
const toEmptyStore = (to) => to.id === "S1" && to.card === null;

/** @type {(to: Slot) => boolean} */
const toDrop = (to) => to.id === "DR";

// ──────────────────────────────────────────────
// Common composite predicates
// ──────────────────────────────────────────────

/**
 * Check whether a slot's card matches ALLY, NEUTRAL, or SKILL
 * using a given location predicate (front or fromStore).
 * @type {(slot: Slot, loc: (s: Slot, q: Keywords) => boolean) => boolean}
 */
const isAllyNeutralSkill = (slot, loc) =>
  loc(slot, "ALLY") || loc(slot, "NEUTRAL") || loc(slot, "SKILL");

// ──────────────────────────────────────────────
// Action functions (stubs — implement game effects here)
// ──────────────────────────────────────────────

const engageCaptain = (p) => p;
const engageGuard = (p) => p;
const engageStrange = (p) => p;
const fixCaptain = (p) => p;
const gainScore = (p) => p;
const storeSomething = (p) => p;
const dropSomething = (p) => p;
const prepare = (p) => p;

// ──────────────────────────────────────────────
// Declarative rule table
// ──────────────────────────────────────────────

/** @typedef {{ when: (from: Slot, to: Slot) => boolean, action: function }} Rule */

/** @type {Rule[]} */
const rules = [
  // Combat
  { when: (from, to) => front(from, "STRANGE") && toCheck(to, "HERO"),       action: engageCaptain },
  { when: (from, to) => front(from, "STRANGE") && toCheck(to, "GUARD"),      action: engageGuard  },
  { when: (from, to) => active(from, "ENGAGE") && toCheck(to, "STRANGE"),    action: engageStrange },

  // Fix / repair
  { when: (from, to) => front(from, "FIX") && toEmptyActive(to),             action: fixCaptain },
  { when: (from, to) => fromStore(from, "FIX") && toEmptyActive(to),         action: fixCaptain },

  // Score
  { when: (from, to) => front(from, "WORTH") && toEmptyActive(to),           action: gainScore },
  { when: (from, to) => front(from, "WORTH") && toEmptyStore(to),            action: gainScore },

  // Store an ally / neutral / skill card from the front-line
  { when: (from, to) => toEmptyStore(to) && isAllyNeutralSkill(from, front), action: storeSomething },

  // Prepare (activate) — from store OR front
  {
    when: (from, to) => toEmptyActive(to) && (
      isAllyNeutralSkill(from, fromStore) || isAllyNeutralSkill(from, front)
    ),
    action: prepare,
  },

  // Drop — discard an ally / neutral / skill card
  {
    when: (from, to) => toDrop(to) && (
      isAllyNeutralSkill(from, fromStore) || isAllyNeutralSkill(from, front)
    ),
    action: dropSomething,
  },
];

/** @type {(from: Slot, to: Slot) => [function, Slot, Slot] | null} */
const moveByRule = (from, to) => {
  if (from.card === null) return null;
  const matched = rules.find((rule) => rule.when(from, to));
  return matched ? [matched.action, from, to] : null;
};

/** @type {(state: any) => (slot: Slot) => Array<[string, Slot, Slot]>} */
const createMoveMap = (state) => (slot) => Object.keys(state.table)
  .map((key) => moveByRule(slot, state.table[key]))
  .filter((p) => p)
  .map(([fun, from, to]) => [fun?.name, from, to]);

// ──────────────────────────────────────────────
// Combat resolution (operates on Card objects)
// ──────────────────────────────────────────────

/** @type {(engage: Card, guard: Card) => {gHealth: number, eHealth: number, engage: Card, guard: Card}} */
const conflict = (engage, guard) => {
  const problem = engage.power;
  const solution = guard.power;
  const gHealth = Math.max(solution - problem, 0);
  const eHealth = Math.max(problem - solution, 0);
  return {
    gHealth, eHealth,
    engage: { ...engage, power: eHealth },
    guard:  { ...guard,  power: gHealth },
  };
};

// ──────────────────────────────────────────────
// View-context type
// ──────────────────────────────────────────────

/**
 * @typedef {{
 *   tableOfSlots: Record<string, {
 *     slotEl: HTMLElement,
 *     moveCardTo: (c: HTMLElement) => Promise<void>,
 *     teleportCardTo: (c: HTMLElement) => void,
 *   }>,
 *   render: any,
 * }} ViewContext
 */

// ──────────────────────────────────────────────
// Monitor helper
// ──────────────────────────────────────────────

/** @type {(state: State) => void} */
const simpleStateMonitor = (state) => monitor({
  ...state,
  deck: [state?.deck?.length],
  render: ['-mock-'],
});

// ──────────────────────────────────────────────
// Factory — call once from the view layer
// ──────────────────────────────────────────────

/** @type {(viewContext: ViewContext) => {
 *   alien: State,
 *   moveByRule: typeof moveByRule,
 *   moveMap: ReturnType<typeof createMoveMap>,
 *   handleSlotClick: (slotId: string) => void,
 *   handleSlotHover: (slotId: string) => Array<[string, Slot, Slot]>,
 *   goingForward: () => Promise<void>,
 *   rules: Rule[],
 *   conflict: typeof conflict,
 * }} */
export const createGameplay = (viewContext) => {
  /** @type {State} */
  const alien = zignal(simpleStateMonitor)(structuredClone({ _over_: [], ...setup }));

  // ── Animation callback (uses injected viewContext, no globalThis) ──

  /** @type {(prop: SlotId, _: any, next: Slot) => void} */
  const gameAnimation = (prop, _, next) => {
    try {
      if (next?.card) {
        const cardName = next.card.name;
        const cardEl = viewContext.render[cardName]?.card;
        if (cardEl && viewContext.tableOfSlots[prop]) {
          viewContext.tableOfSlots[prop].moveCardTo(cardEl);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  // ── Deck / table setup (cards stored as plain objects marked STATIC) ──

  const createDeck = () => {
    const [hero, ...rest] = cardCollection.map((c) =>
      Object.assign({}, c, { [STATIC]: true })
    );
    const shuffled = rest.sort(() => Math.random() - 0.5);
    alien.deck = [hero, ...shuffled];
  };

  const emptyTable = () =>
    [...forntline, ...heroLine, "DR", "DK"].map(
      (slotId) => (alien.table[slotId] = { id: slotId, card: null })
    );

  const hero = () => {
    alien.table.HE = { id: 'HE', card: alien.deck.shift() };
  };

  const dealCards = async () => {
    /** @type {SlotId[]} */
    const emptySlots = forntline.filter((id) => !alien.table[id].card);
    for (const id of emptySlots) {
      alien.table[id] = { id, card: alien.deck.shift() };
      await delay(400);
    }
  };

  // ── Game lifecycle ──

  const gameRule = () => {
    alien.phases = "BEGIN";
    emptyTable();
    createDeck();
    alien.table[DIRECT] = gameAnimation;
  };

  const goingForward = async () => {
    await delay(300);
    hero();
    await delay(600);
    alien.phases = "STORY_GOES_ON";
    dealCards();
  };

  // ── Move map ──

  const moveMap = createMoveMap(alien);

  // ── Slot interaction handlers (view forwards events here) ──

  /** @type {(slotId: string) => void} */
  const handleSlotClick = (slotId) => {
    if (alien.fly?.id) {
      const found = alien.fly.moves
        .find(([, from, to]) => from.id === alien.fly.id && to.id === slotId);
      if (found) {
        const { card } = alien.table[alien.fly.id];
        alien.table[alien.fly.id].card = null;
        alien.table[slotId] = { id: slotId, card };
      }
      alien.fly = null;
      alien._over_ = [];
      return;
    }
    if (alien._over_?.[0]?.[1]?.id) {
      alien.fly = { id: slotId, moves: alien._over_ };
      console.log(alien.fly.id, alien.fly.moves[0][1].card);
    }
  };

  /** @type {(slotId: string) => Array<[string, Slot, Slot]>} */
  const handleSlotHover = (slotId) => {
    try {
      const mm = moveMap(alien.table[slotId]);
      alien._over_ = mm;
      return mm;
    } catch (error) {
      alien._over_ = error;
      return [];
    }
  };

  // ── Initialise ──

  gameRule();

  // ── Public API ──

  const api = {
    alien,
    moveByRule,
    moveMap,
    handleSlotClick,
    handleSlotHover,
    goingForward,
    rules,
    conflict,
  };

  // Single debug namespace (no flat globalThis pollution)
  globalThis.__debug = { ...(globalThis.__debug || {}), gameplay: api };

  return api;
};
