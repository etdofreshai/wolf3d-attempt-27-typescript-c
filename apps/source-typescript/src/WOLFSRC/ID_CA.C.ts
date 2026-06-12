// ID_CA.C

// this has been customized for WOLF

/*
=============================================================================

Id Software Caching Manager
---------------------------

Must be started BEFORE the memory manager, because it needs to get the headers
loaded into the data segment

=============================================================================
*/

import {
  peekb,
  pokeb,
  peekw,
  pokew,
  peekl,
  ref,
  lvar,
  type PtrCell,
} from "../runtime/dosmem";
import {
  open,
  close,
  read,
  write,
  lseek,
  unlink,
  filelength,
  SEEK_SET,
  O_RDONLY,
  O_WRONLY,
  O_CREAT,
  O_BINARY,
  O_TEXT,
  S_IREAD,
  S_IWRITE,
  S_IFREG,
  cerr,
  EINVFMT,
  ENOMEM,
} from "../runtime/dosfs";
import { u16 } from "../runtime/ctypes";
import { GREXT } from "./ID_HEADS.H";
import { NUMMAPS, MAPPLANES, sizeof_maptype, maptype } from "./ID_CA.H";
import {
  NUMCHUNKS,
  NUMPICS,
  NUMTILE8,
  NUMTILE8M,
  STRUCTPIC,
  STARTTILE8,
  STARTTILE8M,
  STARTTILE16,
  STARTTILE16M,
  STARTTILE32,
  STARTTILE32M,
  STARTEXTERNS,
} from "./GFXV_WL6.H";
import {
  NUMSOUNDS,
  NUMSNDCHUNKS,
  STARTPCSOUNDS,
  STARTADLIBSOUNDS,
} from "./AUDIOWL6.H";
import { BUFFERSIZE } from "./ID_MM.H";
import { mm, MM_GetPtr, MM_FreePtr, MM_SetLock, MM_SetPurge } from "./ID_MM.C";
import { sizeof_pictabletype } from "./ID_VH.H";
import { vh, VW_MarkUpdateBlock } from "./ID_VH.C";
import { vl } from "./ID_VL.C";
import { vgamem } from "../platform/vga";
import { SDMode, sdm_Off, sdm_PC, sdm_AdLib } from "./ID_SD.H";
import { sd } from "./ID_SD.C";
import { Quit } from "./WL_MAIN.C";

// #define THREEBYTEGRSTARTS  (defined for WL6)

/*
=============================================================================

						 LOCAL CONSTANTS

=============================================================================
*/

/*
typedef struct
{
  unsigned bit0,bit1;	// 0-255 is a character, > is a pointer to a node
} huffnode;

Port: a huffnode table is a Uint16Array of [bit0,bit1] pairs —
bit0 = table[node*2], bit1 = table[node*2+1].
*/

/*
typedef struct
{
	unsigned	RLEWtag;            // @0
	long		headeroffsets[100]; // @2
	byte		tileinfo[];         // @402
} mapfiletype;
*/
const mapfiletype = {
  RLEWtag: (addr: number): number => peekw(addr + 0),
  headeroffsets: (addr: number, i: number): number => peekl(addr + 2 + 4 * i),
};

/*
=============================================================================

						 GLOBAL VARIABLES

=============================================================================
*/

export const ca = {
  // byte _seg *tinf;
  tinf: 0,
  // int mapon;
  mapon: 0,

  // unsigned _seg *mapsegs[MAPPLANES];
  mapsegs: new Array<number>(MAPPLANES).fill(0),
  // maptype _seg *mapheaderseg[NUMMAPS];
  mapheaderseg: new Array<number>(NUMMAPS).fill(0),
  // byte _seg *audiosegs[NUMSNDCHUNKS];
  audiosegs: new Array<number>(NUMSNDCHUNKS).fill(0),
  // void _seg *grsegs[NUMCHUNKS];
  grsegs: new Array<number>(NUMCHUNKS).fill(0),

  // byte far grneeded[NUMCHUNKS];
  grneeded: new Uint8Array(NUMCHUNKS),
  // byte ca_levelbit,ca_levelnum;
  ca_levelbit: 0,
  ca_levelnum: 0,

  // int profilehandle,debughandle;
  profilehandle: 0,
  debughandle: 0,

  // char audioname[13]="AUDIO.";
  audioname: "AUDIO.",

  /*
  =============================================================================

  						 LOCAL VARIABLES

  =============================================================================
  */

  // char extension[5], gheadname[10]=GREXT"HEAD.", ...
  extension: "", // Need a string, not constant to change cache files
  gheadname: GREXT + "HEAD.",
  gfilename: GREXT + "GRAPH.",
  gdictname: GREXT + "DICT.",
  mheadname: "MAPHEAD.",
  mfilename: "MAPTEMP.",
  aheadname: "AUDIOHED.",
  afilename: "AUDIOT.",

  // long _seg *grstarts;     // array of offsets in egagraph, -1 for sparse
  grstarts: 0,
  // long _seg *audiostarts;  // array of offsets in audio / audiot
  audiostarts: 0,

  // huffnode grhuffman[255];
  grhuffman: new Uint16Array(255 * 2),
  // huffnode audiohuffman[255];
  audiohuffman: new Uint16Array(255 * 2),

  // int grhandle;     // handle to EGAGRAPH
  grhandle: 0,
  // int maphandle;    // handle to MAPTEMP / GAMEMAPS
  maphandle: 0,
  // int audiohandle;  // handle to AUDIOT / AUDIO
  audiohandle: 0,

  // long chunkcomplen,chunkexplen;
  chunkcomplen: 0,
  chunkexplen: 0,

  // SDMode oldsoundmode;
  oldsoundmode: sdm_Off as SDMode,
};

