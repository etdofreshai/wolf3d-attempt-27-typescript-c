type JsDosFileEntry = {
  path: string;
  contents: Uint8Array;
};

type JsDosConfigEntry = {
  dosboxConf: string;
  jsdosConf: {
    version: string;
  };
};

type JsDosPlayer = {
  stop?: () => void;
};

type JsDosCommandInterface = {
  events: () => {
    onExit: (consumer: () => void) => void;
    onMessage: (consumer: (type: string, ...args: unknown[]) => void) => void;
    onStdout: (consumer: (message: string) => void) => void;
  };
  exit: () => Promise<void>;
  fsReadFile: (file: string) => Promise<Uint8Array>;
};

type JsDosEmulators = {
  pathPrefix: string;
  pathSuffix: string;
  dosboxWorker: (
    init: Array<JsDosFileEntry | JsDosConfigEntry>,
    options?: {
      onExtractProgress?: (bundleIndex: number, file: string, extracted: number, total: number) => void;
    }
  ) => Promise<JsDosCommandInterface>;
};

type JsDosOptions = {
  autoStart?: boolean;
  backend?: "dosbox" | "dosboxX";
  dosboxConf?: string;
  imageRendering?: "pixelated";
  initFs?: JsDosFileEntry[];
  jsdosConf?: {
    version: string;
  };
  kiosk?: boolean;
  noCloud?: boolean;
  noCursor?: boolean;
  noNetworking?: boolean;
  pathPrefix?: string;
  renderAspect?: "original" | "16/9" | "4/3";
  workerThread?: boolean;
};

type JsDosFactory = (root: HTMLElement, options: JsDosOptions) => JsDosPlayer;

interface Window {
  Dos?: JsDosFactory;
  emulators?: JsDosEmulators;
}

declare module "js-dos/dist/js-dos.css";
declare module "js-dos/dist/js-dos.js";
declare module "js-dos/dist/emulators/emulators.js";
