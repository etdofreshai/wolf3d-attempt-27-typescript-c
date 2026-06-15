import { DOSMemory } from "./TS_DOS_MEMORY";
import { bufferofs as vlBufferofs, VL_SetBufferOffset } from "./ID_VL.C";
import { LatchDrawPic, type LatchDrawPicSummary } from "./ID_VH.C";
import {
  ClipMoveMemory,
  CmdUseMemory,
  CmdFireMemory,
  ControlMovementMemory,
  GiveAmmoMemory,
  GiveExtraManMemory,
  GiveKeyMemory,
  GivePointsSummaryMemory,
  GiveWeaponMemory,
  GetBonusMemory,
  GunAttackMemory,
  HealSelfMemory,
  KnifeAttackMemory,
  SpawnPlayerMemory,
  T_PlayerMemory,
  T_AttackMemory,
  TakeDamageMemory,
  ThrustMemory,
  TryMoveMemory,
  UpdateFaceMemory,
  VictorySpinMemory,
  VictoryTileMemory,
  type AmmoSummary,
  type AttackTickSummary,
  type BonusSummary,
  type ClipMoveSummary,
  type CmdUseSummary,
  type CmdFireSummary,
  type ControlMovementSummary,
  type DamageSummary,
  type FaceUpdateSummary,
  type HealSummary,
  type KeySummary,
  type PlayerTickSummary,
  type PlayerAttackSummary,
  type PlayerSpawnSummary,
  type PlayerTryMoveSummary,
  type PathStepOptions,
  type PointsSummary,
  type SightPlayerOptions,
  type ThrustSummary,
  type VictorySpinSummary,
  type WeaponSummary,
  type WeaponChangeSummary,
  CheckWeaponChangeMemory,
} from "./TS_LEVEL_SETUP";
import { nearOffsetForRuntimeSymbol } from "./TS_SAVE_LAYOUT";

// @generated-from-wolfsrc
// Original file: source/WOLFSRC/WL_AGENT.C
// This module preserves the source text below as line comments for audit.
// Hand ports can replace generated stubs function-by-function while keeping
// the original text nearby for side-by-side review.

export const WOLFSRC_FILE = "WL_AGENT.C";
export const WOLFSRC_FUNCTIONS = [
  "CheckWeaponChange",
  "ClipMove",
  "Cmd_Fire",
  "Cmd_Use",
  "ControlMovement",
  "DrawAmmo",
  "DrawFace",
  "DrawHealth",
  "DrawKeys",
  "DrawLevel",
  "DrawLives",
  "DrawScore",
  "DrawWeapon",
  "GetBonus",
  "GiveAmmo",
  "GiveExtraMan",
  "GiveKey",
  "GivePoints",
  "GiveWeapon",
  "GunAttack",
  "HealSelf",
  "KnifeAttack",
  "LatchNumber",
  "SpawnPlayer",
  "StatusDrawPic",
  "T_Attack",
  "T_Player",
  "TakeDamage",
  "Thrust",
  "TryMove",
  "UpdateFace",
  "VictorySpin",
  "VictoryTile"
] as const;

const SCREENWIDTH = 80;
const STATUSLINES = 40;
const SCREENSIZE = SCREENWIDTH * 208;
const PAGE1START = 0;
const PAGE2START = SCREENSIZE;
const PAGE3START = SCREENSIZE * 2;
const STATUSBAR_BASE = (200 - STATUSLINES) * SCREENWIDTH;
const KNIFEPIC = 91;
const NOKEYPIC = 95;
const GOLDKEYPIC = 96;
const SILVERKEYPIC = 97;
const N_BLANKPIC = 98;
const N_0PIC = 99;
const FACE1APIC = 109;
const FACE8APIC = 130;
const MUTANTBJPIC = 132;
const NEEDLEOBJ = 12;
const OBJ_CLASS_OFFSET = 4;
const GAMESTATE_MAPON_OFFSET = 2;
const GAMESTATE_SCORE_OFFSET = 8;
const GAMESTATE_LIVES_OFFSET = 16;
const GAMESTATE_HEALTH_OFFSET = 18;
const GAMESTATE_AMMO_OFFSET = 20;
const GAMESTATE_KEYS_OFFSET = 22;
const GAMESTATE_WEAPON_OFFSET = 26;
const GAMESTATE_FACEFRAME_OFFSET = 30;

export interface StatusDrawOptions {
  readonly pictable?: Uint8Array;
}

export interface StatusDrawPicSummary {
  readonly x: number;
  readonly y: number;
  readonly picnum: number;
  readonly pages: readonly [number, number, number];
  readonly draws: readonly [LatchDrawPicSummary, LatchDrawPicSummary, LatchDrawPicSummary];
}

export interface LatchNumberSummary {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly number: number;
  readonly picnums: readonly number[];
  readonly draws: readonly StatusDrawPicSummary[];
}

export interface DrawFaceSummary extends StatusDrawPicSummary {
  readonly health: number;
  readonly faceframe: number;
  readonly mutantDeath: boolean;
}

function gamestateOffset(): number {
  return nearOffsetForRuntimeSymbol("_gamestate");
}

export function CheckWeaponChange(dgroup: DOSMemory): WeaponChangeSummary {
  return CheckWeaponChangeMemory(dgroup);
}

export function ClipMove(
  dgroup: DOSMemory,
  actor: number,
  xmove: number,
  ymove: number,
): ClipMoveSummary {
  return ClipMoveMemory(dgroup, actor, xmove, ymove);
}

export function Cmd_Fire(dgroup: DOSMemory): CmdFireSummary {
  return CmdFireMemory(dgroup);
}

export function Cmd_Use(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  plane1: Uint16Array,
): CmdUseSummary {
  return CmdUseMemory(dgroup, plane0, plane1);
}

export function ControlMovement(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  plane1: Uint16Array,
  actor?: number,
): ControlMovementSummary {
  return ControlMovementMemory(dgroup, plane0, plane1, actor);
}