const sizeof_grhuffman = 255 * 4; // sizeof(grhuffman): 255 huffnodes of 2 words

// #ifdef THREEBYTEGRSTARTS
const FILEPOSSIZE = 3;

export function GRFILEPOS(c: number): number {
  let value: number;
  let offset: number;

  offset = c * 3;

  value = peekl(ca.grstarts + offset); // *(long far *)(((byte far *)grstarts)+offset)

  value &= 0x00ffffff;

  if (value === 0xffffff) value = -1;

  return value;
}
// #else
// #define FILEPOSSIZE 4
// #define GRFILEPOS(c) (grstarts[c])
// #endif

/*
=============================================================================

					   LOW LEVEL ROUTINES

=============================================================================
*/

/*
============================
=
= CA_OpenDebug / CA_CloseDebug
=
= Opens a binary file with the handle "debughandle"
=
============================
*/

export function CA_OpenDebug(): void {
  unlink("DEBUG.TXT");
  ca.debughandle = open("DEBUG.TXT", O_CREAT | O_WRONLY | O_TEXT);
}

export function CA_CloseDebug(): void {
  close(ca.debughandle);
}

/*
============================
=
= CAL_GetGrChunkLength
=
= Gets the length of an explicit length chunk (not tiles)
= The file pointer is positioned so the compressed data can be read in next.
=
============================
*/

export function CAL_GetGrChunkLength(chunk: number): void {
  lseek(ca.grhandle, GRFILEPOS(chunk), SEEK_SET);
  read(ca.grhandle, ref(ca, "chunkexplen"), 4 /* sizeof(chunkexplen) */);
  ca.chunkcomplen = GRFILEPOS(chunk + 1) - GRFILEPOS(chunk) - 4;
}

/*
==========================
=
= CA_FarRead
=
= Read from a file to a far pointer
=
==========================
*/

export function CA_FarRead(handle: number, dest: number, length: number): boolean {
  if (length > 0xffff) Quit("CA_FarRead doesn't support 64K reads yet!");

  // asm: mov ah,0x3f / int 21h  — DOS READ w/handle
  const got = read(handle, dest, length);
  if (got < 0) {
    cerr.errno = -got;
    return false;
  }
  if (got !== length) {
    cerr.errno = EINVFMT; // user manager knows this is bad read
    return false;
  }
  return true;
}

/*
==========================
=
= CA_SegWrite
=
= Write from a file to a far pointer
=
==========================
*/

export function CA_FarWrite(handle: number, source: number, length: number): boolean {
  if (length > 0xffff) Quit("CA_FarWrite doesn't support 64K reads yet!");

  // asm: mov ah,0x40 / int 21h  — DOS WRITE w/handle
  const wrote = write(handle, source, length);
  if (wrote < 0) {
    cerr.errno = -wrote;
    return false;
  }
  if (wrote !== length) {
    cerr.errno = ENOMEM; // user manager knows this is bad write
    return false;
  }
  return true;
}

/*
==========================
=
= CA_ReadFile
=
= Reads a file into an allready allocated buffer
=
==========================
*/

export function CA_ReadFile(filename: string, ptr: PtrCell): boolean {
  let handle: number;
  let size: number;

  if ((handle = open(filename, O_RDONLY | O_BINARY, S_IREAD)) === -1)
    return false;

  size = filelength(handle);
  if (!CA_FarRead(handle, ptr.get(), size)) {
    close(handle);
    return false;
  }
  close(handle);
  return true;
}

/*
==========================
=
= CA_WriteFile
=
= Writes a file from a memory buffer
=
==========================
*/

export function CA_WriteFile(filename: string, ptr: number, length: number): boolean {
  let handle: number;

  handle = open(filename, O_CREAT | O_BINARY | O_WRONLY, S_IREAD | S_IWRITE | S_IFREG);

  if (handle === -1) return false;

  if (!CA_FarWrite(handle, ptr, length)) {
    close(handle);
    return false;
  }
  close(handle);
  return true;
}

/*
==========================
=
= CA_LoadFile
=
= Allocate space for and load a file
=
==========================
*/

export function CA_LoadFile(filename: string, ptr: PtrCell): boolean {
  let handle: number;
  let size: number;

  if ((handle = open(filename, O_RDONLY | O_BINARY, S_IREAD)) === -1)
    return false;

  size = filelength(handle);
  MM_GetPtr(ptr, size);
  if (!CA_FarRead(handle, ptr.get(), size)) {
    close(handle);
    return false;
  }
  close(handle);
  return true;
}

