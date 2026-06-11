//
// WL_MENU.H
//
// #ifdef SPEAR

// #define BORDCOLOR	0x99
// #define BORD2COLOR	0x93
// #define DEACTIVE	0x9b
// #define BKGDCOLOR	0x9d
//#define STRIPE		0x9c

// #define MenuFadeOut()	VL_FadeOut(0,255,0,0,51,10)

// #else

export const BORDCOLOR = 0x29;
export const BORD2COLOR = 0x23;
export const DEACTIVE = 0x2b;
export const BKGDCOLOR = 0x2d;
export const STRIPE = 0x2c;

// #define MenuFadeOut()	VL_FadeOut(0,255,43,0,0,10)
declare function VL_FadeOut(start: number, end: number, red: number, green: number, blue: number, steps: number): void;
export function MenuFadeOut(): void {
	VL_FadeOut(0, 255, 43, 0, 0, 10);
}

// #endif

export const READCOLOR = 0x4a;
export const READHCOLOR = 0x47;
export const VIEWCOLOR = 0x7f;
export const TEXTCOLOR = 0x17;
export const HIGHLIGHT = 0x13;
// #define MenuFadeIn()	VL_FadeIn(0,255,&gamepal,10)
declare const gamepal: unknown;
declare function VL_FadeIn(start: number, end: number, palette: unknown, steps: number): void;
export function MenuFadeIn(): void {
	VL_FadeIn(0, 255, gamepal, 10);
}


// #define MENUSONG	WONDERIN_MUS
declare const WONDERIN_MUS: number;
export const MENUSONG = WONDERIN_MUS;

// #ifndef SPEAR
// #define INTROSONG	NAZI_NOR_MUS
declare const NAZI_NOR_MUS: number;
export const INTROSONG = NAZI_NOR_MUS;
// #else
// #define INTROSONG	XTOWER2_MUS
// #endif

export const SENSITIVE = 60;
export const CENTER = SENSITIVE * 2;

export const MENU_X = 76;
export const MENU_Y = 55;
export const MENU_W = 178;
// #ifndef SPEAR
export const MENU_H = 13 * 10 + 6;
// #else
// #define MENU_H	13*9+6
// #endif

export const SM_X = 48;
export const SM_W = 250;

export const SM_Y1 = 20;
export const SM_H1 = 4 * 13 - 7;
export const SM_Y2 = SM_Y1 + 5 * 13;
export const SM_H2 = 4 * 13 - 7;
export const SM_Y3 = SM_Y2 + 5 * 13;
export const SM_H3 = 3 * 13 - 7;

export const CTL_X = 24;
export const CTL_Y = 70;
export const CTL_W = 284;
export const CTL_H = 13 * 7 - 7;

export const LSM_X = 85;
export const LSM_Y = 55;
export const LSM_W = 175;
export const LSM_H = 10 * 13 + 10;

export const NM_X = 50;
export const NM_Y = 100;
export const NM_W = 225;
export const NM_H = 13 * 4 + 15;

export const NE_X = 10;
export const NE_Y = 23;
export const NE_W = 320 - NE_X * 2;
export const NE_H = 200 - NE_Y * 2;

export const CST_X = 20;
export const CST_Y = 48;
export const CST_START = 60;
export const CST_SPC = 60;


//
// TYPEDEFS
//
// typedef struct {
// 		int x,y,amount,curpos,indent;
// 		} CP_iteminfo;
export interface CP_iteminfo {
	x: number;
	y: number;
	amount: number;
	curpos: number;
	indent: number;
}

// typedef struct {
// 		int active;
// 		char string[36];
// 		void (* routine)(int temp1);
// 		} CP_itemtype;
export interface CP_itemtype {
	active: number;
	string: string;
	routine: (temp1: number) => void;
}

// typedef struct {
// 		int allowed[4];
// 		} CustomCtrls;
export interface CustomCtrls {
	allowed: [number, number, number, number];
}

// extern CP_itemtype far MainMenu[],far NewEMenu[];
// extern CP_iteminfo MainItems;

//
// FUNCTION PROTOTYPES
//
// void SetupControlPanel(void);
// void CleanupControlPanel(void);

