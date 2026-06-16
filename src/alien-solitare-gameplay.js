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
globalThis._busy = false;

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
    if (alien.deck.length === 0) break;
    alien.table[id] = {id,card:alien.deck.shift()}
    await delay(400);
  }
}

const thisIsTheEnd = () =>
  alien.deck.length === 0
  && forntline.every(slot => alien.table[slot].card === null);

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

// -----------------------------------------------[ V I S U A L   F E E D B A C K ]

/** @type {(cardString:string) => HTMLElement | null} */
const getCardEl = (cardString) => {
  if (!cardString) return null;
  const name = cardString.split('|')[2];
  try { return alien.render[name]?.card || null; } catch { return null; }
};
globalThis.getCardEl = getCardEl;

/** @type {(cardString:string, type:'damage'|'heal'|'score'|'death') => void} */
const flashCard = (cardString, type) => {
  const el = getCardEl(cardString);
  if (!el) return;

  const keyframes = {
    damage: [
      { filter: 'brightness(1)', boxShadow: 'none' },
      { filter: 'brightness(2.5) saturate(0.3)', boxShadow: '0 0 30px rgba(255, 50, 50, 0.9)' },
      { filter: 'brightness(1)', boxShadow: 'none' }
    ],
    heal: [
      { filter: 'brightness(1)', boxShadow: 'none' },
      { filter: 'brightness(1.5) hue-rotate(80deg)', boxShadow: '0 0 30px rgba(50, 255, 100, 0.9)' },
      { filter: 'brightness(1)', boxShadow: 'none' }
    ],
    score: [
      { filter: 'brightness(1)', boxShadow: 'none' },
      { filter: 'brightness(2) saturate(2)', boxShadow: '0 0 30px rgba(255, 215, 0, 0.9)' },
      { filter: 'brightness(1)', boxShadow: 'none' }
    ],
    death: [
      { opacity: '1', transform: el.style.transform || 'scale(1)' },
      { opacity: '0', transform: 'scale(0.3) rotateZ(30deg)' }
    ]
  };

  const durations = { damage: 400, heal: 600, score: 500, death: 500 };

  el.animate(keyframes[type] || keyframes.damage, {
    duration: durations[type] || 400,
    easing: 'ease-in-out',
    fill: type === 'death' ? 'forwards' : 'none'
  });
};

/** @type {(cardString:string) => void} */
const updateCardPower = (cardString) => {
  if (!cardString) return;
  const [power, , name] = cardString.split('|');
  try {
    const el = alien.render[name]?.card;
    if (el) {
      el.querySelector('#power').innerHTML = power;
    }
  } catch {}
};

const updateInfoPanel = () => {
  const scoreEl = document.getElementById('info-score');
  const phaseEl = document.getElementById('info-phase');
  const deckEl = document.getElementById('info-deck');
  const heroEl = document.getElementById('info-hero-power');

  if (scoreEl) scoreEl.textContent = alien.score;
  if (phaseEl) {
    phaseEl.textContent = alien.phases;
    const colors = {
      'BEGIN': '#94a3b8',
      'STORY_GOES_ON': '#60a5fa',
      'SOLITARE': '#a78bfa',
      'BURN_OUT': '#f87171',
      'SURVIVE': '#4ade80'
    };
    phaseEl.style.color = colors[alien.phases] || '#94a3b8';
  }
  if (deckEl) deckEl.textContent = alien.deck.length;
  if (heroEl) {
    const heroCard = alien.table.HE?.card;
    const hp = heroCard ? getPower(heroCard) : 0;
    heroEl.textContent = heroCard ? `${hp}` : '-';
    heroEl.style.color = hp <= 3 ? '#f87171' : hp <= 6 ? '#fbbf24' : '#4ade80';
  }
};
globalThis.updateInfoPanel = updateInfoPanel;