/*
============================================================================

		COMPRESSION routines, see JHUFF.C for more

============================================================================
*/

/*
===============
=
= CAL_OptimizeNodes
=
= Goes through a huffman table and changes the 256-511 node numbers to the
= actular address of the node.  Must be called before CAL_HuffExpand
=
===============
*/

export function CAL_OptimizeNodes(table: Uint16Array): void {
  let node: number;
  let i: number;

  node = 0;

  for (i = 0; i < 255; i++) {
    // Port note: in the DOS build this turns node number n (256-511) into
    // the data-segment address of table[n-256] so the asm walk can jump
    // directly. The port's "address of node n" representation IS 256+n,
    // so the rewrite maps every value to itself; the walk in CAL_HuffExpand
    // treats >=256 as "pointer to node (value-256)" exactly like the asm.
    if (table[node * 2 + 0] >= 256)
      table[node * 2 + 0] = 256 + (table[node * 2 + 0] - 256);
    if (table[node * 2 + 1] >= 256)
      table[node * 2 + 1] = 256 + (table[node * 2 + 1] - 256);
    node++;
  }
}

/*
======================
=
= CAL_HuffExpand
=
= Length is the length of the EXPANDED data
= If screenhack, the data is decompressed in four planes directly
= to the screen
=
======================
*/

export function CAL_HuffExpand(
  source: number,
  dest: number,
  length: number,
  hufftable: Uint16Array,
  screenhack: boolean,
): void {
  //  unsigned bit,byte,node,code;
  const headptr = 254; // head node is allways node 254

  /*
  The original expands with inline asm (two variants: <64k and >=64k, which
  differ only in real-mode segment normalization — a no-op in the port's
  flat memory; plus the screenhack plane sequencing). Semantics:

	ds:si  source bit stream, LSB first  (mov ch,[si] / shl cl,1)
	es:di  dest
	ss:bx  node pointer, starting at headptr
	walk:  dx = bit ? node.bit1 : node.bit0
	       if dx < 256 -> emit dl, node = headptr
	       else        -> node = (huffnode *)dx
	screenhack: out SC_MAPMASK plane 1,2,4,8 — expand length/4 bytes to each
	plane at the same dest offset, one continuous bit stream.
  */

  let si = source;
  let bitbyte = peekb(si); // mov ch,[si]  — load first byte
  si++;
  let mask = 1; // mov cl,1
  let node = headptr;

  if (screenhack) {
    // mapmask = 1; out SC_INDEX, SC_MAPMASK+256
    length >>= 2;

    let plane = 0;
    let di = 0;
    const destoff = dest; // MK_FP(SCREENSEG,bufferofs) — offset within plane
    let total = length * 4;
    while (total) {
      const dx =
        (bitbyte & mask) !== 0
          ? hufftable[node * 2 + 1] // take bit1 path
          : hufftable[node * 2 + 0]; // take bit0 path from node
      mask <<= 1; // shl cl,1 — advance to next bit position
      if (mask === 0x100) {
        bitbyte = peekb(si); // load next byte
        si++;
        mask = 1; // back to first bit
      }
      if (dx < 256) {
        vgamem[plane * 0x10000 + ((destoff + di) & 0xffff)] = dx;
        di++; // write a decompressed byte out
        node = headptr; // back to the head node for next bit
        total--;
        if (di === length) {
          // shl mapmask: next plane, di back to destoff
          plane++;
          di = 0;
        }
      } else {
        node = dx - 256; // next node = (huffnode *)code
      }
    }
  } else {
    let di = dest;
    const end = dest + length;
    while (di !== end) {
      const dx =
        (bitbyte & mask) !== 0
          ? hufftable[node * 2 + 1] // take bit1 path
          : hufftable[node * 2 + 0]; // take bit0 path from node
      mask <<= 1; // shl cl,1 — advance to next bit position
      if (mask === 0x100) {
        bitbyte = peekb(si); // load next byte
        si++;
        mask = 1; // back to first bit
      }
      if (dx < 256) {
        pokeb(di, dx); // storebyte
        di++;
        node = headptr; // back to the head node for next bit
      } else {
        node = dx - 256; // next node
      }
    }
  }
}

/*
======================
=
= CAL_CarmackExpand
=
= Length is the length of the EXPANDED data
=
======================
*/

const NEARTAG = 0xa7;
const FARTAG = 0xa8;

