/**
 * Dictionary
 * 
 * @typedef {'HERO' | 'ALIEN' | 'SPACE-SHIP' | 'LOCATION' | 'GADGET' | 'STORY' } Kind
 * @typedef {'GUARD' | 'ENGAGE' | 'FIX' | 'SKILL' | 'WORTH'} Work
 * @typedef {'ALLY' | 'STRANGE' | 'NEUTRAL'} Side
 */

/** @typedef {'FRONT' | 'HERO' | 'ACTIVE' | 'STORE' | 'DROP' | 'DECK'} SlotKind */

/** @typedef {string} CardString */

/** 
 * @typedef {{
*   id: string,
*   name: string,
*   power: number,
*   maxPower: number,
*   type: Kind,
*   work: Work,
*   side: Side,
* }} Card
*/

/** @typedef {{id:SlotId, card:CardString}} Slot */

/** @typedef {[function | string, Slot, Slot]} Move */

/**
* Keys of Slots or Spots I was mixing this a bit.
* TODO: L5, L6, A3, S2 :: Space-ship / Location dynamic table size feature
* 
*  @typedef { 'DK' | 'DR' | 
*     'L1' | 'L2' | 'L3' | 'L4' |
*     'HE' | 'A1' | 'A2' | 'S1'
* } SlotId
*/


/**
* This is represent the whole game are
* 
* @typedef {Slot | null} TableSpot
*/

/** 
* STORY_GOES_ON & SOLITARE :: game rounds
* 
* BURN_OUT means the problems are owervhelming us :: THE-END
* 
* SURVIVE  means we capable to handle the problem :: HAPPY-END
* 
* @typedef { |
*  'BEGIN' | 
*  'STORY_GOES_ON' | 'SOLITARE' | 
*  'BURN_OUT' | 'SURVIVE' 
* } Phases 
*/

/**
* @typedef { Record<SlotId, TableSpot> } Table
*/

/**
* @typedef {{
* deck: CardString[],
* lost: CardString[],
* fly: { id: string, moves: Move[] },
* table: Table,
* phases: Phases,
* score: number,
* render?: object,
* _over_?: array,
* }} State
*/

/** @type {State} */
export const setup = {
  deck: [],
  lost: [],
  fly: null,
  table: {
    L1: null,
    L2: null,
    L3: null,
    L4: null,
    HE: null,
    A1: null,
    A2: null,
    S1: null,
    DR: null,
    DK: null,
  },
  phases: "BEGIN",
  score: 0,
}