export function DrawAmmo(dgroup: DOSMemory, options: StatusDrawOptions = {}): LatchNumberSummary {
  return LatchNumber(27, 16, 2, dgroup.u16(gamestateOffset() + GAMESTATE_AMMO_OFFSET), options);
}

export function DrawFace(dgroup: DOSMemory, options: StatusDrawOptions = {}): DrawFaceSummary {
  const gamestate = gamestateOffset();
  const health = dgroup.u16(gamestate + GAMESTATE_HEALTH_OFFSET);
  const faceframe = dgroup.u16(gamestate + GAMESTATE_FACEFRAME_OFFSET);
  let picnum: number;
  let mutantDeath = false;

  if (health) {
    picnum = FACE1APIC + 3 * Math.trunc((100 - health) / 16) + faceframe;
  } else {
    const lastAttacker = dgroup.u16(nearOffsetForRuntimeSymbol("_LastAttacker"));
    mutantDeath = lastAttacker !== 0 && dgroup.u16(lastAttacker + OBJ_CLASS_OFFSET) === NEEDLEOBJ;
    picnum = mutantDeath ? MUTANTBJPIC : FACE8APIC;
  }

  return { ...StatusDrawPic(17, 4, picnum, options), health, faceframe, mutantDeath };
}

export function DrawHealth(dgroup: DOSMemory, options: StatusDrawOptions = {}): LatchNumberSummary {
  return LatchNumber(21, 16, 3, dgroup.u16(gamestateOffset() + GAMESTATE_HEALTH_OFFSET), options);
}

export function DrawKeys(dgroup: DOSMemory, options: StatusDrawOptions = {}): readonly [StatusDrawPicSummary, StatusDrawPicSummary] {
  const keys = dgroup.u16(gamestateOffset() + GAMESTATE_KEYS_OFFSET);
  return [
    StatusDrawPic(30, 4, keys & 1 ? GOLDKEYPIC : NOKEYPIC, options),
    StatusDrawPic(30, 20, keys & 2 ? SILVERKEYPIC : NOKEYPIC, options),
  ];
}

export function DrawLevel(dgroup: DOSMemory, options: StatusDrawOptions = {}): LatchNumberSummary {
  return LatchNumber(2, 16, 2, dgroup.u16(gamestateOffset() + GAMESTATE_MAPON_OFFSET) + 1, options);
}

export function DrawLives(dgroup: DOSMemory, options: StatusDrawOptions = {}): LatchNumberSummary {
  return LatchNumber(14, 16, 1, dgroup.u16(gamestateOffset() + GAMESTATE_LIVES_OFFSET), options);
}

export function DrawScore(dgroup: DOSMemory, options: StatusDrawOptions = {}): LatchNumberSummary {
  return LatchNumber(6, 16, 6, dgroup.u32(gamestateOffset() + GAMESTATE_SCORE_OFFSET), options);
}

export function DrawWeapon(dgroup: DOSMemory, options: StatusDrawOptions = {}): StatusDrawPicSummary {
  return StatusDrawPic(32, 8, KNIFEPIC + dgroup.u16(gamestateOffset() + GAMESTATE_WEAPON_OFFSET), options);
}

export function GetBonus(dgroup: DOSMemory, statobj: number): BonusSummary {
  return GetBonusMemory(dgroup, statobj);
}

export function GiveAmmo(dgroup: DOSMemory, ammo: number): AmmoSummary {
  return GiveAmmoMemory(dgroup, ammo);
}

export function GiveExtraMan(dgroup: DOSMemory): number {
  return GiveExtraManMemory(dgroup);
}

export function GiveKey(dgroup: DOSMemory, key: number): KeySummary {
  return GiveKeyMemory(dgroup, key);
}

export function GivePoints(dgroup: DOSMemory, points: number): PointsSummary {
  return GivePointsSummaryMemory(dgroup, points);
}

export function GiveWeapon(dgroup: DOSMemory, weapon: number): WeaponSummary {
  return GiveWeaponMemory(dgroup, weapon);
}

export function GunAttack(
  dgroup: DOSMemory,
  actor: number,
  options: SightPlayerOptions = {},
): PlayerAttackSummary {
  return GunAttackMemory(dgroup, actor, options);
}

export function HealSelf(dgroup: DOSMemory, points: number): HealSummary {
  return HealSelfMemory(dgroup, points);
}

export function KnifeAttack(dgroup: DOSMemory, actor: number): PlayerAttackSummary {
  return KnifeAttackMemory(dgroup, actor);
}

export function LatchNumber(x: number, y: number, width: number, number: number, options: StatusDrawOptions = {}): LatchNumberSummary {
  const originalX = x;
  const originalWidth = width;
  const str = Math.trunc(number).toString(10);
  const draws: StatusDrawPicSummary[] = [];
  const picnums: number[] = [];
  let length = str.length;

  while (length < width) {
    const draw = StatusDrawPic(x, y, N_BLANKPIC, options);
    draws.push(draw);
    picnums.push(N_BLANKPIC);
    x++;
    width--;
  }

  let c = length <= width ? 0 : length - width;
  while (c < length) {
    const picnum = str.charCodeAt(c) - 48 + N_0PIC;
    const draw = StatusDrawPic(x, y, picnum, options);
    draws.push(draw);
    picnums.push(picnum);
    x++;
    c++;
  }

  return { x: originalX, y, width: originalWidth, number, picnums, draws };
}

export function SpawnPlayer(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  tilex: number,
  tiley: number,
  dir: number,
): PlayerSpawnSummary {
  return SpawnPlayerMemory(dgroup, plane0, tilex, tiley, dir);
}

export function StatusDrawPic(x: number, y: number, picnum: number, options: StatusDrawOptions = {}): StatusDrawPicSummary {
  const temp = vlBufferofs;
  const pages = [
    PAGE1START + STATUSBAR_BASE,
    PAGE2START + STATUSBAR_BASE,
    PAGE3START + STATUSBAR_BASE,
  ] as const;

  VL_SetBufferOffset(0);
  VL_SetBufferOffset(pages[0]);
  const first = LatchDrawPic(x, y, picnum, options);
  VL_SetBufferOffset(pages[1]);
  const second = LatchDrawPic(x, y, picnum, options);
  VL_SetBufferOffset(pages[2]);
  const third = LatchDrawPic(x, y, picnum, options);
  VL_SetBufferOffset(temp);

  return { x, y, picnum, pages, draws: [first, second, third] };
}

