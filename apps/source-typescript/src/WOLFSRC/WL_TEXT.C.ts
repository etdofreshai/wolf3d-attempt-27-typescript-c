// @generated-from-wolfsrc
// Original file: source/WOLFSRC/WL_TEXT.C
// This module preserves the source text below as line comments for audit.
// Hand ports can replace generated stubs function-by-function while keeping
// the original text nearby for side-by-side review.

export const WOLFSRC_FILE = "WL_TEXT.C";
export const WOLFSRC_FUNCTIONS = [
  "BackPage",
  "CacheLayoutGraphics",
  "EndText",
  "HandleCommand",
  "HandleCtrls",
  "HandleWord",
  "HelpScreens",
  "NewLine",
  "PageLayout",
  "ParseNumber",
  "ParsePicCommand",
  "ParseTimedCommand",
  "RipToEOL",
  "ShowArticle",
  "TimedPicCommand"
] as const;

const BACKCOLOR = 0x11;
const WORDLIMIT = 80;
const FONTHEIGHT = 10;
const TOPMARGIN = 16;
const BOTTOMMARGIN = 32;
const LEFTMARGIN = 16;
const RIGHTMARGIN = 16;
const PICMARGIN = 8;
const TEXTROWS = Math.trunc((200 - TOPMARGIN - BOTTOMMARGIN) / FONTHEIGHT);
const SPACEWIDTH = 7;
const SCREENPIXWIDTH = 320;
const SCREENMID = SCREENPIXWIDTH / 2;
const H_TOPWINDOWPIC = 6;
const H_LEFTWINDOWPIC = 7;
const H_RIGHTWINDOWPIC = 8;
const H_BOTTOMINFOPIC = 9;
const T_HELPART = 138;
const T_ENDART1 = 143;

export let pagenum = 0;
export let numpages = 0;
export const leftmargin = new Uint16Array(TEXTROWS);
export const rightmargin = new Uint16Array(TEXTROWS);
export let text = "";
export let textOffset = 0;
export let rowon = 0;
export let picx = 0;
export let picy = 0;
export let picnum = 0;
export let picdelay = 0;
export let layoutdone = false;
export let px = LEFTMARGIN;
export let py = TOPMARGIN;
export let fontcolor = 0;
export let fontnumber = 0;
export const helpfilename = "HELPART.";
export let endfilename = "ENDART1.";

export type TextDrawOperation =
  | { readonly type: "bar"; readonly x: number; readonly y: number; readonly width: number; readonly height: number; readonly color: number }
  | { readonly type: "pic"; readonly x: number; readonly y: number; readonly pic: number; readonly delay?: number }
  | { readonly type: "word"; readonly x: number; readonly y: number; readonly word: string; readonly color: number }
  | { readonly type: "page-number"; readonly x: number; readonly y: number; readonly text: string; readonly color: number };

export interface PicSize {
  readonly width: number;
  readonly height: number;
}

export interface TextLayoutOptions {
  readonly article?: string;
  readonly shownumber?: boolean;
  readonly picSizes?: ReadonlyMap<number, PicSize> | Record<number, PicSize>;
  readonly measureWord?: (word: string) => PicSize;
}

export interface PicCommandSummary {
  readonly x: number;
  readonly y: number;
  readonly pic: number;
  readonly delay?: number;
  readonly textOffset: number;
}

export interface WordSummary {
  readonly word: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly row: number;
  readonly layoutdone: boolean;
}

export interface CommandSummary {
  readonly command: string;
  readonly textOffset: number;
  readonly layoutdone: boolean;
}

export interface PageLayoutSummary {
  readonly page: number;
  readonly totalPages: number;
  readonly textOffset: number;
  readonly row: number;
  readonly px: number;
  readonly py: number;
  readonly done: boolean;
  readonly operations: readonly TextDrawOperation[];
}

export interface CacheLayoutGraphicsSummary {
  readonly pages: number;
  readonly marked: readonly number[];
  readonly textOffset: number;
}

export interface ShowArticleOptions extends TextLayoutOptions {
  readonly renderAll?: boolean;
  readonly maxPages?: number;
}

export interface ShowArticleSummary {
  readonly pages: readonly PageLayoutSummary[];
  readonly totalPages: number;
  readonly marked: readonly number[];
  readonly finalOffset: number;
}

export interface TextScreenSummary {
  readonly kind: "help" | "end";
  readonly chunkOrFile: number | string;
  readonly article: ShowArticleSummary | null;
}

let operations: TextDrawOperation[] = [];

export function RipToEOL(): number {
  while (textOffset < text.length) {
    if (text.charCodeAt(textOffset++) === 10) {
      break;
    }
  }
  return textOffset;
}

