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
/** @typedef {import('./alien').CardString} CardString */

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

globalThis.setup = structuredClone(setup); // TODO remove

/** @type {(state:State) => void} */
const simpleStateMonitor = state => monitor({
  ...state,
  deck: [state?.deck?.length],
  render: ['-mock-']
});

/** @type {State} */
const alien = zignal(simpleStateMonitor)(structuredClone({_over_:[],...setup}));
globalThis.alien = alien; // TODO remove

/** @type {SlotId[]} */
const forntline = ["L1", "L2", "L3", "L4"];
/** @type {SlotId[]} */
const heroLine = ["HE", "A1", "A2", "S1"];
/** @type {SlotId[]} */
const activeLine = ["A1", "A2"];

const zipcard = ({ name, power, maxPower, type, side, work }) => [power, maxPower, name, type, side, work].join('|');

const createDeck = () => {
  const [hero,...zipCard] = cardCollection.map(zipcard);
  const shuffled = zipCard.sort(() => Math.random() - 0.5);
  alien.deck = [hero, ...shuffled];
}
const emptyTable = () => [...forntline, ...heroLine, "DR", "DK"].map(
  slotId => alien.table[slotId] = {id:slotId, card: null});

const hero = () => alien.table.HE = ({id:'HE', card:alien.deck.shift()});

const dealCards = async () => {
  /** @type {SlotId[]} */
  const emptySlot = forntline.filter(id => !alien.table[id].card)
  for(const id of emptySlot) {
    if (!alien.deck.length) break;
    alien.table[id] = {id,card:alien.deck.shift()}
    await delay(400);
  }
}

const thisIsTheEnd = () =>
  alien.deck.length === 0
  && forntline.find(slot => alien.table[slot].card === null);

const conflict = (engage, guard) => {
  const [ePow, ...eRest] = engage.split('|');
  const [gPow, ...gRest] = guard.split('|');
  const [problem, solution] = [+ePow, +gPow];

  const gHealth = Math.max(solution - problem, 0);
  const eHealth = Math.max(problem - solution, 0);
  const eResult = `${eHealth}|${eRest.join('|')}`;
  const gResult = `${gHealth}|${gRest.join('|')}`;

  return {
    gHealth, eHealth,
    eResult, gResult,
  };
};

/** @type {(card:string) => number} */
const getPower = (card) => + card.split('|')?.[0];

/** @type {(prop:Slot, _:any, next:Slot) => void} */
const gameAnimation = (prop, _, next) => {
  try {
    if (next?.card) {
      const [,, cardNameId] = next.card.split('|')
      ts[prop].moveCardTo(render[cardNameId].card)
    }
  } catch (error) {
    console.log(error)
  }
}

const gameRule = () => {
  alien.phases = "BEGIN";
  emptyTable();
  createDeck();
  alien.table[DIRECT] = gameAnimation;
}

const goingForward = async () => {
  await delay(300);
  hero();
  await delay(600);
  alien.phases = "STORY_GOES_ON"
  await dealCards();
};
globalThis.goingForward = goingForward;
gameRule()

/** @type {(from:Slot, query: Keywords) => boolean} */
const front = (from, query) =>
  forntline.includes(from.id)
  && from.card.includes(query)

/** @type {(from:Slot, query: Keywords) => boolean} */
const active = (from, query) =>
  activeLine.includes(from.id)
  && from.card.includes(query);

/** @type {(to:Slot, check: Keywords) => boolean} */
const toCheck = (to, check) => to.card === null ? false : to.card.includes(check);

/** @type {(from:Slot, check: Keywords) => boolean} */
const fromStore = (from, check) => from.id === "S1" && from.card.includes(check);

/** @type {(to:Slot) => boolean} */
const toEmptyActive = (to) => activeLine.includes(to.id) && to.card === null;

/** @type {(to:Slot) => boolean} */
const toEmptyStore = (to) => to.id === "S1" && to.card === null;

/** @type {(to:Slot) => boolean} */
const toDrop = (to) => to.id === "DR";

/** @type {(from: Slot, to: Slot) => [function, Slot, Slot] | null} */
const moveByRule = (from, to) => {
  if (from.card === null) return null;
  if (front(from, "STRANGE") && toCheck(to, "HERO")) return [engageCaptain, from, to];
  if (front(from, "STRANGE") && toCheck(to, "GUARD")) return [engageGuard, from, to];
  if (active(from,"ENGAGE") && toCheck(to, "STRANGE")) return [engageStrange, from, to];
  if (front(from, "FIX") && toEmptyActive(to)) return [fixCaptain, from, to];
  if (fromStore(from, "FIX") && toEmptyActive(to)) return [fixCaptain, from, to];
  if (front(from, "WORTH") && toEmptyActive(to)) return [gainScore, from, to];
  if (front(from, "WORTH") && toEmptyStore(to)) return [gainScore, from, to];
  if (
    toEmptyStore(to) && (
         front(from, "ALLY")
      || front(from, "NEUTRAL")
      || front(from, "SKILL")
    )
  ) return [storeSomething, from, to];
  if (
    toEmptyActive(to) && (
         fromStore(from, "ALLY")
      || fromStore(from, "NEUTRAL")
      || fromStore(from, "SKILL")
      || front(from, "ALLY")
      || front(from, "NEUTRAL")
      || front(from, "SKILL")
    )
  ) return [prepare, from, to];
  if ((
         fromStore(from, "ALLY")
      || fromStore(from, "NEUTRAL")
      || fromStore(from, "SKILL")
      || front(from, "ALLY")
      || front(from, "NEUTRAL")
      || front(from, "SKILL")
    ) && toDrop(to)
  ) return [dropSomething, from, to];

  return null;
};
globalThis.moveByRule = moveByRule; // TODO remove

