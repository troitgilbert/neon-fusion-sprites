// === DAMAGE SYSTEM ===
import { playHitSound, playBlockSound } from '../audio.js';

/**
 * Apply damage to a fighter
 * Called as: applyDamage(fighter, dmg, canStun)
 */
export function applyDamage(fighter, dmg, canStun = true) {
  if (fighter.isDodging) return;
  if (fighter.isKaitoDemonio && fighter.isKaitoDemonio() && fighter.isIntangible) return;
  if (fighter.isBlocking) {
    dmg *= 0.5;
    canStun = false;
    playBlockSound();
  } else {
    playHitSound();
  }
  fighter.comboHits = 0;
  fighter.blockTime = 0;
  fighter.hp -= dmg;
  fighter.hp = Math.max(0, fighter.hp);
  if (canStun) {
    fighter.stun = 12;
    fighter.vx = -fighter.side * 6;
    fighter.vy = -3;
  }
  fighter.hitFlash = 6;
}