// void DrawMenu(CP_iteminfo *item_i,CP_itemtype far *items);
// int  HandleMenu(CP_iteminfo *item_i,
// 		CP_itemtype far *items,
// 		void (*routine)(int w));
// void ClearMScreen(void);
// void DrawWindow(int x,int y,int w,int h,int wcolor);
// void DrawOutline(int x,int y,int w,int h,int color1,int color2);
// void WaitKeyUp(void);
// void ReadAnyControl(ControlInfo *ci);
// void TicDelay(int count);
// void CacheLump(int lumpstart,int lumpend);
// void UnCacheLump(int lumpstart,int lumpend);
// void StartCPMusic(int song);
// int  Confirm(char far *string);
// void Message(char far *string);
// void CheckPause(void);
// void ShootSnd(void);
// void CheckSecretMissions(void);
// void BossKey(void);

// void DrawGun(CP_iteminfo *item_i,CP_itemtype far *items,int x,int *y,int which,int basey,void (*routine)(int w));
// void DrawHalfStep(int x,int y);
// void EraseGun(CP_iteminfo *item_i,CP_itemtype far *items,int x,int y,int which);
// void SetTextColor(CP_itemtype far *items,int hlight);
// void DrawMenuGun(CP_iteminfo *iteminfo);
// void DrawStripes(int y);

// void DefineMouseBtns(void);
// void DefineJoyBtns(void);
// void DefineKeyBtns(void);
// void DefineKeyMove(void);
// void EnterCtrlData(int index,CustomCtrls *cust,void (*DrawRtn)(int),void (*PrintRtn)(int),int type);

// void DrawMainMenu(void);
// void DrawSoundMenu(void);
// void DrawLoadSaveScreen(int loadsave);
// void DrawNewEpisode(void);
// void DrawNewGame(void);
// void DrawChangeView(int view);
// void DrawMouseSens(void);
// void DrawCtlScreen(void);
// void DrawCustomScreen(void);
// void DrawLSAction(int which);
// void DrawCustMouse(int hilight);
// void DrawCustJoy(int hilight);
// void DrawCustKeybd(int hilight);
// void DrawCustKeys(int hilight);
// void PrintCustMouse(int i);
// void PrintCustJoy(int i);
// void PrintCustKeybd(int i);
// void PrintCustKeys(int i);

// void PrintLSEntry(int w,int color);
// void TrackWhichGame(int w);
// void DrawNewGameDiff(int w);
// void FixupCustom(int w);

// void CP_NewGame(void);
// void CP_Sound(void);
// int  CP_LoadGame(int quick);
// int  CP_SaveGame(int quick);
// void CP_Control(void);
// void CP_ChangeView(void);
// void CP_ExitOptions(void);
// void CP_Quit(void);
// void CP_ViewScores(void);
// int  CP_EndGame(void);
// int  CP_CheckQuick(unsigned scancode);
// void CustomControls(void);
// void MouseSensitivity(void);

// void CheckForEpisodes(void);

//
// VARIABLES
//
// extern int SaveGamesAvail[10],StartGame,SoundStatus;
// extern char SaveGameNames[10][32],SaveName[13];

// enum {MOUSE,JOYSTICK,KEYBOARDBTNS,KEYBOARDMOVE};	// FOR INPUT TYPES
export const MOUSE = 0;
export const JOYSTICK = 1;
export const KEYBOARDBTNS = 2;
export const KEYBOARDMOVE = 3;

// enum
// {
export const newgame = 0;
export const soundmenu = 1;
export const control = 2;
export const loadgame = 3;
export const savegame = 4;
export const changeview = 5;

// #ifndef GOODTIMES
// #ifndef SPEAR
// 	readthis,
// #endif
// #endif

export const viewscores = 6;
export const backtodemo = 7;
export const quit = 8;
// } menuitems;

//
// WL_INTER
//
// typedef struct {
// 		int kill,secret,treasure;
// 		long time;
// 		} LRstruct;
export interface LRstruct {
	kill: number;
	secret: number;
	treasure: number;
	time: number;
}

// extern LRstruct LevelRatios[];

// void Write (int x,int y,char *string);
// void NonShareware(void);
// int GetYorN(int x,int y,int pic);
