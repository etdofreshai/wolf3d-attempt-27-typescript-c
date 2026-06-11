//////////////////////////////////////
//
// Graphics .H file for .WL6
// IGRAB-ed on Wed Apr 13 06:58:44 1994
//
//////////////////////////////////////

export enum graphicnums {
		// Lump Start
		H_BJPIC=3,
		H_CASTLEPIC=4,                         // 4
		H_BLAZEPIC=5,                          // 5
		H_TOPWINDOWPIC=6,                      // 6
		H_LEFTWINDOWPIC=7,                     // 7
		H_RIGHTWINDOWPIC=8,                    // 8
		H_BOTTOMINFOPIC=9,                     // 9
		// Lump Start
		C_OPTIONSPIC=10,                        // 10
		C_CURSOR1PIC=11,                        // 11
		C_CURSOR2PIC=12,                        // 12
		C_NOTSELECTEDPIC=13,                    // 13
		C_SELECTEDPIC=14,                       // 14
		C_FXTITLEPIC=15,                        // 15
		C_DIGITITLEPIC=16,                      // 16
		C_MUSICTITLEPIC=17,                     // 17
		C_MOUSELBACKPIC=18,                     // 18
		C_BABYMODEPIC=19,                       // 19
		C_EASYPIC=20,                           // 20
		C_NORMALPIC=21,                         // 21
		C_HARDPIC=22,                           // 22
		C_LOADSAVEDISKPIC=23,                   // 23
		C_DISKLOADING1PIC=24,                   // 24
		C_DISKLOADING2PIC=25,                   // 25
		C_CONTROLPIC=26,                        // 26
		C_CUSTOMIZEPIC=27,                      // 27
		C_LOADGAMEPIC=28,                       // 28
		C_SAVEGAMEPIC=29,                       // 29
		C_EPISODE1PIC=30,                       // 30
		C_EPISODE2PIC=31,                       // 31
		C_EPISODE3PIC=32,                       // 32
		C_EPISODE4PIC=33,                       // 33
		C_EPISODE5PIC=34,                       // 34
		C_EPISODE6PIC=35,                       // 35
		C_CODEPIC=36,                           // 36
		C_TIMECODEPIC=37,                       // 37
		C_LEVELPIC=38,                          // 38
		C_NAMEPIC=39,                           // 39
		C_SCOREPIC=40,                          // 40
		C_JOY1PIC=41,                           // 41
		C_JOY2PIC=42,                           // 42
		// Lump Start
		L_GUYPIC=43,                            // 43
		L_COLONPIC=44,                          // 44
		L_NUM0PIC=45,                           // 45
		L_NUM1PIC=46,                           // 46
		L_NUM2PIC=47,                           // 47
		L_NUM3PIC=48,                           // 48
		L_NUM4PIC=49,                           // 49
		L_NUM5PIC=50,                           // 50
		L_NUM6PIC=51,                           // 51
		L_NUM7PIC=52,                           // 52
		L_NUM8PIC=53,                           // 53
		L_NUM9PIC=54,                           // 54
		L_PERCENTPIC=55,                        // 55
		L_APIC=56,                              // 56
		L_BPIC=57,                              // 57
		L_CPIC=58,                              // 58
		L_DPIC=59,                              // 59
		L_EPIC=60,                              // 60
		L_FPIC=61,                              // 61
		L_GPIC=62,                              // 62
		L_HPIC=63,                              // 63
		L_IPIC=64,                              // 64
		L_JPIC=65,                              // 65
		L_KPIC=66,                              // 66
		L_LPIC=67,                              // 67
		L_MPIC=68,                              // 68
		L_NPIC=69,                              // 69
		L_OPIC=70,                              // 70
		L_PPIC=71,                              // 71
		L_QPIC=72,                              // 72
		L_RPIC=73,                              // 73
		L_SPIC=74,                              // 74
		L_TPIC=75,                              // 75
		L_UPIC=76,                              // 76
		L_VPIC=77,                              // 77
		L_WPIC=78,                              // 78
		L_XPIC=79,                              // 79
		L_YPIC=80,                              // 80
		L_ZPIC=81,                              // 81
		L_EXPOINTPIC=82,                        // 82
		L_APOSTROPHEPIC=83,                     // 83
		L_GUY2PIC=84,                           // 84
		L_BJWINSPIC=85,                         // 85
		STATUSBARPIC=86,                        // 86
		TITLEPIC=87,                            // 87
		PG13PIC=88,                             // 88
		CREDITSPIC=89,                          // 89
		HIGHSCORESPIC=90,                       // 90
		// Lump Start
		KNIFEPIC=91,                            // 91
		GUNPIC=92,                              // 92
		MACHINEGUNPIC=93,                       // 93
		GATLINGGUNPIC=94,                       // 94
		NOKEYPIC=95,                            // 95
		GOLDKEYPIC=96,                          // 96
		SILVERKEYPIC=97,                        // 97
		N_BLANKPIC=98,                          // 98
		N_0PIC=99,                              // 99
		N_1PIC=100,                              // 100
		N_2PIC=101,                              // 101
		N_3PIC=102,                              // 102
		N_4PIC=103,                              // 103
		N_5PIC=104,                              // 104
		N_6PIC=105,                              // 105
		N_7PIC=106,                              // 106
		N_8PIC=107,                              // 107
		N_9PIC=108,                              // 108
		FACE1APIC=109,                           // 109
		FACE1BPIC=110,                           // 110
		FACE1CPIC=111,                           // 111
		FACE2APIC=112,                           // 112
		FACE2BPIC=113,                           // 113
		FACE2CPIC=114,                           // 114
		FACE3APIC=115,                           // 115
		FACE3BPIC=116,                           // 116
		FACE3CPIC=117,                           // 117
		FACE4APIC=118,                           // 118
		FACE4BPIC=119,                           // 119
		FACE4CPIC=120,                           // 120
		FACE5APIC=121,                           // 121
		FACE5BPIC=122,                           // 122
		FACE5CPIC=123,                           // 123
		FACE6APIC=124,                           // 124
		FACE6BPIC=125,                           // 125
		FACE6CPIC=126,                           // 126
		FACE7APIC=127,                           // 127
		FACE7BPIC=128,                           // 128
		FACE7CPIC=129,                           // 129
		FACE8APIC=130,                           // 130
		GOTGATLINGPIC=131,                       // 131
		MUTANTBJPIC=132,                         // 132
		PAUSEDPIC=133,                           // 133
		GETPSYCHEDPIC=134,                       // 134