/** ---type {(slot:Slot) => [function, Slot, Slot]} */
const moveMap = (slot) => Object.keys(alien.table).map(
  key => moveByRule(slot, alien.table[key])
)
.filter(p => p)
.map(([fun, from, to]) => [fun, from, to])
globalThis.moveMap = moveMap; // TODO remove

// ─────────────────────────────────────────────────────────────────────────────
// VISUAL FEEDBACK — Web Animation API
// ─────────────────────────────────────────────────────────────────────────────

const getCardEl = (slot) => {
  if (!slot?.card) return null;
  const parts = slot.card.split('|');
  const name = parts[2];
  return alien.render?.[name]?.card ?? null;
};

const flashCard = (slot, color = '#f87171', duration = 500) => {
  const el = getCardEl(slot);
  if (!el) return;
  el.animate([
    { filter: `drop-shadow(0 0 0 transparent)`, transform: 'scale(1)' },
    { filter: `drop-shadow(0 0 1.5rem ${color})`, transform: 'scale(1.08)' },
    { filter: `drop-shadow(0 0 0 transparent)`, transform: 'scale(1)' },
  ], { duration, easing: 'ease-in-out' });
};

const fadeOutCard = (slot, duration = 600) => {
  const el = getCardEl(slot);
  if (!el) return;
  el.animate([
    { opacity: 1, transform: 'scale(1) rotateY(0deg)' },
    { opacity: 0, transform: 'scale(0.7) rotateY(90deg)' },
  ], { duration, fill: 'forwards', easing: 'ease-in' });
};

const popScore = (slot) => {
  const el = getCardEl(slot);
  if (!el) return;
  el.animate([
    { filter: 'brightness(1)', transform: 'scale(1)' },
    { filter: 'brightness(2.5)', transform: 'scale(1.2)' },
    { filter: 'brightness(1)', transform: 'scale(1)' },
  ], { duration: 700, easing: 'ease-in-out' });
};

// ─────────────────────────────────────────────────────────────────────────────
// ACTION HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

/** STRANGE (front) attacks HERO directly */
const engageCaptain = async (from, to) => {
  const result = conflict(from.card, to.card);
  await delay(80);
  flashCard(from, '#f87171');
  flashCard(to, '#f87171');

  if (result.eHealth <= 0) {
    await delay(400);
    fadeOutCard(from);
    await delay(300);
    from.card = null;
  } else {
    from.card = result.eResult;
  }

  if (result.gHealth <= 0) {
    await delay(400);
    fadeOutCard(to);
    await delay(300);
    to.card = null;
    alien.lost.push(alien.table.HE.card ?? 'HERO');
    alien.table.HE.card = null;
  } else {
    to.card = result.gResult;
  }

  updateHeroPowerDisplay();
  checkEndGame();
};

/** STRANGE (front) attacks a GUARD card in A1/A2 */
const engageGuard = async (from, to) => {
  const result = conflict(from.card, to.card);
  await delay(80);
  flashCard(from, '#f87171');
  flashCard(to, '#60a5fa');

  if (result.eHealth <= 0) {
    await delay(400);
    fadeOutCard(from);
    await delay(300);
    from.card = null;
  } else {
    from.card = result.eResult;
  }

  if (result.gHealth <= 0) {
    const deadCard = to.card;
    await delay(400);
    fadeOutCard(to);
    await delay(300);
    to.card = null;
    alien.lost.push(deadCard);
  } else {
    to.card = result.gResult;
  }

  checkEndGame();
};

/** Player's ACTIVE ENGAGE card attacks a STRANGE front card */
const engageStrange = async (from, to) => {
  const result = conflict(from.card, to.card);
  await delay(80);
  flashCard(from, '#a78bfa');
  flashCard(to, '#f87171');

  if (result.gHealth <= 0) {
    await delay(400);
    fadeOutCard(to);
    await delay(300);
    to.card = null;
  } else {
    to.card = result.gResult;
  }

  if (result.eHealth <= 0) {
    await delay(400);
    fadeOutCard(from);
    await delay(300);
    from.card = null;
  } else {
    from.card = result.eResult;
  }

  checkEndGame();
};

