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
  // Fisher-Yates shuffle: unbiased, each card has equal probability at each position
  for (let i = zipCard.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [zipCard[i], zipCard[j]] = [zipCard[j], zipCard[i]];
  }
  alien.deck = [hero, ...zipCard];
}
const emptyTable = () => [...forntline, ...heroLine, "DR", "DK"].map(
  slotId => alien.table[slotId] = {id:slotId, card: null});

const hero = () => alien.table.HE = ({id:'HE', card:alien.deck.shift()});

const dealCards = async () => {
  /** @type {SlotId[]} */
  const emptySlot = forntline.filter(id => !alien.table[id].card)
  for(const id of emptySlot) {
    alien.table[id] = {id,card:alien.deck.shift()}
    await delay(400);
  }
  checkPhaseTransition();
}

const thisIsTheEnd = () =>
  alien.deck.length === 0
  && forntline.find(slot => alien.table[slot].card === null);

// const isSurvive = () => alien.table.HE?.card?.power > 0;

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
    if (next?.card && typeof globalThis.ts !== 'undefined' && typeof globalThis.render !== 'undefined') {
      const [,, cardNameId] = next.card.split('|')
      if (globalThis.ts[prop] && globalThis.render[cardNameId]) {
        globalThis.ts[prop].moveCardTo(globalThis.render[cardNameId].card)
      }
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
  checkPhaseTransition();
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
.map(([fun,from,to]) => [fun?.name, from, to])
globalThis.moveMap = moveMap; // TODO remove

const selectCardDemo = () => { };
const playCardInteraction = () => { };
const renderAnimation = () => { };
const informPlayer = () => { };

/** @type {(from: Slot, to: Slot) => void} */
const engageCaptain = (from, to) => {
  const result = conflict(from.card, to.card);
  from.card = result.eHealth > 0 ? result.eResult : null;
  to.card = result.gHealth > 0 ? result.gResult : null;
};
const engageGuard = (from, to) => {
  const result = conflict(from.card, to.card);
  from.card = result.eHealth > 0 ? result.eResult : null;
  to.card = result.gHealth > 0 ? result.gResult : null;
};
const engageEmptyActive = (p) => p;
const engageStrange = (from, to) => {
  const result = conflict(from.card, to.card);
  from.card = result.eHealth > 0 ? result.eResult : null;
  to.card = result.gHealth > 0 ? result.gResult : null;
};
const fixCaptain = (from, to) => {
  to.card = from.card;
  from.card = null;
};
const useSkill = (p) => p;
const gainScore = (from, to) => {
  alien.score += getPower(from.card);
  to.card = from.card;
  from.card = null;
};
const storeSomething = (from, to) => {
  to.card = from.card;
  from.card = null;
};
const dropSomething = (from, to) => {
  alien.lost.push(from.card);
  to.card = from.card;
  from.card = null;
};
const prepare = (from, to) => {
  to.card = from.card;
  from.card = null;
};

const checkPhaseTransition = () => {
  if (alien.phases === 'BURN_OUT' || alien.phases === 'SURVIVE') return;
  const heroCard = alien.table.HE?.card;
  if (!heroCard) {
    alien.phases = 'BURN_OUT';
    return;
  }
  const allFrontEmpty = forntline.every(id => !alien.table[id]?.card);
  if (allFrontEmpty && alien.deck.length === 0) {
    alien.phases = 'SURVIVE';
    return;
  }
  if (alien.phases === 'BEGIN' && !allFrontEmpty) {
    alien.phases = 'STORY_GOES_ON';
  }
};
globalThis.checkPhaseTransition = checkPhaseTransition;
globalThis.engageCaptain = engageCaptain;
globalThis.engageGuard = engageGuard;
globalThis.engageStrange = engageStrange;
globalThis.fixCaptain = fixCaptain;
globalThis.gainScore = gainScore;
globalThis.storeSomething = storeSomething;
globalThis.dropSomething = dropSomething;
globalThis.prepare = prepare;