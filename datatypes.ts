import { Dice } from './dice';

export type DiceResult = {
  final: Dice;             // 🎯 The final output distribution after all modifiers
  hitRoll?: Dice;          // 🧮 To-hit roll (e.g., d20 + modifier)
  critPortion?: Dice;      // 💥 Just the critical hit contribution
  missPortion?: Dice;      // ❌ Damage dealt on miss
  savePortion?: Dice;      // ✅ Damage from saving throws
  explodedPortion?: Dice;  // 💣 Optional: exploded results (if you add exploding dice)
};