export type VersionStatus = "playable" | "experimental" | "planned";

export interface GameVersion {
  /** Stable id. Matches the app's folder name under apps/. */
  id: string;
  /** Display name shown on the card. */
  name: string;
  /** One-line summary. */
  tagline: string;
  /** Longer description shown in the card body. */
  description: string;
  /** Vite dev-server port, or null for versions that aren't runnable yet. */
  devPort: number | null;
  status: VersionStatus;
  /** Short labels rendered as chips. */
  tags: string[];
}

/**
 * The catalog of game versions the launcher can start.
 *
 * To add a new version: scaffold an app under `apps/<id>/`, give it a fixed
 * `server.port` in its vite config, wire that port into the root `dev` script,
 * then append an entry here. The homepage and README pick it up automatically.
 */
export const VERSIONS: GameVersion[] = [
  {
    id: "dos-page",
    name: "Retail DOS",
    tagline: "The shipped Wolfenstein 3D (WL6), unmodified.",
    description:
      "Boots the original retail WOLF3D.EXE and its WL6 data files inside an in-browser DOSBox via js-dos. This is the reference build — exactly how the game shipped in 1992.",
    devPort: 5171,
    status: "playable",
    tags: ["js-dos", "retail", "WL6"]
  },
  {
    id: "source-dos",
    name: "Source DOS Build",
    tagline: "id Software's source, compiled with Borland C++ 3.1.",
    description:
      "Runs WOLF3D.EXE built from the released id Software source tree (source/WOLFSRC). With a local Borland C++ toolchain mounted from deps/borland it can also recompile the EXE in the browser before launching.",
    devPort: 5172,
    status: "playable",
    tags: ["source", "Borland", "rebuildable"]
  },
  {
    id: "source-modified-dos",
    name: "Modified Source DOS",
    tagline: "Our patched source tree, plus a capture & demo harness.",
    description:
      "The same source-build pipeline as Source DOS, but tracking our in-progress modifications. Adds frame / audio (WAV) / state capture and a URL-driven demo automation harness for regression screenshots.",
    devPort: 5173,
    status: "experimental",
    tags: ["source", "capture", "harness"]
  }
];