export function ParseNumber(): number {
  while (textOffset < text.length && !isDigit(text[textOffset])) {
    textOffset++;
  }
  if (textOffset >= text.length) {
    throw new Error("ParseNumber: no number in text stream");
  }

  let value = 0;
  while (textOffset < text.length && isDigit(text[textOffset])) {
    value = value * 10 + (text.charCodeAt(textOffset) - 48);
    textOffset++;
  }
  return value;
}

export function ParsePicCommand(): PicCommandSummary {
  picy = ParseNumber();
  picx = ParseNumber();
  picnum = ParseNumber();
  RipToEOL();
  return { x: picx, y: picy, pic: picnum, textOffset };
}

export function ParseTimedCommand(): PicCommandSummary {
  picy = ParseNumber();
  picx = ParseNumber();
  picnum = ParseNumber();
  picdelay = ParseNumber();
  RipToEOL();
  return { x: picx, y: picy, pic: picnum, delay: picdelay, textOffset };
}

export function TimedPicCommand(options: TextLayoutOptions = {}): PicCommandSummary {
  const command = ParseTimedCommand();
  operations.push({ type: "pic", x: picx & ~7, y: picy, pic: picnum, delay: picdelay });
  void options;
  return command;
}

export function HandleCommand(options: TextLayoutOptions = {}): CommandSummary {
  const caret = textOffset;
  const command = text[++textOffset]?.toUpperCase() ?? "";
  let margin: number;
  let top: number;
  let bottom: number;
  let picwidth: number;
  let picheight: number;
  let picmid: number;

  switch (command) {
    case "B": {
      picy = ParseNumber();
      picx = ParseNumber();
      picwidth = ParseNumber();
      picheight = ParseNumber();
      operations.push({ type: "bar", x: picx, y: picy, width: picwidth, height: picheight, color: BACKCOLOR });
      RipToEOL();
      break;
    }
    case ";":
      RipToEOL();
      break;
    case "P":
    case "E":
      layoutdone = true;
      textOffset = caret;
      break;
    case "C":
      fontcolor = (parseHex(text[++textOffset]) << 4) + parseHex(text[++textOffset]);
      textOffset++;
      break;
    case ">":
      px = 160;
      textOffset++;
      break;
    case "L":
      py = ParseNumber();
      rowon = Math.trunc((py - TOPMARGIN) / FONTHEIGHT);
      rowon = clamp(rowon, 0, TEXTROWS - 1);
      py = TOPMARGIN + rowon * FONTHEIGHT;
      px = ParseNumber();
      RipToEOL();
      break;
    case "T":
      TimedPicCommand(options);
      break;
    case "G": {
      ParsePicCommand();
      operations.push({ type: "pic", x: picx & ~7, y: picy, pic: picnum });
      const size = picSizeFor(picnum, options);
      picwidth = size.width;
      picheight = size.height;
      picmid = picx + Math.trunc(picwidth / 2);
      margin = picmid > SCREENMID ? picx - PICMARGIN : picx + picwidth + PICMARGIN;
      top = Math.trunc((picy - TOPMARGIN) / FONTHEIGHT);
      if (top < 0) top = 0;
      bottom = Math.trunc((picy + picheight - TOPMARGIN) / FONTHEIGHT);
      if (bottom >= TEXTROWS) bottom = TEXTROWS - 1;
      for (let i = top; i <= bottom; i++) {
        if (picmid > SCREENMID) {
          rightmargin[i] = margin;
        } else {
          leftmargin[i] = margin;
        }
      }
      if (px < leftmargin[rowon]) {
        px = leftmargin[rowon];
      }
      break;
    }
    default:
      textOffset++;
      break;
  }

  return { command, textOffset, layoutdone };
}

export function NewLine(): { readonly row: number; readonly px: number; readonly py: number; readonly layoutdone: boolean } {
  rowon++;
  if (rowon === TEXTROWS) {
    layoutdone = true;
    while (textOffset < text.length) {
      if (text[textOffset] === "^") {
        const ch = text[textOffset + 1]?.toUpperCase();
        if (ch === "E" || ch === "P") {
          return { row: rowon, px, py, layoutdone };
        }
      }
      textOffset++;
    }
    return { row: rowon, px, py, layoutdone };
  }
  px = leftmargin[rowon];
  py += FONTHEIGHT;
  return { row: rowon, px, py, layoutdone };
}

export function HandleCtrls(): { readonly char: string; readonly textOffset: number; readonly layoutdone: boolean } {
  const ch = text[textOffset++] ?? "";
  if (ch === "\n") {
    NewLine();
  }
  return { char: ch, textOffset, layoutdone };
}

