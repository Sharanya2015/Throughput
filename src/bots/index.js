import easy from './easy.js';
import normal from './normal.js';
import hard from './hard.js';

const BRAINS = { easy, normal, hard };
export function decide(game, comp) { return BRAINS[comp.difficulty](game, comp); }