export function T_Attack(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  plane1: Uint16Array,
  actor: number,
  options: PathStepOptions = {},
): AttackTickSummary {
  return T_AttackMemory(dgroup, plane0, plane1, actor, options);
}

export function T_Player(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  plane1: Uint16Array,
  actor: number,
  options: SightPlayerOptions = {},
): PlayerTickSummary {
  return T_PlayerMemory(dgroup, plane0, plane1, actor, options);
}

export function TakeDamage(dgroup: DOSMemory, points: number, attacker: number): DamageSummary {
  return TakeDamageMemory(dgroup, attacker, points);
}

export function Thrust(
  dgroup: DOSMemory,
  plane0: Uint16Array,
  plane1: Uint16Array,
  angle: number,
  speed: number,
): ThrustSummary {
  return ThrustMemory(dgroup, plane0, plane1, angle, speed);
}

export function TryMove(dgroup: DOSMemory, actor: number): PlayerTryMoveSummary {
  return TryMoveMemory(dgroup, actor);
}

export function UpdateFace(
  dgroup: DOSMemory,
  options: SightPlayerOptions = {},
): FaceUpdateSummary {
  return UpdateFaceMemory(dgroup, options);
}

export function VictorySpin(
  dgroup: DOSMemory,
  options: SightPlayerOptions = {},
): VictorySpinSummary {
  return VictorySpinMemory(dgroup, options);
}

