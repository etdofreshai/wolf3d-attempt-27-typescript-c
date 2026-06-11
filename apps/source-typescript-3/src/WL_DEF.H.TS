import { UPDATEHIGH, UPDATEWIDE } from './ID_HEADS.H.ts';
import type { byte, word, Ptr } from './ID_HEADS.H.ts';
export * from './ID_HEADS.H.ts';
import './WL_MENU.H.ts';
import './FOREIGN.H.ts';

//#define BETA
export const YEAR = 1992;
export const MONTH = 9;
export const DAY = 30;

// #include "ID_HEADS.H"
// #include <MATH.H>
// #include <VALUES.H>

// #include "WL_MENU.H"

// #ifdef SPANISH
// #include "SPANISH.H"
// #else
// #include "FOREIGN.H"
// #endif

// #ifdef SPEAR
// #include "F_SPEAR.H"
// #endif

/*
=============================================================================

							MACROS

=============================================================================
*/


// #define COLORBORDER(color)		asm{mov	dx,STATUS_REGISTER_1;in al,dx;\
// 	mov dx,ATR_INDEX;mov al,ATR_OVERSCAN;out dx,al;mov al,color;out	dx,al;\
// 	mov	al,32;out dx,al};
export function COLORBORDER(_color: number): void {
}

// #define MAPSPOT(x,y,plane)		(*(mapsegs[plane]+farmapylookup[y]+x))
export function MAPSPOT(_x: number, _y: number, _plane: number): number {
	throw new Error('MAPSPOT requires mapsegs and farmapylookup runtime state');
}

// #define SIGN(x) 	((x)>0?1:-1)
export function SIGN(x: number): number { return x > 0 ? 1 : -1; }
// #define ABS(x) 		((int)(x)>0?(x):-(x))
export function ABS(x: number): number { return x > 0 ? x : -x; }
// #define LABS(x) 	((long)(x)>0?(x):-(x))
export function LABS(x: number): number { return x > 0 ? x : -x; }

/*
=============================================================================

						 GLOBAL CONSTANTS

=============================================================================
*/

export const MAXACTORS = 150;				// max number of nazis, etc / map
export const MAXSTATS = 400;				// max number of lamps, bonus, etc
export const MAXDOORS = 64;				// max number of sliding doors
export const MAXWALLTILES = 64;				// max number of wall tiles

//
// tile constants
//

export const ICONARROWS = 90;
export const PUSHABLETILE = 98;
export const EXITTILE = 99;				// at end of castle
export const AREATILE = 107;				// first of NUMAREAS floor tiles
export const NUMAREAS = 37;
export const ELEVATORTILE = 21;
export const AMBUSHTILE = 106;
export const ALTELEVATORTILE = 107;

export const NUMBERCHARS = 9;


//----------------

export const EXTRAPOINTS = 40000;

export const PLAYERSPEED = 3000;
export const RUNSPEED = 6000;

export const SCREENSEG = 0xa000;

export const SCREENBWIDE = 80;

export const HEIGHTRATIO = 0.50;		// also defined in id_mm.c

export const BORDERCOLOR = 3;
export const FLASHCOLOR = 5;
export const FLASHTICS = 4;


export const PLAYERSIZE = 0x5800;			// player radius
export const MINACTORDIST = 0x10000;		// minimum dist from player center
										// to any actor center

export const NUMLATCHPICS = 100;


export const PI = 3.141592657;

export const GLOBAL1 = (1<<16);
export const TILEGLOBAL = GLOBAL1;
export const PIXGLOBAL = (GLOBAL1/64);
export const TILESHIFT = 16;
export const UNSIGNEDSHIFT = 8;

export const ANGLES = 360;					// must be divisable by 4
export const ANGLEQUAD = (ANGLES/4);
export const FINEANGLES = 3600;
export const ANG90 = (FINEANGLES/4);
export const ANG180 = (ANG90*2);
export const ANG270 = (ANG90*3);
export const ANG360 = (ANG90*4);
export const VANG90 = (ANGLES/4);
export const VANG180 = (VANG90*2);
export const VANG270 = (VANG90*3);
export const VANG360 = (VANG90*4);

export const MINDIST = (0x5800);


export const MAXSCALEHEIGHT = 256;				// largest scale on largest view

export const MAXVIEWWIDTH = 320;

export const MAPSIZE = 64;					// maps are 64*64 max
export const NORTH = 0;
export const EAST = 1;
export const SOUTH = 2;
export const WEST = 3;


export const STATUSLINES = 40;

export const SCREENSIZE = (SCREENBWIDE*208);
export const PAGE1START = 0;
export const PAGE2START = (SCREENSIZE);
export const PAGE3START = (SCREENSIZE*2);
export const FREESTART = (SCREENSIZE*3);


export const PIXRADIUS = 512;

export const STARTAMMO = 8;


// object flag values

export const FL_SHOOTABLE = 1;
export const FL_BONUS = 2;
export const FL_NEVERMARK = 4;
export const FL_VISABLE = 8;
export const FL_ATTACKMODE = 16;
export const FL_FIRSTATTACK = 32;
export const FL_AMBUSH = 64;
export const FL_NONMARK = 128;


//
// sprite constants
//

export enum spritetype {
		SPR_DEMO,
		SPR_DEATHCAM,
//
// static sprites
//
		SPR_STAT_0,SPR_STAT_1,SPR_STAT_2,SPR_STAT_3,
		SPR_STAT_4,SPR_STAT_5,SPR_STAT_6,SPR_STAT_7,

		SPR_STAT_8,SPR_STAT_9,SPR_STAT_10,SPR_STAT_11,
		SPR_STAT_12,SPR_STAT_13,SPR_STAT_14,SPR_STAT_15,

		SPR_STAT_16,SPR_STAT_17,SPR_STAT_18,SPR_STAT_19,
		SPR_STAT_20,SPR_STAT_21,SPR_STAT_22,SPR_STAT_23,

		SPR_STAT_24,SPR_STAT_25,SPR_STAT_26,SPR_STAT_27,
		SPR_STAT_28,SPR_STAT_29,SPR_STAT_30,SPR_STAT_31,

		SPR_STAT_32,SPR_STAT_33,SPR_STAT_34,SPR_STAT_35,
		SPR_STAT_36,SPR_STAT_37,SPR_STAT_38,SPR_STAT_39,

		SPR_STAT_40,SPR_STAT_41,SPR_STAT_42,SPR_STAT_43,
		SPR_STAT_44,SPR_STAT_45,SPR_STAT_46,SPR_STAT_47,

// #ifdef SPEAR
// 		SPR_STAT_48,SPR_STAT_49,SPR_STAT_50,SPR_STAT_51,
// #endif

//
// guard
//
		SPR_GRD_S_1,SPR_GRD_S_2,SPR_GRD_S_3,SPR_GRD_S_4,
		SPR_GRD_S_5,SPR_GRD_S_6,SPR_GRD_S_7,SPR_GRD_S_8,

		SPR_GRD_W1_1,SPR_GRD_W1_2,SPR_GRD_W1_3,SPR_GRD_W1_4,
		SPR_GRD_W1_5,SPR_GRD_W1_6,SPR_GRD_W1_7,SPR_GRD_W1_8,

		SPR_GRD_W2_1,SPR_GRD_W2_2,SPR_GRD_W2_3,SPR_GRD_W2_4,
		SPR_GRD_W2_5,SPR_GRD_W2_6,SPR_GRD_W2_7,SPR_GRD_W2_8,

		SPR_GRD_W3_1,SPR_GRD_W3_2,SPR_GRD_W3_3,SPR_GRD_W3_4,
		SPR_GRD_W3_5,SPR_GRD_W3_6,SPR_GRD_W3_7,SPR_GRD_W3_8,

		SPR_GRD_W4_1,SPR_GRD_W4_2,SPR_GRD_W4_3,SPR_GRD_W4_4,
		SPR_GRD_W4_5,SPR_GRD_W4_6,SPR_GRD_W4_7,SPR_GRD_W4_8,

		SPR_GRD_PAIN_1,SPR_GRD_DIE_1,SPR_GRD_DIE_2,SPR_GRD_DIE_3,
		SPR_GRD_PAIN_2,SPR_GRD_DEAD,

		SPR_GRD_SHOOT1,SPR_GRD_SHOOT2,SPR_GRD_SHOOT3,

//
// dogs
//
		SPR_DOG_W1_1,SPR_DOG_W1_2,SPR_DOG_W1_3,SPR_DOG_W1_4,
		SPR_DOG_W1_5,SPR_DOG_W1_6,SPR_DOG_W1_7,SPR_DOG_W1_8,

		SPR_DOG_W2_1,SPR_DOG_W2_2,SPR_DOG_W2_3,SPR_DOG_W2_4,
		SPR_DOG_W2_5,SPR_DOG_W2_6,SPR_DOG_W2_7,SPR_DOG_W2_8,

		SPR_DOG_W3_1,SPR_DOG_W3_2,SPR_DOG_W3_3,SPR_DOG_W3_4,
		SPR_DOG_W3_5,SPR_DOG_W3_6,SPR_DOG_W3_7,SPR_DOG_W3_8,

		SPR_DOG_W4_1,SPR_DOG_W4_2,SPR_DOG_W4_3,SPR_DOG_W4_4,
		SPR_DOG_W4_5,SPR_DOG_W4_6,SPR_DOG_W4_7,SPR_DOG_W4_8,

		SPR_DOG_DIE_1,SPR_DOG_DIE_2,SPR_DOG_DIE_3,SPR_DOG_DEAD,
		SPR_DOG_JUMP1,SPR_DOG_JUMP2,SPR_DOG_JUMP3,



//
// ss
//
		SPR_SS_S_1,SPR_SS_S_2,SPR_SS_S_3,SPR_SS_S_4,
		SPR_SS_S_5,SPR_SS_S_6,SPR_SS_S_7,SPR_SS_S_8,

		SPR_SS_W1_1,SPR_SS_W1_2,SPR_SS_W1_3,SPR_SS_W1_4,
		SPR_SS_W1_5,SPR_SS_W1_6,SPR_SS_W1_7,SPR_SS_W1_8,

		SPR_SS_W2_1,SPR_SS_W2_2,SPR_SS_W2_3,SPR_SS_W2_4,
		SPR_SS_W2_5,SPR_SS_W2_6,SPR_SS_W2_7,SPR_SS_W2_8,

		SPR_SS_W3_1,SPR_SS_W3_2,SPR_SS_W3_3,SPR_SS_W3_4,
		SPR_SS_W3_5,SPR_SS_W3_6,SPR_SS_W3_7,SPR_SS_W3_8,

		SPR_SS_W4_1,SPR_SS_W4_2,SPR_SS_W4_3,SPR_SS_W4_4,
		SPR_SS_W4_5,SPR_SS_W4_6,SPR_SS_W4_7,SPR_SS_W4_8,

		SPR_SS_PAIN_1,SPR_SS_DIE_1,SPR_SS_DIE_2,SPR_SS_DIE_3,
		SPR_SS_PAIN_2,SPR_SS_DEAD,

