import { DOSMemory } from "./TS_DOS_MEMORY";
import { STRUCT_LAYOUTS, nearOffsetForRuntimeSymbol } from "./TS_SAVE_LAYOUT";

export const STARTAMMO = 8;
export const EXTRAPOINTS = 40000;
export const wp_pistol = 1;

export interface NewGameSummary {
  readonly difficulty: number;
  readonly episode: number;
}

const GAMESTATE_BYTES = STRUCT_LAYOUTS.gametype.bytes;
const GAMESTATE_DIFFICULTY_OFFSET = gamestateFieldOffset("difficulty");
const GAMESTATE_NEXTEXTRA_OFFSET = gamestateFieldOffset("nextextra");
const GAMESTATE_LIVES_OFFSET = gamestateFieldOffset("lives");
const GAMESTATE_HEALTH_OFFSET = gamestateFieldOffset("health");
const GAMESTATE_AMMO_OFFSET = gamestateFieldOffset("ammo");
const GAMESTATE_BESTWEAPON_OFFSET = gamestateFieldOffset("bestweapon");
const GAMESTATE_WEAPON_OFFSET = gamestateFieldOffset("weapon");
const GAMESTATE_CHOSENWEAPON_OFFSET = gamestateFieldOffset("chosenweapon");
const GAMESTATE_EPISODE_OFFSET = gamestateFieldOffset("episode");

export function NewGameMemory(
  dgroup: DOSMemory,
  difficulty: number,
  episode: number,
): NewGameSummary {
  const gamestate = nearOffsetForRuntimeSymbol("_gamestate");
  dgroup.view(gamestate, GAMESTATE_BYTES).fill(0);
  dgroup.setU16(gamestate + GAMESTATE_DIFFICULTY_OFFSET, difficulty);
  dgroup.setU16(gamestate + GAMESTATE_WEAPON_OFFSET, wp_pistol);
  dgroup.setU16(gamestate + GAMESTATE_BESTWEAPON_OFFSET, wp_pistol);
  dgroup.setU16(gamestate + GAMESTATE_CHOSENWEAPON_OFFSET, wp_pistol);
  dgroup.setU16(gamestate + GAMESTATE_HEALTH_OFFSET, 100);
  dgroup.setU16(gamestate + GAMESTATE_AMMO_OFFSET, STARTAMMO);
  dgroup.setU16(gamestate + GAMESTATE_LIVES_OFFSET, 3);
  dgroup.setU32(gamestate + GAMESTATE_NEXTEXTRA_OFFSET, EXTRAPOINTS);
  dgroup.setU16(gamestate + GAMESTATE_EPISODE_OFFSET, episode);
  return { difficulty, episode };
}

function gamestateFieldOffset(name: string): number {
  const field = STRUCT_LAYOUTS.gametype.fields.find((entry) => entry[0] === name);
  if (!field) {
    throw new Error(`Missing gamestate field ${name}`);
  }
  return field[1];
}