export function VictoryTile(dgroup: DOSMemory): void {
  return VictoryTileMemory(dgroup);
}
// ---------------------------------------------------------------------------
// Original source follows.
// ---------------------------------------------------------------------------
// // WL_AGENT.C
// 
// #include "WL_DEF.H"
// #pragma hdrstop
// 
// 
// /*
// =============================================================================
// 
// 						 LOCAL CONSTANTS
// 
// =============================================================================
// */
// 
// #define MAXMOUSETURN	10
// 
// 
// #define MOVESCALE		150l
// #define BACKMOVESCALE	100l
// #define ANGLESCALE		20
// 
// /*
// =============================================================================
// 
// 						 GLOBAL VARIABLES
// 
// =============================================================================
// */
// 
// 
// 
// //
// // player state info
// //
// boolean		running;
// long		thrustspeed;
// 
// unsigned	plux,pluy;			// player coordinates scaled to unsigned
// 
// int			anglefrac;
// int			gotgatgun;	// JR
// 
// objtype		*LastAttacker;
// 
// /*
// =============================================================================
// 
// 						 LOCAL VARIABLES
// 
// =============================================================================
// */
// 
// 
// void	T_Player (objtype *ob);
// void	T_Attack (objtype *ob);
// 
// statetype s_player = {false,0,0,T_Player,NULL,NULL};
// statetype s_attack = {false,0,0,T_Attack,NULL,NULL};
// 
// 
// long	playerxmove,playerymove;
// 
// struct atkinf
// {
// 	char	tics,attack,frame;		// attack is 1 for gun, 2 for knife
// } attackinfo[4][14] =
// 
// {
// { {6,0,1},{6,2,2},{6,0,3},{6,-1,4} },
// { {6,0,1},{6,1,2},{6,0,3},{6,-1,4} },
// { {6,0,1},{6,1,2},{6,3,3},{6,-1,4} },
// { {6,0,1},{6,1,2},{6,4,3},{6,-1,4} },
// };
// 
// 
// int	strafeangle[9] = {0,90,180,270,45,135,225,315,0};
// 
// void DrawWeapon (void);
// void GiveWeapon (int weapon);
// void	GiveAmmo (int ammo);
// 
// //===========================================================================
// 
// //----------
// 
// void Attack (void);
// void Use (void);
// void Search (objtype *ob);
// void SelectWeapon (void);
// void SelectItem (void);
// 
// //----------
// 
// boolean TryMove (objtype *ob);
// void T_Player (objtype *ob);
// 
// void ClipMove (objtype *ob, long xmove, long ymove);
// 
// /*
// =============================================================================
// 
// 						CONTROL STUFF
// 
// =============================================================================
// */
// 
// /*
// ======================
// =
// = CheckWeaponChange
// =
// = Keys 1-4 change weapons
// =
// ======================
// */
// 
// void CheckWeaponChange (void)
// {
// 	int	i,buttons;
// 
// 	if (!gamestate.ammo)		// must use knife with no ammo
// 		return;
// 
// 	for (i=wp_knife ; i<=gamestate.bestweapon ; i++)
// 		if (buttonstate[bt_readyknife+i-wp_knife])
// 		{
// 			gamestate.weapon = gamestate.chosenweapon = i;
// 			DrawWeapon ();
// 			return;
// 		}
// }
// 
// 
// /*
// =======================
// =
// = ControlMovement
// =
// = Takes controlx,controly, and buttonstate[bt_strafe]
// =
// = Changes the player's angle and position
// =
// = There is an angle hack because when going 70 fps, the roundoff becomes
// = significant
// =
// =======================
// */
// 
// void ControlMovement (objtype *ob)
// {
// 	long	oldx,oldy;
// 	int		angle,maxxmove;
// 	int		angleunits;
// 	long	speed;
// 
// 	thrustspeed = 0;
// 
// 	oldx = player->x;
// 	oldy = player->y;
// 
// //
// // side to side move
// //
// 	if (buttonstate[bt_strafe])
// 	{
// 	//
// 	// strafing
// 	//
// 	//
// 		if (controlx > 0)
// 		{
// 			angle = ob->angle - ANGLES/4;
// 			if (angle < 0)
// 				angle += ANGLES;
// 			Thrust (angle,controlx*MOVESCALE);	// move to left
// 		}
// 		else if (controlx < 0)
// 		{
// 			angle = ob->angle + ANGLES/4;
// 			if (angle >= ANGLES)
// 				angle -= ANGLES;
// 			Thrust (angle,-controlx*MOVESCALE);	// move to right
// 		}
// 	}
// 	else
// 	{
// 	//
// 	// not strafing
// 	//
// 		anglefrac += controlx;
// 		angleunits = anglefrac/ANGLESCALE;
// 		anglefrac -= angleunits*ANGLESCALE;
// 		ob->angle -= angleunits;
// 
// 		if (ob->angle >= ANGLES)
// 			ob->angle -= ANGLES;
// 		if (ob->angle < 0)
// 			ob->angle += ANGLES;
// 
// 	}
// 
// //
// // forward/backwards move
// //
// 	if (controly < 0)
// 	{
// 		Thrust (ob->angle,-controly*MOVESCALE);	// move forwards
// 	}
// 	else if (controly > 0)
// 	{
// 		angle = ob->angle + ANGLES/2;
// 		if (angle >= ANGLES)
// 			angle -= ANGLES;
// 		Thrust (angle,controly*BACKMOVESCALE);		// move backwards
// 	}
// 
// 	if (gamestate.victoryflag)		// watching the BJ actor
// 		return;
// 
// //
// // calculate total move
// //
// 	playerxmove = player->x - oldx;
// 	playerymove = player->y - oldy;
// }
// 
// /*
// =============================================================================
// 
// 					STATUS WINDOW STUFF
// 
// =============================================================================
// */
// 
// 
// /*
// ==================
// =
// = StatusDrawPic
// =
// ==================
// */
// 
// void StatusDrawPic (unsigned x, unsigned y, unsigned picnum)
// {
// 	unsigned	temp;
// 
// 	temp = bufferofs;
// 	bufferofs = 0;
// 
// 	bufferofs = PAGE1START+(200-STATUSLINES)*SCREENWIDTH;
// 	LatchDrawPic (x,y,picnum);
// 	bufferofs = PAGE2START+(200-STATUSLINES)*SCREENWIDTH;
// 	LatchDrawPic (x,y,picnum);
// 	bufferofs = PAGE3START+(200-STATUSLINES)*SCREENWIDTH;
// 	LatchDrawPic (x,y,picnum);
// 
// 	bufferofs = temp;
// }
// 
// 
// /*
// ==================
// =
// = DrawFace
// =
// ==================
// */
// 
// void DrawFace (void)
// {
// 	if (gamestate.health)
// 	{
// 		#ifdef SPEAR
// 		if (godmode)
// 			StatusDrawPic (17,4,GODMODEFACE1PIC+gamestate.faceframe);
// 		else
// 		#endif
// 		StatusDrawPic (17,4,FACE1APIC+3*((100-gamestate.health)/16)+gamestate.faceframe);
// 	}
// 	else
// 	{
// #ifndef SPEAR
// 	 if (LastAttacker->obclass == needleobj)
// 	   StatusDrawPic (17,4,MUTANTBJPIC);
// 	 else
// #endif
// 	   StatusDrawPic (17,4,FACE8APIC);
// 	}
// }
// 
// 
// /*
// ===============
// =
// = UpdateFace
// =
// = Calls draw face if time to change
// =
// ===============
// */
// 
// #define FACETICS	70
// 
// int	facecount;
// 
// void	UpdateFace (void)
// {
// 
// 	if (SD_SoundPlaying() == GETGATLINGSND)
// 	  return;
// 
// 	facecount += tics;
// 	if (facecount > US_RndT())
// 	{
// 		gamestate.faceframe = (US_RndT()>>6);
// 		if (gamestate.faceframe==3)
// 			gamestate.faceframe = 1;
// 
// 		facecount = 0;
// 		DrawFace ();
// 	}
// }
// 
// 
// 
// /*
// ===============
// =
// = LatchNumber
// =
// = right justifies and pads with blanks
// =
// ===============
// */
// 
// void	LatchNumber (int x, int y, int width, long number)
// {
// 	unsigned	length,c;
// 	char	str[20];
// 
// 	ltoa (number,str,10);
// 
// 	length = strlen (str);
// 
// 	while (length<width)
// 	{
// 		StatusDrawPic (x,y,N_BLANKPIC);
// 		x++;
// 		width--;
// 	}
// 
// 	c= length <= width ? 0 : length-width;
// 
// 	while (c<length)
// 	{
// 		StatusDrawPic (x,y,str[c]-'0'+ N_0PIC);
// 		x++;
// 		c++;
// 	}
// }
// 
// 
// /*
// ===============
// =
// = DrawHealth
// =
// ===============
// */
// 
// void	DrawHealth (void)
// {
// 	LatchNumber (21,16,3,gamestate.health);
// }
// 
// 
// /*
// ===============
// =
// = TakeDamage
// =
// ===============
// */
// 
// void	TakeDamage (int points,objtype *attacker)
// {
// 	LastAttacker = attacker;
// 
// 	if (gamestate.victoryflag)
// 		return;
// 	if (gamestate.difficulty==gd_baby)
// 	  points>>=2;
// 
// 	if (!godmode)
// 		gamestate.health -= points;
// 
// 	if (gamestate.health<=0)
// 	{
// 		gamestate.health = 0;
// 		playstate = ex_died;
// 		killerobj = attacker;
// 	}
// 
// 	StartDamageFlash (points);
// 
// 	gotgatgun=0;
// 
// 	DrawHealth ();
// 	DrawFace ();
// 
// 	//
// 	// MAKE BJ'S EYES BUG IF MAJOR DAMAGE!
// 	//
// 	#ifdef SPEAR
// 	if (points > 30 && gamestate.health!=0 && !godmode)
// 	{
// 		StatusDrawPic (17,4,BJOUCHPIC);
// 		facecount = 0;
// 	}
// 	#endif
// 
// }
// 
// 
// /*
// ===============
// =
// = HealSelf
// =
// ===============
// */
// 
// void	HealSelf (int points)
// {
// 	gamestate.health += points;
// 	if (gamestate.health>100)
// 		gamestate.health = 100;
// 
// 	DrawHealth ();
// 	gotgatgun = 0;	// JR
// 	DrawFace ();
// }
// 
// 
// //===========================================================================
// 
// 
// /*
// ===============
// =
// = DrawLevel
// =
// ===============
// */
// 
// void	DrawLevel (void)
// {
// #ifdef SPEAR
// 	if (gamestate.mapon == 20)
// 		LatchNumber (2,16,2,18);
// 	else
// #endif
// 	LatchNumber (2,16,2,gamestate.mapon+1);
// }
// 
// //===========================================================================
// 
// 
// /*
// ===============
// =
// = DrawLives
// =
// ===============
// */
// 
// void	DrawLives (void)
// {
// 	LatchNumber (14,16,1,gamestate.lives);
// }
// 
// 
// /*
// ===============
// =
// = GiveExtraMan
// =
// ===============
// */
// 
// void	GiveExtraMan (void)
// {
// 	if (gamestate.lives<9)
// 		gamestate.lives++;
// 	DrawLives ();
// 	SD_PlaySound (BONUS1UPSND);
// }
// 
// //===========================================================================
// 
// /*
// ===============
// =
// = DrawScore
// =
// ===============
// */
// 
// void	DrawScore (void)
// {
// 	LatchNumber (6,16,6,gamestate.score);
// }
// 
// /*
// ===============
// =
// = GivePoints
// =
// ===============
// */
// 
// void	GivePoints (long points)
// {
// 	gamestate.score += points;
// 	while (gamestate.score >= gamestate.nextextra)
// 	{
// 		gamestate.nextextra += EXTRAPOINTS;
// 		GiveExtraMan ();
// 	}
// 	DrawScore ();
// }
// 
// //===========================================================================
// 
// /*
// ==================
// =
// = DrawWeapon
// =
// ==================
// */
// 
// void DrawWeapon (void)
// {
// 	StatusDrawPic (32,8,KNIFEPIC+gamestate.weapon);
// }
// 
// 
// /*
// ==================
// =
// = DrawKeys
// =
// ==================
// */
// 
// void DrawKeys (void)
// {
// 	if (gamestate.keys & 1)
// 		StatusDrawPic (30,4,GOLDKEYPIC);
// 	else
// 		StatusDrawPic (30,4,NOKEYPIC);
// 
// 	if (gamestate.keys & 2)
// 		StatusDrawPic (30,20,SILVERKEYPIC);
// 	else
// 		StatusDrawPic (30,20,NOKEYPIC);
// }
// 
// 
// 
// /*
// ==================
// =
// = GiveWeapon
// =
// ==================
// */
// 
// void GiveWeapon (int weapon)
// {
// 	GiveAmmo (6);
// 
// 	if (gamestate.bestweapon<weapon)
// 		gamestate.bestweapon = gamestate.weapon
// 		= gamestate.chosenweapon = weapon;
// 
// 	DrawWeapon ();
// }
// 
// 
// //===========================================================================
// 
// /*
// ===============
// =
// = DrawAmmo
// =
// ===============
// */
// 
// void	DrawAmmo (void)
// {
// 	LatchNumber (27,16,2,gamestate.ammo);
// }
// 
// 
// /*
// ===============
// =
// = GiveAmmo
// =
// ===============
// */
// 
// void	GiveAmmo (int ammo)
// {
// 	if (!gamestate.ammo)				// knife was out
// 	{
// 		if (!gamestate.attackframe)
// 		{
// 			gamestate.weapon = gamestate.chosenweapon;
// 			DrawWeapon ();
// 		}
// 	}
// 	gamestate.ammo += ammo;
// 	if (gamestate.ammo > 99)
// 		gamestate.ammo = 99;
// 	DrawAmmo ();
// }
// 
// //===========================================================================
// 
// /*
// ==================
// =
// = GiveKey
// =
// ==================
// */
// 
// void GiveKey (int key)
// {
// 	gamestate.keys |= (1<<key);
// 	DrawKeys ();
// }
// 
// 
// 
// /*
// =============================================================================
// 
// 							MOVEMENT
// 
// =============================================================================
// */
// 
// 
// /*
// ===================
// =
// = GetBonus
// =
// ===================
// */
// void GetBonus (statobj_t *check)
// {
// 	switch (check->itemnumber)
// 	{
// 	case	bo_firstaid:
// 		if (gamestate.health == 100)
// 			return;
// 
// 		SD_PlaySound (HEALTH2SND);
// 		HealSelf (25);
// 		break;
// 
// 	case	bo_key1:
// 	case	bo_key2:
// 	case	bo_key3:
// 	case	bo_key4:
// 		GiveKey (check->itemnumber - bo_key1);
// 		SD_PlaySound (GETKEYSND);
// 		break;
// 
// 	case	bo_cross:
// 		SD_PlaySound (BONUS1SND);
// 		GivePoints (100);
// 		gamestate.treasurecount++;
// 		break;
// 	case	bo_chalice:
// 		SD_PlaySound (BONUS2SND);
// 		GivePoints (500);
// 		gamestate.treasurecount++;
// 		break;
// 	case	bo_bible:
// 		SD_PlaySound (BONUS3SND);
// 		GivePoints (1000);
// 		gamestate.treasurecount++;
// 		break;
// 	case	bo_crown:
// 		SD_PlaySound (BONUS4SND);
// 		GivePoints (5000);
// 		gamestate.treasurecount++;
// 		break;
// 
// 	case	bo_clip:
// 		if (gamestate.ammo == 99)
// 			return;
// 
// 		SD_PlaySound (GETAMMOSND);
// 		GiveAmmo (8);
// 		break;
// 	case	bo_clip2:
// 		if (gamestate.ammo == 99)
// 			return;
// 
// 		SD_PlaySound (GETAMMOSND);
// 		GiveAmmo (4);
// 		break;
// 
// #ifdef SPEAR
// 	case	bo_25clip:
// 		if (gamestate.ammo == 99)
// 		  return;
// 
// 		SD_PlaySound (GETAMMOBOXSND);
// 		GiveAmmo (25);
// 		break;
// #endif
// 
// 	case	bo_machinegun:
// 		SD_PlaySound (GETMACHINESND);
// 		GiveWeapon (wp_machinegun);
// 		break;
// 	case	bo_chaingun:
// 		SD_PlaySound (GETGATLINGSND);
// 		GiveWeapon (wp_chaingun);
// 
// 		StatusDrawPic (17,4,GOTGATLINGPIC);
// 		facecount = 0;
// 		gotgatgun = 1;
// 		break;
// 
// 	case	bo_fullheal:
// 		SD_PlaySound (BONUS1UPSND);
// 		HealSelf (99);
// 		GiveAmmo (25);
// 		GiveExtraMan ();
// 		gamestate.treasurecount++;
// 		break;
// 
// 	case	bo_food:
// 		if (gamestate.health == 100)
// 			return;
// 
// 		SD_PlaySound (HEALTH1SND);
// 		HealSelf (10);
// 		break;
// 
// 	case	bo_alpo:
// 		if (gamestate.health == 100)
// 			return;
// 
// 		SD_PlaySound (HEALTH1SND);
// 		HealSelf (4);
// 		break;
// 
// 	case	bo_gibs:
// 		if (gamestate.health >10)
// 			return;
// 
// 		SD_PlaySound (SLURPIESND);
// 		HealSelf (1);
// 		break;
// 
// 	case	bo_spear:
// 		spearflag = true;
// 		spearx = player->x;
// 		speary = player->y;
// 		spearangle = player->angle;
// 		playstate = ex_completed;
// 	}
// 
// 	StartBonusFlash ();
// 	check->shapenum = -1;			// remove from list
// }
// 
// 
// /*
// ===================
// =
// = TryMove
// =
// = returns true if move ok
// = debug: use pointers to optimize
// ===================
// */
// 
// boolean TryMove (objtype *ob)
// {
// 	int			xl,yl,xh,yh,x,y;
// 	objtype		*check;
// 	long		deltax,deltay;
// 
// 	xl = (ob->x-PLAYERSIZE) >>TILESHIFT;
// 	yl = (ob->y-PLAYERSIZE) >>TILESHIFT;
// 
// 	xh = (ob->x+PLAYERSIZE) >>TILESHIFT;
// 	yh = (ob->y+PLAYERSIZE) >>TILESHIFT;
// 
// //
// // check for solid walls
// //
// 	for (y=yl;y<=yh;y++)
// 		for (x=xl;x<=xh;x++)
// 		{
// 			check = actorat[x][y];
// 			if (check && check<objlist)
// 				return false;
// 		}
// 
// //
// // check for actors
// //
// 	if (yl>0)
// 		yl--;
// 	if (yh<MAPSIZE-1)
// 		yh++;
// 	if (xl>0)
// 		xl--;
// 	if (xh<MAPSIZE-1)
// 		xh++;
// 
// 	for (y=yl;y<=yh;y++)
// 		for (x=xl;x<=xh;x++)
// 		{
// 			check = actorat[x][y];
// 			if (check > objlist
// 			&& (check->flags & FL_SHOOTABLE) )
// 			{
// 				deltax = ob->x - check->x;
// 				if (deltax < -MINACTORDIST || deltax > MINACTORDIST)
// 					continue;
// 				deltay = ob->y - check->y;
// 				if (deltay < -MINACTORDIST || deltay > MINACTORDIST)
// 					continue;
// 
// 				return false;
// 			}
// 		}
// 
// 	return true;
// }
// 
// 
// /*
// ===================
// =
// = ClipMove
// =
// ===================
// */
// 
// void ClipMove (objtype *ob, long xmove, long ymove)
// {
// 	long	basex,basey;
// 
// 	basex = ob->x;
// 	basey = ob->y;
// 
// 	ob->x = basex+xmove;
// 	ob->y = basey+ymove;
// 	if (TryMove (ob))
// 		return;
// 
// 	if (noclip && ob->x > 2*TILEGLOBAL && ob->y > 2*TILEGLOBAL &&
// 	ob->x < (((long)(mapwidth-1))<<TILESHIFT)
// 	&& ob->y < (((long)(mapheight-1))<<TILESHIFT) )
// 		return;		// walk through walls
// 
// 	if (!SD_SoundPlaying())
// 		SD_PlaySound (HITWALLSND);
// 
// 	ob->x = basex+xmove;
// 	ob->y = basey;
// 	if (TryMove (ob))
// 		return;
// 
// 	ob->x = basex;
// 	ob->y = basey+ymove;
// 	if (TryMove (ob))
// 		return;
// 
// 	ob->x = basex;
// 	ob->y = basey;
// }
// 
// //==========================================================================
// 
// /*
// ===================
// =
// = VictoryTile
// =
// ===================
// */
// 
// void VictoryTile (void)
// {
// #ifndef SPEAR
// 	SpawnBJVictory ();
// #endif
// 
// 	gamestate.victoryflag = true;
// }
// 
// 
// /*
// ===================
// =
// = Thrust
// =
// ===================
// */
// 
// void Thrust (int angle, long speed)
// {
// 	long xmove,ymove;
// 	long	slowmax;
// 	unsigned	offset;
// 
// 
// 	//
// 	// ZERO FUNNY COUNTER IF MOVED!
// 	//
// 	#ifdef SPEAR
// 	if (speed)
// 		funnyticount = 0;
// 	#endif
// 
// 	thrustspeed += speed;
// //
// // moving bounds speed
// //
// 	if (speed >= MINDIST*2)
// 		speed = MINDIST*2-1;
// 
// 	xmove = FixedByFrac(speed,costable[angle]);
// 	ymove = -FixedByFrac(speed,sintable[angle]);
// 
// 	ClipMove(player,xmove,ymove);
// 
// 	player->tilex = player->x >> TILESHIFT;		// scale to tile values
// 	player->tiley = player->y >> TILESHIFT;
// 
// 	offset = farmapylookup[player->tiley]+player->tilex;
// 	player->areanumber = *(mapsegs[0] + offset) -AREATILE;
// 
// 	if (*(mapsegs[1] + offset) == EXITTILE)
// 		VictoryTile ();
// }
// 
// 
// /*
// =============================================================================
// 
// 								ACTIONS
// 
// =============================================================================
// */
// 
// 
// /*
// ===============
// =
// = Cmd_Fire
// =
// ===============
// */
// 
// void Cmd_Fire (void)
// {
// 	buttonheld[bt_attack] = true;
// 
// 	gamestate.weaponframe = 0;
// 
// 	player->state = &s_attack;
// 
// 	gamestate.attackframe = 0;
// 	gamestate.attackcount =
// 		attackinfo[gamestate.weapon][gamestate.attackframe].tics;
// 	gamestate.weaponframe =
// 		attackinfo[gamestate.weapon][gamestate.attackframe].frame;
// }
// 
// //===========================================================================
// 
// /*
// ===============
// =
// = Cmd_Use
// =
// ===============
// */
// 
// void Cmd_Use (void)
// {
// 	objtype 	*check;
// 	int			checkx,checky,doornum,dir;
// 	boolean		elevatorok;
// 
// 
// //
// // find which cardinal direction the player is facing
// //
// 	if (player->angle < ANGLES/8 || player->angle > 7*ANGLES/8)
// 	{
// 		checkx = player->tilex + 1;
// 		checky = player->tiley;
// 		dir = di_east;
// 		elevatorok = true;
// 	}
// 	else if (player->angle < 3*ANGLES/8)
// 	{
// 		checkx = player->tilex;
// 		checky = player->tiley-1;
// 		dir = di_north;
// 		elevatorok = false;
// 	}
// 	else if (player->angle < 5*ANGLES/8)
// 	{
// 		checkx = player->tilex - 1;
// 		checky = player->tiley;
// 		dir = di_west;
// 		elevatorok = true;
// 	}
// 	else
// 	{
// 		checkx = player->tilex;
// 		checky = player->tiley + 1;
// 		dir = di_south;
// 		elevatorok = false;
// 	}
// 
// 	doornum = tilemap[checkx][checky];
// 	if (*(mapsegs[1]+farmapylookup[checky]+checkx) == PUSHABLETILE)
// 	{
// 	//
// 	// pushable wall
// 	//
// 
// 		PushWall (checkx,checky,dir);
// 		return;
// 	}
// 	if (!buttonheld[bt_use] && doornum == ELEVATORTILE && elevatorok)
// 	{
// 	//
// 	// use elevator
// 	//
// 		buttonheld[bt_use] = true;
// 
// 		tilemap[checkx][checky]++;		// flip switch
// 		if (*(mapsegs[0]+farmapylookup[player->tiley]+player->tilex) == ALTELEVATORTILE)
// 			playstate = ex_secretlevel;
// 		else
// 			playstate = ex_completed;
// 		SD_PlaySound (LEVELDONESND);
// 		SD_WaitSoundDone();
// 	}
// 	else if (!buttonheld[bt_use] && doornum & 0x80)
// 	{
// 		buttonheld[bt_use] = true;
// 		OperateDoor (doornum & ~0x80);
// 	}
// 	else
// 		SD_PlaySound (DONOTHINGSND);
// 
// }
// 
// /*
// =============================================================================
// 
// 						   PLAYER CONTROL
// 
// =============================================================================
// */
// 
// 
// 
// /*
// ===============
// =
// = SpawnPlayer
// =
// ===============
// */
// 
// void SpawnPlayer (int tilex, int tiley, int dir)
// {
// 	player->obclass = playerobj;
// 	player->active = true;
// 	player->tilex = tilex;
// 	player->tiley = tiley;
// 	player->areanumber =
// 		*(mapsegs[0] + farmapylookup[player->tiley]+player->tilex);
// 	player->x = ((long)tilex<<TILESHIFT)+TILEGLOBAL/2;
// 	player->y = ((long)tiley<<TILESHIFT)+TILEGLOBAL/2;
// 	player->state = &s_player;
// 	player->angle = (1-dir)*90;
// 	if (player->angle<0)
// 		player->angle += ANGLES;
// 	player->flags = FL_NEVERMARK;
// 	Thrust (0,0);				// set some variables
// 
// 	InitAreas ();
// }
// 
// 
// //===========================================================================
// 
// /*
// ===============
// =
// = T_KnifeAttack
// =
// = Update player hands, and try to do damage when the proper frame is reached
// =
// ===============
// */
// 
// void	KnifeAttack (objtype *ob)
// {
// 	objtype *check,*closest;
// 	long	dist;
// 
// 	SD_PlaySound (ATKKNIFESND);
// // actually fire
// 	dist = 0x7fffffff;
// 	closest = NULL;
// 	for (check=ob->next ; check ; check=check->next)
// 		if ( (check->flags & FL_SHOOTABLE)
// 		&& (check->flags & FL_VISABLE)
// 		&& abs (check->viewx-centerx) < shootdelta
// 		)
// 		{
// 			if (check->transx < dist)
// 			{
// 				dist = check->transx;
// 				closest = check;
// 			}
// 		}
// 
// 	if (!closest || dist> 0x18000l)
// 	{
// 	// missed
// 
// 		return;
// 	}
// 
// // hit something
// 	DamageActor (closest,US_RndT() >> 4);
// }
// 
// 
// 
// void	GunAttack (objtype *ob)
// {
// 	objtype *check,*closest,*oldclosest;
// 	int		damage;
// 	int		dx,dy,dist;
// 	long	viewdist;
// 
// 	switch (gamestate.weapon)
// 	{
// 	case wp_pistol:
// 		SD_PlaySound (ATKPISTOLSND);
// 		break;
// 	case wp_machinegun:
// 		SD_PlaySound (ATKMACHINEGUNSND);
// 		break;
// 	case wp_chaingun:
// 		SD_PlaySound (ATKGATLINGSND);
// 		break;
// 	}
// 
// 	madenoise = true;
// 
// //
// // find potential targets
// //
// 	viewdist = 0x7fffffffl;
// 	closest = NULL;
// 
// 	while (1)
// 	{
// 		oldclosest = closest;
// 
// 		for (check=ob->next ; check ; check=check->next)
// 			if ( (check->flags & FL_SHOOTABLE)
// 			&& (check->flags & FL_VISABLE)
// 			&& abs (check->viewx-centerx) < shootdelta
// 			)
// 			{
// 				if (check->transx < viewdist)
// 				{
// 					viewdist = check->transx;
// 					closest = check;
// 				}
// 			}
// 
// 		if (closest == oldclosest)
// 			return;						// no more targets, all missed
// 
// 	//
// 	// trace a line from player to enemey
// 	//
// 		if (CheckLine(closest))
// 			break;
// 
// 	}
// 
// //
// // hit something
// //
// 	dx = abs(closest->tilex - player->tilex);
// 	dy = abs(closest->tiley - player->tiley);
// 	dist = dx>dy ? dx:dy;
// 
// 	if (dist<2)
// 		damage = US_RndT() / 4;
// 	else if (dist<4)
// 		damage = US_RndT() / 6;
// 	else
// 	{
// 		if ( (US_RndT() / 12) < dist)		// missed
// 			return;
// 		damage = US_RndT() / 6;
// 	}
// 
// 	DamageActor (closest,damage);
// }
// 
// //===========================================================================
// 
// /*
// ===============
// =
// = VictorySpin
// =
// ===============
// */
// 
// void VictorySpin (void)
// {
// 	long	desty;
// 
// 	if (player->angle > 270)
// 	{
// 		player->angle -= tics * 3;
// 		if (player->angle < 270)
// 			player->angle = 270;
// 	}
// 	else if (player->angle < 270)
// 	{
// 		player->angle += tics * 3;
// 		if (player->angle > 270)
// 			player->angle = 270;
// 	}
// 
// 	desty = (((long)player->tiley-5)<<TILESHIFT)-0x3000;
// 
// 	if (player->y > desty)
// 	{
// 		player->y -= tics*4096;
// 		if (player->y < desty)
// 			player->y = desty;
// 	}
// }
// 
// 
// //===========================================================================
// 
// /*
// ===============
// =
// = T_Attack
// =
// ===============
// */
// 
// void	T_Attack (objtype *ob)
// {
// 	struct	atkinf	*cur;
// 
// 	UpdateFace ();
// 
// 	if (gamestate.victoryflag)		// watching the BJ actor
// 	{
// 		VictorySpin ();
// 		return;
// 	}
// 
// 	if ( buttonstate[bt_use] && !buttonheld[bt_use] )
// 		buttonstate[bt_use] = false;
// 
// 	if ( buttonstate[bt_attack] && !buttonheld[bt_attack])
// 		buttonstate[bt_attack] = false;
// 
// 	ControlMovement (ob);
// 	if (gamestate.victoryflag)		// watching the BJ actor
// 		return;
// 
// 	plux = player->x >> UNSIGNEDSHIFT;			// scale to fit in unsigned
// 	pluy = player->y >> UNSIGNEDSHIFT;
// 	player->tilex = player->x >> TILESHIFT;		// scale to tile values
// 	player->tiley = player->y >> TILESHIFT;
// 
// //
// // change frame and fire
// //
// 	gamestate.attackcount -= tics;
// 	while (gamestate.attackcount <= 0)
// 	{
// 		cur = &attackinfo[gamestate.weapon][gamestate.attackframe];
// 		switch (cur->attack)
// 		{
// 		case -1:
// 			ob->state = &s_player;
// 			if (!gamestate.ammo)
// 			{
// 				gamestate.weapon = wp_knife;
// 				DrawWeapon ();
// 			}
// 			else
// 			{
// 				if (gamestate.weapon != gamestate.chosenweapon)
// 				{
// 					gamestate.weapon = gamestate.chosenweapon;
// 					DrawWeapon ();
// 				}
// 			};
// 			gamestate.attackframe = gamestate.weaponframe = 0;
// 			return;
// 
// 		case 4:
// 			if (!gamestate.ammo)
// 				break;
// 			if (buttonstate[bt_attack])
// 				gamestate.attackframe -= 2;
// 		case 1:
// 			if (!gamestate.ammo)
// 			{	// can only happen with chain gun
// 				gamestate.attackframe++;
// 				break;
// 			}
// 			GunAttack (ob);
// 			gamestate.ammo--;
// 			DrawAmmo ();
// 			break;
// 
// 		case 2:
// 			KnifeAttack (ob);
// 			break;
// 
// 		case 3:
// 			if (gamestate.ammo && buttonstate[bt_attack])
// 				gamestate.attackframe -= 2;
// 			break;
// 		}
// 
// 		gamestate.attackcount += cur->tics;
// 		gamestate.attackframe++;
// 		gamestate.weaponframe =
// 			attackinfo[gamestate.weapon][gamestate.attackframe].frame;
// 	}
// 
// }
// 
// 
// 
// //===========================================================================
// 
// /*
// ===============
// =
// = T_Player
// =
// ===============
// */
// 
// void	T_Player (objtype *ob)
// {
// 	if (gamestate.victoryflag)		// watching the BJ actor
// 	{
// 		VictorySpin ();
// 		return;
// 	}
// 
// 	UpdateFace ();
// 	CheckWeaponChange ();
// 
// 	if ( buttonstate[bt_use] )
// 		Cmd_Use ();
// 
// 	if ( buttonstate[bt_attack] && !buttonheld[bt_attack])
// 		Cmd_Fire ();
// 
// 	ControlMovement (ob);
// 	if (gamestate.victoryflag)		// watching the BJ actor
// 		return;
// 
// 
// 	plux = player->x >> UNSIGNEDSHIFT;			// scale to fit in unsigned
// 	pluy = player->y >> UNSIGNEDSHIFT;
// 	player->tilex = player->x >> TILESHIFT;		// scale to tile values
// 	player->tiley = player->y >> TILESHIFT;
// }
// 
// 
// 
