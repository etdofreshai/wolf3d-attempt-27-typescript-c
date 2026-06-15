// @generated-from-wolfsrc
// Original file: source/WOLFSRC/ID_IN.H
// This module preserves the source text below as line comments for audit.
// Hand ports can replace generated stubs function-by-function while keeping
// the original text nearby for side-by-side review.

export const WOLFSRC_FILE = "ID_IN.H";
export const WOLFSRC_FUNCTIONS = [] as const;

export const MaxPlayers = 4;
export const MaxKbds = 2;
export const MaxJoys = 2;
export const NumCodes = 128;

export type ScanCode = number;
export const sc_None = 0;
export const sc_Bad = 0xff;
export const sc_Return = 0x1c;
export const sc_Enter = sc_Return;
export const sc_Escape = 0x01;
export const sc_Space = 0x39;
export const sc_BackSpace = 0x0e;
export const sc_Tab = 0x0f;
export const sc_Alt = 0x38;
export const sc_Control = 0x1d;
export const sc_CapsLock = 0x3a;
export const sc_LShift = 0x2a;
export const sc_RShift = 0x36;
export const sc_UpArrow = 0x48;
export const sc_DownArrow = 0x50;
export const sc_LeftArrow = 0x4b;
export const sc_RightArrow = 0x4d;
export const sc_Insert = 0x52;
export const sc_Delete = 0x53;
export const sc_Home = 0x47;
export const sc_End = 0x4f;
export const sc_PgUp = 0x49;
export const sc_PgDn = 0x51;
export const sc_F1 = 0x3b;
export const sc_F2 = 0x3c;
export const sc_F3 = 0x3d;
export const sc_F4 = 0x3e;
export const sc_F5 = 0x3f;
export const sc_F6 = 0x40;
export const sc_F7 = 0x41;
export const sc_F8 = 0x42;
export const sc_F9 = 0x43;
export const sc_F10 = 0x44;
export const sc_F11 = 0x57;
export const sc_F12 = 0x59;

export const sc_1 = 0x02;
export const sc_2 = 0x03;
export const sc_3 = 0x04;
export const sc_4 = 0x05;
export const sc_5 = 0x06;
export const sc_6 = 0x07;
export const sc_7 = 0x08;
export const sc_8 = 0x09;
export const sc_9 = 0x0a;
export const sc_0 = 0x0b;

export const sc_A = 0x1e;
export const sc_B = 0x30;
export const sc_C = 0x2e;
export const sc_D = 0x20;
export const sc_E = 0x12;
export const sc_F = 0x21;
export const sc_G = 0x22;
export const sc_H = 0x23;
export const sc_I = 0x17;
export const sc_J = 0x24;
export const sc_K = 0x25;
export const sc_L = 0x26;
export const sc_M = 0x32;
export const sc_N = 0x31;
export const sc_O = 0x18;
export const sc_P = 0x19;
export const sc_Q = 0x10;
export const sc_R = 0x13;
export const sc_S = 0x1f;
export const sc_T = 0x14;
export const sc_U = 0x16;
export const sc_V = 0x2f;
export const sc_W = 0x11;
export const sc_X = 0x2d;
export const sc_Y = 0x15;
export const sc_Z = 0x2c;

export const key_None = 0;
export const key_Return = 0x0d;
export const key_Enter = key_Return;
export const key_Escape = 0x1b;
export const key_Space = 0x20;
export const key_BackSpace = 0x08;
export const key_Tab = 0x09;
export const key_Delete = 0x7f;

export const MReset = 0;
export const MButtons = 3;
export const MDelta = 11;
export const MouseInt = 0x33;

export const demo_Off = 0;
export const demo_Record = 1;
export const demo_Playback = 2;
export const demo_PlayDone = 3;
export type Demo = typeof demo_Off | typeof demo_Record | typeof demo_Playback | typeof demo_PlayDone;

export const ctrl_Keyboard = 0;
export const ctrl_Keyboard1 = ctrl_Keyboard;
export const ctrl_Keyboard2 = 1;
export const ctrl_Joystick = 2;
export const ctrl_Joystick1 = ctrl_Joystick;
export const ctrl_Joystick2 = 3;
export const ctrl_Mouse = 4;
export type ControlType =
  | typeof ctrl_Keyboard
  | typeof ctrl_Keyboard2
  | typeof ctrl_Joystick
  | typeof ctrl_Joystick2
  | typeof ctrl_Mouse;

export const motion_Left = -1;
export const motion_Up = -1;
export const motion_None = 0;
export const motion_Right = 1;
export const motion_Down = 1;
export type Motion = typeof motion_Left | typeof motion_None | typeof motion_Right;