		SPR_SS_SHOOT1,SPR_SS_SHOOT2,SPR_SS_SHOOT3,

//
// mutant
//
		SPR_MUT_S_1,SPR_MUT_S_2,SPR_MUT_S_3,SPR_MUT_S_4,
		SPR_MUT_S_5,SPR_MUT_S_6,SPR_MUT_S_7,SPR_MUT_S_8,

		SPR_MUT_W1_1,SPR_MUT_W1_2,SPR_MUT_W1_3,SPR_MUT_W1_4,
		SPR_MUT_W1_5,SPR_MUT_W1_6,SPR_MUT_W1_7,SPR_MUT_W1_8,

		SPR_MUT_W2_1,SPR_MUT_W2_2,SPR_MUT_W2_3,SPR_MUT_W2_4,
		SPR_MUT_W2_5,SPR_MUT_W2_6,SPR_MUT_W2_7,SPR_MUT_W2_8,

		SPR_MUT_W3_1,SPR_MUT_W3_2,SPR_MUT_W3_3,SPR_MUT_W3_4,
		SPR_MUT_W3_5,SPR_MUT_W3_6,SPR_MUT_W3_7,SPR_MUT_W3_8,

		SPR_MUT_W4_1,SPR_MUT_W4_2,SPR_MUT_W4_3,SPR_MUT_W4_4,
		SPR_MUT_W4_5,SPR_MUT_W4_6,SPR_MUT_W4_7,SPR_MUT_W4_8,

		SPR_MUT_PAIN_1,SPR_MUT_DIE_1,SPR_MUT_DIE_2,SPR_MUT_DIE_3,
		SPR_MUT_PAIN_2,SPR_MUT_DIE_4,SPR_MUT_DEAD,

		SPR_MUT_SHOOT1,SPR_MUT_SHOOT2,SPR_MUT_SHOOT3,SPR_MUT_SHOOT4,

//
// officer
//
		SPR_OFC_S_1,SPR_OFC_S_2,SPR_OFC_S_3,SPR_OFC_S_4,
		SPR_OFC_S_5,SPR_OFC_S_6,SPR_OFC_S_7,SPR_OFC_S_8,

		SPR_OFC_W1_1,SPR_OFC_W1_2,SPR_OFC_W1_3,SPR_OFC_W1_4,
		SPR_OFC_W1_5,SPR_OFC_W1_6,SPR_OFC_W1_7,SPR_OFC_W1_8,

		SPR_OFC_W2_1,SPR_OFC_W2_2,SPR_OFC_W2_3,SPR_OFC_W2_4,
		SPR_OFC_W2_5,SPR_OFC_W2_6,SPR_OFC_W2_7,SPR_OFC_W2_8,

		SPR_OFC_W3_1,SPR_OFC_W3_2,SPR_OFC_W3_3,SPR_OFC_W3_4,
		SPR_OFC_W3_5,SPR_OFC_W3_6,SPR_OFC_W3_7,SPR_OFC_W3_8,

		SPR_OFC_W4_1,SPR_OFC_W4_2,SPR_OFC_W4_3,SPR_OFC_W4_4,
		SPR_OFC_W4_5,SPR_OFC_W4_6,SPR_OFC_W4_7,SPR_OFC_W4_8,

		SPR_OFC_PAIN_1,SPR_OFC_DIE_1,SPR_OFC_DIE_2,SPR_OFC_DIE_3,
		SPR_OFC_PAIN_2,SPR_OFC_DIE_4,SPR_OFC_DEAD,

		SPR_OFC_SHOOT1,SPR_OFC_SHOOT2,SPR_OFC_SHOOT3,

// #ifndef SPEAR
//
// ghosts
//
		SPR_BLINKY_W1,SPR_BLINKY_W2,SPR_PINKY_W1,SPR_PINKY_W2,
		SPR_CLYDE_W1,SPR_CLYDE_W2,SPR_INKY_W1,SPR_INKY_W2,

//
// hans
//
		SPR_BOSS_W1,SPR_BOSS_W2,SPR_BOSS_W3,SPR_BOSS_W4,
		SPR_BOSS_SHOOT1,SPR_BOSS_SHOOT2,SPR_BOSS_SHOOT3,SPR_BOSS_DEAD,

		SPR_BOSS_DIE1,SPR_BOSS_DIE2,SPR_BOSS_DIE3,

//
// schabbs
//
		SPR_SCHABB_W1,SPR_SCHABB_W2,SPR_SCHABB_W3,SPR_SCHABB_W4,
		SPR_SCHABB_SHOOT1,SPR_SCHABB_SHOOT2,

		SPR_SCHABB_DIE1,SPR_SCHABB_DIE2,SPR_SCHABB_DIE3,SPR_SCHABB_DEAD,
		SPR_HYPO1,SPR_HYPO2,SPR_HYPO3,SPR_HYPO4,

//
// fake
//
		SPR_FAKE_W1,SPR_FAKE_W2,SPR_FAKE_W3,SPR_FAKE_W4,
		SPR_FAKE_SHOOT,SPR_FIRE1,SPR_FIRE2,

		SPR_FAKE_DIE1,SPR_FAKE_DIE2,SPR_FAKE_DIE3,SPR_FAKE_DIE4,
		SPR_FAKE_DIE5,SPR_FAKE_DEAD,

//
// hitler
//
		SPR_MECHA_W1,SPR_MECHA_W2,SPR_MECHA_W3,SPR_MECHA_W4,
		SPR_MECHA_SHOOT1,SPR_MECHA_SHOOT2,SPR_MECHA_SHOOT3,SPR_MECHA_DEAD,

		SPR_MECHA_DIE1,SPR_MECHA_DIE2,SPR_MECHA_DIE3,

		SPR_HITLER_W1,SPR_HITLER_W2,SPR_HITLER_W3,SPR_HITLER_W4,
		SPR_HITLER_SHOOT1,SPR_HITLER_SHOOT2,SPR_HITLER_SHOOT3,SPR_HITLER_DEAD,

		SPR_HITLER_DIE1,SPR_HITLER_DIE2,SPR_HITLER_DIE3,SPR_HITLER_DIE4,
		SPR_HITLER_DIE5,SPR_HITLER_DIE6,SPR_HITLER_DIE7,

//
// giftmacher
//
		SPR_GIFT_W1,SPR_GIFT_W2,SPR_GIFT_W3,SPR_GIFT_W4,
		SPR_GIFT_SHOOT1,SPR_GIFT_SHOOT2,

		SPR_GIFT_DIE1,SPR_GIFT_DIE2,SPR_GIFT_DIE3,SPR_GIFT_DEAD,
// #endif
//
// Rocket, smoke and small explosion
//
		SPR_ROCKET_1,SPR_ROCKET_2,SPR_ROCKET_3,SPR_ROCKET_4,
		SPR_ROCKET_5,SPR_ROCKET_6,SPR_ROCKET_7,SPR_ROCKET_8,

		SPR_SMOKE_1,SPR_SMOKE_2,SPR_SMOKE_3,SPR_SMOKE_4,
		SPR_BOOM_1,SPR_BOOM_2,SPR_BOOM_3,

//
// Angel of Death's DeathSparks(tm)
//
// #ifdef SPEAR
// 		SPR_HROCKET_1,SPR_HROCKET_2,SPR_HROCKET_3,SPR_HROCKET_4,
// 		SPR_HROCKET_5,SPR_HROCKET_6,SPR_HROCKET_7,SPR_HROCKET_8,
//
// 		SPR_HSMOKE_1,SPR_HSMOKE_2,SPR_HSMOKE_3,SPR_HSMOKE_4,
// 		SPR_HBOOM_1,SPR_HBOOM_2,SPR_HBOOM_3,
//
// 		SPR_SPARK1,SPR_SPARK2,SPR_SPARK3,SPR_SPARK4,
// #endif

// #ifndef SPEAR
//
// gretel
//
		SPR_GRETEL_W1,SPR_GRETEL_W2,SPR_GRETEL_W3,SPR_GRETEL_W4,
		SPR_GRETEL_SHOOT1,SPR_GRETEL_SHOOT2,SPR_GRETEL_SHOOT3,SPR_GRETEL_DEAD,

		SPR_GRETEL_DIE1,SPR_GRETEL_DIE2,SPR_GRETEL_DIE3,

//
// fat face
//
		SPR_FAT_W1,SPR_FAT_W2,SPR_FAT_W3,SPR_FAT_W4,
		SPR_FAT_SHOOT1,SPR_FAT_SHOOT2,SPR_FAT_SHOOT3,SPR_FAT_SHOOT4,

		SPR_FAT_DIE1,SPR_FAT_DIE2,SPR_FAT_DIE3,SPR_FAT_DEAD,

//
// bj
//
		SPR_BJ_W1,SPR_BJ_W2,SPR_BJ_W3,SPR_BJ_W4,
		SPR_BJ_JUMP1,SPR_BJ_JUMP2,SPR_BJ_JUMP3,SPR_BJ_JUMP4,
// #else
// //
// // THESE ARE FOR 'SPEAR OF DESTINY'
// //
//
// //
// // Trans Grosse
// //
// 		SPR_TRANS_W1,SPR_TRANS_W2,SPR_TRANS_W3,SPR_TRANS_W4,
// 		SPR_TRANS_SHOOT1,SPR_TRANS_SHOOT2,SPR_TRANS_SHOOT3,SPR_TRANS_DEAD,
//
// 		SPR_TRANS_DIE1,SPR_TRANS_DIE2,SPR_TRANS_DIE3,
//
// //
// // Wilhelm
// //
// 		SPR_WILL_W1,SPR_WILL_W2,SPR_WILL_W3,SPR_WILL_W4,
// 		SPR_WILL_SHOOT1,SPR_WILL_SHOOT2,SPR_WILL_SHOOT3,SPR_WILL_SHOOT4,
//
// 		SPR_WILL_DIE1,SPR_WILL_DIE2,SPR_WILL_DIE3,SPR_WILL_DEAD,
//
// //
// // UberMutant
// //
// 		SPR_UBER_W1,SPR_UBER_W2,SPR_UBER_W3,SPR_UBER_W4,
// 		SPR_UBER_SHOOT1,SPR_UBER_SHOOT2,SPR_UBER_SHOOT3,SPR_UBER_SHOOT4,
//
// 		SPR_UBER_DIE1,SPR_UBER_DIE2,SPR_UBER_DIE3,SPR_UBER_DIE4,
// 		SPR_UBER_DEAD,
//
// //
// // Death Knight
// //
// 		SPR_DEATH_W1,SPR_DEATH_W2,SPR_DEATH_W3,SPR_DEATH_W4,
// 		SPR_DEATH_SHOOT1,SPR_DEATH_SHOOT2,SPR_DEATH_SHOOT3,SPR_DEATH_SHOOT4,
//
// 		SPR_DEATH_DIE1,SPR_DEATH_DIE2,SPR_DEATH_DIE3,SPR_DEATH_DIE4,
// 		SPR_DEATH_DIE5,SPR_DEATH_DIE6,SPR_DEATH_DEAD,
//
// //
// // Ghost
// //
// 		SPR_SPECTRE_W1,SPR_SPECTRE_W2,SPR_SPECTRE_W3,SPR_SPECTRE_W4,
// 		SPR_SPECTRE_F1,SPR_SPECTRE_F2,SPR_SPECTRE_F3,SPR_SPECTRE_F4,
//
// //
// // Angel of Death
// //
// 		SPR_ANGEL_W1,SPR_ANGEL_W2,SPR_ANGEL_W3,SPR_ANGEL_W4,
// 		SPR_ANGEL_SHOOT1,SPR_ANGEL_SHOOT2,SPR_ANGEL_TIRED1,SPR_ANGEL_TIRED2,
//
// 		SPR_ANGEL_DIE1,SPR_ANGEL_DIE2,SPR_ANGEL_DIE3,SPR_ANGEL_DIE4,
// 		SPR_ANGEL_DIE5,SPR_ANGEL_DIE6,SPR_ANGEL_DIE7,SPR_ANGEL_DEAD,
//
// #endif

//
// player attack frames
//
		SPR_KNIFEREADY,SPR_KNIFEATK1,SPR_KNIFEATK2,SPR_KNIFEATK3,
		SPR_KNIFEATK4,