export function CAL_CarmackExpand(source: number, dest: number, length: number): void {
  let ch: number, chhigh: number, count: number, offset: number;
  let copyptr: number, inptr: number, outptr: number; // unsigned far * (word pointers)

  length = u16(length);
  length = Math.floor(length / 2); // length/=2;

  inptr = source;
  outptr = dest;

  while (length) {
    ch = peekw(inptr);
    inptr += 2; // ch = *inptr++;
    chhigh = ch >> 8;
    if (chhigh === NEARTAG) {
      count = ch & 0xff;
      if (!count) {
        // have to insert a word containing the tag byte
        ch |= peekb(inptr);
        inptr += 1; // *((unsigned char far *)inptr)++
        pokew(outptr, ch);
        outptr += 2; // *outptr++ = ch;
        length--;
      } else {
        offset = peekb(inptr);
        inptr += 1;
        copyptr = outptr - offset * 2; // word pointer arithmetic
        length = u16(length - count);
        while (count--) {
          pokew(outptr, peekw(copyptr));
          outptr += 2;
          copyptr += 2; // *outptr++ = *copyptr++;
        }
      }
    } else if (chhigh === FARTAG) {
      count = ch & 0xff;
      if (!count) {
        // have to insert a word containing the tag byte
        ch |= peekb(inptr);
        inptr += 1;
        pokew(outptr, ch);
        outptr += 2;
        length--;
      } else {
        offset = peekw(inptr);
        inptr += 2; // offset = *inptr++;
        copyptr = dest + offset * 2; // copyptr = dest + offset;
        length = u16(length - count);
        while (count--) {
          pokew(outptr, peekw(copyptr));
          outptr += 2;
          copyptr += 2;
        }
      }
    } else {
      pokew(outptr, ch);
      outptr += 2; // *outptr++ = ch;
      length--;
    }
  }
}

/*
======================
=
= CA_RLEWcompress
=
======================
*/

export function CA_RLEWCompress(
  source: number,
  length: number,
  dest: number,
  rlewtag: number,
): number {
  let complength: number;
  let value: number, count: number, i: number;
  let end: number;
  const start = dest; // unsigned huge *start

  end = source + Math.floor((length + 1) / 2) * 2; // source + (length+1)/2 words

  //
  // compress it
  //
  do {
    count = 1;
    value = peekw(source);
    source += 2; // value = *source++;
    while (peekw(source) === value && source < end) {
      count++;
      source += 2;
    }
    if (count > 3 || value === rlewtag) {
      //
      // send a tag / count / value string
      //
      pokew(dest, rlewtag);
      dest += 2;
      pokew(dest, count);
      dest += 2;
      pokew(dest, value);
      dest += 2;
    } else {
      //
      // send word without compressing
      //
      for (i = 1; i <= count; i++) {
        pokew(dest, value);
        dest += 2;
      }
    }
  } while (source < end);

  complength = dest - start; // 2*(dest-start) with word pointers
  return complength;
}

/*
======================
=
= CA_RLEWexpand
= length is EXPANDED length
=
======================
*/

export function CA_RLEWexpand(
  source: number,
  dest: number,
  length: number,
  rlewtag: number,
): void {
  //  unsigned value,count,i;
  let end: number;

  //
  // expand it
  //
  end = dest + Math.floor(length / 2) * 2; // dest + (length)/2 words

  /*
  asm loop (segment normalization elided — flat memory):
	expand: lodsw / cmp ax,bx(tag) / je repeat / stosw / jmp next
	repeat: lodsw -> cx (count) / lodsw (value) / rep stosw
	next:   until es:di reaches end
  */
  let si = source;
  let di = dest;
  do {
    const value = peekw(si);
    si += 2; // lodsw
    if (value !== rlewtag) {
      // uncompressed
      pokew(di, value);
      di += 2; // stosw
    } else {
      // compressed string
      let count = peekw(si);
      si += 2; // repeat count
      const repval = peekw(si);
      si += 2; // repeat value
      while (count--) {
        pokew(di, repval);
        di += 2; // rep stosw
      }
    }
  } while (di < end);
}

/*
=============================================================================

					 CACHE MANAGER ROUTINES

=============================================================================
*/

/*
======================
=
= CAL_SetupGrFile
=
======================
*/

export function CAL_SetupGrFile(): void {
  let fname: string;
  let handle: number;
  const compseg = lvar(); // memptr compseg;

  // #ifdef GRHEADERLINKED — not for WL6
  //
  // load ???dict.ext (huffman dictionary for graphics files)
  //

  fname = ca.gdictname; // strcpy(fname,gdictname);
  fname += ca.extension; // strcat(fname,extension);

  if ((handle = open(fname, O_RDONLY | O_BINARY, S_IREAD)) === -1)
    CA_CannotOpen(fname);

  read(handle, ca.grhuffman, sizeof_grhuffman);
  close(handle);
  CAL_OptimizeNodes(ca.grhuffman);

  //
  // load the data offsets from ???head.ext
  //
  MM_GetPtr(ref(ca, "grstarts"), (NUMCHUNKS + 1) * FILEPOSSIZE);

  fname = ca.gheadname;
  fname += ca.extension;

  if ((handle = open(fname, O_RDONLY | O_BINARY, S_IREAD)) === -1)
    CA_CannotOpen(fname);

  CA_FarRead(handle, ca.grstarts, (NUMCHUNKS + 1) * FILEPOSSIZE);

  close(handle);

  // #endif

  //
  // Open the graphics file, leaving it open until the game is finished
  //
  fname = ca.gfilename;
  fname += ca.extension;

  ca.grhandle = open(fname, O_RDONLY | O_BINARY);
  if (ca.grhandle === -1) CA_CannotOpen(fname);

  //
  // load the pic and sprite headers into the arrays in the data segment
  //
  MM_GetPtr(ref(vh, "pictable"), NUMPICS * sizeof_pictabletype);
  CAL_GetGrChunkLength(STRUCTPIC); // position file pointer
  MM_GetPtr(compseg, ca.chunkcomplen);
  CA_FarRead(ca.grhandle, compseg.get(), ca.chunkcomplen);
  CAL_HuffExpand(
    compseg.get(),
    vh.pictable,
    NUMPICS * sizeof_pictabletype,
    ca.grhuffman,
    false,
  );
  MM_FreePtr(compseg);
}

