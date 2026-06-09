declare module "js-dos/dist/js-dos.js";
declare module "js-dos/dist/js-dos.css";

type JsDosFileEntry = {
  path: string;
  contents: Uint8Array;
};

type JsDosPlayer = {
  stop: () => Promise<void>;
  save: () => Promise<Uint8Array | null>;
};

type JsDosOptions = {
  autoStart?: boolean;
  backend?: "dosbox" | "dosboxX";
  dosboxConf: string;
  imageRendering?: "pixelated" | "smooth";
  initFs: JsDosFileEntry[];
  jsdosConf: {
    version: string;
  };
  kiosk?: boolean;
  noCloud?: boolean;
  noCursor?: boolean;
  noNetworking?: boolean;
  pathPrefix?: string;
  renderAspect?: "original" | "stretch" | "fit";
  workerThread?: boolean;
};

interface Window {
  Dos?: (root: HTMLElement, options: JsDosOptions) => JsDosPlayer;
}