		SPR_PISTOLREADY,SPR_PISTOLATK1,SPR_PISTOLATK2,SPR_PISTOLATK3,
		SPR_PISTOLATK4,

		SPR_MACHINEGUNREADY,SPR_MACHINEGUNATK1,SPR_MACHINEGUNATK2,MACHINEGUNATK3,
		SPR_MACHINEGUNATK4,

		SPR_CHAINREADY,SPR_CHAINATK1,SPR_CHAINATK2,SPR_CHAINATK3,
		SPR_CHAINATK4,

		
}

export const SPR_DEMO = spritetype.SPR_DEMO;
export const SPR_DEATHCAM = spritetype.SPR_DEATHCAM;
export const SPR_STAT_0 = spritetype.SPR_STAT_0;
export const SPR_STAT_1 = spritetype.SPR_STAT_1;
export const SPR_STAT_2 = spritetype.SPR_STAT_2;
export const SPR_STAT_3 = spritetype.SPR_STAT_3;
export const SPR_STAT_4 = spritetype.SPR_STAT_4;
export const SPR_STAT_5 = spritetype.SPR_STAT_5;
export const SPR_STAT_6 = spritetype.SPR_STAT_6;
export const SPR_STAT_7 = spritetype.SPR_STAT_7;
export const SPR_STAT_8 = spritetype.SPR_STAT_8;
export const SPR_STAT_9 = spritetype.SPR_STAT_9;
export const SPR_STAT_10 = spritetype.SPR_STAT_10;
export const SPR_STAT_11 = spritetype.SPR_STAT_11;
export const SPR_STAT_12 = spritetype.SPR_STAT_12;
export const SPR_STAT_13 = spritetype.SPR_STAT_13;
export const SPR_STAT_14 = spritetype.SPR_STAT_14;
export const SPR_STAT_15 = spritetype.SPR_STAT_15;
export const SPR_STAT_16 = spritetype.SPR_STAT_16;
export const SPR_STAT_17 = spritetype.SPR_STAT_17;
export const SPR_STAT_18 = spritetype.SPR_STAT_18;
export const SPR_STAT_19 = spritetype.SPR_STAT_19;
export const SPR_STAT_20 = spritetype.SPR_STAT_20;
export const SPR_STAT_21 = spritetype.SPR_STAT_21;
export const SPR_STAT_22 = spritetype.SPR_STAT_22;
export const SPR_STAT_23 = spritetype.SPR_STAT_23;
export const SPR_STAT_24 = spritetype.SPR_STAT_24;
export const SPR_STAT_25 = spritetype.SPR_STAT_25;
export const SPR_STAT_26 = spritetype.SPR_STAT_26;
export const SPR_STAT_27 = spritetype.SPR_STAT_27;
export const SPR_STAT_28 = spritetype.SPR_STAT_28;
export const SPR_STAT_29 = spritetype.SPR_STAT_29;
export const SPR_STAT_30 = spritetype.SPR_STAT_30;
export const SPR_STAT_31 = spritetype.SPR_STAT_31;
export const SPR_STAT_32 = spritetype.SPR_STAT_32;
export const SPR_STAT_33 = spritetype.SPR_STAT_33;
export const SPR_STAT_34 = spritetype.SPR_STAT_34;
export const SPR_STAT_35 = spritetype.SPR_STAT_35;
export const SPR_STAT_36 = spritetype.SPR_STAT_36;
export const SPR_STAT_37 = spritetype.SPR_STAT_37;
export const SPR_STAT_38 = spritetype.SPR_STAT_38;
export const SPR_STAT_39 = spritetype.SPR_STAT_39;
export const SPR_STAT_40 = spritetype.SPR_STAT_40;
export const SPR_STAT_41 = spritetype.SPR_STAT_41;
export const SPR_STAT_42 = spritetype.SPR_STAT_42;
export const SPR_STAT_43 = spritetype.SPR_STAT_43;
export const SPR_STAT_44 = spritetype.SPR_STAT_44;
export const SPR_STAT_45 = spritetype.SPR_STAT_45;
export const SPR_STAT_46 = spritetype.SPR_STAT_46;
export const SPR_STAT_47 = spritetype.SPR_STAT_47;
export const SPR_GRD_S_1 = spritetype.SPR_GRD_S_1;
export const SPR_GRD_S_2 = spritetype.SPR_GRD_S_2;
export const SPR_GRD_S_3 = spritetype.SPR_GRD_S_3;
export const SPR_GRD_S_4 = spritetype.SPR_GRD_S_4;
export const SPR_GRD_S_5 = spritetype.SPR_GRD_S_5;
export const SPR_GRD_S_6 = spritetype.SPR_GRD_S_6;
export const SPR_GRD_S_7 = spritetype.SPR_GRD_S_7;
export const SPR_GRD_S_8 = spritetype.SPR_GRD_S_8;
export const SPR_GRD_W1_1 = spritetype.SPR_GRD_W1_1;
export const SPR_GRD_W1_2 = spritetype.SPR_GRD_W1_2;
export const SPR_GRD_W1_3 = spritetype.SPR_GRD_W1_3;
export const SPR_GRD_W1_4 = spritetype.SPR_GRD_W1_4;
export const SPR_GRD_W1_5 = spritetype.SPR_GRD_W1_5;
export const SPR_GRD_W1_6 = spritetype.SPR_GRD_W1_6;
export const SPR_GRD_W1_7 = spritetype.SPR_GRD_W1_7;
export const SPR_GRD_W1_8 = spritetype.SPR_GRD_W1_8;
export const SPR_GRD_W2_1 = spritetype.SPR_GRD_W2_1;
export const SPR_GRD_W2_2 = spritetype.SPR_GRD_W2_2;
export const SPR_GRD_W2_3 = spritetype.SPR_GRD_W2_3;
export const SPR_GRD_W2_4 = spritetype.SPR_GRD_W2_4;
export const SPR_GRD_W2_5 = spritetype.SPR_GRD_W2_5;
export const SPR_GRD_W2_6 = spritetype.SPR_GRD_W2_6;
export const SPR_GRD_W2_7 = spritetype.SPR_GRD_W2_7;
export const SPR_GRD_W2_8 = spritetype.SPR_GRD_W2_8;
export const SPR_GRD_W3_1 = spritetype.SPR_GRD_W3_1;
export const SPR_GRD_W3_2 = spritetype.SPR_GRD_W3_2;
export const SPR_GRD_W3_3 = spritetype.SPR_GRD_W3_3;
export const SPR_GRD_W3_4 = spritetype.SPR_GRD_W3_4;
export const SPR_GRD_W3_5 = spritetype.SPR_GRD_W3_5;
export const SPR_GRD_W3_6 = spritetype.SPR_GRD_W3_6;
export const SPR_GRD_W3_7 = spritetype.SPR_GRD_W3_7;
export const SPR_GRD_W3_8 = spritetype.SPR_GRD_W3_8;
export const SPR_GRD_W4_1 = spritetype.SPR_GRD_W4_1;
export const SPR_GRD_W4_2 = spritetype.SPR_GRD_W4_2;
export const SPR_GRD_W4_3 = spritetype.SPR_GRD_W4_3;
export const SPR_GRD_W4_4 = spritetype.SPR_GRD_W4_4;
export const SPR_GRD_W4_5 = spritetype.SPR_GRD_W4_5;
export const SPR_GRD_W4_6 = spritetype.SPR_GRD_W4_6;
export const SPR_GRD_W4_7 = spritetype.SPR_GRD_W4_7;
export const SPR_GRD_W4_8 = spritetype.SPR_GRD_W4_8;
export const SPR_GRD_PAIN_1 = spritetype.SPR_GRD_PAIN_1;
export const SPR_GRD_DIE_1 = spritetype.SPR_GRD_DIE_1;
export const SPR_GRD_DIE_2 = spritetype.SPR_GRD_DIE_2;
export const SPR_GRD_DIE_3 = spritetype.SPR_GRD_DIE_3;
export const SPR_GRD_PAIN_2 = spritetype.SPR_GRD_PAIN_2;
export const SPR_GRD_DEAD = spritetype.SPR_GRD_DEAD;
export const SPR_GRD_SHOOT1 = spritetype.SPR_GRD_SHOOT1;
export const SPR_GRD_SHOOT2 = spritetype.SPR_GRD_SHOOT2;
export const SPR_GRD_SHOOT3 = spritetype.SPR_GRD_SHOOT3;
export const SPR_DOG_W1_1 = spritetype.SPR_DOG_W1_1;
export const SPR_DOG_W1_2 = spritetype.SPR_DOG_W1_2;
export const SPR_DOG_W1_3 = spritetype.SPR_DOG_W1_3;
export const SPR_DOG_W1_4 = spritetype.SPR_DOG_W1_4;
export const SPR_DOG_W1_5 = spritetype.SPR_DOG_W1_5;
export const SPR_DOG_W1_6 = spritetype.SPR_DOG_W1_6;
export const SPR_DOG_W1_7 = spritetype.SPR_DOG_W1_7;
export const SPR_DOG_W1_8 = spritetype.SPR_DOG_W1_8;
export const SPR_DOG_W2_1 = spritetype.SPR_DOG_W2_1;
export const SPR_DOG_W2_2 = spritetype.SPR_DOG_W2_2;
export const SPR_DOG_W2_3 = spritetype.SPR_DOG_W2_3;
export const SPR_DOG_W2_4 = spritetype.SPR_DOG_W2_4;
export const SPR_DOG_W2_5 = spritetype.SPR_DOG_W2_5;
export const SPR_DOG_W2_6 = spritetype.SPR_DOG_W2_6;
export const SPR_DOG_W2_7 = spritetype.SPR_DOG_W2_7;
export const SPR_DOG_W2_8 = spritetype.SPR_DOG_W2_8;
export const SPR_DOG_W3_1 = spritetype.SPR_DOG_W3_1;
export const SPR_DOG_W3_2 = spritetype.SPR_DOG_W3_2;
export const SPR_DOG_W3_3 = spritetype.SPR_DOG_W3_3;
export const SPR_DOG_W3_4 = spritetype.SPR_DOG_W3_4;
export const SPR_DOG_W3_5 = spritetype.SPR_DOG_W3_5;
export const SPR_DOG_W3_6 = spritetype.SPR_DOG_W3_6;
export const SPR_DOG_W3_7 = spritetype.SPR_DOG_W3_7;
export const SPR_DOG_W3_8 = spritetype.SPR_DOG_W3_8;
export const SPR_DOG_W4_1 = spritetype.SPR_DOG_W4_1;
export const SPR_DOG_W4_2 = spritetype.SPR_DOG_W4_2;
export const SPR_DOG_W4_3 = spritetype.SPR_DOG_W4_3;
export const SPR_DOG_W4_4 = spritetype.SPR_DOG_W4_4;
export const SPR_DOG_W4_5 = spritetype.SPR_DOG_W4_5;
export const SPR_DOG_W4_6 = spritetype.SPR_DOG_W4_6;
export const SPR_DOG_W4_7 = spritetype.SPR_DOG_W4_7;
export const SPR_DOG_W4_8 = spritetype.SPR_DOG_W4_8;
export const SPR_DOG_DIE_1 = spritetype.SPR_DOG_DIE_1;
export const SPR_DOG_DIE_2 = spritetype.SPR_DOG_DIE_2;
export const SPR_DOG_DIE_3 = spritetype.SPR_DOG_DIE_3;
export const SPR_DOG_DEAD = spritetype.SPR_DOG_DEAD;
export const SPR_DOG_JUMP1 = spritetype.SPR_DOG_JUMP1;
export const SPR_DOG_JUMP2 = spritetype.SPR_DOG_JUMP2;
export const SPR_DOG_JUMP3 = spritetype.SPR_DOG_JUMP3;
export const SPR_SS_S_1 = spritetype.SPR_SS_S_1;
export const SPR_SS_S_2 = spritetype.SPR_SS_S_2;
export const SPR_SS_S_3 = spritetype.SPR_SS_S_3;
export const SPR_SS_S_4 = spritetype.SPR_SS_S_4;
export const SPR_SS_S_5 = spritetype.SPR_SS_S_5;
export const SPR_SS_S_6 = spritetype.SPR_SS_S_6;
export const SPR_SS_S_7 = spritetype.SPR_SS_S_7;
export const SPR_SS_S_8 = spritetype.SPR_SS_S_8;
export const SPR_SS_W1_1 = spritetype.SPR_SS_W1_1;
export const SPR_SS_W1_2 = spritetype.SPR_SS_W1_2;
export const SPR_SS_W1_3 = spritetype.SPR_SS_W1_3;
export const SPR_SS_W1_4 = spritetype.SPR_SS_W1_4;
export const SPR_SS_W1_5 = spritetype.SPR_SS_W1_5;
export const SPR_SS_W1_6 = spritetype.SPR_SS_W1_6;
export const SPR_SS_W1_7 = spritetype.SPR_SS_W1_7;
export const SPR_SS_W1_8 = spritetype.SPR_SS_W1_8;
export const SPR_SS_W2_1 = spritetype.SPR_SS_W2_1;
export const SPR_SS_W2_2 = spritetype.SPR_SS_W2_2;
export const SPR_SS_W2_3 = spritetype.SPR_SS_W2_3;
export const SPR_SS_W2_4 = spritetype.SPR_SS_W2_4;
export const SPR_SS_W2_5 = spritetype.SPR_SS_W2_5;
export const SPR_SS_W2_6 = spritetype.SPR_SS_W2_6;
export const SPR_SS_W2_7 = spritetype.SPR_SS_W2_7;
export const SPR_SS_W2_8 = spritetype.SPR_SS_W2_8;
export const SPR_SS_W3_1 = spritetype.SPR_SS_W3_1;
export const SPR_SS_W3_2 = spritetype.SPR_SS_W3_2;
export const SPR_SS_W3_3 = spritetype.SPR_SS_W3_3;
export const SPR_SS_W3_4 = spritetype.SPR_SS_W3_4;
export const SPR_SS_W3_5 = spritetype.SPR_SS_W3_5;
export const SPR_SS_W3_6 = spritetype.SPR_SS_W3_6;
export const SPR_SS_W3_7 = spritetype.SPR_SS_W3_7;
export const SPR_SS_W3_8 = spritetype.SPR_SS_W3_8;
export const SPR_SS_W4_1 = spritetype.SPR_SS_W4_1;
export const SPR_SS_W4_2 = spritetype.SPR_SS_W4_2;
export const SPR_SS_W4_3 = spritetype.SPR_SS_W4_3;
export const SPR_SS_W4_4 = spritetype.SPR_SS_W4_4;
export const SPR_SS_W4_5 = spritetype.SPR_SS_W4_5;
export const SPR_SS_W4_6 = spritetype.SPR_SS_W4_6;
export const SPR_SS_W4_7 = spritetype.SPR_SS_W4_7;
export const SPR_SS_W4_8 = spritetype.SPR_SS_W4_8;
export const SPR_SS_PAIN_1 = spritetype.SPR_SS_PAIN_1;
export const SPR_SS_DIE_1 = spritetype.SPR_SS_DIE_1;
export const SPR_SS_DIE_2 = spritetype.SPR_SS_DIE_2;
export const SPR_SS_DIE_3 = spritetype.SPR_SS_DIE_3;
export const SPR_SS_PAIN_2 = spritetype.SPR_SS_PAIN_2;
export const SPR_SS_DEAD = spritetype.SPR_SS_DEAD;
export const SPR_SS_SHOOT1 = spritetype.SPR_SS_SHOOT1;
export const SPR_SS_SHOOT2 = spritetype.SPR_SS_SHOOT2;
export const SPR_SS_SHOOT3 = spritetype.SPR_SS_SHOOT3;
export const SPR_MUT_S_1 = spritetype.SPR_MUT_S_1;
export const SPR_MUT_S_2 = spritetype.SPR_MUT_S_2;
export const SPR_MUT_S_3 = spritetype.SPR_MUT_S_3;
export const SPR_MUT_S_4 = spritetype.SPR_MUT_S_4;
export const SPR_MUT_S_5 = spritetype.SPR_MUT_S_5;
export const SPR_MUT_S_6 = spritetype.SPR_MUT_S_6;
export const SPR_MUT_S_7 = spritetype.SPR_MUT_S_7;
export const SPR_MUT_S_8 = spritetype.SPR_MUT_S_8;
export const SPR_MUT_W1_1 = spritetype.SPR_MUT_W1_1;
export const SPR_MUT_W1_2 = spritetype.SPR_MUT_W1_2;
export const SPR_MUT_W1_3 = spritetype.SPR_MUT_W1_3;
export const SPR_MUT_W1_4 = spritetype.SPR_MUT_W1_4;
export const SPR_MUT_W1_5 = spritetype.SPR_MUT_W1_5;
export const SPR_MUT_W1_6 = spritetype.SPR_MUT_W1_6;
export const SPR_MUT_W1_7 = spritetype.SPR_MUT_W1_7;
export const SPR_MUT_W1_8 = spritetype.SPR_MUT_W1_8;
export const SPR_MUT_W2_1 = spritetype.SPR_MUT_W2_1;
export const SPR_MUT_W2_2 = spritetype.SPR_MUT_W2_2;
export const SPR_MUT_W2_3 = spritetype.SPR_MUT_W2_3;
export const SPR_MUT_W2_4 = spritetype.SPR_MUT_W2_4;
export const SPR_MUT_W2_5 = spritetype.SPR_MUT_W2_5;
export const SPR_MUT_W2_6 = spritetype.SPR_MUT_W2_6;
export const SPR_MUT_W2_7 = spritetype.SPR_MUT_W2_7;
export const SPR_MUT_W2_8 = spritetype.SPR_MUT_W2_8;
export const SPR_MUT_W3_1 = spritetype.SPR_MUT_W3_1;
export const SPR_MUT_W3_2 = spritetype.SPR_MUT_W3_2;
export const SPR_MUT_W3_3 = spritetype.SPR_MUT_W3_3;
export const SPR_MUT_W3_4 = spritetype.SPR_MUT_W3_4;
export const SPR_MUT_W3_5 = spritetype.SPR_MUT_W3_5;
export const SPR_MUT_W3_6 = spritetype.SPR_MUT_W3_6;
export const SPR_MUT_W3_7 = spritetype.SPR_MUT_W3_7;
export const SPR_MUT_W3_8 = spritetype.SPR_MUT_W3_8;
export const SPR_MUT_W4_1 = spritetype.SPR_MUT_W4_1;
export const SPR_MUT_W4_2 = spritetype.SPR_MUT_W4_2;
export const SPR_MUT_W4_3 = spritetype.SPR_MUT_W4_3;
export const SPR_MUT_W4_4 = spritetype.SPR_MUT_W4_4;
export const SPR_MUT_W4_5 = spritetype.SPR_MUT_W4_5;
export const SPR_MUT_W4_6 = spritetype.SPR_MUT_W4_6;
export const SPR_MUT_W4_7 = spritetype.SPR_MUT_W4_7;
export const SPR_MUT_W4_8 = spritetype.SPR_MUT_W4_8;
export const SPR_MUT_PAIN_1 = spritetype.SPR_MUT_PAIN_1;
export const SPR_MUT_DIE_1 = spritetype.SPR_MUT_DIE_1;
export const SPR_MUT_DIE_2 = spritetype.SPR_MUT_DIE_2;
export const SPR_MUT_DIE_3 = spritetype.SPR_MUT_DIE_3;
export const SPR_MUT_PAIN_2 = spritetype.SPR_MUT_PAIN_2;
export const SPR_MUT_DIE_4 = spritetype.SPR_MUT_DIE_4;
export const SPR_MUT_DEAD = spritetype.SPR_MUT_DEAD;
export const SPR_MUT_SHOOT1 = spritetype.SPR_MUT_SHOOT1;
export const SPR_MUT_SHOOT2 = spritetype.SPR_MUT_SHOOT2;
export const SPR_MUT_SHOOT3 = spritetype.SPR_MUT_SHOOT3;
export const SPR_MUT_SHOOT4 = spritetype.SPR_MUT_SHOOT4;
export const SPR_OFC_S_1 = spritetype.SPR_OFC_S_1;
export const SPR_OFC_S_2 = spritetype.SPR_OFC_S_2;
export const SPR_OFC_S_3 = spritetype.SPR_OFC_S_3;
export const SPR_OFC_S_4 = spritetype.SPR_OFC_S_4;
export const SPR_OFC_S_5 = spritetype.SPR_OFC_S_5;
export const SPR_OFC_S_6 = spritetype.SPR_OFC_S_6;
export const SPR_OFC_S_7 = spritetype.SPR_OFC_S_7;
export const SPR_OFC_S_8 = spritetype.SPR_OFC_S_8;
export const SPR_OFC_W1_1 = spritetype.SPR_OFC_W1_1;
export const SPR_OFC_W1_2 = spritetype.SPR_OFC_W1_2;
export const SPR_OFC_W1_3 = spritetype.SPR_OFC_W1_3;
export const SPR_OFC_W1_4 = spritetype.SPR_OFC_W1_4;
export const SPR_OFC_W1_5 = spritetype.SPR_OFC_W1_5;
export const SPR_OFC_W1_6 = spritetype.SPR_OFC_W1_6;
export const SPR_OFC_W1_7 = spritetype.SPR_OFC_W1_7;
export const SPR_OFC_W1_8 = spritetype.SPR_OFC_W1_8;
export const SPR_OFC_W2_1 = spritetype.SPR_OFC_W2_1;
export const SPR_OFC_W2_2 = spritetype.SPR_OFC_W2_2;
export const SPR_OFC_W2_3 = spritetype.SPR_OFC_W2_3;
export const SPR_OFC_W2_4 = spritetype.SPR_OFC_W2_4;
export const SPR_OFC_W2_5 = spritetype.SPR_OFC_W2_5;
export const SPR_OFC_W2_6 = spritetype.SPR_OFC_W2_6;
export const SPR_OFC_W2_7 = spritetype.SPR_OFC_W2_7;
export const SPR_OFC_W2_8 = spritetype.SPR_OFC_W2_8;
export const SPR_OFC_W3_1 = spritetype.SPR_OFC_W3_1;
export const SPR_OFC_W3_2 = spritetype.SPR_OFC_W3_2;
export const SPR_OFC_W3_3 = spritetype.SPR_OFC_W3_3;
export const SPR_OFC_W3_4 = spritetype.SPR_OFC_W3_4;
export const SPR_OFC_W3_5 = spritetype.SPR_OFC_W3_5;
export const SPR_OFC_W3_6 = spritetype.SPR_OFC_W3_6;
export const SPR_OFC_W3_7 = spritetype.SPR_OFC_W3_7;
export const SPR_OFC_W3_8 = spritetype.SPR_OFC_W3_8;
export const SPR_OFC_W4_1 = spritetype.SPR_OFC_W4_1;
export const SPR_OFC_W4_2 = spritetype.SPR_OFC_W4_2;
export const SPR_OFC_W4_3 = spritetype.SPR_OFC_W4_3;
export const SPR_OFC_W4_4 = spritetype.SPR_OFC_W4_4;
export const SPR_OFC_W4_5 = spritetype.SPR_OFC_W4_5;
export const SPR_OFC_W4_6 = spritetype.SPR_OFC_W4_6;
export const SPR_OFC_W4_7 = spritetype.SPR_OFC_W4_7;
export const SPR_OFC_W4_8 = spritetype.SPR_OFC_W4_8;
export const SPR_OFC_PAIN_1 = spritetype.SPR_OFC_PAIN_1;
export const SPR_OFC_DIE_1 = spritetype.SPR_OFC_DIE_1;
export const SPR_OFC_DIE_2 = spritetype.SPR_OFC_DIE_2;
export const SPR_OFC_DIE_3 = spritetype.SPR_OFC_DIE_3;
export const SPR_OFC_PAIN_2 = spritetype.SPR_OFC_PAIN_2;
export const SPR_OFC_DIE_4 = spritetype.SPR_OFC_DIE_4;
export const SPR_OFC_DEAD = spritetype.SPR_OFC_DEAD;
export const SPR_OFC_SHOOT1 = spritetype.SPR_OFC_SHOOT1;
export const SPR_OFC_SHOOT2 = spritetype.SPR_OFC_SHOOT2;
export const SPR_OFC_SHOOT3 = spritetype.SPR_OFC_SHOOT3;
export const SPR_BLINKY_W1 = spritetype.SPR_BLINKY_W1;
export const SPR_BLINKY_W2 = spritetype.SPR_BLINKY_W2;
export const SPR_PINKY_W1 = spritetype.SPR_PINKY_W1;
export const SPR_PINKY_W2 = spritetype.SPR_PINKY_W2;
export const SPR_CLYDE_W1 = spritetype.SPR_CLYDE_W1;
export const SPR_CLYDE_W2 = spritetype.SPR_CLYDE_W2;
export const SPR_INKY_W1 = spritetype.SPR_INKY_W1;
export const SPR_INKY_W2 = spritetype.SPR_INKY_W2;
export const SPR_BOSS_W1 = spritetype.SPR_BOSS_W1;
export const SPR_BOSS_W2 = spritetype.SPR_BOSS_W2;
export const SPR_BOSS_W3 = spritetype.SPR_BOSS_W3;
export const SPR_BOSS_W4 = spritetype.SPR_BOSS_W4;
export const SPR_BOSS_SHOOT1 = spritetype.SPR_BOSS_SHOOT1;
export const SPR_BOSS_SHOOT2 = spritetype.SPR_BOSS_SHOOT2;
export const SPR_BOSS_SHOOT3 = spritetype.SPR_BOSS_SHOOT3;
export const SPR_BOSS_DEAD = spritetype.SPR_BOSS_DEAD;
export const SPR_BOSS_DIE1 = spritetype.SPR_BOSS_DIE1;
export const SPR_BOSS_DIE2 = spritetype.SPR_BOSS_DIE2;
export const SPR_BOSS_DIE3 = spritetype.SPR_BOSS_DIE3;
export const SPR_SCHABB_W1 = spritetype.SPR_SCHABB_W1;
export const SPR_SCHABB_W2 = spritetype.SPR_SCHABB_W2;
export const SPR_SCHABB_W3 = spritetype.SPR_SCHABB_W3;
export const SPR_SCHABB_W4 = spritetype.SPR_SCHABB_W4;
export const SPR_SCHABB_SHOOT1 = spritetype.SPR_SCHABB_SHOOT1;
export const SPR_SCHABB_SHOOT2 = spritetype.SPR_SCHABB_SHOOT2;
export const SPR_SCHABB_DIE1 = spritetype.SPR_SCHABB_DIE1;
export const SPR_SCHABB_DIE2 = spritetype.SPR_SCHABB_DIE2;
export const SPR_SCHABB_DIE3 = spritetype.SPR_SCHABB_DIE3;
export const SPR_SCHABB_DEAD = spritetype.SPR_SCHABB_DEAD;
export const SPR_HYPO1 = spritetype.SPR_HYPO1;
export const SPR_HYPO2 = spritetype.SPR_HYPO2;
export const SPR_HYPO3 = spritetype.SPR_HYPO3;
export const SPR_HYPO4 = spritetype.SPR_HYPO4;
export const SPR_FAKE_W1 = spritetype.SPR_FAKE_W1;
export const SPR_FAKE_W2 = spritetype.SPR_FAKE_W2;
export const SPR_FAKE_W3 = spritetype.SPR_FAKE_W3;
export const SPR_FAKE_W4 = spritetype.SPR_FAKE_W4;
export const SPR_FAKE_SHOOT = spritetype.SPR_FAKE_SHOOT;
export const SPR_FIRE1 = spritetype.SPR_FIRE1;
export const SPR_FIRE2 = spritetype.SPR_FIRE2;
export const SPR_FAKE_DIE1 = spritetype.SPR_FAKE_DIE1;
export const SPR_FAKE_DIE2 = spritetype.SPR_FAKE_DIE2;
export const SPR_FAKE_DIE3 = spritetype.SPR_FAKE_DIE3;
export const SPR_FAKE_DIE4 = spritetype.SPR_FAKE_DIE4;
export const SPR_FAKE_DIE5 = spritetype.SPR_FAKE_DIE5;
export const SPR_FAKE_DEAD = spritetype.SPR_FAKE_DEAD;
export const SPR_MECHA_W1 = spritetype.SPR_MECHA_W1;
export const SPR_MECHA_W2 = spritetype.SPR_MECHA_W2;
export const SPR_MECHA_W3 = spritetype.SPR_MECHA_W3;
export const SPR_MECHA_W4 = spritetype.SPR_MECHA_W4;
export const SPR_MECHA_SHOOT1 = spritetype.SPR_MECHA_SHOOT1;
export const SPR_MECHA_SHOOT2 = spritetype.SPR_MECHA_SHOOT2;
export const SPR_MECHA_SHOOT3 = spritetype.SPR_MECHA_SHOOT3;
export const SPR_MECHA_DEAD = spritetype.SPR_MECHA_DEAD;
export const SPR_MECHA_DIE1 = spritetype.SPR_MECHA_DIE1;
export const SPR_MECHA_DIE2 = spritetype.SPR_MECHA_DIE2;
export const SPR_MECHA_DIE3 = spritetype.SPR_MECHA_DIE3;
export const SPR_HITLER_W1 = spritetype.SPR_HITLER_W1;
export const SPR_HITLER_W2 = spritetype.SPR_HITLER_W2;
export const SPR_HITLER_W3 = spritetype.SPR_HITLER_W3;
export const SPR_HITLER_W4 = spritetype.SPR_HITLER_W4;
export const SPR_HITLER_SHOOT1 = spritetype.SPR_HITLER_SHOOT1;
export const SPR_HITLER_SHOOT2 = spritetype.SPR_HITLER_SHOOT2;
export const SPR_HITLER_SHOOT3 = spritetype.SPR_HITLER_SHOOT3;
export const SPR_HITLER_DEAD = spritetype.SPR_HITLER_DEAD;
export const SPR_HITLER_DIE1 = spritetype.SPR_HITLER_DIE1;
export const SPR_HITLER_DIE2 = spritetype.SPR_HITLER_DIE2;
export const SPR_HITLER_DIE3 = spritetype.SPR_HITLER_DIE3;
export const SPR_HITLER_DIE4 = spritetype.SPR_HITLER_DIE4;
export const SPR_HITLER_DIE5 = spritetype.SPR_HITLER_DIE5;
export const SPR_HITLER_DIE6 = spritetype.SPR_HITLER_DIE6;
export const SPR_HITLER_DIE7 = spritetype.SPR_HITLER_DIE7;
export const SPR_GIFT_W1 = spritetype.SPR_GIFT_W1;
export const SPR_GIFT_W2 = spritetype.SPR_GIFT_W2;
export const SPR_GIFT_W3 = spritetype.SPR_GIFT_W3;
export const SPR_GIFT_W4 = spritetype.SPR_GIFT_W4;
export const SPR_GIFT_SHOOT1 = spritetype.SPR_GIFT_SHOOT1;
export const SPR_GIFT_SHOOT2 = spritetype.SPR_GIFT_SHOOT2;
export const SPR_GIFT_DIE1 = spritetype.SPR_GIFT_DIE1;
export const SPR_GIFT_DIE2 = spritetype.SPR_GIFT_DIE2;
export const SPR_GIFT_DIE3 = spritetype.SPR_GIFT_DIE3;
export const SPR_GIFT_DEAD = spritetype.SPR_GIFT_DEAD;
export const SPR_ROCKET_1 = spritetype.SPR_ROCKET_1;
export const SPR_ROCKET_2 = spritetype.SPR_ROCKET_2;
export const SPR_ROCKET_3 = spritetype.SPR_ROCKET_3;
export const SPR_ROCKET_4 = spritetype.SPR_ROCKET_4;
export const SPR_ROCKET_5 = spritetype.SPR_ROCKET_5;
export const SPR_ROCKET_6 = spritetype.SPR_ROCKET_6;
export const SPR_ROCKET_7 = spritetype.SPR_ROCKET_7;
export const SPR_ROCKET_8 = spritetype.SPR_ROCKET_8;
export const SPR_SMOKE_1 = spritetype.SPR_SMOKE_1;
export const SPR_SMOKE_2 = spritetype.SPR_SMOKE_2;
export const SPR_SMOKE_3 = spritetype.SPR_SMOKE_3;
export const SPR_SMOKE_4 = spritetype.SPR_SMOKE_4;
export const SPR_BOOM_1 = spritetype.SPR_BOOM_1;
export const SPR_BOOM_2 = spritetype.SPR_BOOM_2;
export const SPR_BOOM_3 = spritetype.SPR_BOOM_3;
export const SPR_GRETEL_W1 = spritetype.SPR_GRETEL_W1;
export const SPR_GRETEL_W2 = spritetype.SPR_GRETEL_W2;
export const SPR_GRETEL_W3 = spritetype.SPR_GRETEL_W3;
export const SPR_GRETEL_W4 = spritetype.SPR_GRETEL_W4;
export const SPR_GRETEL_SHOOT1 = spritetype.SPR_GRETEL_SHOOT1;
export const SPR_GRETEL_SHOOT2 = spritetype.SPR_GRETEL_SHOOT2;
export const SPR_GRETEL_SHOOT3 = spritetype.SPR_GRETEL_SHOOT3;
export const SPR_GRETEL_DEAD = spritetype.SPR_GRETEL_DEAD;
export const SPR_GRETEL_DIE1 = spritetype.SPR_GRETEL_DIE1;
export const SPR_GRETEL_DIE2 = spritetype.SPR_GRETEL_DIE2;
export const SPR_GRETEL_DIE3 = spritetype.SPR_GRETEL_DIE3;
export const SPR_FAT_W1 = spritetype.SPR_FAT_W1;
export const SPR_FAT_W2 = spritetype.SPR_FAT_W2;
export const SPR_FAT_W3 = spritetype.SPR_FAT_W3;
export const SPR_FAT_W4 = spritetype.SPR_FAT_W4;
export const SPR_FAT_SHOOT1 = spritetype.SPR_FAT_SHOOT1;
export const SPR_FAT_SHOOT2 = spritetype.SPR_FAT_SHOOT2;
export const SPR_FAT_SHOOT3 = spritetype.SPR_FAT_SHOOT3;
export const SPR_FAT_SHOOT4 = spritetype.SPR_FAT_SHOOT4;
export const SPR_FAT_DIE1 = spritetype.SPR_FAT_DIE1;
export const SPR_FAT_DIE2 = spritetype.SPR_FAT_DIE2;
export const SPR_FAT_DIE3 = spritetype.SPR_FAT_DIE3;
export const SPR_FAT_DEAD = spritetype.SPR_FAT_DEAD;
export const SPR_BJ_W1 = spritetype.SPR_BJ_W1;
export const SPR_BJ_W2 = spritetype.SPR_BJ_W2;
export const SPR_BJ_W3 = spritetype.SPR_BJ_W3;
export const SPR_BJ_W4 = spritetype.SPR_BJ_W4;
export const SPR_BJ_JUMP1 = spritetype.SPR_BJ_JUMP1;
export const SPR_BJ_JUMP2 = spritetype.SPR_BJ_JUMP2;
export const SPR_BJ_JUMP3 = spritetype.SPR_BJ_JUMP3;
export const SPR_BJ_JUMP4 = spritetype.SPR_BJ_JUMP4;
export const SPR_KNIFEREADY = spritetype.SPR_KNIFEREADY;
export const SPR_KNIFEATK1 = spritetype.SPR_KNIFEATK1;
export const SPR_KNIFEATK2 = spritetype.SPR_KNIFEATK2;
export const SPR_KNIFEATK3 = spritetype.SPR_KNIFEATK3;
export const SPR_KNIFEATK4 = spritetype.SPR_KNIFEATK4;
export const SPR_PISTOLREADY = spritetype.SPR_PISTOLREADY;
export const SPR_PISTOLATK1 = spritetype.SPR_PISTOLATK1;
export const SPR_PISTOLATK2 = spritetype.SPR_PISTOLATK2;
export const SPR_PISTOLATK3 = spritetype.SPR_PISTOLATK3;
export const SPR_PISTOLATK4 = spritetype.SPR_PISTOLATK4;
export const SPR_MACHINEGUNREADY = spritetype.SPR_MACHINEGUNREADY;
export const SPR_MACHINEGUNATK1 = spritetype.SPR_MACHINEGUNATK1;
export const SPR_MACHINEGUNATK2 = spritetype.SPR_MACHINEGUNATK2;
export const MACHINEGUNATK3 = spritetype.MACHINEGUNATK3;
export const SPR_MACHINEGUNATK4 = spritetype.SPR_MACHINEGUNATK4;
export const SPR_CHAINREADY = spritetype.SPR_CHAINREADY;
export const SPR_CHAINATK1 = spritetype.SPR_CHAINATK1;
export const SPR_CHAINATK2 = spritetype.SPR_CHAINATK2;
export const SPR_CHAINATK3 = spritetype.SPR_CHAINATK3;
export const SPR_CHAINATK4 = spritetype.SPR_CHAINATK4;