//==========================================================================

/*
======================
=
= CAL_SetupMapFile
=
======================
*/

export function CAL_SetupMapFile(): void {
  let i: number;
  let handle: number;
  let length: number, pos: number;
  let fname: string;

  //
  // load maphead.ext (offsets and tileinfo for map file)
  //
  // #ifndef MAPHEADERLINKED
  fname = ca.mheadname;
  fname += ca.extension;

  if ((handle = open(fname, O_RDONLY | O_BINARY, S_IREAD)) === -1)
    CA_CannotOpen(fname);

  length = filelength(handle);
  MM_GetPtr(ref(ca, "tinf"), length);
  CA_FarRead(handle, ca.tinf, length);
  close(handle);
  // #else
  //   tinf = (byte _seg *)FP_SEG(&maphead);
  // #endif

  //
  // open the data file
  //
  // #ifdef CARMACIZED — defined for WL6
  fname = "GAMEMAPS.";
  fname += ca.extension;

  if ((ca.maphandle = open(fname, O_RDONLY | O_BINARY, S_IREAD)) === -1)
    CA_CannotOpen(fname);
  // #else
  //   strcpy(fname,mfilename); ...
  // #endif

  //
  // load all map header
  //
  for (i = 0; i < NUMMAPS; i++) {
    pos = mapfiletype.headeroffsets(ca.tinf, i);
    if (pos < 0)
      // $FFFFFFFF start is a sparse map
      continue;

    MM_GetPtr(ref(ca.mapheaderseg, i), sizeof_maptype);
    MM_SetLock(ref(ca.mapheaderseg, i), true);
    lseek(ca.maphandle, pos, SEEK_SET);
    CA_FarRead(ca.maphandle, ca.mapheaderseg[i], sizeof_maptype);
  }

  //
  // allocate space for 3 64*64 planes
  //
  for (i = 0; i < MAPPLANES; i++) {
    MM_GetPtr(ref(ca.mapsegs, i), 64 * 64 * 2);
    MM_SetLock(ref(ca.mapsegs, i), true);
  }
}

//==========================================================================

/*
======================
=
= CAL_SetupAudioFile
=
======================
*/

export function CAL_SetupAudioFile(): void {
  let handle: number;
  let length: number;
  let fname: string;

  //
  // load maphead.ext (offsets and tileinfo for map file)
  //
  // #ifndef AUDIOHEADERLINKED
  fname = ca.aheadname;
  fname += ca.extension;

  if ((handle = open(fname, O_RDONLY | O_BINARY, S_IREAD)) === -1)
    CA_CannotOpen(fname);

  length = filelength(handle);
  MM_GetPtr(ref(ca, "audiostarts"), length);
  CA_FarRead(handle, ca.audiostarts, length);
  close(handle);
  // #else
  //   audiohuffman = (huffnode *)&audiodict; ...
  // #endif

  //
  // open the data file
  //
  // #ifndef AUDIOHEADERLINKED
  fname = ca.afilename;
  fname += ca.extension;

  if ((ca.audiohandle = open(fname, O_RDONLY | O_BINARY, S_IREAD)) === -1)
    CA_CannotOpen(fname);
  // #else
  //   if ((audiohandle = open("AUDIO."EXTENSION, ...
  // #endif
}

//==========================================================================

/*
======================
=
= CA_Startup
=
= Open all files and load in headers
=
======================
*/

export function CA_Startup(): void {
  // #ifdef PROFILE
  //   unlink ("PROFILE.TXT");
  //   profilehandle = open("PROFILE.TXT", O_CREAT | O_WRONLY | O_TEXT);
  // #endif

  CAL_SetupMapFile();
  CAL_SetupGrFile();
  CAL_SetupAudioFile();

  ca.mapon = -1;
  ca.ca_levelbit = 1;
  ca.ca_levelnum = 0;
}

//==========================================================================

/*
======================
=
= CA_Shutdown
=
= Closes all files
=
======================
*/

export function CA_Shutdown(): void {
  // #ifdef PROFILE
  //   close (profilehandle);
  // #endif

  close(ca.maphandle);
  close(ca.grhandle);
  close(ca.audiohandle);
}

//===========================================================================

/*
======================
=
= CA_CacheAudioChunk
=
======================
*/