/** @type {Card[]} */
export const cardCollection = [
 {
   "id": "c001",
   "name": "Captain Co",
   "power": 12,
   "maxPower": 12,
   "type": "HERO",
   "work": "GUARD",
   "side": "ALLY",
 },
 {
   "id": "c002",
   "name": "Cosmic Defender",
   "power": 10,
   "maxPower": 10,
   "type": "SPACE-SHIP",
   "work": "ENGAGE",
   "side": "STRANGE",
 },
 {
   "id": "c003",
   "name": "Asteroid Field",
   "power": 6,
   "maxPower": 6,
   "type": "LOCATION",
   "work": "ENGAGE",
   "side": "STRANGE",
 },
 {
   "id": "c004",
   "name": "Laser Blaster",
   "power": 3,
   "maxPower": 3,
   "type": "GADGET",
   "work": "ENGAGE",
   "side": "ALLY",
 },
 {
   "id": "c005",
   "name": "Alien Overlord",
   "power": 10,
   "maxPower": 10,
   "type": "ALIEN",
   "work": "ENGAGE",
   "side": "STRANGE",
 },
 {
   "id": "c006",
   "name": "Space Pirate",
   "power": 9,
   "maxPower": 9,
   "type": "ALIEN",
   "work": "ENGAGE",
   "side": "STRANGE",
 },
 {
   "id": "c007",
   "name": "Healing Pod",
   "power": 7,
   "maxPower": 7,
   "type": "GADGET",
   "work": "FIX",
   "side": "ALLY",
 },
 {
   "id": "c008",
   "name": "Galactic Map",
   "power": 5,
   "maxPower": 5,
   "type": "GADGET",
   "work": "GUARD",
   "side": "ALLY",
 },
 {
   "id": "c009",
   "name": "Alien Symbiote",
   "power": 9,
   "maxPower": 9,
   "type": "ALIEN",
   "work": "ENGAGE",
   "side": "STRANGE",
 },
 {
   "id": "c010",
   "name": "Space Station",
   "power": 7,
   "maxPower": 7,
   "type": "LOCATION",
   "work": "GUARD",
   "side": "ALLY",
 },
 {
   "id": "c011",
   "name": "Energy Shield",
   "power": 6,
   "maxPower": 6,
   "type": "GADGET",
   "work": "GUARD",
   "side": "ALLY",
 },
 {
   "id": "c012",
   "name": "Alien Hatchling",
   "power": 2,
   "maxPower": 2,
   "type": "ALIEN",
   "work": "ENGAGE",
   "side": "STRANGE",
 },
 {
   "id": "c013",
   "name": "Black Hole",
   "power": 10,
   "maxPower": 10,
   "type": "LOCATION",
   "work": "ENGAGE",
   "side": "STRANGE",
 },
 {
   "id": "c014",
   "name": "Quantum Drive",
   "power": 4,
   "maxPower": 4,
   "type": "GADGET",
   "work": "WORTH",
   "side": "ALLY",
 },
 {
   "id": "c015",
   "name": "Alien Queen",
   "power": 8,
   "maxPower": 8,
   "type": "ALIEN",
   "work": "ENGAGE",
   "side": "STRANGE",
 },
 {
   "id": "c016",
   "name": "Space Merchant",
   "power": 2,
   "maxPower": 2,
   "type": "ALIEN",
   "work": "GUARD",
   "side": "ALLY",
 },
 {
   "id": "c017",
   "name": "Meteor Shower",
   "power": 8,
   "maxPower": 8,
   "type": "LOCATION",
   "work": "ENGAGE",
   "side": "STRANGE",
 },
 {
   "id": "c018",
   "name": "Robotic Ally",
   "power": 3,
   "maxPower": 3,
   "type": "SPACE-SHIP",
   "work": "FIX",
   "side": "ALLY",
 },
 {
   "id": "c019",
   "name": "Space Mine",
   "power": 7,
   "maxPower": 7,
   "type": "GADGET",
   "work": "WORTH",
   "side": "ALLY",
 },
 {
   "id": "c020",
   "name": "Alien Scout",
   "power": 5,
   "maxPower": 5,
   "type": "ALIEN",
   "work": "ENGAGE",
   "side": "STRANGE",
 },
 {
   "id": "c021",
   "name": "Nebula Cloud",
   "power": 4,
   "maxPower": 4,
   "type": "LOCATION",
   "work": "GUARD",
   "side": "ALLY",
 },
 {
   "id": "c022",
   "name": "Time Warp",
   "power": 0,
   "maxPower": 0,
   "type": "STORY",
   "work": "SKILL",
   "side": "ALLY",
 },
 {
   "id": "c023",
   "name": "Plasma Cannon",
   "power": 5,
   "maxPower": 5,
   "type": "GADGET",
   "work": "ENGAGE",
   "side": "ALLY",
 },
 {
   "id": "c024",
   "name": "Alien Warrior",
   "power": 4,
   "maxPower": 4,
   "type": "ALIEN",
   "work": "ENGAGE",
   "side": "STRANGE",
 },
 {
   "id": "c025",
   "name": "Wormhole",
   "power": 5,
   "maxPower": 5,
   "type": "LOCATION",
   "work": "ENGAGE",
   "side": "STRANGE",
 },
 {
   "id": "c026",
   "name": "Alien Artifact",
   "power": 10,
   "maxPower": 10,
   "type": "GADGET",
   "work": "WORTH",
   "side": "ALLY",
 },
 {
   "id": "c027",
   "name": "Solar Flare",
   "power": 2,
   "maxPower": 2,
   "type": "LOCATION",
   "work": "ENGAGE",
   "side": "STRANGE",
 },
 {
   "id": "c028",
   "name": "Space Ranger",
   "power": 5,
   "maxPower": 5,
   "type": "SPACE-SHIP",
   "work": "FIX",
   "side": "ALLY",
 },
 {
   "id": "c029",
   "name": "Alien Spy",
   "power": 3,
   "maxPower": 3,
   "type": "ALIEN",
   "work": "ENGAGE",
   "side": "STRANGE",
 },
 {
   "id": "c030",
   "name": "Ion Storm",
   "power": 3,
   "maxPower": 3,
   "type": "LOCATION",
   "work": "ENGAGE",
   "side": "STRANGE",
 },
 {
   "id": "c031",
   "name": "Holographic Decoy",
   "power": 3,
   "maxPower": 3,
   "type": "GADGET",
   "work": "GUARD",
   "side": "ALLY",
 },
 {
   "id": "c032",
   "name": "Alien Slime",
   "power": 2,
   "maxPower": 2,
   "type": "ALIEN",
   "work": "WORTH",
   "side": "ALLY",
 },
 {
   "id": "c033",
   "name": "Dr. Anomaly",
   "power": 9,
   "maxPower": 9,
   "type": "ALIEN",
   "work": "FIX",
   "side": "ALLY",
 },
 {
   "id": "c034",
   "name": "Don Grox",
   "power": 4,
   "maxPower": 4,
   "type": "ALIEN",
   "work": "ENGAGE",
   "side": "ALLY",
 },
 {
   "id": "c035",
   "name": "Alien Berserker",
   "power": 6,
   "maxPower": 6,
   "type": "ALIEN",
   "work": "ENGAGE",
   "side": "STRANGE",
 },
 {
   "id": "c036",
   "name": "Space Explorer",
   "power": 6,
   "maxPower": 6,
   "type": "SPACE-SHIP",
   "work": "ENGAGE",
   "side": "ALLY",
 },
 {
   "id": "c037",
   "name": "Urgent Surgery",
   "power": 0,
   "maxPower": 0,
   "type": "STORY",
   "work": "SKILL",
   "side": "ALLY",
 },
 {
   "id": "c038",
   "name": "Comet",
   "power": 2,
   "maxPower": 2,
   "type": "STORY",
   "work": "ENGAGE",
   "side": "ALLY",
 },
 {
   "id": "c039",
   "name": "Alien Psychic",
   "power": 4,
   "maxPower": 4,
   "type": "ALIEN",
   "work": "ENGAGE",
   "side": "STRANGE",
 },
 {
   "id": "c040",
   "name": "Interstellar Map",
   "power": 0,
   "maxPower": 0,
   "type": "GADGET",
   "work": "SKILL",
   "side": "ALLY",
 },
 {
   "id": "c041",
   "name": "Supernova",
   "power": 7,
   "maxPower": 7,
   "type": "STORY",
   "work": "ENGAGE",
   "side": "ALLY",
 },
 {
   "id": "c042",
   "name": "Alien Ambassador",
   "power": 4,
   "maxPower": 4,
   "type": "ALIEN",
   "work": "FIX",
   "side": "ALLY",
 },
 {
   "id": "c043",
   "name": "Bonan Hedwinder",
   "power": 8,
   "maxPower": 8,
   "type": "ALIEN",
   "work": "FIX",
   "side": "ALLY",
 },
 {
   "id": "c044",
   "name": "Dr. Frwhuwhincs",
   "power": 6,
   "maxPower": 6,
   "type": "ALIEN",
   "work": "FIX",
   "side": "ALLY",
 },
 {
   "id": "c045",
   "name": "Yengon",
   "power": 10,
   "maxPower": 10,
   "type": "LOCATION",
   "work": "FIX",
   "side": "ALLY",
 },
 {
   "id": "c046",
   "name": "Infection",
   "power": 2,
   "maxPower": 2,
   "type": "GADGET",
   "work": "FIX",
   "side": "ALLY",
 },
 {
   "id": "c047",
   "name": "Brew Generator",
   "power": 3,
   "maxPower": 3,
   "type": "GADGET",
   "work": "WORTH",
   "side": "NEUTRAL",
 },
 {
   "id": "c048",
   "name": "Plasma Converter",
   "power": 5,
   "maxPower": 5,
   "type": "GADGET",
   "work": "WORTH",
   "side": "NEUTRAL",
 },
 {
   "id": "c048",
   "name": "Proton Palace",
   "power": 6,
   "maxPower": 6,
   "type": "LOCATION",
   "work": "WORTH",
   "side": "NEUTRAL",
 },
 {
   "id": "c049",
   "name": "Xeno Princess",
   "power": 9,
   "maxPower": 9,
   "type": "ALIEN",
   "work": "WORTH",
   "side": "NEUTRAL",
 },
 {
   "id": "c050",
   "name": "Holy Sparrow",
   "power": 10,
   "maxPower": 10,
   "type": "SPACE-SHIP",
   "work": "WORTH",
   "side": "ALLY",
 }
];