/*
=============================================================================

						   GLOBAL TYPES

=============================================================================
*/

// typedef long fixed;
// C int/unsigned are 16-bit; long/fixed are 32-bit. Pointers are conceptual typed-array indices.
export type fixed = number;

export enum controldir_t {
	di_north,
	di_east,
	di_south,
	di_west

}

export const di_north = controldir_t.di_north;
export const di_east = controldir_t.di_east;
export const di_south = controldir_t.di_south;
export const di_west = controldir_t.di_west;

export enum door_t {
	dr_normal,
	dr_lock1,
	dr_lock2,
	dr_lock3,
	dr_lock4,
	dr_elevator

}

export const dr_normal = door_t.dr_normal;
export const dr_lock1 = door_t.dr_lock1;
export const dr_lock2 = door_t.dr_lock2;
export const dr_lock3 = door_t.dr_lock3;
export const dr_lock4 = door_t.dr_lock4;
export const dr_elevator = door_t.dr_elevator;

export enum activetype {
	ac_badobject = -1,
	ac_no,
	ac_yes,
	ac_allways

}

export const ac_badobject = activetype.ac_badobject;
export const ac_no = activetype.ac_no;
export const ac_yes = activetype.ac_yes;
export const ac_allways = activetype.ac_allways;

export enum classtype {
	nothing,
	playerobj,
	inertobj,
	guardobj,
	officerobj,
	ssobj,
	dogobj,
	bossobj,
	schabbobj,
	fakeobj,
	mechahitlerobj,
	mutantobj,
	needleobj,
	fireobj,
	bjobj,
	ghostobj,
	realhitlerobj,
	gretelobj,
	giftobj,
	fatobj,
	rocketobj,

