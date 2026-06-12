// WL_PLAY.C
//
// PARTIAL PORT: only the refresh-manager globals that ID_VH/WL_MAIN touch
// so far (update buffer pointer + width tables). PlayLoop and the tic
// machinery land with the game-loop milestone.

import { UPDATEHIGH, UPDATEWIDE } from "./ID_HEADS.H";

/*
=============================================================================

						 GLOBAL VARIABLES

=============================================================================
*/

export const wp = {
  // byte *updateptr;   (offset into ID_VH's update[][] buffer)
  updateptr: 0,
};

// unsigned uwidthtable[UPDATEHIGH];   (built in WL_MAIN InitGame)
export const uwidthtable = new Uint16Array(UPDATEHIGH);

// unsigned blockstarts[UPDATEWIDE*UPDATEHIGH];
export const blockstarts = new Uint16Array(UPDATEWIDE * UPDATEHIGH);