/** @type {(result: Phases) => void} */
const showGameOver = (result) => {
  if (document.getElementById('game-over-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'game-over-overlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    flex-direction: column;
    background: rgba(0,0,0,0.8); z-index: 30000;
  `;

  const isWin = result === 'SURVIVE';
  overlay.innerHTML = `
    <h1 style="
      font-size: 4rem; margin: 0 0 1rem 0;
      color: ${isWin ? '#4ade80' : '#f87171'};
      text-shadow: 0 0 40px ${isWin ? 'rgba(74,222,128,0.5)' : 'rgba(248,113,113,0.5)'};
    ">${isWin ? '★ SURVIVE! ★' : '✦ BURN OUT ✦'}</h1>
    <p style="font-size: 2rem; color: #ccc; margin: 0 0 0.5rem 0;">
      Final Score: <span style="color: #fbbf24; font-weight: bold;">${alien.score}</span>
    </p>
    <p style="font-size: 1.2rem; color: #888; margin: 0 0 2rem 0;">
      ${isWin ? 'All threats have been neutralized!' : 'The hero has fallen...'}
    </p>
    <button onclick="location.reload()" style="
      font-size: 1.5rem; padding: 0.8rem 2.5rem;
      background: ${isWin ? '#166534' : '#991b1b'};
      color: white; border: 2px solid ${isWin ? '#4ade80' : '#f87171'};
      border-radius: 0.8rem; cursor: pointer;
      transition: all 0.2s;
    " onmouseover="this.style.transform='scale(1.08)';this.style.filter='brightness(1.3)'"
       onmouseout="this.style.transform='scale(1)';this.style.filter='brightness(1)'">
      Play Again
    </button>
  `;
  document.body.appendChild(overlay);
};

// -----------------------------------------------[ P O S T - A C T I O N ]

const afterAction = async () => {
  updateInfoPanel();

  // Check hero health
  const heroCard = alien.table.HE?.card;
  if (heroCard && getPower(heroCard) <= 0) {
    alien.phases = 'BURN_OUT';
    updateInfoPanel();
    await delay(500);
    showGameOver('BURN_OUT');
    return;
  }

  // Check if frontline is completely clear
  const allClear = forntline.every(id => alien.table[id].card === null);
  if (allClear) {
    if (alien.deck.length > 0) {
      // Next wave
      await delay(600);
      alien.phases = 'STORY_GOES_ON';
      await dealCards();
      updateInfoPanel();
    } else {
      // All threats dealt, deck empty — victory!
      alien.phases = 'SURVIVE';
      updateInfoPanel();
      await delay(500);
      showGameOver('SURVIVE');
    }
  }
};

// -----------------------------------------------[ S E T U P ]

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
  updateInfoPanel();
  await delay(600);
  alien.phases = "STORY_GOES_ON"
  await dealCards();
  updateInfoPanel();
};
globalThis.goingForward = goingForward;
gameRule()

// -----------------------------------------------[ M O V E   R U L E S ]

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

// -----------------------------------------------[ A C T I O N   H A N D L E R S ]

/** STRANGE from frontline attacks HERO */
const engageCaptain = async (from, to) => {
  const attackCard = from.card;
  const heroCard = to.card;
  const fromId = from.id;
  const toId = to.id;

  const result = conflict(attackCard, heroCard);

  // Visual: hero takes a hit
  flashCard(heroCard, 'damage');

  // Update hero with reduced power
  alien.table[toId] = {id: toId, card: result.gResult};
  updateCardPower(result.gResult);

  // Update attacker (STRANGE)
  if (result.eHealth <= 0) {
    alien.score += getPower(attackCard);
    alien.lost.push(attackCard);
    flashCard(attackCard, 'death');
    await delay(150);
    alien.table[fromId] = {id: fromId, card: null};
  } else {
    flashCard(attackCard, 'damage');
    alien.table[fromId] = {id: fromId, card: result.eResult};
    updateCardPower(result.eResult);
  }

  await delay(200);
  await afterAction();
};

/** STRANGE from frontline attacks a GUARD card */
const engageGuard = async (from, to) => {
  const attackCard = from.card;
  const guardCard = to.card;
  const fromId = from.id;
  const toId = to.id;

  const result = conflict(attackCard, guardCard);

  flashCard(guardCard, 'damage');

  // Update guard
  if (result.gHealth <= 0) {
    alien.lost.push(guardCard);
    flashCard(guardCard, 'death');
    await delay(150);
    alien.table[toId] = {id: toId, card: null};
  } else {
    alien.table[toId] = {id: toId, card: result.gResult};
    updateCardPower(result.gResult);
  }

  // Update attacker (STRANGE)
  if (result.eHealth <= 0) {
    alien.score += getPower(attackCard);
    alien.lost.push(attackCard);
    flashCard(attackCard, 'death');
    await delay(150);
    alien.table[fromId] = {id: fromId, card: null};
  } else {
    flashCard(attackCard, 'damage');
    alien.table[fromId] = {id: fromId, card: result.eResult};
    updateCardPower(result.eResult);
  }

  await delay(200);
  await afterAction();
};

/** Player's ACTIVE ENGAGE card attacks frontline STRANGE */
const engageStrange = async (from, to) => {
  const attackCard = from.card;   // player's ENGAGE card
  const strangeCard = to.card;    // frontline STRANGE card
  const fromId = from.id;
  const toId = to.id;

  const result = conflict(attackCard, strangeCard);

  flashCard(strangeCard, 'damage');

  // Update strange (defender)
  if (result.gHealth <= 0) {
    alien.score += getPower(strangeCard);
    alien.lost.push(strangeCard);
    flashCard(strangeCard, 'death');
    await delay(150);
    alien.table[toId] = {id: toId, card: null};
  } else {
    alien.table[toId] = {id: toId, card: result.gResult};
    updateCardPower(result.gResult);
  }

  // Update player's card (attacker)
  if (result.eHealth <= 0) {
    alien.lost.push(attackCard);
    flashCard(attackCard, 'death');
    await delay(150);
    alien.table[fromId] = {id: fromId, card: null};
  } else {
    flashCard(attackCard, 'damage');
    alien.table[fromId] = {id: fromId, card: result.eResult};
    updateCardPower(result.eResult);
  }

  await delay(200);
  await afterAction();
};

/** FIX card moves to ACTIVE and heals the HERO */
const fixCaptain = async (from, to) => {
  const fixCard = from.card;
  const fromId = from.id;
  const toId = to.id;

  // Move FIX card to active slot
  alien.table[fromId] = {id: fromId, card: null};
  alien.table[toId] = {id: toId, card: fixCard};

  await delay(200);

  // Heal hero
  const heroCard = alien.table.HE?.card;
  if (heroCard) {
    const parts = heroCard.split('|');
    const curPower = +parts[0];
    const maxPower = +parts[1];
    const fixPower = getPower(fixCard);
    const newPower = Math.min(curPower + fixPower, maxPower);
    const newHeroCard = `${newPower}|${parts.slice(1).join('|')}`;

    alien.table.HE = {id: 'HE', card: newHeroCard};
    flashCard(newHeroCard, 'heal');
    updateCardPower(newHeroCard);
  }

  flashCard(fixCard, 'heal');
  await delay(200);
  await afterAction();
};

/** WORTH card gives score and moves to target slot */
const gainScore = async (from, to) => {
  const worthCard = from.card;
  const fromId = from.id;
  const toId = to.id;

  alien.score += getPower(worthCard);

  alien.table[fromId] = {id: fromId, card: null};
  alien.table[toId] = {id: toId, card: worthCard};

  flashCard(worthCard, 'score');
  await delay(200);
  await afterAction();
};

/** Move ALLY/NEUTRAL/SKILL card from frontline to Store */
const storeSomething = async (from, to) => {
  const card = from.card;
  const fromId = from.id;
  const toId = to.id;

  alien.table[fromId] = {id: fromId, card: null};
  alien.table[toId] = {id: toId, card};

  await delay(100);
  await afterAction();
};

/** Move card to Drop pile (discard) */
const dropSomething = async (from, to) => {
  const card = from.card;
  const fromId = from.id;

  alien.lost.push(card);
  alien.table[fromId] = {id: fromId, card: null};
  alien.table.DR = {id: 'DR', card};

  flashCard(card, 'death');
  await delay(200);
  await afterAction();
};

/** Move ALLY/NEUTRAL/SKILL from Store or Front to Active (prepare for use) */
const prepare = async (from, to) => {
  const card = from.card;
  const fromId = from.id;
  const toId = to.id;

  alien.table[fromId] = {id: fromId, card: null};
  alien.table[toId] = {id: toId, card};

  flashCard(card, 'score');
  await delay(100);
  await afterAction();
};

// Handler registry — allows lookup by function name from moveMap
globalThis.actionHandlers = {
  engageCaptain,
  engageGuard,
  engageStrange,
  fixCaptain,
  gainScore,
  storeSomething,
  dropSomething,
  prepare,
};

// -----------------------------------------------[ M O V E   M A P ]

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
