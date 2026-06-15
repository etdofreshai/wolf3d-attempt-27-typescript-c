// @generated-from-wolfsrc
// Original file: source/WOLFSRC/FOREIGN.H
// This module preserves the source text below as line comments for audit.
// Hand ports can replace generated stubs function-by-function while keeping
// the original text nearby for side-by-side review.

export const WOLFSRC_FILE = "FOREIGN.H";
export const WOLFSRC_FUNCTIONS = [] as const;

export const CURGAME = "You are currently in\na game. Continuing will\nerase old game. Ok?";
export const ENDGAMESTR = "Are you sure you want\nto end the game you\nare playing? (Y or N):";
export const GAMESVD = "There's already a game\nsaved at this position.\n      Overwrite?";
export const STR_NG = "New Game";
export const STR_SD = "Sound";
export const STR_CL = "Control";
export const STR_LG = "Load Game";
export const STR_SG = "Save Game";
export const STR_CV = "Change View";
export const STR_VS = "View Scores";
export const STR_EG = "End Game";
export const STR_BD = "Back to Demo";
export const STR_QT = "Quit";
export const STR_LOADING = "Loading";
export const STR_SAVING = "Saving";
export const STR_GAME = "Game";
export const STR_DEMO = "Demo";
export const STR_LGC = "Load Game called\n\"";
export const STR_EMPTY = "empty";
export const STR_MOUSEADJ = "Adjust Mouse Sensitivity";
export const STR_SLOW = "Slow";
export const STR_FAST = "Fast";
export const STR_DADDY = "Can I play, Daddy?";
export const STR_HURTME = "Don't hurt me.";
export const STR_BRINGEM = "Bring 'em on!";
export const STR_DEATH = "I am Death incarnate!";
export const STR_NONE = "None";
export const STR_PC = "PC Speaker";
export const STR_ALSB = "AdLib/Sound Blaster";
export const STR_DISNEY = "Disney Sound Source";
export const STR_SB = "Sound Blaster";
export const STR_MOUSEEN = "Mouse Enabled";
export const STR_JOYEN = "Joystick Enabled";
export const STR_PORT2 = "Use joystick port 2";
export const STR_GAMEPAD = "Gravis GamePad Enabled";
export const STR_SENS = "Mouse Sensitivity";
export const STR_CUSTOM = "Customize controls";
export const STR_CRUN = "Run";
export const STR_COPEN = "Open";
export const STR_CFIRE = "Fire";
export const STR_CSTRAFE = "Strafe";
export const STR_LEFT = "Left";
export const STR_RIGHT = "Right";
export const STR_FRWD = "Frwd";
export const STR_BKWD = "Bkwrd";
export const STR_THINK = "Thinking";
export const STR_CALIB = "Calibrate";
export const STR_JOYST = "Joystick";
export const STR_MOVEJOY = "Move joystick to\nupper left and\npress button 0\n";
export const STR_MOVEJOY2 = "Move joystick to\nlower right and\npress button 1\n";
export const STR_ESCEXIT = "ESC to exit";
export const STR_SIZE1 = "Use arrows to size";
export const STR_SIZE2 = "ENTER to accept";
export const STR_SIZE3 = "ESC to cancel";

