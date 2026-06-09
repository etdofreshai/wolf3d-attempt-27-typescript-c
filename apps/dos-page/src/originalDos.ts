import "js-dos/dist/js-dos.css";
import "js-dos/dist/js-dos.js";

const DOS_FILES = [
  "WOLF3D.EXE",
  "AUDIOHED.WL6",
  "AUDIOT.WL6",
  "CONFIG.WL6",
  "GAMEMAPS.WL6",
  "MAPHEAD.WL6",
  "VGADICT.WL6",
  "VGAGRAPH.WL6",
  "VGAHEAD.WL6",
  "VSWAP.WL6"
] as const;

const DOSBOX_CONF = `
[sdl]
autolock=false

[dosbox]
machine=svga_s3
memsize=16

[render]
frameskip=0
aspect=false
scaler=normal2x

[cpu]
core=auto
cputype=auto
cycles=fixed 15000
cycleup=1000
cycledown=1000

[mixer]
nosound=false
rate=44100
blocksize=1024
prebuffer=25

[sblaster]
sbtype=sb16
sbbase=220
irq=7
dma=1
hdma=5
sbmixer=true
oplmode=auto
oplemu=default
oplrate=44100

[speaker]
pcspeaker=true
pcrate=44100
tandy=auto
tandyrate=44100
disney=true

[dos]
xms=true
ems=true
umb=true
keyboardlayout=auto

[autoexec]
mount c .
c:
cd WOLF3D
WOLF3D.EXE
`;

type RunnerState = {
  player: JsDosPlayer | null;
  starting: boolean;
};

export function createOriginalDosRunner(root: HTMLElement): void {
  root.innerHTML = `
    <div class="original-dos">
      <div class="original-toolbar">
        <div>
          <span>Original DOS</span>
          <small id="dos-status">Checking repo data</small>
        </div>
        <button id="start-dos" type="button" disabled>Start</button>
      </div>
      <div id="dos-mount" class="dos-mount" aria-label="Original Wolfenstein 3D DOS runner"></div>
    </div>
  `;

  const button = requireElement<HTMLButtonElement>(root, "#start-dos");
  const status = requireElement<HTMLElement>(root, "#dos-status");
  const mount = requireElement<HTMLElement>(root, "#dos-mount");
  const state: RunnerState = {
    player: null,
    starting: false
  };

  void refreshAvailability();

  button.addEventListener("click", async () => {
    if (state.starting || state.player) {
      return;
    }

    state.starting = true;
    button.disabled = true;
    status.textContent = "Loading DOS program";

    try {
      const entries = await Promise.all(
        DOS_FILES.map(async (fileName) => ({
          path: `WOLF3D/${fileName}`,
          contents: await fetchBytes(`/__local-dos/${fileName}`)
        }))
      );

      const dos = window.Dos;
      if (!dos) {
        throw new Error("js-dos runtime did not initialize.");
      }

      state.player = dos(mount, {
        autoStart: true,
        backend: "dosbox",
        dosboxConf: DOSBOX_CONF,
        imageRendering: "pixelated",
        initFs: entries,
        jsdosConf: {
          version: "8"
        },
        kiosk: true,
        noCloud: true,
        noCursor: false,
        noNetworking: true,
        pathPrefix: "/emulators/",
        renderAspect: "original",
        workerThread: true
      });

      status.textContent = "Running";
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Unable to start DOS";
      state.starting = false;
      button.disabled = false;
    }
  });

  async function refreshAvailability(): Promise<void> {
    try {
      const response = await fetch("/__local-dos/status", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Local DOS endpoint unavailable.");
      }

      const statusPayload = (await response.json()) as {
        files?: Array<{ fileName: string; present: boolean }>;
      };
      const missing = statusPayload.files?.filter((file) => !file.present).map((file) => file.fileName) ?? [];

      if (missing.length > 0) {
        status.textContent = `Missing ${missing.join(", ")}`;
        button.disabled = true;
        return;
      }

      status.textContent = "Ready";
      button.disabled = false;
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Unable to check repo data";
      button.disabled = true;
    }
  }
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to fetch ${url}.`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

function requireElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing element ${selector}.`);
  }

  return element;
}