export function HandleWord(options: TextLayoutOptions = {}): WordSummary {
  let word = text[textOffset++] ?? "";
  while (textOffset < text.length && text.charCodeAt(textOffset) > 32) {
    word += text[textOffset++];
    if (word.length === WORDLIMIT) {
      throw new Error("PageLayout: Word limit exceeded");
    }
  }

  const size = options.measureWord ? options.measureWord(word) : measureWord(word);
  while (px + size.width > rightmargin[rowon]) {
    NewLine();
    if (layoutdone) {
      return { word, x: px, y: py, width: size.width, row: rowon, layoutdone };
    }
  }

  const x = px;
  const y = py;
  px += size.width;
  operations.push({ type: "word", x, y, word, color: fontcolor });

  while (text[textOffset] === " ") {
    px += SPACEWIDTH;
    textOffset++;
  }

  return { word, x, y, width: size.width, row: rowon, layoutdone };
}

export function PageLayout(shownumberOrOptions: boolean | TextLayoutOptions = false): PageLayoutSummary {
  const options = typeof shownumberOrOptions === "boolean"
    ? { shownumber: shownumberOrOptions }
    : shownumberOrOptions;
  if (options.article !== undefined) {
    text = options.article;
    textOffset = 0;
  }

  const oldfontcolor = fontcolor;
  fontcolor = 0;
  operations = [
    { type: "bar", x: 0, y: 0, width: 320, height: 200, color: BACKCOLOR },
    { type: "pic", x: 0, y: 0, pic: H_TOPWINDOWPIC },
    { type: "pic", x: 0, y: 8, pic: H_LEFTWINDOWPIC },
    { type: "pic", x: 312, y: 8, pic: H_RIGHTWINDOWPIC },
    { type: "pic", x: 8, y: 176, pic: H_BOTTOMINFOPIC },
  ];

  leftmargin.fill(LEFTMARGIN);
  rightmargin.fill(SCREENPIXWIDTH - RIGHTMARGIN);
  px = LEFTMARGIN;
  py = TOPMARGIN;
  rowon = 0;
  layoutdone = false;

  while (textOffset < text.length && text.charCodeAt(textOffset) <= 32) {
    textOffset++;
  }
  if (text[textOffset] !== "^" || text[textOffset + 1]?.toUpperCase() !== "P") {
    throw new Error("PageLayout: Text not headed with ^P");
  }
  textOffset += 2;
  RipToEOL();

  do {
    const ch = text[textOffset] ?? "";
    if (ch === "^") {
      HandleCommand(options);
    } else if (ch.charCodeAt(0) === 9) {
      px = (px + 8) & 0xfff8;
      textOffset++;
    } else if (ch === "" || ch.charCodeAt(0) <= 32) {
      HandleCtrls();
    } else {
      HandleWord(options);
    }
  } while (!layoutdone && textOffset < text.length);

  pagenum++;
  if (options.shownumber) {
    const pageText = `pg ${pagenum} of ${numpages}`;
    fontcolor = 0x4f;
    operations.push({ type: "page-number", x: 213, y: 183, text: pageText, color: fontcolor });
  }

  fontcolor = oldfontcolor;
  return {
    page: pagenum,
    totalPages: numpages,
    textOffset,
    row: rowon,
    px,
    py,
    done: layoutdone,
    operations: operations.slice(),
  };
}

export function BackPage(): { readonly page: number; readonly textOffset: number } {
  pagenum--;
  do {
    textOffset--;
    if (textOffset < 0) {
      textOffset = 0;
      return { page: pagenum, textOffset };
    }
    if (text[textOffset] === "^" && text[textOffset + 1]?.toUpperCase() === "P") {
      return { page: pagenum, textOffset };
    }
  } while (true);
}

export function CacheLayoutGraphics(article?: string): CacheLayoutGraphicsSummary {
  if (article !== undefined) {
    text = article;
  }
  const textstart = 0;
  const bombpoint = Math.min(text.length, 30000);
  const marked = new Set<number>();
  textOffset = textstart;
  numpages = 0;
  pagenum = 0;

  do {
    if (text[textOffset] === "^") {
      const ch = text[++textOffset]?.toUpperCase();
      if (ch === "P") {
        numpages++;
      }
      if (ch === "E") {
        marked.add(H_TOPWINDOWPIC);
        marked.add(H_LEFTWINDOWPIC);
        marked.add(H_RIGHTWINDOWPIC);
        marked.add(H_BOTTOMINFOPIC);
        textOffset = textstart;
        return { pages: numpages, marked: Array.from(marked).sort((a, b) => a - b), textOffset };
      }
      if (ch === "G") {
        ParsePicCommand();
        marked.add(picnum);
        continue;
      }
      if (ch === "T") {
        ParseTimedCommand();
        marked.add(picnum);
        continue;
      }
    } else {
      textOffset++;
    }
  } while (textOffset < bombpoint);

  throw new Error("CacheLayoutGraphics: No ^E to terminate file!");
}