	spectreobj,
	angelobj,
	transobj,
	uberobj,
	willobj,
	deathobj,
	hrocketobj,
	sparkobj

}

export const nothing = classtype.nothing;
export const playerobj = classtype.playerobj;
export const inertobj = classtype.inertobj;
export const guardobj = classtype.guardobj;
export const officerobj = classtype.officerobj;
export const ssobj = classtype.ssobj;
export const dogobj = classtype.dogobj;
export const bossobj = classtype.bossobj;
export const schabbobj = classtype.schabbobj;
export const fakeobj = classtype.fakeobj;
export const mechahitlerobj = classtype.mechahitlerobj;
export const mutantobj = classtype.mutantobj;
export const needleobj = classtype.needleobj;
export const fireobj = classtype.fireobj;
export const bjobj = classtype.bjobj;
export const ghostobj = classtype.ghostobj;
export const realhitlerobj = classtype.realhitlerobj;
export const gretelobj = classtype.gretelobj;
export const giftobj = classtype.giftobj;
export const fatobj = classtype.fatobj;
export const rocketobj = classtype.rocketobj;
export const spectreobj = classtype.spectreobj;
export const angelobj = classtype.angelobj;
export const transobj = classtype.transobj;
export const uberobj = classtype.uberobj;
export const willobj = classtype.willobj;
export const deathobj = classtype.deathobj;
export const hrocketobj = classtype.hrocketobj;
export const sparkobj = classtype.sparkobj;

