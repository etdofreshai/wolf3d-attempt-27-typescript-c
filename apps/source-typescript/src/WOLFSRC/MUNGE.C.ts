// @generated-from-wolfsrc
// Original file: source/WOLFSRC/MUNGE.C
// This module preserves the source text below as line comments for audit.
// Hand ports can replace generated stubs function-by-function while keeping
// the original text nearby for side-by-side review.

export const WOLFSRC_FILE = "MUNGE.C";
export const WOLFSRC_FUNCTIONS = [
  "VL_MungePic"
] as const;

export function VL_MungePic(source: Uint8Array, width: number, height: number): Uint8Array {
  if (width & 3) {
    throw new Error("VL_MungePic: Not divisable by 4!");
  }

  const size = Math.max(0, Math.trunc(width)) * Math.max(0, Math.trunc(height));
  if (source.length < size) {
    throw new Error(`VL_MungePic requires ${size} source bytes, got ${source.length}`);
  }

  const temp = source.slice(0, size);
  let dest = 0;
  const pwidth = width >> 2;
  for (let plane = 0; plane < 4; plane++) {
    let srcline = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < pwidth; x++) {
        source[dest++] = temp[srcline + x * 4 + plane];
      }
      srcline += width;
    }
  }
  return source;
}
// ---------------------------------------------------------------------------
// Original source follows.
// ---------------------------------------------------------------------------
// 
// /*
// =================
// =
// = VL_MungePic
// =
// =================
// */
// 
// void VL_MungePic (unsigned char far *source, unsigned width, unsigned height)
// {
// 	unsigned	x,y,plane,size,pwidth;
// 	unsigned char	far *temp, far *dest, far *srcline;
// 
// 	size = width*height;
// 
// 	if (width&3)
// 		errout ("VL_MungePic: Not divisable by 4!\n");
// 
// //
// // copy the pic to a temp buffer
// //
// 	temp = (unsigned char far *)farmalloc (size);
// 	if (!temp)
// 		errout ("Non enough memory for munge buffer!\n");
// 
// 	_fmemcpy (temp,source,size);
// 
// //
// // munge it back into the original buffer
// //
// 	dest = source;
// 	pwidth = width/4;
// 
// 	for (plane=0;plane<4;plane++)
// 	{
// 		srcline = temp;
// 		for (y=0;y<height;y++)
// 		{
// 			for (x=0;x<pwidth;x++)
// 				*dest++ = *(srcline+x*4+plane);
// 			srcline+=width;
// 		}
// 	}
// 
// 	free (temp);
// }
// 
// 
