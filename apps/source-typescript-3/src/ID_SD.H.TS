//
//	ID Engine
//	ID_SD.h - Sound Manager Header
//	Version for Wolfenstein
//	By Jason Blochowiak
//

// #ifndef	__ID_SD__
// #define	__ID_SD__

export type byte = number;
export type word = number;
export type longword = number;

// void	alOut(byte n,byte b);

// #ifdef	__DEBUG__
// #define	__DEBUG_SoundMgr__
// #endif

export const TickBase = 70;		// 70Hz per tick - used as a base for timer 0

export enum SDMode {
					sdm_Off = 0,
					sdm_PC = 1,sdm_AdLib = 2,
				}
export enum SMMode {
					smm_Off = 0,smm_AdLib = 1
				}
export enum SDSMode {
					sds_Off = 0,sds_PC = 1,sds_SoundSource = 2,sds_SoundBlaster = 3
				}
export interface SoundCommon
		{
			length: longword;
			priority: word;
		}

//	PC Sound stuff
export const pcTimer = 0x42;
export const pcTAccess = 0x43;
export const pcSpeaker = 0x61;

export const pcSpkBits = 3;

export interface PCSound
		{
			common: SoundCommon;
			data: byte[];
		}

// 	Registers for the Sound Blaster card - needs to be offset by n0 (0x10,0x20,0x30,0x40,0x50,0x60)
export const sbReset = 0x206;	// W
export const sbFMStatus = 0x208;	// R
export const sbFMAddr = 0x208;	// W
export const sbFMData = 0x209;	// W
export const sbReadData = 0x20a;	// R
export const sbWriteCmd = 0x20c;	// W
export const sbWriteData = 0x20c;	// W
export const sbWriteStat = 0x20c;	// R
export const sbDataAvail = 0x20e;	// R

//	Registers for the Sound Blaster Pro card - needs to be offset by n0 (0x20 or 0x40)
export const sbpLFMStatus = 0x200;	// R
export const sbpLFMAddr = 0x200;		// W
export const sbpLFMData = 0x201;		// W
export const sbpRFMStatus = 0x202;	// R
export const sbpRFMAddr = 0x202;		// W
export const sbpRFMData = 0x203;		// W
export const sbpMixerAddr = 0x204;	// W
export const sbpMixerData = 0x205;	// RW
export const sbpCDData = 0x210;		// R
export const sbpCDCommand = 0x210;	// W
export const sbpCDStatus = 0x211;		// R
export const sbpCDReset = 0x212;		// W

//	SBPro Mixer addresses
export const sbpmReset = 0x00;
export const sbpmVoiceVol = 0x04;
export const sbpmMicMix = 0x0a;
export const sbpmFilterADC = 0x0c;
export const sbpmControl = 0x0e;
export const sbpmMasterVol = 0x22;
export const sbpmFMVol = 0x26;
export const sbpmCDVol = 0x28;
export const sbpmLineVol = 0x2e;

export interface SampledSound
		{
			common: SoundCommon;
			hertz: word;
			bits: byte;
						reference: byte;
						data: byte[];
		}

// 	Registers for the AdLib card
export const alFMStatus = 0x388;	// R
export const alFMAddr = 0x388;	// W
export const alFMData = 0x389;	// W

//	Register addresses
// Operator stuff
export const alChar = 0x20;
export const alScale = 0x40;
export const alAttack = 0x60;
export const alSus = 0x80;
export const alWave = 0xe0;
// Channel stuff
export const alFreqL = 0xa0;
export const alFreqH = 0xb0;
export const alFeedCon = 0xc0;
// Global stuff
export const alEffects = 0xbd;

export interface Instrument
		{
			mChar: byte;cChar: byte;
					mScale: byte;cScale: byte;
					mAttack: byte;cAttack: byte;
					mSus: byte;cSus: byte;
					mWave: byte;cWave: byte;
					nConn: byte;

					// These are only for Muse - these bytes are really unused
					voice: byte;
					mode: byte;
					unused: [byte, byte, byte];
		}

export interface AdLibSound
		{
			common: SoundCommon;
			inst: Instrument;
			block: byte;
						data: byte[];
		}

//
//	Sequencing stuff
//
export const sqMaxTracks = 10;
export const sqMaxMoods = 1;	// DEBUG

export const sev_Null = 0;	// Does nothing
export const sev_NoteOff = 1;	// Turns a note off
export const sev_NoteOn = 2;	// Turns a note on
export const sev_NotePitch = 3;	// Sets the pitch of a currently playing note
export const sev_NewInst = 4;	// Installs a new instrument
export const sev_NewPerc = 5;	// Installs a new percussive instrument
export const sev_PercOn = 6;	// Turns a percussive note on
export const sev_PercOff = 7;	// Turns a percussive note off
export const sev_SeqEnd = -1;	// Terminates a sequence

// 	Flags for MusicGroup.flags
export const sf_Melodic = 0;
export const sf_Percussive = 1;

// #if 1
export interface MusicGroup
		{
			length: word;
					values: word[];
		}
// #else
// typedef	struct
// 		{
// 			word	flags,
// 					count,
// 					offsets[1];
// 		} MusicGroup;
// #endif

export interface ActiveTrack
		{
			/* This part needs to be set up by the user */
			mood: word;moods: Array<word[] | null>;

			/* The rest is set up by the code */
			inst: Instrument;
			percussive: boolean;
			seq: word[] | null;
			nextevent: longword;
		}

export const sqmode_Normal = 0;
export const sqmode_FadeIn = 1;
export const sqmode_FadeOut = 2;

export const sqMaxFade = 64;	// DEBUG


// Global variables
// extern	boolean		AdLibPresent,
// 					SoundSourcePresent,
// 					SoundBlasterPresent,
// 					NeedsMusic,					// For Caching Mgr
// 					SoundPositioned;
// extern	SDMode		SoundMode;
// extern	SDSMode		DigiMode;
// extern	SMMode		MusicMode;
// extern	boolean		DigiPlaying;
// extern	int			DigiMap[];
// extern	longword	TimeCount;					// Global time in ticks

// Function prototypes
// extern	void	SD_Startup(void),
// 				SD_Shutdown(void),
// 				SD_Default(boolean gotit,SDMode sd,SMMode sm),
//
// 				SD_PositionSound(int leftvol,int rightvol);
// extern	boolean	SD_PlaySound(soundnames sound);
// extern	void	SD_SetPosition(int leftvol,int rightvol),
// 				SD_StopSound(void),
// 				SD_WaitSoundDone(void),
//
// 				SD_StartMusic(MusicGroup far *music),
// 				SD_MusicOn(void),
// 				SD_MusicOff(void),
// 				SD_FadeOutMusic(void),
//
// 				SD_SetUserHook(void (*hook)(void));
// extern	boolean	SD_MusicPlaying(void),
// 				SD_SetSoundMode(SDMode mode),
// 				SD_SetMusicMode(SMMode mode);
// extern	word	SD_SoundPlaying(void);

// extern	void	SD_SetDigiDevice(SDSMode),
// 				SD_PlayDigitized(word which,int leftpos,int rightpos),
// 				SD_StopDigitized(void),
// 				SD_Poll(void);

// #ifdef	_MUSE_	// MUSE Goes directly to the lower level routines
// extern	void	SDL_PCPlaySound(PCSound far *sound),
// 				SDL_PCStopSound(void),
// 				SDL_ALPlaySound(AdLibSound far *sound),
// 				SDL_ALStopSound(void);
// #endif

// #endif
