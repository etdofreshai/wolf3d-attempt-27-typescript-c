// WL_MAIN.C
//
// PARTIAL PORT: only Quit() so far — it is declared in ID_HEADS.H as
// "defined in user program" and every module error-exits through it.
// The full original Quit shuts down all managers, restores the video mode
// and prints the error (or the GOODTIMES/ordering screen) before exit();
// that body lands with the game-loop milestone.

/** Error thrown by Quit — the port's stand-in for exit(1) with a message. */
export class DosQuit extends Error {
  constructor(error: string) {
    super(error);
    this.name = "DosQuit";
  }
}

/*
==========================
=
= Quit
=
==========================
*/

export function Quit(error: string | null): never {
  throw new DosQuit(error ?? "");
}