export function CA_CacheAudioChunk(chunk: number): void {
  let pos: number, compressed: number;

  if (ca.audiosegs[chunk]) {
    MM_SetPurge(ref(ca.audiosegs, chunk), 0);
    return; // allready in memory
  }

  //
  // load the chunk into a buffer, either the miscbuffer if it fits, or allocate
  // a larger buffer
  //
  pos = peekl(ca.audiostarts + chunk * 4); // audiostarts[chunk]
  compressed = peekl(ca.audiostarts + (chunk + 1) * 4) - pos;

  lseek(ca.audiohandle, pos, SEEK_SET);

  // #ifndef AUDIOHEADERLINKED

  MM_GetPtr(ref(ca.audiosegs, chunk), compressed);
  if (mm.mmerror) return;

  CA_FarRead(ca.audiohandle, ca.audiosegs[chunk], compressed);

  // #else
  //   (Huffman-expanded path for linked audio — not the WL6 build)
  // #endif
}

//===========================================================================

/*
======================
=
= CA_LoadAllSounds
=
= Purges all sounds, then loads all new ones (mode switch)
=
======================
*/

export function CA_LoadAllSounds(): void {
  let start = 0,
    i: number;

  cachein: {
    switch (ca.oldsoundmode) {
      case sdm_Off:
        break cachein; // goto cachein;
      case sdm_PC:
        start = STARTPCSOUNDS;
        break;
      case sdm_AdLib:
        start = STARTADLIBSOUNDS;
        break;
    }

    for (i = 0; i < NUMSOUNDS; i++, start++)
      if (ca.audiosegs[start])
        MM_SetPurge(ref(ca.audiosegs, start), 3); // make purgable
  } // cachein:

  switch (sd.SoundMode) {
    case sdm_Off:
      return;
    case sdm_PC:
      start = STARTPCSOUNDS;
      break;
    case sdm_AdLib:
      start = STARTADLIBSOUNDS;
      break;
  }

  for (i = 0; i < NUMSOUNDS; i++, start++) CA_CacheAudioChunk(start);

  ca.oldsoundmode = sd.SoundMode;
}

//===========================================================================

/*
======================
=
= CAL_ExpandGrChunk
=
= Does whatever is needed with a pointer to a compressed chunk
=
======================
*/

const BLOCK = 64;
const MASKBLOCK = 128;

export function CAL_ExpandGrChunk(chunk: number, source: number): void {
  let expanded: number;

  if (chunk >= STARTTILE8 && chunk < STARTEXTERNS) {
    //
    // expanded sizes of tile8/16/32 are implicit
    //
    if (chunk < STARTTILE8M)
      // tile 8s are all in one chunk!
      expanded = BLOCK * NUMTILE8;
    else if (chunk < STARTTILE16) expanded = MASKBLOCK * NUMTILE8M;
    else if (chunk < STARTTILE16M)
      // all other tiles are one/chunk
      expanded = BLOCK * 4;
    else if (chunk < STARTTILE32) expanded = MASKBLOCK * 4;
    else if (chunk < STARTTILE32M) expanded = BLOCK * 16;
    else expanded = MASKBLOCK * 16;
  } else {
    //
    // everything else has an explicit size longword
    //
    expanded = peekl(source); // *(long far *)source
    source += 4; // skip over length
  }

  //
  // allocate final space, decompress it, and free bigbuffer
  // Sprites need to have shifts made and various other junk
  //
  MM_GetPtr(ref(ca.grsegs, chunk), expanded);
  if (mm.mmerror) return;
  CAL_HuffExpand(source, ca.grsegs[chunk], expanded, ca.grhuffman, false);
}

/*
======================
=
= CA_CacheGrChunk
=
= Makes sure a given chunk is in memory, loadiing it if needed
=
======================
*/

export function CA_CacheGrChunk(chunk: number): void {
  let pos: number, compressed: number;
  const bigbufferseg = lvar(); // memptr bigbufferseg;
  let source: number;
  let next: number;

  ca.grneeded[chunk] |= ca.ca_levelbit; // make sure it doesn't get removed
  if (ca.grsegs[chunk]) {
    MM_SetPurge(ref(ca.grsegs, chunk), 0);
    return; // allready in memory
  }

  //
  // load the chunk into a buffer, either the miscbuffer if it fits, or allocate
  // a larger buffer
  //
  pos = GRFILEPOS(chunk);
  if (pos < 0)
    // $FFFFFFFF start is a sparse tile
    return;

  next = chunk + 1;
  while (GRFILEPOS(next) === -1)
    // skip past any sparse tiles
    next++;

  compressed = GRFILEPOS(next) - pos;

  lseek(ca.grhandle, pos, SEEK_SET);

  if (compressed <= BUFFERSIZE) {
    CA_FarRead(ca.grhandle, mm.bufferseg, compressed);
    source = mm.bufferseg;
  } else {
    MM_GetPtr(bigbufferseg, compressed);
    MM_SetLock(bigbufferseg, true);
    CA_FarRead(ca.grhandle, bigbufferseg.get(), compressed);
    source = bigbufferseg.get();
  }

  CAL_ExpandGrChunk(chunk, source);

  if (compressed > BUFFERSIZE) MM_FreePtr(bigbufferseg);
}

//==========================================================================

/*
======================
=
= CA_CacheScreen
=
= Decompresses a chunk from disk straight onto the screen
=
======================
*/

