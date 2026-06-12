// VERSION.H
//
// Port note: the original is a block of #define switches selecting the build
// variant. The locked target (PORTING.md §2) is registered WL6, so SPEAR /
// JAPAN / UPLOAD stay false. They are kept as consts so the #ifdef branches
// they guard can be ported as dead-but-present code.

//#define SPEAR
export const SPEAR = false;
//#define JAPAN
export const JAPAN = false;
export const GOODTIMES = true; // #define GOODTIMES
export const ARTSEXTERN = true; // #define ARTSEXTERN
export const DEMOSEXTERN = true; // #define DEMOSEXTERN
//#define MYPROFILE
export const MYPROFILE = false;
//#define DEBCHECK
export const DEBCHECK = false;
export const CARMACIZED = true; // #define CARMACIZED
//#define UPLOAD
export const UPLOAD = false;

// Variant switches referenced by #ifdef but never defined in the WL6 build:
export const SPEARDEMO = false;
export const JAPDEMO = false;
export const GRHEADERLINKED = false;
export const MAPHEADERLINKED = false;
export const AUDIOHEADERLINKED = false;
export const PROFILE = false;
