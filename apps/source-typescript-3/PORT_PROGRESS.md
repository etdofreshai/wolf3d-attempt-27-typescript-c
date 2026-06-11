# Port Progress

## Source Files

| File | Type | Status |
| --- | --- | --- |
| AUDIOSDM.H | H | ported |
| AUDIOSOD.H | H | ported |
| AUDIOWL1.H | H | ported |
| AUDIOWL6.H | H | ported |
| BUDIOSOD.H | H | ported |
| BUDIOWL6.H | H | ported |
| CONTIGSC.C | C | pending |
| DETECT.C | C | pending |
| F_SPEAR.H | H | ported |
| FOREIGN.H | H | ported |
| GFXE_SOD.H | H | ported |
| GFXE_WL1.H | H | ported |
| GFXE_WL6.H | H | ported |
| GFXV_SDM.H | H | ported |
| GFXV_SOD.H | H | ported |
| GFXV_WL1.H | H | ported |
| GFXV_WL6.H | H | ported |
| ID_CA.C | C | pending |
| ID_CA.H | H | ported |
| ID_HEAD.H | H | ported |
| ID_HEADS.H | H | ported |
| ID_IN.C | C | pending |
| ID_IN.H | H | ported |
| ID_MM.C | C | pending |
| ID_MM.H | H | ported |
| ID_PM.C | C | pending |
| ID_PM.H | H | ported |
| ID_SD.C | C | pending |
| ID_SD.H | H | ported |
| ID_US_1.C | C | pending |
| ID_US.H | H | ported |
| ID_VH.C | C | pending |
| ID_VH.H | H | ported |
| ID_VL.C | C | pending |
| ID_VL.H | H | ported |
| MAPSSDM.H | H | ported |
| MAPSSOD.H | H | ported |
| MAPSWL1.H | H | ported |
| MAPSWL6.H | H | ported |
| MAPSWLF.H | H | ported |
| MUNGE.C | C | pending |
| OLDSCALE.C | C | pending |
| PICLIST.H | H | ported |
| SDMVER.H | H | ported |
| SHAREMSG.H | H | ported |
| SODVER.H | H | ported |
| SPANISH.H | H | ported |
| SPANVER.H | H | ported |
| VERSION.H | H | ported |
| WL_ACT1.C | C | pending |
| WL_ACT2.C | C | pending |
| WL_AGENT.C | C | pending |
| WL_DEBUG.C | C | pending |
| WL_DEF.H | H | ported |
| WL_DRAW.C | C | pending |
| WL_GAME.C | C | pending |
| WL_INTER.C | C | pending |
| WL_MAIN.C | C | pending |
| WL_MENU.C | C | pending |
| WL_MENU.H | H | ported |
| WL_PLAY.C | C | pending |
| WL_SCALE.C | C | pending |
| WL_STATE.C | C | pending |
| WL_TEXT.C | C | pending |
| WLFJ1VER.H | H | ported |
| WOLF1VER.H | H | ported |
| WOLFGTV.H | H | ported |
| WOLFHACK.C | C | pending |
| WOLFJVER.H | H | ported |
| WOLFVER.H | H | ported |

## Milestones

| Milestone | Gate | Status |
| --- | --- | --- |
| M1 - Scaffold apps/source-typescript-3 | `npm --workspace @wolf3d/source-typescript-3 run check` | complete |
| M2 - Port all WOLFSRC headers | `node scripts/port-parity.mjs --tier headers` | complete |
| M3 - Port all WOLFSRC .C modules | `node scripts/port-parity.mjs --tier full` | pending |
| M4 - Build green | `npm --workspace @wolf3d/source-typescript-3 run build` | pending |
| M5 - Save/load round-trip | `npm --workspace @wolf3d/source-typescript-3 run test:saveload` | pending |
| M6 - Demo replay determinism | `npm --workspace @wolf3d/source-typescript-3 run test:demo` | pending |
| M7 - DOS parity vs golden fixtures | `npm --workspace @wolf3d/source-typescript-3 run test:parity` | pending |