export enum stat_t {
	dressing,
	block,
	bo_gibs,
	bo_alpo,
	bo_firstaid,
	bo_key1,
	bo_key2,
	bo_key3,
	bo_key4,
	bo_cross,
	bo_chalice,
	bo_bible,
	bo_crown,
	bo_clip,
	bo_clip2,
	bo_machinegun,
	bo_chaingun,
	bo_food,
	bo_fullheal,
	bo_25clip,
	bo_spear

}

export const dressing = stat_t.dressing;
export const block = stat_t.block;
export const bo_gibs = stat_t.bo_gibs;
export const bo_alpo = stat_t.bo_alpo;
export const bo_firstaid = stat_t.bo_firstaid;
export const bo_key1 = stat_t.bo_key1;
export const bo_key2 = stat_t.bo_key2;
export const bo_key3 = stat_t.bo_key3;
export const bo_key4 = stat_t.bo_key4;
export const bo_cross = stat_t.bo_cross;
export const bo_chalice = stat_t.bo_chalice;
export const bo_bible = stat_t.bo_bible;
export const bo_crown = stat_t.bo_crown;
export const bo_clip = stat_t.bo_clip;
export const bo_clip2 = stat_t.bo_clip2;
export const bo_machinegun = stat_t.bo_machinegun;
export const bo_chaingun = stat_t.bo_chaingun;
export const bo_food = stat_t.bo_food;
export const bo_fullheal = stat_t.bo_fullheal;
export const bo_25clip = stat_t.bo_25clip;
export const bo_spear = stat_t.bo_spear;

export enum dirtype {
	east,
	northeast,
	north,
	northwest,
	west,
	southwest,
	south,
	southeast,
	nodir

}

export const east = dirtype.east;
export const northeast = dirtype.northeast;
export const north = dirtype.north;
export const northwest = dirtype.northwest;
export const west = dirtype.west;
export const southwest = dirtype.southwest;
export const south = dirtype.south;
export const southeast = dirtype.southeast;
export const nodir = dirtype.nodir;


export const NUMENEMIES = 22;
export enum enemy_t {
	en_guard,
	en_officer,
	en_ss,
	en_dog,
	en_boss,
	en_schabbs,
	en_fake,
	en_hitler,
	en_mutant,
	en_blinky,
	en_clyde,
	en_pinky,
	en_inky,
	en_gretel,
	en_gift,
	en_fat,
	en_spectre,
	en_angel,
	en_trans,
	en_uber,
	en_will,
	en_death

}

export const en_guard = enemy_t.en_guard;
export const en_officer = enemy_t.en_officer;
export const en_ss = enemy_t.en_ss;
export const en_dog = enemy_t.en_dog;
export const en_boss = enemy_t.en_boss;
export const en_schabbs = enemy_t.en_schabbs;
export const en_fake = enemy_t.en_fake;
export const en_hitler = enemy_t.en_hitler;
export const en_mutant = enemy_t.en_mutant;
export const en_blinky = enemy_t.en_blinky;
export const en_clyde = enemy_t.en_clyde;
export const en_pinky = enemy_t.en_pinky;
export const en_inky = enemy_t.en_inky;
export const en_gretel = enemy_t.en_gretel;
export const en_gift = enemy_t.en_gift;
export const en_fat = enemy_t.en_fat;
export const en_spectre = enemy_t.en_spectre;
export const en_angel = enemy_t.en_angel;
export const en_trans = enemy_t.en_trans;
export const en_uber = enemy_t.en_uber;
export const en_will = enemy_t.en_will;
export const en_death = enemy_t.en_death;