		ORDERSCREEN=136,
		ERRORSCREEN=137,                         // 137
		T_HELPART=138,                           // 138
		T_DEMO0=139,                             // 139
		T_DEMO1=140,                             // 140
		T_DEMO2=141,                             // 141
		T_DEMO3=142,                             // 142
		T_ENDART1=143,                           // 143
		T_ENDART2=144,                           // 144
		T_ENDART3=145,                           // 145
		T_ENDART4=146,                           // 146
		T_ENDART5=147,                           // 147
		T_ENDART6=148,                           // 148
		ENUMEND=149
}

//
// Data LUMPs
//
export const README_LUMP_START = 3;
export const README_LUMP_END = 9;

export const CONTROLS_LUMP_START = 10;
export const CONTROLS_LUMP_END = 42;

export const LEVELEND_LUMP_START = 43;
export const LEVELEND_LUMP_END = 85;

export const LATCHPICS_LUMP_START = 91;
export const LATCHPICS_LUMP_END = 134;


//
// Amount of each data item
//
export const NUMCHUNKS = 149;
export const NUMFONT = 2;
export const NUMFONTM = 0;
export const NUMPICS = 132;
export const NUMPICM = 0;
export const NUMSPRITES = 0;
export const NUMTILE8 = 72;
export const NUMTILE8M = 0;
export const NUMTILE16 = 0;
export const NUMTILE16M = 0;
export const NUMTILE32 = 0;
export const NUMTILE32M = 0;
export const NUMEXTERNS = 13;
//
// File offsets for data items
//
export const STRUCTPIC = 0;

export const STARTFONT = 1;
export const STARTFONTM = 3;
export const STARTPICS = 3;
export const STARTPICM = 135;
export const STARTSPRITES = 135;
export const STARTTILE8 = 135;
export const STARTTILE8M = 136;
export const STARTTILE16 = 136;
export const STARTTILE16M = 136;
export const STARTTILE32 = 136;
export const STARTTILE32M = 136;
export const STARTEXTERNS = 136;

//
// Thank you for using IGRAB!
//
