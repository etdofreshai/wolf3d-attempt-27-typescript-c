//
//	ID Engine
//	ID_US.h - Header file for the User Manager
//	v1.0d1
//	By Jason Blochowiak
//

// #ifndef	__ID_US__
// #define	__ID_US__

// #ifdef	__DEBUG__
// #define	__DEBUG_UserMgr__
// #endif

// #define	HELPTEXTLINKED

export const MaxX = 320;
export const MaxY = 200;

export const MaxHelpLines = 500;

export const MaxHighName = 57;
export const MaxScores = 7;
export interface HighScore
		{
			name:string;
			score:number;
			completed:number;
			episode:number;
		 }

export const MaxGameName = 32;
export const MaxSaveGames = 6;
export interface SaveGame
		{
			signature:string;
			oldtest:number[] | null;
			present:boolean;
			name:string;
		 }

export const MaxString = 128;	// Maximum input string size

export interface WindowRec
		{
			x:number;
			y:number;
			w:number;
			h:number;
			px:number;
			py:number;
		 }	// Record used to save & restore screen windows

export enum GameDiff
		{
			gd_Continue = 0,
			gd_Easy = 1,
			gd_Normal = 2,
			gd_Hard = 3,
		 }

//	Hack import for TED launch support
// extern	boolean		tedlevel;
// extern	int			tedlevelnum;
// extern	void		TEDDeath(void);

// extern	boolean		ingame,		// Set by game code if a game is in progress
// 					abortgame,	// Set if a game load failed
// 					loadedgame,	// Set if the current game was loaded
// 					NoWait,
// 					HighScoresDirty;
// extern	char		*abortprogram;	// Set to error msg if program is dying
// extern	GameDiff	restartgame;	// Normally gd_Continue, else starts game
// extern	word		PrintX,PrintY;	// Current printing location in the window
// extern	word		WindowX,WindowY,// Current location of window
// 					WindowW,WindowH;// Current size of window

// extern	boolean		Button0,Button1,
// 					CursorBad;
// extern	int			CursorX,CursorY;

// extern	void		(*USL_MeasureString)(char far *,word *,word *),
// 					(*USL_DrawString)(char far *);

// extern	boolean		(*USL_SaveGame)(int),(*USL_LoadGame)(int);
// extern	void		(*USL_ResetGame)(void);
// extern	SaveGame	Games[MaxSaveGames];
// extern	HighScore	Scores[];

// #define	US_HomeWindow()	{PrintX = WindowX; PrintY = WindowY;}
export function US_HomeWindow(state: { PrintX:number; PrintY:number; WindowX:number; WindowY:number }): void
{
	state.PrintX = state.WindowX;
	state.PrintY = state.WindowY;
}

// extern	void	US_Startup(void),
// 				US_Setup(void),
// 				US_Shutdown(void),
// 				US_InitRndT(boolean randomize),
// 				US_SetLoadSaveHooks(boolean (*load)(int),
// 									boolean (*save)(int),
// 									void (*reset)(void)),
// 				US_TextScreen(void),
// 				US_UpdateTextScreen(void),
// 				US_FinishTextScreen(void),
// 				US_DrawWindow(word x,word y,word w,word h),
// 				US_CenterWindow(word,word),
// 				US_SaveWindow(WindowRec *win),
// 				US_RestoreWindow(WindowRec *win),
// 				US_ClearWindow(void),
// 				US_SetPrintRoutines(void (*measure)(char far *,word *,word *),
// 									void (*print)(char far *)),
// 				US_PrintCentered(char far *s),
// 				US_CPrint(char far *s),
// 				US_CPrintLine(char far *s),
// 				US_Print(char far *s),
// 				US_PrintUnsigned(longword n),
// 				US_PrintSigned(long n),
// 				US_StartCursor(void),
// 				US_ShutCursor(void),
// 				US_CheckHighScore(long score,word other),
// 				US_DisplayHighScores(int which);
// extern	boolean	US_UpdateCursor(void),
// 				US_LineInput(int x,int y,char *buf,char *def,boolean escok,
// 								int maxchars,int maxwidth);
// extern	int		US_CheckParm(char *parm,char **strings),
// 				US_RndT(void);

// 		void	USL_PrintInCenter(char far *s,Rect r);
// 		char 	*USL_GiveSaveName(word game);
// #endif