export function ShowArticle(articleOrOptions: string | ShowArticleOptions): ShowArticleSummary {
  const options: ShowArticleOptions = typeof articleOrOptions === "string"
    ? { article: articleOrOptions }
    : articleOrOptions;
  if (options.article !== undefined) {
    text = options.article;
  }

  const cache = CacheLayoutGraphics();
  const pages: PageLayoutSummary[] = [];
  const maxPages = options.renderAll ? (options.maxPages ?? numpages) : 1;
  while (pages.length < maxPages && text[textOffset + 1]?.toUpperCase() !== "E") {
    pages.push(PageLayout({ ...options, shownumber: true }));
    if (!options.renderAll) {
      break;
    }
    if (text[textOffset] === "^" && text[textOffset + 1]?.toUpperCase() === "P") {
      continue;
    }
    break;
  }

  fontnumber = 0;
  return { pages, totalPages: numpages, marked: cache.marked, finalOffset: textOffset };
}

export function HelpScreens(options: { readonly article?: string } = {}): TextScreenSummary {
  const article = options.article ? ShowArticle({ article: options.article }) : null;
  return { kind: "help", chunkOrFile: T_HELPART, article };
}

export function EndText(options: { readonly episode?: number; readonly article?: string } = {}): TextScreenSummary {
  const episode = Math.trunc(options.episode ?? 0);
  endfilename = `ENDART${episode + 1}.`;
  const article = options.article ? ShowArticle({ article: options.article }) : null;
  return { kind: "end", chunkOrFile: T_ENDART1 + episode, article };
}

function picSizeFor(pic: number, options: TextLayoutOptions): PicSize {
  const sizes = options.picSizes;
  if (!sizes) {
    return { width: 64, height: 64 };
  }
  if ("get" in sizes) {
    return sizes.get(pic) ?? { width: 64, height: 64 };
  }
  return sizes[pic] ?? { width: 64, height: 64 };
}

function measureWord(word: string): PicSize {
  return { width: word.length * 8, height: FONTHEIGHT };
}

function parseHex(ch: string | undefined): number {
  const upper = ch?.toUpperCase() ?? "0";
  if (upper >= "0" && upper <= "9") {
    return upper.charCodeAt(0) - 48;
  }
  if (upper >= "A" && upper <= "F") {
    return upper.charCodeAt(0) - 55;
  }
  return 0;
}

