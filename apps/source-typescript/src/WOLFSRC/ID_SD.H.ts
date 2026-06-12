// ID_SD.H
//
// PARTIAL PORT: only what ID_CA needs so far (the SDMode enum). The full
// sound-manager header lands with the ID_SD.C port.

export const TickBase = 70; // 70Hz per tick - used as a base for timer 0

export enum SDMode {
  sdm_Off,
  sdm_PC,
  sdm_AdLib,
}
export const { sdm_Off, sdm_PC, sdm_AdLib } = SDMode;

export enum SMMode {
  smm_Off,
  smm_AdLib,
}
export const { smm_Off, smm_AdLib } = SMMode;

export enum SDSMode {
  sds_Off,
  sds_PC,
  sds_SoundSource,
  sds_SoundBlaster,
}
export const { sds_Off, sds_PC, sds_SoundSource, sds_SoundBlaster } = SDSMode;