/** FIX card heals hero, then moves to drop */
const fixCaptain = async (from, to) => {
  const healPower = getPower(from.card);
  const heroCard = alien.table.HE.card;
  if (heroCard) {
    const [pow, maxPow, ...rest] = heroCard.split('|');
    const newPow = Math.min(+pow + healPower, +maxPow);
    alien.table.HE.card = `${newPow}|${maxPow}|${rest.join('|')}`;
    await delay(100);
    flashCard(alien.table.HE, '#4ade80', 900);
    updateHeroPowerDisplay();
  }

  const usedCard = from.card;
  from.card = null;
  alien.table.DR.card = usedCard;
  await delay(400);
};

/** WORTH card scores points, then moves to drop */
const gainScore = async (from, to) => {
  const pts = getPower(from.card);
  alien.score += pts;
  popScore(from);
  await delay(500);

  const scoredCard = from.card;
  from.card = null;
  alien.table.DR.card = scoredCard;
  updateHUD();
  await delay(300);
};

/** Store ALLY/NEUTRAL/SKILL in S1 */
const storeSomething = async (from, to) => {
  flashCard(from, '#60a5fa', 400);
  await delay(300);
};

/** Prepare ALLY/NEUTRAL/SKILL from Store or Front into A1/A2 */
const prepare = async (from, to) => {
  flashCard(from, '#c084fc', 400);
  await delay(300);
};

/** Drop a card to DR discard pile */
const dropSomething = async (from, to) => {
  const droppedCard = from.card;
  fadeOutCard(from, 400);
  await delay(400);
  from.card = null;
  alien.table.DR.card = droppedCard;
};

// ─────────────────────────────────────────────────────────────────────────────
// GAME STATE CHECKS
// ─────────────────────────────────────────────────────────────────────────────

const updateHeroPowerDisplay = () => {
  const heroCard = alien.table.HE?.card;
  if (!heroCard) return;
  const [pow,, name] = heroCard.split('|');
  const el = alien.render?.[name]?.card;
  if (!el) return;
  const pw = el.querySelector('#power');
  if (pw) pw.innerHTML = pow;
};

const checkEndGame = () => {
  if (alien.phases === 'BURN_OUT' || alien.phases === 'SURVIVE') return;

  // Hero power zero → BURN_OUT
  const heroCard = alien.table.HE?.card;
  if (heroCard && getPower(heroCard) <= 0) {
    alien.phases = 'BURN_OUT';
    updateHUD();
    return;
  }

  // Deck empty AND at least one empty frontline slot → BURN_OUT
  if (alien.deck.length === 0) {
    const hasEmptyFront = forntline.some(id => !alien.table[id]?.card);
    if (hasEmptyFront) {
      // All frontline threats cleared but deck couldn't refill → SURVIVE
      const allFrontEmpty = forntline.every(id => !alien.table[id]?.card);
      if (allFrontEmpty && heroCard && getPower(heroCard) > 0) {
        alien.phases = 'SURVIVE';
      } else {
        alien.phases = 'BURN_OUT';
      }
      updateHUD();
    }
  }
};

/** Called after every action to advance the round when frontline is clear */
const advanceRoundIfNeeded = async () => {
  if (alien.phases === 'BURN_OUT' || alien.phases === 'SURVIVE') return;

  const allFrontEmpty = forntline.every(id => !alien.table[id]?.card);
  if (!allFrontEmpty) return;

  if (alien.deck.length > 0) {
    alien.phases = 'STORY_GOES_ON';
    updateHUD();
    await delay(500);
    await dealCards();
    updateHUD();
  } else {
    // No cards to deal and frontline clear → SURVIVE
    const heroCard = alien.table.HE?.card;
    if (heroCard && getPower(heroCard) > 0) {
      alien.phases = 'SURVIVE';
    } else {
      alien.phases = 'BURN_OUT';
    }
    updateHUD();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// HUD UPDATE
// ─────────────────────────────────────────────────────────────────────────────

const updateHUD = () => {
  const hud = document.getElementById('game-hud');
  if (!hud) return;
  const heroCard = alien.table.HE?.card;
  const heroPow = heroCard ? getPower(heroCard) : 0;
  const heroMaxPow = heroCard ? +(heroCard.split('|')[1]) : 0;
  hud.innerHTML = `
    <div class="text-xs text-zinc-500 uppercase tracking-widest mb-1">Alien Solitaire</div>
    <div class="text-2xl font-bold ${alien.phases === 'SURVIVE' ? 'text-emerald-400' : alien.phases === 'BURN_OUT' ? 'text-rose-400' : 'text-sky-400'}">
      ${alien.phases.replace(/_/g, ' ')}
    </div>
    <div class="mt-2 flex gap-4 text-sm">
      <span class="text-amber-300">★ Score: <b>${alien.score}</b></span>
      <span class="text-zinc-400">Deck: <b>${alien.deck.length}</b></span>
      <span class="${heroPow <= 3 ? 'text-rose-400' : 'text-emerald-300'}">♥ Hero: <b>${heroPow}</b>/${heroMaxPow}</span>
    </div>
  `;
};

globalThis.advanceRoundIfNeeded = advanceRoundIfNeeded;
globalThis.checkEndGame = checkEndGame;
globalThis.updateHUD = updateHUD;