function isDigit(ch: string | undefined): boolean {
  return ch !== undefined && ch >= "0" && ch <= "9";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
// ---------------------------------------------------------------------------
// Original source follows.
// ---------------------------------------------------------------------------
// // WL_TEXT.C
// 
// #include "WL_DEF.H"
// #pragma	hdrstop
// 
// /*
// =============================================================================
// 
// TEXT FORMATTING COMMANDS
// ------------------------
// ^C<hex digit>  			Change text color
// ^E[enter]				End of layout (all pages)
// ^G<y>,<x>,<pic>[enter]	Draw a graphic and push margins
// ^P[enter]				start new page, must be the first chars in a layout
// ^L<x>,<y>[ENTER]		Locate to a specific spot, x in pixels, y in lines
// 
// =============================================================================
// */
// 
// /*
// =============================================================================
// 
// 						 LOCAL CONSTANTS
// 
// =============================================================================
// */
// 
// #define BACKCOLOR		0x11
// 
// 
// #define WORDLIMIT		80
// #define FONTHEIGHT		10
// #define	TOPMARGIN		16
// #define BOTTOMMARGIN	32
// #define LEFTMARGIN		16
// #define RIGHTMARGIN		16
// #define PICMARGIN		8
// #define TEXTROWS		((200-TOPMARGIN-BOTTOMMARGIN)/FONTHEIGHT)
// #define	SPACEWIDTH		7
// #define SCREENPIXWIDTH	320
// #define SCREENMID		(SCREENPIXWIDTH/2)
// 
// /*
// =============================================================================
// 
// 						 LOCAL VARIABLES
// 
// =============================================================================
// */
// 
// int			pagenum,numpages;
// 
// unsigned	leftmargin[TEXTROWS],rightmargin[TEXTROWS];
// char		far *text;
// unsigned	rowon;
// 
// int			picx,picy,picnum,picdelay;
// boolean		layoutdone;
// 
// //===========================================================================
// 
// #ifndef JAPAN
// /*
// =====================
// =
// = RipToEOL
// =
// =====================
// */
// 
// void RipToEOL (void)
// {
// 	while (*text++ != '\n')		// scan to end of line
// 	;
// }
// 
// 
// /*
// =====================
// =
// = ParseNumber
// =
// =====================
// */
// 
// int	ParseNumber (void)
// {
// 	char	ch;
// 	char	num[80],*numptr;
// 
// //
// // scan until a number is found
// //
// 	ch = *text;
// 	while (ch < '0' || ch >'9')
// 		ch = *++text;
// 
// //
// // copy the number out
// //
// 	numptr = num;
// 	do
// 	{
// 		*numptr++ = ch;
// 		ch = *++text;
// 	} while (ch >= '0' && ch <= '9');
// 	*numptr = 0;
// 
// 	return atoi (num);
// }
// 
// 
// 
// /*
// =====================
// =
// = ParsePicCommand
// =
// = Call with text pointing just after a ^P
// = Upon exit text points to the start of next line
// =
// =====================
// */
// 
// void	ParsePicCommand (void)
// {
// 	picy=ParseNumber();
// 	picx=ParseNumber();
// 	picnum=ParseNumber();
// 	RipToEOL ();
// }
// 
// 
// void	ParseTimedCommand (void)
// {
// 	picy=ParseNumber();
// 	picx=ParseNumber();
// 	picnum=ParseNumber();
// 	picdelay=ParseNumber();
// 	RipToEOL ();
// }
// 
// 
// /*
// =====================
// =
// = TimedPicCommand
// =
// = Call with text pointing just after a ^P
// = Upon exit text points to the start of next line
// =
// =====================
// */
// 
// void	TimedPicCommand (void)
// {
// 	ParseTimedCommand ();
// 
// //
// // update the screen, and wait for time delay
// //
// 	VW_UpdateScreen ();
// 
// //
// // wait for time
// //
// 	TimeCount = 0;
// 	while (TimeCount < picdelay)
// 	;
// 
// //
// // draw pic
// //
// 	VWB_DrawPic (picx&~7,picy,picnum);
// }
// 
// 
// /*
// =====================
// =
// = HandleCommand
// =
// =====================
// */
// 
// void HandleCommand (void)
// {
// 	int	i,margin,top,bottom;
// 	int	picwidth,picheight,picmid;
// 
// 	switch (toupper(*++text))
// 	{
// 	case 'B':
// 		picy=ParseNumber();
// 		picx=ParseNumber();
// 		picwidth=ParseNumber();
// 		picheight=ParseNumber();
// 		VWB_Bar(picx,picy,picwidth,picheight,BACKCOLOR);
// 		RipToEOL();
// 		break;
// 	case ';':		// comment
// 		RipToEOL();
// 		break;
// 	case 'P':		// ^P is start of next page, ^E is end of file
// 	case 'E':
// 		layoutdone = true;
// 		text--;    	// back up to the '^'
// 		break;
// 
// 	case 'C':		// ^c<hex digit> changes text color
// 		i = toupper(*++text);
// 		if (i>='0' && i<='9')
// 			fontcolor = i-'0';
// 		else if (i>='A' && i<='F')
// 			fontcolor = i-'A'+10;
// 
// 		fontcolor *= 16;
// 		i = toupper(*++text);
// 		if (i>='0' && i<='9')
// 			fontcolor += i-'0';
// 		else if (i>='A' && i<='F')
// 			fontcolor += i-'A'+10;
// 		text++;
// 		break;
// 
// 	case '>':
// 		px = 160;
// 		text++;
// 		break;
// 
// 	case 'L':
// 		py=ParseNumber();
// 		rowon = (py-TOPMARGIN)/FONTHEIGHT;
// 		py = TOPMARGIN+rowon*FONTHEIGHT;
// 		px=ParseNumber();
// 		while (*text++ != '\n')		// scan to end of line
// 		;
// 		break;
// 
// 	case 'T':		// ^Tyyy,xxx,ppp,ttt waits ttt tics, then draws pic
// 		TimedPicCommand ();
// 		break;
// 
// 	case 'G':		// ^Gyyy,xxx,ppp draws graphic
// 		ParsePicCommand ();
// 		VWB_DrawPic (picx&~7,picy,picnum);
// 		picwidth = pictable[picnum-STARTPICS].width;
// 		picheight = pictable[picnum-STARTPICS].height;
// 		//
// 		// adjust margins
// 		//
// 		picmid = picx + picwidth/2;
// 		if (picmid > SCREENMID)
// 			margin = picx-PICMARGIN;			// new right margin
// 		else
// 			margin = picx+picwidth+PICMARGIN;	// new left margin
// 
// 		top = (picy-TOPMARGIN)/FONTHEIGHT;
// 		if (top<0)
// 			top = 0;
// 		bottom = (picy+picheight-TOPMARGIN)/FONTHEIGHT;
// 		if (bottom>=TEXTROWS)
// 			bottom = TEXTROWS-1;
// 
// 		for (i=top;i<=bottom;i++)
// 			if (picmid > SCREENMID)
// 				rightmargin[i] = margin;
// 			else
// 				leftmargin[i] = margin;
// 
// 		//
// 		// adjust this line if needed
// 		//
// 		if (px < leftmargin[rowon])
// 			px = leftmargin[rowon];
// 		break;
// 	}
// }
// 
// 
// /*
// =====================
// =
// = NewLine
// =
// =====================
// */
// 
// void NewLine (void)
// {
// 	char	ch;
// 
// 	if (++rowon == TEXTROWS)
// 	{
// 	//
// 	// overflowed the page, so skip until next page break
// 	//
// 		layoutdone = true;
// 		do
// 		{
// 			if (*text == '^')
// 			{
// 				ch = toupper(*(text+1));
// 				if (ch == 'E' || ch == 'P')
// 				{
// 					layoutdone = true;
// 					return;
// 				}
// 			}
// 			text++;
// 
// 		} while (1);
// 
// 	}
// 	px = leftmargin[rowon];
// 	py+= FONTHEIGHT;
// }
// 
// 
// 
// /*
// =====================
// =
// = HandleCtrls
// =
// =====================
// */
// 
// void HandleCtrls (void)
// {
// 	char	ch;
// 
// 	ch = *text++;			// get the character and advance
// 
// 	if (ch == '\n')
// 	{
// 		NewLine ();
// 		return;
// 	}
// 
// }
// 
// 
// /*
// =====================
// =
// = HandleWord
// =
// =====================
// */
// 
// void HandleWord (void)
// {
// 	char		word[WORDLIMIT];
// 	int			i,wordindex;
// 	unsigned	wwidth,wheight,newpos;
// 
// 
// 	//
// 	// copy the next word into [word]
// 	//
// 	word[0] = *text++;
// 	wordindex = 1;
// 	while (*text>32)
// 	{
// 		word[wordindex] = *text++;
// 		if (++wordindex == WORDLIMIT)
// 			Quit ("PageLayout: Word limit exceeded");
// 	}
// 	word[wordindex] = 0;		// stick a null at end for C
// 
// 	//
// 	// see if it fits on this line
// 	//
// 	VW_MeasurePropString (word,&wwidth,&wheight);
// 
// 	while (px+wwidth > rightmargin[rowon])
// 	{
// 		NewLine ();
// 		if (layoutdone)
// 			return;		// overflowed page
// 	}
// 
// 	//
// 	// print it
// 	//
// 	newpos = px+wwidth;
// 	VWB_DrawPropString (word);
// 	px = newpos;
// 
// 	//
// 	// suck up any extra spaces
// 	//
// 	while (*text == ' ')
// 	{
// 		px += SPACEWIDTH;
// 		text++;
// 	}
// }
// 
// /*
// =====================
// =
// = PageLayout
// =
// = Clears the screen, draws the pics on the page, and word wraps the text.
// = Returns a pointer to the terminating command
// =
// =====================
// */
// 
// void PageLayout (boolean shownumber)
// {
// 	int		i,oldfontcolor;
// 	char	ch;
// 
// 	oldfontcolor = fontcolor;
// 
// 	fontcolor = 0;
// 
// //
// // clear the screen
// //
// 	VWB_Bar (0,0,320,200,BACKCOLOR);
// 	VWB_DrawPic (0,0,H_TOPWINDOWPIC);
// 	VWB_DrawPic (0,8,H_LEFTWINDOWPIC);
// 	VWB_DrawPic (312,8,H_RIGHTWINDOWPIC);
// 	VWB_DrawPic (8,176,H_BOTTOMINFOPIC);
// 
// 
// 	for (i=0;i<TEXTROWS;i++)
// 	{
// 		leftmargin[i] = LEFTMARGIN;
// 		rightmargin[i] = SCREENPIXWIDTH-RIGHTMARGIN;
// 	}
// 
// 	px = LEFTMARGIN;
// 	py = TOPMARGIN;
// 	rowon = 0;
// 	layoutdone = false;
// 
// //
// // make sure we are starting layout text (^P first command)
// //
// 	while (*text <= 32)
// 		text++;
// 
// 	if (*text != '^' || toupper(*++text) != 'P')
// 		Quit ("PageLayout: Text not headed with ^P");
// 
// 	while (*text++ != '\n')
// 	;
// 
// 
// //
// // process text stream
// //
// 	do
// 	{
// 		ch = *text;
// 
// 		if (ch == '^')
// 			HandleCommand ();
// 		else
// 		if (ch == 9)
// 		{
// 		 px = (px+8)&0xf8;
// 		 text++;
// 		}
// 		else if (ch <= 32)
// 			HandleCtrls ();
// 		else
// 			HandleWord ();
// 
// 	} while (!layoutdone);
// 
// 	pagenum++;
// 
// 	if (shownumber)
// 	{
// 		#ifdef SPANISH
// 		strcpy (str,"Hoja ");
// 		itoa (pagenum,str2,10);
// 		strcat (str,str2);
// 		strcat (str," de ");
// 		py = 183;
// 		px = 208;
// 		#else
// 		strcpy (str,"pg ");
// 		itoa (pagenum,str2,10);
// 		strcat (str,str2);
// 		strcat (str," of ");
// 		py = 183;
// 		px = 213;
// 		#endif
// 		itoa (numpages,str2,10);
// 		strcat (str,str2);
// 		fontcolor = 0x4f; 			   //12^BACKCOLOR;
// 
// 		VWB_DrawPropString (str);
// 	}
// 
// 	fontcolor = oldfontcolor;
// }
// 
// //===========================================================================
// 
// /*
// =====================
// =
// = BackPage
// =
// = Scans for a previous ^P
// =
// =====================
// */
// 
// void BackPage (void)
// {
// 	pagenum--;
// 	do
// 	{
// 		text--;
// 		if (*text == '^' && toupper(*(text+1)) == 'P')
// 			return;
// 	} while (1);
// }
// 
// 
// //===========================================================================
// 
// 
// /*
// =====================
// =
// = CacheLayoutGraphics
// =
// = Scans an entire layout file (until a ^E) marking all graphics used, and
// = counting pages, then caches the graphics in
// =
// =====================
// */
// void CacheLayoutGraphics (void)
// {
// 	char	far *bombpoint, far *textstart;
// 	char	ch;
// 
// 	textstart = text;
// 	bombpoint = text+30000;
// 	numpages = pagenum = 0;
// 
// 	do
// 	{
// 		if (*text == '^')
// 		{
// 			ch = toupper(*++text);
// 			if (ch == 'P')		// start of a page
// 				numpages++;
// 			if (ch == 'E')		// end of file, so load graphics and return
// 			{
// 				CA_MarkGrChunk(H_TOPWINDOWPIC);
// 				CA_MarkGrChunk(H_LEFTWINDOWPIC);
// 				CA_MarkGrChunk(H_RIGHTWINDOWPIC);
// 				CA_MarkGrChunk(H_BOTTOMINFOPIC);
// 				CA_CacheMarks ();
// 				text = textstart;
// 				return;
// 			}
// 			if (ch == 'G')		// draw graphic command, so mark graphics
// 			{
// 				ParsePicCommand ();
// 				CA_MarkGrChunk (picnum);
// 			}
// 			if (ch == 'T')		// timed draw graphic command, so mark graphics
// 			{
// 				ParseTimedCommand ();
// 				CA_MarkGrChunk (picnum);
// 			}
// 		}
// 		else
// 			text++;
// 
// 	} while (text<bombpoint);
// 
// 	Quit ("CacheLayoutGraphics: No ^E to terminate file!");
// }
// #endif
// 
// 
// /*
// =====================
// =
// = ShowArticle
// =
// =====================
// */
// 
// #ifdef JAPAN
// void ShowArticle (int which)
// #else
// void ShowArticle (char far *article)
// #endif
// {
// 	#ifdef JAPAN
// 	int		snames[10] = {	H_HELP1PIC,
// 							H_HELP2PIC,
// 							H_HELP3PIC,
// 							H_HELP4PIC,
// 							H_HELP5PIC,
// 							H_HELP6PIC,
// 							H_HELP7PIC,
// 							H_HELP8PIC,
// 							H_HELP9PIC,
// 							H_HELP10PIC};
// 	int		enames[14] = {
// 							0,0,
// 							#ifndef JAPDEMO
// 							C_ENDGAME1APIC,
// 							C_ENDGAME1BPIC,
// 							C_ENDGAME2APIC,
// 							C_ENDGAME2BPIC,
// 							C_ENDGAME3APIC,
// 							C_ENDGAME3BPIC,
// 							C_ENDGAME4APIC,
// 							C_ENDGAME4BPIC,
// 							C_ENDGAME5APIC,
// 							C_ENDGAME5BPIC,
// 							C_ENDGAME6APIC,
// 							C_ENDGAME6BPIC
// 							#endif
// 							};
// 	#endif
// 	unsigned	oldfontnumber;
// 	unsigned	temp;
// 	boolean 	newpage,firstpage;
// 
// 	#ifdef JAPAN
// 	pagenum = 1;
// 	if (!which)
// 		numpages = 10;
// 	else
// 		numpages = 2;
// 
// 	#else
// 
// 	text = article;
// 	oldfontnumber = fontnumber;
// 	fontnumber = 0;
// 	CA_MarkGrChunk(STARTFONT);
// 	VWB_Bar (0,0,320,200,BACKCOLOR);
// 	CacheLayoutGraphics ();
// 	#endif
// 
// 	newpage = true;
// 	firstpage = true;
// 
// 	do
// 	{
// 		if (newpage)
// 		{
// 			newpage = false;
// 			#ifdef JAPAN
// 			if (!which)
// 				CA_CacheScreen(snames[pagenum - 1]);
// 			else
// 				CA_CacheScreen(enames[which*2 + pagenum - 1]);
// 			#else
// 			PageLayout (true);
// 			#endif
// 			VW_UpdateScreen ();
// 			if (firstpage)
// 			{
// 				VL_FadeIn(0,255,&gamepal,10);
// 				// VW_FadeIn ()
// 				firstpage = false;
// 			}
// 		}
// 
// 		LastScan = 0;
// 		while (!LastScan)
// 		;
// 
// 		switch (LastScan)
// 		{
// 		case sc_UpArrow:
// 		case sc_PgUp:
// 		case sc_LeftArrow:
// 			if (pagenum>1)
// 			{
// 				#ifndef JAPAN
// 				BackPage ();
// 				BackPage ();
// 				#else
// 				pagenum--;
// 				#endif
// 				newpage = true;
// 			}
// 			break;
// 
// 		case sc_Enter:
// 		case sc_DownArrow:
// 		case sc_PgDn:
// 		case sc_RightArrow:		// the text allready points at next page
// 			if (pagenum<numpages)
// 			{
// 				newpage = true;
// 				#ifdef JAPAN
// 				pagenum++;
// 				#endif
// 			}
// 			break;
// 		}
// 
// 		#ifndef SPEAR
// 		if (Keyboard[sc_Tab] && Keyboard[sc_P] && MS_CheckParm("goobers"))
// 			PicturePause();
// 		#endif
// 
// 	} while (LastScan != sc_Escape);
// 
// 	IN_ClearKeysDown ();
// 	fontnumber = oldfontnumber;
// }
// 
// 
// //===========================================================================
// 
// #ifndef JAPAN
// #ifdef ARTSEXTERN
// int 	endextern = T_ENDART1;
// #ifndef SPEAR
// int		helpextern = T_HELPART;
// #endif
// #endif
// char helpfilename[13] = "HELPART.",
// 	 endfilename[13] = "ENDART1.";
// #endif
// 
// /*
// =================
// =
// = HelpScreens
// =
// =================
// */
// #ifndef SPEAR
// void HelpScreens (void)
// {
// 	int			artnum;
// 	char far 	*text;
// 	memptr		layout;
// 
// 
// 	CA_UpLevel ();
// 	MM_SortMem ();
// #ifdef JAPAN
// 	ShowArticle (0);
// 	VW_FadeOut();
// 	FreeMusic ();
// 	CA_DownLevel ();
// 	MM_SortMem ();
// #else
// 
// 
// 
// 
// #ifdef ARTSEXTERN
// 	artnum = helpextern;
// 	CA_CacheGrChunk (artnum);
// 	text = (char _seg *)grsegs[artnum];
// 	MM_SetLock (&grsegs[artnum], true);
// #else
// 	CA_LoadFile (helpfilename,&layout);
// 	text = (char _seg *)layout;
// 	MM_SetLock (&layout, true);
// #endif
// 
// 	ShowArticle (text);
// 
// #ifdef ARTSEXTERN
// 	MM_FreePtr (&grsegs[artnum]);
// #else
// 	MM_FreePtr (&layout);
// #endif
// 
// 
// 
// 	VW_FadeOut();
// 
// 	FreeMusic ();
// 	CA_DownLevel ();
// 	MM_SortMem ();
// #endif
// }
// #endif
// 
// //
// // END ARTICLES
// //
// void EndText (void)
// {
// 	int			artnum;
// 	char far 	*text;
// 	memptr		layout;
// 
// 
// 	ClearMemory ();
// 
// 	CA_UpLevel ();
// 	MM_SortMem ();
// #ifdef JAPAN
// 	ShowArticle(gamestate.episode + 1);
// 
// 	VW_FadeOut();
// 
// 	SETFONTCOLOR(0,15);
// 	IN_ClearKeysDown();
// 	if (MousePresent)
// 		Mouse(MDelta);	// Clear accumulated mouse movement
// 
// 	FreeMusic ();
// 	CA_DownLevel ();
// 	MM_SortMem ();
// #else
// 
// 
// 
// #ifdef ARTSEXTERN
// 	artnum = endextern+gamestate.episode;
// 	CA_CacheGrChunk (artnum);
// 	text = (char _seg *)grsegs[artnum];
// 	MM_SetLock (&grsegs[artnum], true);
// #else
// 	endfilename[6] = '1'+gamestate.episode;
// 	CA_LoadFile (endfilename,&layout);
// 	text = (char _seg *)layout;
// 	MM_SetLock (&layout, true);
// #endif
// 
// 	ShowArticle (text);
// 
// #ifdef ARTSEXTERN
// 	MM_FreePtr (&grsegs[artnum]);
// #else
// 	MM_FreePtr (&layout);
// #endif
// 
// 
// 	VW_FadeOut();
// 	SETFONTCOLOR(0,15);
// 	IN_ClearKeysDown();
// 	if (MousePresent)
// 		Mouse(MDelta);	// Clear accumulated mouse movement
// 
// 	FreeMusic ();
// 	CA_DownLevel ();
// 	MM_SortMem ();
// #endif
// }
// 