export function CA_CacheScreen(chunk: number): void {
  let pos: number, compressed: number, expanded: number;
  const bigbufferseg = lvar();
  let source: number;
  let next: number;

  //
  // load the chunk into a buffer
  //
  pos = GRFILEPOS(chunk);
  next = chunk + 1;
  while (GRFILEPOS(next) === -1)
    // skip past any sparse tiles
    next++;
  compressed = GRFILEPOS(next) - pos;

  lseek(ca.grhandle, pos, SEEK_SET);

  MM_GetPtr(bigbufferseg, compressed);
  MM_SetLock(bigbufferseg, true);
  CA_FarRead(ca.grhandle, bigbufferseg.get(), compressed);
  source = bigbufferseg.get();

  expanded = peekl(source); // *(long far *)source
  source += 4; // skip over length

  //
  // allocate final space, decompress it, and free bigbuffer
  // Sprites need to have shifts made and various other junk
  //
  CAL_HuffExpand(source, vl.bufferofs /* MK_FP(SCREENSEG,bufferofs) */, expanded, ca.grhuffman, true);
  VW_MarkUpdateBlock(0, 0, 319, 199);
  MM_FreePtr(bigbufferseg);
}

//==========================================================================

/*
======================
=
= CA_CacheMap
=
= WOLF: This is specialized for a 64*64 map size
=
======================
*/

export function CA_CacheMap(mapnum: number): void {
  let pos: number, compressed: number;
  let plane: number;
  let dest: PtrCell;
  const bigbufferseg = lvar();
  let size: number;
  let source: number;
  // #ifdef CARMACIZED
  const buffer2seg = lvar();
  let expanded: number;
  // #endif

  ca.mapon = mapnum;

  //
  // load the planes into the allready allocated buffers
  //
  size = 64 * 64 * 2;

  for (plane = 0; plane < MAPPLANES; plane++) {
    pos = maptype.at(ca.mapheaderseg[mapnum]).planestart(plane);
    compressed = maptype.at(ca.mapheaderseg[mapnum]).planelength(plane);

    dest = ref(ca.mapsegs, plane); // dest = &(memptr)mapsegs[plane];

    lseek(ca.maphandle, pos, SEEK_SET);
    if (compressed <= BUFFERSIZE) source = mm.bufferseg;
    else {
      MM_GetPtr(bigbufferseg, compressed);
      MM_SetLock(bigbufferseg, true);
      source = bigbufferseg.get();
    }

    CA_FarRead(ca.maphandle, source, compressed);
    // #ifdef CARMACIZED — defined for WL6
    //
    // unhuffman, then unRLEW
    // The huffman'd chunk has a two byte expanded length first
    // The resulting RLEW chunk also does, even though it's not really
    // needed
    //
    expanded = peekw(source); // *source
    source += 2; // source++;
    MM_GetPtr(buffer2seg, expanded);
    CAL_CarmackExpand(source, buffer2seg.get(), expanded);
    CA_RLEWexpand(
      buffer2seg.get() + 2, // ((unsigned far *)buffer2seg)+1
      dest.get(),
      size,
      mapfiletype.RLEWtag(ca.tinf),
    );
    MM_FreePtr(buffer2seg);
    // #else
    //   CA_RLEWexpand (source+1, *dest,size, ((mapfiletype _seg *)tinf)->RLEWtag);
    // #endif

    if (compressed > BUFFERSIZE) MM_FreePtr(bigbufferseg);
  }
}

//===========================================================================

/*
======================
=
= CA_UpLevel
=
= Goes up a bit level in the needed lists and clears it out.
= Everything is made purgable
=
======================
*/

export function CA_UpLevel(): void {
  let i: number;

  if (ca.ca_levelnum === 7) Quit("CA_UpLevel: Up past level 7!");

  for (i = 0; i < NUMCHUNKS; i++)
    if (ca.grsegs[i]) MM_SetPurge(ref(ca.grsegs, i), 3);
  ca.ca_levelbit = (ca.ca_levelbit << 1) & 0xff;
  ca.ca_levelnum++;
}

//===========================================================================

/*
======================
=
= CA_DownLevel
=
= Goes down a bit level in the needed lists and recaches
= everything from the lower level
=
======================
*/

export function CA_DownLevel(): void {
  if (!ca.ca_levelnum) Quit("CA_DownLevel: Down past level 0!");
  ca.ca_levelbit >>= 1;
  ca.ca_levelnum--;
  CA_CacheMarks();
}

//===========================================================================

/*
======================
=
= CA_ClearMarks
=
= Clears out all the marks at the current level
=
======================
*/

export function CA_ClearMarks(): void {
  let i: number;

  for (i = 0; i < NUMCHUNKS; i++) ca.grneeded[i] &= ~ca.ca_levelbit;
}

//===========================================================================

/*
======================
=
= CA_ClearAllMarks
=
= Clears out all the marks on all the levels
=
======================
*/

export function CA_ClearAllMarks(): void {
  ca.grneeded.fill(0); // _fmemset (grneeded,0,sizeof(grneeded));
  ca.ca_levelbit = 1;
  ca.ca_levelnum = 0;
}

//===========================================================================