// typedef struct	statestruct
// {
// 	boolean	rotate;
// 	int		shapenum;			// a shapenum of -1 means get from ob->temp1
// 	int		tictime;
// 	void	(*think) (),(*action) ();
// 	struct	statestruct	*next;
// } statetype;
export interface statetype {
	rotate: boolean;
	shapenum: number;			// a shapenum of -1 means get from ob->temp1
	tictime: number;
	think: (() => void) | null;
	action: (() => void) | null;
	next: statetype | null;
}


//---------------------
//
// trivial actor structure
//
//---------------------

// typedef struct statstruct
// {
// 	byte	tilex,tiley;
// 	byte	*visspot;
// 	int		shapenum;			// if shapenum == -1 the obj has been removed
// 	byte	flags;
// 	byte	itemnumber;
// } statobj_t;
export interface statobj_t {
	tilex: byte;
	tiley: byte;
	visspot: Ptr | null;
	shapenum: number;			// if shapenum == -1 the obj has been removed
	flags: byte;
	itemnumber: byte;
}


//---------------------
//
// door actor structure
//
//---------------------

// typedef struct doorstruct
// {
// 	byte	tilex,tiley;
// 	boolean	vertical;
// 	byte	lock;
// 	enum	{dr_open,dr_closed,dr_opening,dr_closing}	action;
// 	int		ticcount;
// } doorobj_t;
export enum dooraction_t {
	dr_open,
	dr_closed,
	dr_opening,
	dr_closing
}
export const dr_open = dooraction_t.dr_open;
export const dr_closed = dooraction_t.dr_closed;
export const dr_opening = dooraction_t.dr_opening;
export const dr_closing = dooraction_t.dr_closing;

export interface doorobj_t {
	tilex: byte;
	tiley: byte;
	vertical: boolean;
	lock: byte;
	action: dooraction_t;
	ticcount: number;
}


//--------------------
//
// thinking actor structure
//
//--------------------

// typedef struct objstruct
// {
// 	activetype	active;
// 	int			ticcount;
// 	classtype	obclass;
// 	statetype	*state;
//
// 	byte		flags;				//	FL_SHOOTABLE, etc
//
// 	long		distance;			// if negative, wait for that door to open
// 	dirtype		dir;
//
// 	fixed 		x,y;
// 	unsigned	tilex,tiley;
// 	byte		areanumber;
//
// 	int	 		viewx;
// 	unsigned	viewheight;
// 	fixed		transx,transy;		// in global coord
//
// 	int 		angle;
// 	int			hitpoints;
// 	long		speed;
//
// 	int			temp1,temp2,temp3;
// 	struct		objstruct	*next,*prev;
// } objtype;
export interface objtype {
	active: activetype;
	ticcount: number;
	obclass: classtype;
	state: statetype | null;

	flags: byte;				//	FL_SHOOTABLE, etc

	distance: number;			// if negative, wait for that door to open
	dir: dirtype;

	x: fixed;
	y: fixed;
	tilex: word;
	tiley: word;
	areanumber: byte;

	viewx: number;
	viewheight: word;
	transx: fixed;
	transy: fixed;		// in global coord

	angle: number;
	hitpoints: number;
	speed: number;

	temp1: number;
	temp2: number;
	temp3: number;
	next: objtype | null;
	prev: objtype | null;
}


export const NUMBUTTONS = 8;
export enum buttontype {
	bt_nobutton=-1,
	bt_attack=0,
	bt_strafe,
	bt_run,
	bt_use,
	bt_readyknife,
	bt_readypistol,
	bt_readymachinegun,
	bt_readychaingun

}

export const bt_nobutton = buttontype.bt_nobutton;
export const bt_attack = buttontype.bt_attack;
export const bt_strafe = buttontype.bt_strafe;
export const bt_run = buttontype.bt_run;
export const bt_use = buttontype.bt_use;
export const bt_readyknife = buttontype.bt_readyknife;
export const bt_readypistol = buttontype.bt_readypistol;
export const bt_readymachinegun = buttontype.bt_readymachinegun;
export const bt_readychaingun = buttontype.bt_readychaingun;


export const NUMWEAPONS = 5;
export enum weapontype {
	wp_knife,
	wp_pistol,
	wp_machinegun,
	wp_chaingun

}

export const wp_knife = weapontype.wp_knife;
export const wp_pistol = weapontype.wp_pistol;
export const wp_machinegun = weapontype.wp_machinegun;
export const wp_chaingun = weapontype.wp_chaingun;


export enum difficulty_t {
	gd_baby,
	gd_easy,
	gd_medium,
	gd_hard

}

export const gd_baby = difficulty_t.gd_baby;
export const gd_easy = difficulty_t.gd_easy;
export const gd_medium = difficulty_t.gd_medium;
export const gd_hard = difficulty_t.gd_hard;

//---------------
//
// gamestate structure
//
//---------------

// typedef	struct
// {
// 	int			difficulty;
// 	int			mapon;
// 	long		oldscore,score,nextextra;
// 	int			lives;
// 	int			health;
// 	int			ammo;
// 	int			keys;
// 	weapontype		bestweapon,weapon,chosenweapon;
//
// 	int			faceframe;
// 	int			attackframe,attackcount,weaponframe;
//
// 	int			episode,secretcount,treasurecount,killcount,
// 				secrettotal,treasuretotal,killtotal;
// 	long		TimeCount;
// 	long		killx,killy;
// 	boolean		victoryflag;		// set during victory animations
// } gametype;
export interface gametype {
	difficulty: number;
	mapon: number;
	oldscore: number;
	score: number;
	nextextra: number;
	lives: number;
	health: number;
	ammo: number;
	keys: number;
	bestweapon: weapontype;
	weapon: weapontype;
	chosenweapon: weapontype;

	faceframe: number;
	attackframe: number;
	attackcount: number;
	weaponframe: number;

	episode: number;
	secretcount: number;
	treasurecount: number;
	killcount: number;
	secrettotal: number;
	treasuretotal: number;
	killtotal: number;
	TimeCount: number;
	killx: number;
	killy: number;
	victoryflag: boolean;		// set during victory animations
}


export enum exit_t {
	ex_stillplaying,
	ex_completed,
	ex_died,
	ex_warped,
	ex_resetgame,
	ex_loadedgame,
	ex_victorious,
	ex_abort,
	ex_demodone,
	ex_secretlevel

}

export const ex_stillplaying = exit_t.ex_stillplaying;
export const ex_completed = exit_t.ex_completed;
export const ex_died = exit_t.ex_died;
export const ex_warped = exit_t.ex_warped;
export const ex_resetgame = exit_t.ex_resetgame;
export const ex_loadedgame = exit_t.ex_loadedgame;
export const ex_victorious = exit_t.ex_victorious;
export const ex_abort = exit_t.ex_abort;
export const ex_demodone = exit_t.ex_demodone;
export const ex_secretlevel = exit_t.ex_secretlevel;


/*
=============================================================================

						 WL_MAIN DEFINITIONS

=============================================================================
*/

// extern	boolean		MS_CheckParm (char far *string);

// extern	char		str[80],str2[20];
// extern	int			tedlevelnum;
// extern	boolean		tedlevel;
// extern	boolean		nospr;
// extern	boolean		IsA386;

// extern	byte far	*scalermemory;

// extern	fixed		focallength;
// extern	unsigned	viewangles;
// extern	unsigned	screenofs;
// extern	int		    viewwidth;
// extern	int			viewheight;
// extern	int			centerx;
// extern	int			shootdelta;

// extern	int			dirangle[9];

// extern	boolean         startgame,loadedgame,virtualreality;
// extern	int		mouseadjustment;
//
// math tables
//
// extern	int			pixelangle[MAXVIEWWIDTH];
// extern	long		far finetangent[FINEANGLES/4];
// extern	fixed 		far sintable[],far *costable;

//
// derived constants
//
// extern	fixed 	scale,maxslope;
// extern	long	heightnumerator;
// extern	int		minheightdiv;

// extern	char	configname[13];



// void		HelpScreens (void);
// void		OrderingInfo (void);
// void		TEDDeath(void);
// void		Quit (char *error);
// void 		CalcProjection (long focal);
// boolean		SetViewSize (unsigned width, unsigned height);
// void		NewGame (int difficulty,int episode);
// void 		NewViewSize (int width);
// boolean 	LoadTheGame(int file,int x,int y);
// boolean		SaveTheGame(int file,int x,int y);
// void 		ShowViewSize (int width);
// void		ShutdownId (void);


/*
=============================================================================

						 WL_GAME DEFINITIONS

=============================================================================
*/


// extern	boolean		ingame,fizzlein;
// extern	unsigned	latchpics[NUMLATCHPICS];
// extern	gametype	gamestate;
// extern	int			doornum;

// extern	char		demoname[13];

// extern	long		spearx,speary;
// extern	unsigned	spearangle;
// extern	boolean		spearflag;


// void 	DrawPlayBorder (void);
// void 	ScanInfoPlane (void);
// void	SetupGameLevel (void);
// void 	NormalScreen (void);
// void 	DrawPlayScreen (void);
// void 	FizzleOut (void);
// void 	GameLoop (void);
// void ClearMemory (void);
// void PlayDemo (int demonumber);
// void RecordDemo (void);
// void DrawAllPlayBorder (void);
// void	DrawHighScores(void);
// void DrawAllPlayBorderSides (void);


// JAB
// #define	PlaySoundLocTile(s,tx,ty)	PlaySoundLocGlobal(s,(((long)(tx) << TILESHIFT) + (1L << (TILESHIFT - 1))),(((long)ty << TILESHIFT) + (1L << (TILESHIFT - 1))))
export function PlaySoundLocTile(s: word, tx: number, ty: number): [word, fixed, fixed] {
	return [s, ((tx << TILESHIFT) + (1 << (TILESHIFT - 1))), ((ty << TILESHIFT) + (1 << (TILESHIFT - 1)))];
}
// #define	PlaySoundLocActor(s,ob)		PlaySoundLocGlobal(s,(ob)->x,(ob)->y)
export function PlaySoundLocActor(s: word, ob: objtype): [word, fixed, fixed] {
	return [s, ob.x, ob.y];
}
// void	PlaySoundLocGlobal(word s,fixed gx,fixed gy);
// void UpdateSoundLoc(void);


/*
=============================================================================

						 WL_PLAY DEFINITIONS

=============================================================================
*/

// #ifdef SPEAR
// extern	long		funnyticount;		// FOR FUNNY BJ FACE
// #endif

// extern	exit_t		playstate;

// extern	boolean		madenoise;

// extern	objtype 	objlist[MAXACTORS],*new,*obj,*player,*lastobj,
// 					*objfreelist,*killerobj;
// extern	statobj_t	statobjlist[MAXSTATS],*laststatobj;
// extern	doorobj_t	doorobjlist[MAXDOORS],*lastdoorobj;

// extern	unsigned	farmapylookup[MAPSIZE];
// extern	byte		*nearmapylookup[MAPSIZE];

// extern	byte		tilemap[MAPSIZE][MAPSIZE];	// wall values only
// extern	byte		spotvis[MAPSIZE][MAPSIZE];
// extern	objtype		*actorat[MAPSIZE][MAPSIZE];