export const dir_North = 0;
export const dir_NorthEast = 1;
export const dir_East = 2;
export const dir_SouthEast = 3;
export const dir_South = 4;
export const dir_SouthWest = 5;
export const dir_West = 6;
export const dir_NorthWest = 7;
export const dir_None = 8;
export type Direction =
  | typeof dir_North
  | typeof dir_NorthEast
  | typeof dir_East
  | typeof dir_SouthEast
  | typeof dir_South
  | typeof dir_SouthWest
  | typeof dir_West
  | typeof dir_NorthWest
  | typeof dir_None;

export interface CursorInfo {
  button0: boolean;
  button1: boolean;
  button2: boolean;
  button3: boolean;
  x: number;
  y: number;
  xaxis: Motion;
  yaxis: Motion;
  dir: Direction;
}

export type ControlInfo = CursorInfo;

export interface KeyboardDef {
  button0: ScanCode;
  button1: ScanCode;
  upleft: ScanCode;
  up: ScanCode;
  upright: ScanCode;
  left: ScanCode;
  right: ScanCode;
  downleft: ScanCode;
  down: ScanCode;
  downright: ScanCode;
}

export interface JoystickDef {
  joyMinX: number;
  joyMinY: number;
  threshMinX: number;
  threshMinY: number;
  threshMaxX: number;
  threshMaxY: number;
  joyMaxX: number;
  joyMaxY: number;
  joyMultXL: number;
  joyMultYL: number;
  joyMultXH: number;
  joyMultYH: number;
}