// ---------------------------------------------------------------------------
// Original source follows.
// ---------------------------------------------------------------------------
// #define QUITSUR	"Are you sure you want\n"\
// 		"to quit this great game?"
// 
// #define CURGAME	"You are currently in\n"\
// 		"a game. Continuing will\n"\
// 		"erase old game. Ok?"
// 
// #define GAMESVD	"There's already a game\n"\
// 		"saved at this position.\n"\
// 		"      Overwrite?"
// 
// #define ENDGAMESTR	"Are you sure you want\n"\
// 					"to end the game you\n"\
// 					"are playing? (Y or N):"
// 
// #define STR_NG	"New Game"
// #define	STR_SD	"Sound"
// #define	STR_CL	"Control"
// #define	STR_LG	"Load Game"
// #define	STR_SG	"Save Game"
// #define	STR_CV	"Change View"
// #define	STR_VS	"View Scores"
// #define STR_EG	"End Game"
// #define	STR_BD	"Back to Demo"
// #define STR_QT	"Quit"
// 
// #define STR_LOADING	"Loading"
// #define STR_SAVING	"Saving"
// 
// #define STR_GAME	"Game"
// #define STR_DEMO	"Demo"
// #define STR_LGC		"Load Game called\n\""
// #define STR_EMPTY	"empty"
// #define STR_CALIB	"Calibrate"
// #define STR_JOYST	"Joystick"
// #define STR_MOVEJOY	"Move joystick to\nupper left and\npress button 0\n"
// #define STR_MOVEJOY2 "Move joystick to\nlower right and\npress button 1\n"
// #define STR_ESCEXIT	"ESC to exit"
// 
// #define STR_NONE	"None"
// #define	STR_PC		"PC Speaker"
// #define	STR_ALSB	"AdLib/Sound Blaster"
// #define	STR_DISNEY	"Disney Sound Source"
// #define	STR_SB		"Sound Blaster"
// 
// #define	STR_MOUSEEN	"Mouse Enabled"
// #define	STR_JOYEN	"Joystick Enabled"
// #define	STR_PORT2	"Use joystick port 2"
// #define	STR_GAMEPAD	"Gravis GamePad Enabled"
// #define	STR_SENS	"Mouse Sensitivity"
// #define	STR_CUSTOM	"Customize controls"
// 
// #define	STR_DADDY	"Can I play, Daddy?"
// #define	STR_HURTME	"Don't hurt me."
// #define	STR_BRINGEM	"Bring 'em on!"
// #define	STR_DEATH	"I am Death incarnate!"
// 
// #define	STR_MOUSEADJ	"Adjust Mouse Sensitivity"
// #define STR_SLOW	"Slow"
// #define STR_FAST	"Fast"
// 
// #define	STR_CRUN	"Run"
// #define STR_COPEN	"Open"
// #define STR_CFIRE	"Fire"
// #define STR_CSTRAFE	"Strafe"
// 
// #define	STR_LEFT	"Left"
// #define	STR_RIGHT	"Right"
// #define	STR_FRWD	"Frwd"
// #define	STR_BKWD	"Bkwrd"
// #define	STR_THINK	"Thinking"
// 
// #define STR_SIZE1	"Use arrows to size"
// #define STR_SIZE2	"ENTER to accept"
// #define STR_SIZE3	"ESC to cancel"
// 
// #define STR_YOUWIN	"you win!"
// 
// #define STR_TOTALTIME	"total time"
// 
// #define STR_RATKILL		    "kill    %"
// #define STR_RATSECRET  	  "secret    %"
// #define STR_RATTREASURE	"treasure    %"
// 
// #define STR_BONUS	"bonus"
// #define STR_TIME	"time"
// #define STR_PAR		" par"
// 
// #define STR_RAT2KILL            "kill ratio    %"
// #define STR_RAT2SECRET  	  "secret ratio    %"
// #define STR_RAT2TREASURE	"treasure ratio    %"
// 
// #define STR_DEFEATED	"defeated!"
// 
// #define STR_CHEATER1	"You now have 100% Health,"
// #define STR_CHEATER2    "99 Ammo and both Keys!"
// #define STR_CHEATER3	"Note that you have basically"
// #define STR_CHEATER4	"eliminated your chances of"
// #define STR_CHEATER5	"getting a high score!"
// 
// #define STR_NOSPACE1	"There is not enough space"
// #define STR_NOSPACE2	"on your disk to Save Game!"
// 
// #define STR_SAVECHT1	"Your Save Game file is,"
// #define STR_SAVECHT2	"shall we say, \"corrupted\"."
// #define STR_SAVECHT3	"But I'll let you go on and"
// #define STR_SAVECHT4	"play anyway...."
// 
// #define	STR_SEEAGAIN	"Let's see that again!"
// 