export const UPDATESIZE = (UPDATEWIDE*UPDATEHIGH);
// extern	byte		update[UPDATESIZE];

// extern	boolean		singlestep,godmode,noclip;
// extern	int			extravbls;

//
// control info
//
// extern	boolean		mouseenabled,joystickenabled,joypadenabled,joystickprogressive;
// extern	int			joystickport;
// extern	int			dirscan[4];
// extern	int			buttonscan[NUMBUTTONS];
// extern	int			buttonmouse[4];
// extern	int			buttonjoy[4];

// extern	boolean		buttonheld[NUMBUTTONS];

// extern	int			viewsize;

//
// curent user input
//
// extern	int			controlx,controly;		// range from -100 to 100
// extern	boolean		buttonstate[NUMBUTTONS];

// extern	boolean		demorecord,demoplayback;
// extern	char		far *demoptr, far *lastdemoptr;
// extern	memptr		demobuffer;



// void	InitRedShifts (void);
// void 	FinishPaletteShifts (void);

// void	CenterWindow(word w,word h);
// void 	InitActorList (void);
// void 	GetNewActor (void);
// void 	RemoveObj (objtype *gone);
// void 	PollControls (void);
// void 	StopMusic(void);
// void 	StartMusic(void);
// void	PlayLoop (void);
// void StartDamageFlash (int damage);
// void StartBonusFlash (void);

/*
=============================================================================

							WL_INTER

=============================================================================
*/

// void IntroScreen (void);
// void PreloadGraphics(void);
// void LevelCompleted (void);
// void	CheckHighScore (long score,word other);
// void Victory (void);
// void ClearSplitVWB (void);


/*
=============================================================================

							WL_DEBUG

=============================================================================
*/

// int DebugKeys (void);
// void PicturePause (void);


/*
=============================================================================

						 WL_DRAW DEFINITIONS

=============================================================================
*/

// extern	unsigned screenloc[3];
// extern	unsigned freelatch;

// extern	long 	lasttimecount;
// extern	long 	frameon;
// extern	boolean	fizzlein;

// extern	unsigned	wallheight[MAXVIEWWIDTH];

// extern	fixed	tileglobal;
// extern	fixed	focallength;
// extern	fixed	mindist;

//
// math tables
//
// extern	int			pixelangle[MAXVIEWWIDTH];
// extern	long		far finetangent[FINEANGLES/4];
// extern	fixed 		far sintable[],far *costable;

//
// derived constants
//
// extern	fixed 	scale;
// extern	long	heightnumerator,mindist;

//
// refresh variables
//
// extern	fixed	viewx,viewy;			// the focal point
// extern	int		viewangle;
// extern	fixed	viewsin,viewcos;

// extern	long		postsource;
// extern	unsigned	postx;
// extern	unsigned	postwidth;


// extern	int		horizwall[],vertwall[];

// extern	unsigned	pwallpos;


// fixed	FixedByFrac (fixed a, fixed b);
// void	TransformActor (objtype *ob);
// void	BuildTables (void);
// void	ClearScreen (void);
// int		CalcRotate (objtype *ob);
// void	DrawScaleds (void);
// void	CalcTics (void);
// void	FixOfs (void);
// void	ThreeDRefresh (void);
// void  FarScalePost (void);

/*
=============================================================================

						 WL_STATE DEFINITIONS

=============================================================================
*/
export const TURNTICS = 10;
export const SPDPATROL = 512;
export const SPDDOG = 1500;


// extern	dirtype opposite[9];
// extern	dirtype diagonal[9][9];


// void	InitHitRect (objtype *ob, unsigned radius);
// void	SpawnNewObj (unsigned tilex, unsigned tiley, statetype *state);
// void	NewState (objtype *ob, statetype *state);

// boolean TryWalk (objtype *ob);
// void 	SelectChaseDir (objtype *ob);
// void 	SelectDodgeDir (objtype *ob);
// void	SelectRunDir (objtype *ob);
// void	MoveObj (objtype *ob, long move);
// boolean SightPlayer (objtype *ob);

// void	KillActor (objtype *ob);
// void	DamageActor (objtype *ob, unsigned damage);

// boolean CheckLine (objtype *ob);
// boolean	CheckSight (objtype *ob);


/*
=============================================================================

						 WL_SCALE DEFINITIONS

=============================================================================
*/


export const COMPSCALECODESTART = (65*4);		// offset to start of code in comp scaler

// typedef struct
// {
// 	unsigned	codeofs[65];
// 	unsigned	width[65];
// 	byte		code[];
// }	t_compscale;
export interface t_compscale {
	codeofs: word[];
	width: word[];
	code: byte[];
}

// typedef struct
// {
// 	unsigned	leftpix,rightpix;
// 	unsigned	dataofs[64];
// // table data after dataofs[rightpix-leftpix+1]
// }	t_compshape;
export interface t_compshape {
	leftpix: word;
	rightpix: word;
	dataofs: word[];
}


// extern	t_compscale _seg *scaledirectory[MAXSCALEHEIGHT+1];
// extern	long			fullscalefarcall[MAXSCALEHEIGHT+1];

// extern	byte		bitmasks1[8][8];
// extern	byte		bitmasks2[8][8];
// extern	unsigned	wordmasks[8][8];

// extern	byte		mapmasks1[4][8];
// extern	byte		mapmasks2[4][8];
// extern	byte		mapmasks3[4][8];

// extern	int			maxscale,maxscaleshl2;

// extern	boolean	insetupscaling;

// void SetupScaling (int maxscaleheight);
// void ScaleShape (int xcenter, int shapenum, unsigned height);
// void SimpleScaleShape (int xcenter, int shapenum, unsigned height);

/*
=============================================================================

						 WL_AGENT DEFINITIONS

=============================================================================
*/

//
// player state info
//
// extern	boolean		running;
// extern	long		thrustspeed;
// extern	unsigned	plux,pluy;		// player coordinates scaled to unsigned

// extern	int			anglefrac;
// extern	int			facecount;

// void	SpawnPlayer (int tilex, int tiley, int dir);
// void 	DrawFace (void);
// void	DrawHealth (void);
// void	TakeDamage (int points,objtype *attacker);
// void	HealSelf (int points);
// void	DrawLevel (void);
// void	DrawLives (void);
// void	GiveExtraMan (void);
// void	DrawScore (void);
// void	GivePoints (long points);
// void	DrawWeapon (void);
// void	DrawKeys (void);
// void	GiveWeapon (int weapon);
// void	DrawAmmo (void);
// void	GiveAmmo (int ammo);
// void	GiveKey (int key);
// void	GetBonus (statobj_t *check);

// void	Thrust (int angle, long speed);

/*
=============================================================================

						 WL_ACT1 DEFINITIONS

=============================================================================
*/

// extern	doorobj_t	doorobjlist[MAXDOORS],*lastdoorobj;
// extern	int			doornum;

// extern	unsigned	doorposition[MAXDOORS],pwallstate;

// extern	byte		far areaconnect[NUMAREAS][NUMAREAS];

// extern	boolean		areabyplayer[NUMAREAS];

// extern unsigned	pwallstate;
// extern unsigned	pwallpos;			// amount a pushable wall has been moved (0-63)
// extern unsigned	pwallx,pwally;
// extern int			pwalldir;


// void InitDoorList (void);
// void InitStaticList (void);
// void SpawnStatic (int tilex, int tiley, int type);
// void SpawnDoor (int tilex, int tiley, boolean vertical, int lock);
// void MoveDoors (void);
// void MovePWalls (void);
// void OpenDoor (int door);
// void PlaceItemType (int itemtype, int tilex, int tiley);
// void PushWall (int checkx, int checky, int dir);
// void OperateDoor (int door);
// void InitAreas (void);

/*
=============================================================================

						 WL_ACT2 DEFINITIONS

=============================================================================
*/

export const s_nakedbody = 's_static10';

// extern	statetype s_grddie1;
// extern	statetype s_dogdie1;
// extern	statetype s_ofcdie1;
// extern	statetype s_mutdie1;
// extern	statetype s_ssdie1;
// extern	statetype s_bossdie1;
// extern	statetype s_schabbdie1;
// extern	statetype s_fakedie1;
// extern	statetype s_mechadie1;
// extern	statetype s_hitlerdie1;
// extern	statetype s_greteldie1;
// extern	statetype s_giftdie1;
// extern	statetype s_fatdie1;

// extern	statetype s_spectredie1;
// extern	statetype s_angeldie1;
// extern	statetype s_transdie0;
// extern	statetype s_uberdie0;
// extern	statetype s_willdie1;
// extern	statetype s_deathdie1;


// extern	statetype s_grdchase1;
// extern	statetype s_dogchase1;
// extern	statetype s_ofcchase1;
// extern	statetype s_sschase1;
// extern	statetype s_mutchase1;
// extern	statetype s_bosschase1;
// extern	statetype s_schabbchase1;
// extern	statetype s_fakechase1;
// extern	statetype s_mechachase1;
// extern	statetype s_gretelchase1;
// extern	statetype s_giftchase1;
// extern	statetype s_fatchase1;

// extern	statetype s_spectrechase1;
// extern	statetype s_angelchase1;
// extern	statetype s_transchase1;
// extern	statetype s_uberchase1;
// extern	statetype s_willchase1;
// extern	statetype s_deathchase1;

// extern	statetype s_blinkychase1;
// extern	statetype s_hitlerchase1;

// extern	statetype s_grdpain;
// extern	statetype s_grdpain1;
// extern	statetype s_ofcpain;
// extern	statetype s_ofcpain1;
// extern	statetype s_sspain;
// extern	statetype s_sspain1;
// extern	statetype s_mutpain;
// extern	statetype s_mutpain1;

// extern	statetype s_deathcam;

// extern	statetype s_schabbdeathcam2;
// extern	statetype s_hitlerdeathcam2;
// extern	statetype s_giftdeathcam2;
// extern	statetype s_fatdeathcam2;

// void SpawnStand (enemy_t which, int tilex, int tiley, int dir);
// void SpawnPatrol (enemy_t which, int tilex, int tiley, int dir);
// void KillActor (objtype *ob);

// void	US_ControlPanel(byte);

// void SpawnDeadGuard (int tilex, int tiley);
// void SpawnBoss (int tilex, int tiley);
// void SpawnGretel (int tilex, int tiley);
// void SpawnTrans (int tilex, int tiley);
// void SpawnUber (int tilex, int tiley);
// void SpawnWill (int tilex, int tiley);
// void SpawnDeath (int tilex, int tiley);
// void SpawnAngel (int tilex, int tiley);
// void SpawnSpectre (int tilex, int tiley);
// void SpawnGhosts (int which, int tilex, int tiley);
// void SpawnSchabbs (int tilex, int tiley);
// void SpawnGift (int tilex, int tiley);
// void SpawnFat (int tilex, int tiley);
// void SpawnFakeHitler (int tilex, int tiley);
// void SpawnHitler (int tilex, int tiley);

/*
=============================================================================

						 WL_TEXT DEFINITIONS

=============================================================================
*/

// extern	char	helpfilename[],endfilename[];

// extern	void	HelpScreens(void);
// extern	void	EndText(void);