/*
======================
=
= CA_FreeGraphics
=
======================
*/

export function CA_SetGrPurge(): void {
  let i: number;

  //
  // free graphics
  //
  CA_ClearMarks();

  for (i = 0; i < NUMCHUNKS; i++)
    if (ca.grsegs[i]) MM_SetPurge(ref(ca.grsegs, i), 3);
}

/*
======================
=
= CA_SetAllPurge
=
= Make everything possible purgable
=
======================
*/

export function CA_SetAllPurge(): void {
  let i: number;

  //
  // free sounds
  //
  for (i = 0; i < NUMSNDCHUNKS; i++)
    if (ca.audiosegs[i]) MM_SetPurge(ref(ca.audiosegs, i), 3);

  //
  // free graphics
  //
  CA_SetGrPurge();
}

//===========================================================================

/*
======================
=
= CA_CacheMarks
=
======================
*/
const MAXEMPTYREAD = 1024;

export function CA_CacheMarks(): void {
  let i: number, next: number, numcache: number;
  let pos: number,
    endpos: number,
    nextpos: number,
    nextendpos: number,
    compressed: number;
  let bufferstart: number, bufferend: number; // file position of general buffer
  let source: number;
  const bigbufferseg = lvar();

  numcache = 0;
  //
  // go through and make everything not needed purgable
  //
  for (i = 0; i < NUMCHUNKS; i++)
    if (ca.grneeded[i] & ca.ca_levelbit) {
      if (ca.grsegs[i])
        // its allready in memory, make
        MM_SetPurge(ref(ca.grsegs, i), 0); // sure it stays there!
      else numcache++;
    } else {
      if (ca.grsegs[i])
        // not needed, so make it purgeable
        MM_SetPurge(ref(ca.grsegs, i), 3);
    }

  if (!numcache)
    // nothing to cache!
    return;

  //
  // go through and load in anything still needed
  //
  bufferstart = bufferend = 0; // nothing good in buffer now

  for (i = 0; i < NUMCHUNKS; i++)
    if (ca.grneeded[i] & ca.ca_levelbit && !ca.grsegs[i]) {
      pos = GRFILEPOS(i);
      if (pos < 0) continue;

      next = i + 1;
      while (GRFILEPOS(next) === -1)
        // skip past any sparse tiles
        next++;

      compressed = GRFILEPOS(next) - pos;
      endpos = pos + compressed;

      if (compressed <= BUFFERSIZE) {
        if (bufferstart <= pos && bufferend >= endpos) {
          // data is allready in buffer
          source = mm.bufferseg + (pos - bufferstart);
        } else {
          // load buffer with a new block from disk
          // try to get as many of the needed blocks in as possible
          while (next < NUMCHUNKS) {
            while (
              next < NUMCHUNKS &&
              !(ca.grneeded[next] & ca.ca_levelbit && !ca.grsegs[next])
            )
              next++;
            if (next === NUMCHUNKS) continue;

            nextpos = GRFILEPOS(next);
            do {
              next++;
            } while (GRFILEPOS(next) === -1); // while (GRFILEPOS(++next) == -1) ;
            nextendpos = GRFILEPOS(next);
            if (
              nextpos - endpos <= MAXEMPTYREAD &&
              nextendpos - pos <= BUFFERSIZE
            )
              endpos = nextendpos;
            else next = NUMCHUNKS; // read pos to posend
          }

          lseek(ca.grhandle, pos, SEEK_SET);
          CA_FarRead(ca.grhandle, mm.bufferseg, endpos - pos);
          bufferstart = pos;
          bufferend = endpos;
          source = mm.bufferseg;
        }
      } else {
        // big chunk, allocate temporary buffer
        MM_GetPtr(bigbufferseg, compressed);
        if (mm.mmerror) return;
        MM_SetLock(bigbufferseg, true);
        lseek(ca.grhandle, pos, SEEK_SET);
        CA_FarRead(ca.grhandle, bigbufferseg.get(), compressed);
        source = bigbufferseg.get();
      }

      CAL_ExpandGrChunk(i, source);
      if (mm.mmerror) return;

      if (compressed > BUFFERSIZE) MM_FreePtr(bigbufferseg);
    }
}

export function CA_CannotOpen(string: string): never {
  let str: string;

  str = "Can't open ";
  str += string;
  str += "!\n";
  Quit(str);
}

//===========================================================================
//
// Header macros carried as functions (they touch ID_CA state):
//

// #define UNCACHEGRCHUNK(chunk) {MM_FreePtr(&grsegs[chunk]);grneeded[chunk]&=~ca_levelbit;}
export function UNCACHEGRCHUNK(chunk: number): void {
  MM_FreePtr(ref(ca.grsegs, chunk));
  ca.grsegs[chunk] = 0; // (the original's purge path nulls the useptr)
  ca.grneeded[chunk] &= ~ca.ca_levelbit;
}

// #define CA_MarkGrChunk(chunk) grneeded[chunk]|=ca_levelbit
export function CA_MarkGrChunk(chunk: number): void {
  ca.grneeded[chunk] |= ca.ca_levelbit;
}