// ---------------------------------------------------------------------------
// Original source follows.
// ---------------------------------------------------------------------------
// //
// //	ID Engine
// //	ID_IN.h - Header file for Input Manager
// //	v1.0d1
// //	By Jason Blochowiak
// //
// 
// #ifndef	__ID_IN__
// #define	__ID_IN__
// 
// #ifdef	__DEBUG__
// #define	__DEBUG_InputMgr__
// #endif
// 
// #define	MaxPlayers	4
// #define	MaxKbds		2
// #define	MaxJoys		2
// #define	NumCodes	128
// 
// typedef	byte		ScanCode;
// #define	sc_None			0
// #define	sc_Bad			0xff
// #define	sc_Return		0x1c
// #define	sc_Enter		sc_Return
// #define	sc_Escape		0x01
// #define	sc_Space		0x39
// #define	sc_BackSpace	0x0e
// #define	sc_Tab			0x0f
// #define	sc_Alt			0x38
// #define	sc_Control		0x1d
// #define	sc_CapsLock		0x3a
// #define	sc_LShift		0x2a
// #define	sc_RShift		0x36
// #define	sc_UpArrow		0x48
// #define	sc_DownArrow	0x50
// #define	sc_LeftArrow	0x4b
// #define	sc_RightArrow	0x4d
// #define	sc_Insert		0x52
// #define	sc_Delete		0x53
// #define	sc_Home			0x47
// #define	sc_End			0x4f
// #define	sc_PgUp			0x49
// #define	sc_PgDn			0x51
// #define	sc_F1			0x3b
// #define	sc_F2			0x3c
// #define	sc_F3			0x3d
// #define	sc_F4			0x3e
// #define	sc_F5			0x3f
// #define	sc_F6			0x40
// #define	sc_F7			0x41
// #define	sc_F8			0x42
// #define	sc_F9			0x43
// #define	sc_F10			0x44
// #define	sc_F11			0x57
// #define	sc_F12			0x59
// 
// #define	sc_1			0x02
// #define	sc_2			0x03
// #define	sc_3			0x04
// #define	sc_4			0x05
// #define	sc_5			0x06
// #define	sc_6			0x07
// #define	sc_7			0x08
// #define	sc_8			0x09
// #define	sc_9			0x0a
// #define	sc_0			0x0b
// 
// #define	sc_A			0x1e
// #define	sc_B			0x30
// #define	sc_C			0x2e
// #define	sc_D			0x20
// #define	sc_E			0x12
// #define	sc_F			0x21
// #define	sc_G			0x22
// #define	sc_H			0x23
// #define	sc_I			0x17
// #define	sc_J			0x24
// #define	sc_K			0x25
// #define	sc_L			0x26
// #define	sc_M			0x32
// #define	sc_N			0x31
// #define	sc_O			0x18
// #define	sc_P			0x19
// #define	sc_Q			0x10
// #define	sc_R			0x13
// #define	sc_S			0x1f
// #define	sc_T			0x14
// #define	sc_U			0x16
// #define	sc_V			0x2f
// #define	sc_W			0x11
// #define	sc_X			0x2d
// #define	sc_Y			0x15
// #define	sc_Z			0x2c
// 
// #define	key_None		0
// #define	key_Return		0x0d
// #define	key_Enter		key_Return
// #define	key_Escape		0x1b
// #define	key_Space		0x20
// #define	key_BackSpace	0x08
// #define	key_Tab			0x09
// #define	key_Delete		0x7f
// 
// // 	Stuff for the mouse
// #define	MReset		0
// #define	MButtons	3
// #define	MDelta		11
// 
// #define	MouseInt	0x33
// #define	Mouse(x)	_AX = x,geninterrupt(MouseInt)
// 
// typedef	enum		{
// 						demo_Off,demo_Record,demo_Playback,demo_PlayDone
// 					} Demo;
// typedef	enum		{
// 						ctrl_Keyboard,
// 							ctrl_Keyboard1 = ctrl_Keyboard,ctrl_Keyboard2,
// 						ctrl_Joystick,
// 							ctrl_Joystick1 = ctrl_Joystick,ctrl_Joystick2,
// 						ctrl_Mouse
// 					} ControlType;
// typedef	enum		{
// 						motion_Left = -1,motion_Up = -1,
// 						motion_None = 0,
// 						motion_Right = 1,motion_Down = 1
// 					} Motion;
// typedef	enum		{
// 						dir_North,dir_NorthEast,
// 						dir_East,dir_SouthEast,
// 						dir_South,dir_SouthWest,
// 						dir_West,dir_NorthWest,
// 						dir_None
// 					} Direction;
// typedef	struct		{
// 						boolean		button0,button1,button2,button3;
// 						int			x,y;
// 						Motion		xaxis,yaxis;
// 						Direction	dir;
// 					} CursorInfo;
// typedef	CursorInfo	ControlInfo;
// typedef	struct		{
// 						ScanCode	button0,button1,
// 									upleft,		up,		upright,
// 									left,				right,
// 									downleft,	down,	downright;
// 					} KeyboardDef;
// typedef	struct		{
// 						word		joyMinX,joyMinY,
// 									threshMinX,threshMinY,
// 									threshMaxX,threshMaxY,
// 									joyMaxX,joyMaxY,
// 									joyMultXL,joyMultYL,
// 									joyMultXH,joyMultYH;
// 					} JoystickDef;
// // Global variables
// extern	boolean		Keyboard[],
// 					MousePresent,
// 					JoysPresent[];
// extern	boolean		Paused;
// extern	char		LastASCII;
// extern	ScanCode	LastScan;
// extern	KeyboardDef	KbdDefs;
// extern	JoystickDef	JoyDefs[];
// extern	ControlType	Controls[MaxPlayers];
// 
// extern	Demo		DemoMode;
// extern	byte _seg	*DemoBuffer;
// extern	word		DemoOffset,DemoSize;
// 
// // Function prototypes
// #define	IN_KeyDown(code)	(Keyboard[(code)])
// #define	IN_ClearKey(code)	{Keyboard[code] = false;\
// 							if (code == LastScan) LastScan = sc_None;}
// 
// // DEBUG - put names in prototypes
// extern	void		IN_Startup(void),IN_Shutdown(void),
// 					IN_Default(boolean gotit,ControlType in),
// 					IN_SetKeyHook(void (*)()),
// 					IN_ClearKeysDown(void),
// 					IN_ReadCursor(CursorInfo *),
// 					IN_ReadControl(int,ControlInfo *),
// 					IN_SetControlType(int,ControlType),
// 					IN_GetJoyAbs(word joy,word *xp,word *yp),
// 					IN_SetupJoy(word joy,word minx,word maxx,
// 								word miny,word maxy),
// 					IN_StopDemo(void),IN_FreeDemoBuffer(void),
// 					IN_Ack(void),IN_AckBack(void);
// extern	boolean		IN_UserInput(longword delay);
// extern	char		IN_WaitForASCII(void);
// extern	ScanCode	IN_WaitForKey(void);
// extern	word		IN_GetJoyButtonsDB(word joy);
// extern	byte		*IN_GetScanName(ScanCode);
// 
// 
// byte	IN_MouseButtons (void);
// byte	IN_JoyButtons (void);
// 
// void INL_GetJoyDelta(word joy,int *dx,int *dy);
// void IN_StartAck(void);
// boolean IN_CheckAck (void);
// 
// #endif
// 
