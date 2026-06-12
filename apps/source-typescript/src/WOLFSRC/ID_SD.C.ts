// ID_SD.C
//
// PARTIAL PORT: only the globals ID_CA references so far (SoundMode /
// MusicMode / DigiMode). The full sound manager is ported in the UI/sound
// milestone (with Nuked-OPL per PORTING.md §11#2).

import { SDMode, SMMode, SDSMode, sdm_Off, smm_Off, sds_Off } from "./ID_SD.H";

//	Global variables (subset)
export const sd = {
  SoundMode: sdm_Off as SDMode,
  MusicMode: smm_Off as SMMode,
  DigiMode: sds_Off as SDSMode,
};
