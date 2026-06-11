import "js-dos/dist/js-dos.css";
import "./keyboardLockGuard";
import "js-dos/dist/js-dos.js";
import "./styles.css";

const DOS_ASSET_FILES = [
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

const BUILD_SOURCE_ROOT = "SOURCE/WOLF";

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
set PATH=C:\\BC\\BIN;C:\\BC;%PATH%
set INCLUDE=C:\\BC\\INCLUDE
set LIB=C:\\BC\\LIB
cd SRCGAME
WOLF3D.EXE
`;

const BUILD_DOSBOX_CONF = `
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
cycles=max
cycleup=1000
cycledown=1000

[dos]
xms=true
ems=true
umb=true
keyboardlayout=auto

[autoexec]
mount c .
mount g .
c:
set PATH=C:\\BC30\\BIN;C:\\BC\\BIN;%PATH%
set INCLUDE=C:\\BC30\\INCLUDE;C:\\BC\\INCLUDE
set LIB=C:\\BC30\\LIB;C:\\BC\\LIB
cd \\SOURCE\\WOLF
BUILD.BAT
`;

const BORLAND_BUILD_CFG = `
-mm
-3
-a
-ff-
-v
-G
-O
-Og
-Oe
-Om
-Ov
-Ol
-Ob
-Op
-Oi
-Z
-d
-vi-
-H=WOLF3D.SYM
-Fc
-weas
-wpre
-nOBJ
-IG:\\BC30\\INCLUDE
-LG:\\BC30\\LIB
-P-.C
`;

const BORLAND_MAKEFILE = `
.AUTODEPEND

.PATH.obj = OBJ

CC = bcc +BUILD.CFG
TASM = TASM
TLIB = tlib
TLINK = tlink
LIBPATH = G:\\BC30\\LIB
INCLUDEPATH = G:\\BC30\\INCLUDE

.c.obj:
  $(CC) -c {$< }

.cpp.obj:
  $(CC) -c {$< }

EXE_dependencies =  \\
 obj\\c0.obj \\
 h_ldiv.obj \\
 wolfhack.obj \\
 whack_a.obj \\
 wl_asm.obj \\
 wl_main.obj \\
 wl_text.obj \\
 wl_menu.obj \\
 wl_inter.obj \\
 wl_game.obj \\
 wl_play.obj \\
 wl_debug.obj \\
 wl_draw.obj \\
 wl_dr_a.obj \\
 wl_scale.obj \\
 wl_state.obj \\
 wl_agent.obj \\
 wl_act1.obj \\
 wl_act2.obj \\
 c:\\source\\wolf\\obj\\signon.obj \\
 c:\\source\\wolf\\obj\\gamepal.obj \\
 id_ca.obj \\
 id_in.obj \\
 id_mm.obj \\
 id_pm.obj \\
 id_sd.obj \\
 id_sd_a.obj \\
 id_us_1.obj \\
 id_us_a.obj \\
 id_vl.obj \\
 id_vh.obj \\
 id_vl_a.obj \\
 id_vh_a.obj

obj\\wolf3d.exe: build.cfg $(EXE_dependencies)
  $(TLINK) /v/s/c/P-/L$(LIBPATH) @&&|
obj\\c0.obj+
obj\\h_ldiv.obj+
obj\\wolfhack.obj+
obj\\whack_a.obj+
obj\\wl_asm.obj+
obj\\wl_main.obj+
obj\\wl_text.obj+
obj\\wl_menu.obj+
obj\\wl_inter.obj+
obj\\wl_game.obj+
obj\\wl_play.obj+
obj\\wl_debug.obj+
obj\\wl_draw.obj+
obj\\wl_dr_a.obj+
obj\\wl_scale.obj+
obj\\wl_state.obj+
obj\\wl_agent.obj+
obj\\wl_act1.obj+
obj\\wl_act2.obj+
c:\\source\\wolf\\obj\\signon.obj+
c:\\source\\wolf\\obj\\gamepal.obj+
obj\\id_ca.obj+
obj\\id_in.obj+
obj\\id_mm.obj+
obj\\id_pm.obj+
obj\\id_sd.obj+
obj\\id_sd_a.obj+
obj\\id_us_1.obj+
obj\\id_us_a.obj+
obj\\id_vl.obj+
obj\\id_vh.obj+
obj\\id_vl_a.obj+
obj\\id_vh_a.obj
obj\\wolf3d,obj\\wolf3d
emu.lib+
mathm.lib+
cm.lib
|

obj\\c0.obj: build.cfg c0.asm
	$(TASM) /MX /ZI /O /D__MEDIUM__ C0.ASM,OBJ\\C0.OBJ

h_ldiv.obj: build.cfg h_ldiv.asm
	$(TASM) /MX /ZI /O H_LDIV.ASM,OBJ\\H_LDIV.OBJ /d__MEDIUM__

wolfhack.obj: build.cfg wolfhack.c

whack_a.obj: build.cfg whack_a.asm
	$(TASM) /MX /ZI /O WHACK_A.ASM,OBJ\\WHACK_A.OBJ

wl_asm.obj: build.cfg wl_asm.asm
	$(TASM) /MX /ZI /O WL_ASM.ASM,OBJ\\WL_ASM.OBJ

wl_main.obj: build.cfg wl_main.c
wl_text.obj: build.cfg wl_text.c
wl_menu.obj: build.cfg wl_menu.c
wl_inter.obj: build.cfg wl_inter.c
wl_game.obj: build.cfg wl_game.c
wl_play.obj: build.cfg wl_play.c
wl_debug.obj: build.cfg wl_debug.c
wl_draw.obj: build.cfg wl_draw.c

wl_dr_a.obj: build.cfg wl_dr_a.asm
	$(TASM) /MX /ZI /O WL_DR_A.ASM,OBJ\\WL_DR_A.OBJ

wl_scale.obj: build.cfg wl_scale.c
wl_state.obj: build.cfg wl_state.c
wl_agent.obj: build.cfg wl_agent.c
wl_act1.obj: build.cfg wl_act1.c
wl_act2.obj: build.cfg wl_act2.c
id_ca.obj: build.cfg id_ca.c
id_in.obj: build.cfg id_in.c
id_mm.obj: build.cfg id_mm.c
id_pm.obj: build.cfg id_pm.c
id_sd.obj: build.cfg id_sd.c

id_sd_a.obj: build.cfg id_sd_a.asm
	$(TASM) /MX /ZI /O ID_SD_A.ASM,OBJ\\ID_SD_A.OBJ

id_us_1.obj: build.cfg id_us_1.c

id_us_a.obj: build.cfg id_us_a.asm
	$(TASM) /MX /ZI /O ID_US_A.ASM,OBJ\\ID_US_A.OBJ

id_vl.obj: build.cfg id_vl.c
id_vh.obj: build.cfg id_vh.c

id_vl_a.obj: build.cfg id_vl_a.asm
	$(TASM) /MX /ZI /O ID_VL_A.ASM,OBJ\\ID_VL_A.OBJ

id_vh_a.obj: build.cfg id_vh_a.asm
	$(TASM) /MX /ZI /O ID_VH_A.ASM,OBJ\\ID_VH_A.OBJ
`;

const BUILD_BAT = `
@echo off
echo === Wolf3D Borland source build ===
echo Toolchain:
BCC
TASM
TLINK
echo.
echo Cleaning generated files...
if exist WOLF3D.EXE del WOLF3D.EXE
if exist WOLF3D.MAP del WOLF3D.MAP
if exist WOLF3D.SYM del WOLF3D.SYM
if exist OBJ\\WOLF3D.EXE del OBJ\\WOLF3D.EXE
if exist OBJ\\WOLF3D.MAP del OBJ\\WOLF3D.MAP
if exist BUILD.OK del BUILD.OK
if exist BUILD.FA del BUILD.FA
echo.
if not exist WOLF3D.MAK goto fail
if not exist BUILD.CFG goto fail
echo Using browser-mounted Borland makefile.
echo.
echo Running MAKE...
MAKE -B -fWOLF3D.MAK
if errorlevel 1 goto fail
if exist OBJ\\WOLF3D.EXE copy OBJ\\WOLF3D.EXE WOLF3D.EXE > nul
if not exist WOLF3D.EXE goto fail
echo BUILD_OK > BUILD.OK
echo.
dir WOLF3D.EXE
echo === Build complete ===
goto done
:fail
echo BUILD_FAILED > BUILD.FA
echo.
echo === Build failed ===
if exist BUILD.CFG type BUILD.CFG
if exist WOLF3D.MAK type WOLF3D.MAK
:done
`;

type FileStatus = {
  fileName: string;
  present: boolean;
};

type SourceEntry = {
  path: string;
  size: number;
  kind: "source" | "build" | "binary" | "doc";
};

type ToolchainEntry = {
  path: string;
  size: number;
};

type SourceDosStatus = {
  assets: FileStatus[];
  sourceExe: FileStatus;
  sourceFiles: SourceEntry[];
  sourceCounts: {
    asm: number;
    c: number;
    h: number;
    mounted: number;
  };
  toolchain: {
    canBuild: boolean;
    checkedRoots: string[];
    files: ToolchainEntry[];
    foundRoot: string | null;
    missing: string[];
  };
};

type DemoPlan = {
  name: string;
  autoStart?: boolean;
  steps: DemoPlanStep[];
};

type DemoPlanStep =
  | {
      action: "wait";
      ms: number;
    }
  | {
      action: "key";
      holdMs?: number;
      key: string | number;
    }
  | {
      action: "keydown" | "keyup";
      key: string | number;
    }
  | {
      action: "capture";
      label?: string;
      png?: boolean;
      state?: boolean;
      wav?: boolean;
    };

type ArtifactKind = "audio" | "frame" | "state";

type ArtifactRecord = {
  bytes: number;
  fileName: string;
  kind: ArtifactKind;
  label: string;
  mimeType: string;
  sequence: number;
  tickSource: "dos-frame" | "unknown";
  ticcount: number;
};

type RunnerState = {
  artifactRecords: ArtifactRecord[];
  artifactSequence: number;
  artifactUrls: string[];
  audioChunks: Float32Array[];
  audioSampleCount: number;
  builtExe: Uint8Array | null;
  buildDownloadUrl: string | null;
  building: boolean;
  commandInterface: JsDosCommandInterface | null;
  demoAutoStarted: boolean;
  demoPlan: DemoPlan | null;
  demoRunning: boolean;
  frameCount: number;
  frameHeight: number;
  frameWidth: number;
  lastFrameRgba: Uint8ClampedArray | null;
  lastStatsUpdate: number;
  starting: boolean;
  status: SourceDosStatus | null;
};

const root = document.querySelector<HTMLElement>("#app");

if (!root) {
  throw new Error("Missing #app root.");
}

const appRoot = root;

appRoot.innerHTML = `
  <div class="source-shell">
    <header class="source-toolbar">
      <div class="identity">
        <span>Modified Source DOS</span>
        <small id="status-line">Checking source tree</small>
      </div>
      <div class="actions">
        <button id="refresh-status" type="button">Refresh</button>
        <button id="build-source" type="button" disabled>Build</button>
        <button id="start-source" type="button" disabled>Start</button>
        <button id="stop-source" type="button" disabled>Stop</button>
      </div>
    </header>
    <main class="source-workbench">
      <section class="dos-stage" aria-label="Modified Source DOS runner">
        <div id="dos-mount" class="dos-mount">
          <canvas id="dos-canvas" class="dos-canvas" width="320" height="200"></canvas>
        </div>
      </section>
      <aside class="source-panel">
        <dl class="status-grid">
          <div>
            <dt>Source</dt>
            <dd id="source-count">--</dd>
          </div>
          <div>
            <dt>Assets</dt>
            <dd id="asset-count">--</dd>
          </div>
          <div>
            <dt>Compiler</dt>
            <dd id="compiler-status">--</dd>
          </div>
          <div>
            <dt>Build Tools</dt>
            <dd id="toolchain-files">--</dd>
          </div>
          <div>
            <dt>Run Image</dt>
            <dd id="run-image">--</dd>
          </div>
          <div>
            <dt>Capture</dt>
            <dd id="capture-status">--</dd>
          </div>
          <div>
            <dt>Demo</dt>
            <dd id="demo-status">--</dd>
          </div>
          <div>
            <dt>Artifacts</dt>
            <dd id="artifact-status">0</dd>
          </div>
        </dl>
        <div class="build-note" id="build-note"></div>
        <div class="file-list" id="missing-list" aria-live="polite"></div>
        <div class="artifact-actions">
          <button id="export-png" type="button" disabled>PNG</button>
          <button id="export-wav" type="button" disabled>WAV</button>
          <button id="export-state" type="button" disabled>BIN</button>
        </div>
        <a class="download-built disabled" id="download-built" aria-disabled="true">Built EXE</a>
        <div class="artifact-list" id="artifact-list" aria-live="polite"></div>
        <pre class="build-log" id="build-log" aria-live="polite"></pre>
      </aside>
    </main>
  </div>
`;

const buttonStart = requireElement<HTMLButtonElement>("#start-source");
const buttonStop = requireElement<HTMLButtonElement>("#stop-source");
const buttonBuild = requireElement<HTMLButtonElement>("#build-source");
const buttonRefresh = requireElement<HTMLButtonElement>("#refresh-status");
const buttonExportPng = requireElement<HTMLButtonElement>("#export-png");
const buttonExportWav = requireElement<HTMLButtonElement>("#export-wav");
const buttonExportState = requireElement<HTMLButtonElement>("#export-state");
const statusLine = requireElement<HTMLElement>("#status-line");
const sourceCount = requireElement<HTMLElement>("#source-count");
const assetCount = requireElement<HTMLElement>("#asset-count");
const compilerStatus = requireElement<HTMLElement>("#compiler-status");
const toolchainFiles = requireElement<HTMLElement>("#toolchain-files");
const runImage = requireElement<HTMLElement>("#run-image");
const captureStatus = requireElement<HTMLElement>("#capture-status");
const demoStatus = requireElement<HTMLElement>("#demo-status");
const artifactStatus = requireElement<HTMLElement>("#artifact-status");
const buildNote = requireElement<HTMLElement>("#build-note");
const missingList = requireElement<HTMLElement>("#missing-list");
const downloadBuilt = requireElement<HTMLAnchorElement>("#download-built");
const artifactList = requireElement<HTMLElement>("#artifact-list");
const buildLog = requireElement<HTMLPreElement>("#build-log");
const dosCanvas = requireElement<HTMLCanvasElement>("#dos-canvas");
const dosContext = dosCanvas.getContext("2d");

const state: RunnerState = {
  artifactRecords: [],
  artifactSequence: 0,
  artifactUrls: [],
  audioChunks: [],
  audioSampleCount: 0,
  builtExe: null,
  buildDownloadUrl: null,
  building: false,
  commandInterface: null,
  demoAutoStarted: false,
  demoPlan: readDemoPlan(),
  demoRunning: false,
  frameCount: 0,
  frameHeight: dosCanvas.height,
  frameWidth: dosCanvas.width,
  lastFrameRgba: null,
  lastStatsUpdate: 0,
  starting: false,
  status: null
};

const KEY_CODES: Record<string, number> = {
  ALT: 18,
  ARROWDOWN: 40,
  ARROWLEFT: 37,
  ARROWRIGHT: 39,
  ARROWUP: 38,
  BACKSPACE: 8,
  CONTROL: 17,
  CTRL: 17,
  ENTER: 13,
  ESC: 27,
  ESCAPE: 27,
  KEYA: 65,
  KEYD: 68,
  KEYN: 78,
  KEYS: 83,
  KEYW: 87,
  KEYY: 89,
  SHIFT: 16,
  SPACE: 32,
  TAB: 9
};

const DEMO_DEFAULT_HOLD_MS = 90;
const MAX_CAPTURED_AUDIO_SECONDS = 300;

(window as Window & {
  wolf3dModifiedHarness?: {
    exportPng: () => Promise<void>;
    exportState: () => Promise<void>;
    exportWav: () => Promise<void>;
    start: () => Promise<void>;
    stop: () => Promise<void>;
  };
}).wolf3dModifiedHarness = {
  exportPng: () => exportPng("harness", false),
  exportState: () => exportStateBin("harness", false),
  exportWav: () => exportWav("harness", false),
  start: startSourceDos,
  stop: stopSourceDos
};

buttonRefresh.addEventListener("click", () => {
  void refreshStatus();
});

buttonBuild.addEventListener("click", () => {
  void startSourceBuild();
});

buttonStart.addEventListener("click", () => {
  void startSourceDos();
});

buttonStop.addEventListener("click", () => {
  void stopSourceDos();
});

buttonExportPng.addEventListener("click", () => {
  void exportPng("manual");
});

buttonExportWav.addEventListener("click", () => {
  void exportWav("manual");
});

buttonExportState.addEventListener("click", () => {
  void exportStateBin("manual");
});

void refreshStatus();

async function refreshStatus(): Promise<void> {
  statusLine.textContent = "Checking source tree";
  buttonStart.disabled = true;
  buttonBuild.disabled = true;

  try {
    const status = await fetchJson<SourceDosStatus>("/__source-modified-dos/status");
    state.status = status;
    renderStatus(status);
  } catch (error) {
    statusLine.textContent = error instanceof Error ? error.message : "Status check failed";
  }
}

function renderStatus(status: SourceDosStatus): void {
  const missingAssets = status.assets.filter((file) => !file.present);
  const missingSourceExe = !status.sourceExe.present;

  sourceCount.textContent = `${status.sourceCounts.c} C / ${status.sourceCounts.asm} ASM / ${status.sourceCounts.h} H`;
  assetCount.textContent = `${status.assets.length - missingAssets.length}/${status.assets.length} WL6`;
  compilerStatus.textContent = status.toolchain.canBuild
    ? shortPath(status.toolchain.foundRoot ?? "ready")
    : status.toolchain.files.length > 0
      ? "Partial toolchain"
      : "Missing toolchain";
  toolchainFiles.textContent = status.toolchain.files.length > 0
    ? `${status.toolchain.files.length} files mounted as C:\\BC`
    : "0 files";
  runImage.textContent = state.builtExe
    ? `Built WOLF3D.EXE (${formatBytes(state.builtExe.length)})`
    : status.sourceExe.present
      ? "source/WOLFSRC/WOLF3D.EXE"
      : "Missing";
  captureStatus.textContent = `${state.frameCount} frames / ${formatDuration(audioDurationSeconds())} audio`;
  renderArtifactStatus();
  demoStatus.textContent = state.demoPlan
    ? state.demoRunning
      ? `Running ${state.demoPlan.name}`
      : `${state.demoPlan.name} (${state.demoPlan.steps.length} steps)`
    : "No plan";
  buildNote.textContent = status.toolchain.canBuild
    ? `Build tools found at ${status.toolchain.foundRoot}.`
    : status.toolchain.files.length > 0
      ? `Partial DOS tools found at ${status.toolchain.foundRoot}. Rebuild still needs ${status.toolchain.missing.join(", ")}.`
      : `Start runs the source tree's bundled DOS EXE. Rebuild needs BORLANDC_ROOT, BC_ROOT, or deps/borland pointing at a local Borland C++ 3.0/3.1 install.`;

  const missing = [
    ...(missingSourceExe ? [`Missing ${status.sourceExe.fileName}`] : []),
    ...missingAssets.map((file) => `Missing ${file.fileName}`),
    ...status.toolchain.missing.map((tool) => `Needs ${tool}`)
  ];

  missingList.replaceChildren(
    ...missing.map((item) => {
      const span = document.createElement("span");
      span.textContent = item;
      return span;
    })
  );

  buttonStart.disabled = missingSourceExe || missingAssets.length > 0 || state.commandInterface !== null || state.starting;
  buttonStop.disabled = state.commandInterface === null;
  buttonBuild.disabled = !status.toolchain.canBuild || state.building;
  buttonExportPng.disabled = state.frameCount === 0;
  buttonExportWav.disabled = state.audioSampleCount === 0;
  buttonExportState.disabled = state.commandInterface === null;
  statusLine.textContent = state.commandInterface
    ? "Running"
    : buttonStart.disabled && (missingSourceExe || missingAssets.length > 0)
      ? "Source runtime incomplete"
      : "Ready";

  if (
    state.demoPlan &&
    !state.demoAutoStarted &&
    state.demoPlan.autoStart !== false &&
    !buttonStart.disabled
  ) {
    state.demoAutoStarted = true;
    void startSourceDos();
  }
}

async function startSourceBuild(): Promise<void> {
  if (state.building) {
    return;
  }

  const status = state.status ?? (await fetchJson<SourceDosStatus>("/__source-modified-dos/status"));
  state.status = status;

  if (!status.toolchain.canBuild) {
    statusLine.textContent = `Build blocked: missing ${status.toolchain.missing.join(", ")}`;
    return;
  }

  state.building = true;
  buttonBuild.disabled = true;
  buttonStart.disabled = true;
  statusLine.textContent = "Building source EXE";
  resetBuiltDownload();
  appendBuildLog("Preparing DOSBox build filesystem...\n", true);

  let commandInterface: JsDosCommandInterface | null = null;
  let observedBuildResult: "ok" | "failed" | null = null;
  const observeBuildOutput = (message: string) => {
    if (message.includes("=== Build complete ===")) {
      observedBuildResult = "ok";
    } else if (message.includes("=== Build failed ===")) {
      observedBuildResult = "failed";
    }
  };

  try {
    const entries = await buildSourceBuildFs(status);
    const buildEmulators = await loadBuildEmulators();
    buildEmulators.pathPrefix = "/emulators/";
    buildEmulators.pathSuffix = "";

    commandInterface = await buildEmulators.dosboxWorker([
      ...entries,
      {
        dosboxConf: BUILD_DOSBOX_CONF,
        jsdosConf: {
          version: "8"
        }
      }
    ]);

    commandInterface.events().onStdout((message) => {
      appendBuildLog(message);
      observeBuildOutput(message);
    });
    commandInterface.events().onMessage((type, ...args) => {
      if (type === "log") {
        return;
      }

      const message = `[${type}] ${args.map(String).join(" ")}\n`;
      appendBuildLog(message);
      observeBuildOutput(message);
    });

    const buildMarker = await waitForBuildMarker(
      commandInterface,
      10 * 60 * 1000,
      () => observedBuildResult
    );
    if (buildMarker === "failed") {
      throw new Error("Borland build failed.");
    }

    const builtExe = await readFirstExistingFile(commandInterface, buildFilePaths("WOLF3D.EXE"));
    state.builtExe = builtExe;
    exposeBuiltDownload(builtExe);
    appendBuildLog(`\nCaptured WOLF3D.EXE (${formatBytes(builtExe.length)}).\n`);
    statusLine.textContent = "Build complete";
  } catch (error) {
    state.builtExe = null;
    resetBuiltDownload();
    const message = error instanceof Error ? error.message : "Build failed";
    appendBuildLog(`\n${message}\n`);
    statusLine.textContent = message;
  } finally {
    if (commandInterface) {
      await commandInterface.exit().catch(() => undefined);
    }

    state.building = false;
    if (state.status) {
      renderStatus(state.status);
    }
  }
}

async function startSourceDos(): Promise<void> {
  if (state.starting || state.commandInterface) {
    return;
  }

  const status = state.status ?? (await fetchJson<SourceDosStatus>("/__source-modified-dos/status"));
  state.status = status;

  state.starting = true;
  buttonStart.disabled = true;
  statusLine.textContent = "Loading source tree";

  try {
    const entries = await buildInitFs(status);
    const emulators = await loadBuildEmulators();
    emulators.pathPrefix = "/emulators/";
    emulators.pathSuffix = "";

    const commandInterface = await emulators.dosboxWorker([
      ...entries,
      {
        dosboxConf: DOSBOX_CONF,
        jsdosConf: {
          version: "8"
        }
      }
    ]);

    state.commandInterface = commandInterface;
    resetCaptureBuffers();
    attachRuntimeCapture(commandInterface);
    statusLine.textContent = "Running";
    state.starting = false;
    renderStatus(status);

    if (state.demoPlan) {
      void runDemoPlan(commandInterface, state.demoPlan);
    }
  } catch (error) {
    statusLine.textContent = error instanceof Error ? error.message : "Unable to start source DOS";
    state.starting = false;
    buttonStart.disabled = false;
    renderStatus(status);
  }
}

async function stopSourceDos(): Promise<void> {
  const commandInterface = state.commandInterface;
  if (!commandInterface) {
    return;
  }

  buttonStop.disabled = true;
  statusLine.textContent = "Stopping";
  await commandInterface.exit().catch(() => undefined);
  if (state.commandInterface === commandInterface) {
    state.commandInterface = null;
  }

  state.starting = false;
  state.demoRunning = false;
  statusLine.textContent = "Stopped";
  if (state.status) {
    renderStatus(state.status);
  }
}

function attachRuntimeCapture(commandInterface: JsDosCommandInterface): void {
  commandInterface.events().onFrameSize((width, height) => {
    state.frameWidth = width;
    state.frameHeight = height;
    dosCanvas.width = width;
    dosCanvas.height = height;
    renderCaptureStatus();
  });

  commandInterface.events().onFrame((rgb, rgba) => {
    drawRuntimeFrame(rgb, rgba);
  });

  commandInterface.events().onSoundPush((samples) => {
    captureAudio(samples);
  });

  commandInterface.events().onExit(() => {
    if (state.commandInterface === commandInterface) {
      state.commandInterface = null;
    }

    state.starting = false;
    state.demoRunning = false;
    statusLine.textContent = "Exited";
    if (state.status) {
      renderStatus(state.status);
    }
  });

  commandInterface.events().onMessage((type, ...args) => {
    if (type === "log") {
      return;
    }

    appendBuildLog(`[runtime:${type}] ${args.map(String).join(" ")}\n`);
  });
}

function drawRuntimeFrame(rgb: Uint8Array | null, rgba: Uint8Array | null): void {
  if (!dosContext) {
    return;
  }

  const width = state.frameWidth;
  const height = state.frameHeight;
  const expectedRgbaLength = width * height * 4;
  const frame = new Uint8ClampedArray(expectedRgbaLength);

  if (rgba && rgba.length >= expectedRgbaLength) {
    frame.set(rgba.subarray(0, expectedRgbaLength));
  } else if (rgb && rgb.length >= width * height * 3) {
    let sourceIndex = 0;
    for (let targetIndex = 0; targetIndex < expectedRgbaLength; targetIndex += 4) {
      frame[targetIndex] = rgb[sourceIndex++] ?? 0;
      frame[targetIndex + 1] = rgb[sourceIndex++] ?? 0;
      frame[targetIndex + 2] = rgb[sourceIndex++] ?? 0;
      frame[targetIndex + 3] = 255;
    }
  } else {
    return;
  }

  state.lastFrameRgba = frame;
  state.frameCount += 1;
  dosContext.putImageData(new ImageData(frame, width, height), 0, 0);
  renderCaptureStatusThrottled();
}

function captureAudio(samples: Float32Array): void {
  const copy = new Float32Array(samples);
  state.audioChunks.push(copy);
  state.audioSampleCount += copy.length;

  const sampleRate = runtimeSampleRate();
  const maxSamples = sampleRate * MAX_CAPTURED_AUDIO_SECONDS;
  while (state.audioSampleCount > maxSamples && state.audioChunks.length > 0) {
    const removed = state.audioChunks.shift();
    state.audioSampleCount -= removed?.length ?? 0;
  }

  renderCaptureStatusThrottled();
}

function resetCaptureBuffers(): void {
  state.audioChunks = [];
  state.audioSampleCount = 0;
  state.frameCount = 0;
  state.frameHeight = dosCanvas.height;
  state.frameWidth = dosCanvas.width;
  state.lastFrameRgba = null;
  state.lastStatsUpdate = 0;
  if (dosContext) {
    dosContext.clearRect(0, 0, dosCanvas.width, dosCanvas.height);
  }

  renderCaptureStatus();
}

async function runDemoPlan(commandInterface: JsDosCommandInterface, plan: DemoPlan): Promise<void> {
  if (state.demoRunning) {
    return;
  }

  state.demoRunning = true;
  statusLine.textContent = `Demo running: ${plan.name}`;
  if (state.status) {
    renderStatus(state.status);
  }

  try {
    await delay(500);
    for (const [index, step] of plan.steps.entries()) {
      if (state.commandInterface !== commandInterface) {
        break;
      }

      await runDemoStep(commandInterface, step, index);
    }

    statusLine.textContent = `Demo complete: ${plan.name}`;
  } catch (error) {
    statusLine.textContent = error instanceof Error ? error.message : "Demo failed";
  } finally {
    state.demoRunning = false;
    if (state.status) {
      renderStatus(state.status);
    }
  }
}

async function runDemoStep(
  commandInterface: JsDosCommandInterface,
  step: DemoPlanStep,
  index: number
): Promise<void> {
  if (step.action === "wait") {
    await delay(Math.max(0, step.ms));
    return;
  }

  if (step.action === "capture") {
    const label = step.label ?? `step-${index + 1}`;
    if (step.png !== false) {
      await exportPng(label, false);
    }

    if (step.wav) {
      await exportWav(label, false);
    }

    if (step.state) {
      await exportStateBin(label, false);
    }

    return;
  }

  const keyCode = keyCodeFor(step.key);
  if (step.action === "keydown") {
    commandInterface.sendKeyEvent(keyCode, true);
    return;
  }

  if (step.action === "keyup") {
    commandInterface.sendKeyEvent(keyCode, false);
    return;
  }

  if (step.action === "key") {
    commandInterface.sendKeyEvent(keyCode, true);
    await delay(Math.max(1, step.holdMs ?? DEMO_DEFAULT_HOLD_MS));
    commandInterface.sendKeyEvent(keyCode, false);
  }
}

async function exportPng(label: string, autoDownload = true): Promise<void> {
  const imageData = await getCurrentImageData();
  if (!imageData) {
    statusLine.textContent = "No frame captured yet";
    return;
  }

  const blob = await imageDataToBlob(imageData);
  registerArtifact(blob, "frame", label, "png", autoDownload);
}

async function exportWav(label: string, autoDownload = true): Promise<void> {
  if (state.audioSampleCount === 0) {
    statusLine.textContent = "No audio samples captured yet";
    return;
  }

  const samples = mergeAudioChunks();
  const wav = encodeWav(samples, runtimeSampleRate());
  registerArtifact(
    new Blob([new Uint8Array(wav)], {
      type: "audio/wav"
    }),
    "audio",
    label,
    "wav",
    autoDownload
  );
}

async function exportStateBin(label: string, autoDownload = true): Promise<void> {
  const commandInterface = state.commandInterface;
  if (!commandInterface) {
    statusLine.textContent = "Runtime is not active";
    return;
  }

  const persisted = await commandInterface.persist(false);
  const bytes = encodePersistedState(persisted);
  registerArtifact(
    new Blob([new Uint8Array(bytes)], {
      type: "application/octet-stream"
    }),
    "state",
    label,
    "bin",
    autoDownload
  );
}

async function getCurrentImageData(): Promise<ImageData | null> {
  const screenshot = await state.commandInterface?.screenshot().catch(() => null);
  if (screenshot) {
    return screenshot;
  }

  if (!state.lastFrameRgba) {
    return null;
  }

  return new ImageData(new Uint8ClampedArray(state.lastFrameRgba), state.frameWidth, state.frameHeight);
}

async function imageDataToBlob(imageData: ImageData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create PNG canvas.");
  }

  context.putImageData(imageData, 0, 0);
  return canvasToBlob(canvas, "image/png");
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Canvas export failed."));
      }
    }, type);
  });
}

function registerArtifact(
  blob: Blob,
  kind: ArtifactKind,
  label: string,
  extension: string,
  autoDownload: boolean
): void {
  const fileName = artifactFileName(kind, label, extension);
  const url = URL.createObjectURL(blob);
  state.artifactUrls.push(url);
  const record: ArtifactRecord = {
    bytes: blob.size,
    fileName,
    kind,
    label,
    mimeType: blob.type || "application/octet-stream",
    sequence: state.artifactSequence,
    tickSource: "dos-frame",
    ticcount: state.frameCount
  };
  state.artifactSequence += 1;
  state.artifactRecords.push(record);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.dataset.artifactBytes = String(record.bytes);
  link.dataset.artifactKind = record.kind;
  link.dataset.artifactLabel = record.label;
  link.dataset.artifactSequence = String(record.sequence);
  link.dataset.artifactTickSource = record.tickSource;
  link.dataset.artifactTiccount = String(record.ticcount);
  link.textContent = `${fileName} (${formatBytes(blob.size)})`;
  artifactList.prepend(link);
  renderArtifactStatus();

  if (autoDownload) {
    link.click();
  }
}

function artifactFileName(kind: string, label: string, extension: string): string {
  const suffix = label.trim().length > 0 ? `-${slug(label)}` : "";
  return `wolf3d-source-modified-${kind}${suffix}.${extension}`;
}

function encodePersistedState(
  persisted: Uint8Array | { drives: { url: string; persist: Uint8Array }[] } | null
): Uint8Array {
  if (persisted instanceof Uint8Array) {
    return persisted;
  }

  return encodeText(
    JSON.stringify({
      artifacts: state.artifactRecords.map((artifact) => ({ ...artifact })),
      capturedAt: new Date().toISOString(),
      frameCount: state.frameCount,
      persisted: persisted
        ? {
            drives: persisted.drives.map((drive) => ({
              bytes: Array.from(drive.persist),
              url: drive.url
            }))
          }
        : null,
      runner: "source-modified-dos"
    })
  );
}

function mergeAudioChunks(): Float32Array {
  const merged = new Float32Array(state.audioSampleCount);
  let offset = 0;
  for (const chunk of state.audioChunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return merged;
}

function encodeWav(samples: Float32Array, sampleRate: number): Uint8Array {
  const bytesPerSample = 2;
  const channelCount = 1;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channelCount * bytesPerSample, true);
  view.setUint16(32, channelCount * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (const sample of samples) {
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += bytesPerSample;
  }

  return new Uint8Array(buffer);
}

function writeAscii(view: DataView, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function renderCaptureStatusThrottled(): void {
  const now = window.performance.now();
  if (now - state.lastStatsUpdate < 250) {
    return;
  }

  state.lastStatsUpdate = now;
  renderCaptureStatus();
}

function renderCaptureStatus(): void {
  captureStatus.textContent = `${state.frameCount} frames / ${formatDuration(audioDurationSeconds())} audio`;
  buttonExportPng.disabled = state.frameCount === 0;
  buttonExportWav.disabled = state.audioSampleCount === 0;
  renderArtifactStatus();
}

function renderArtifactStatus(): void {
  const latestArtifact = state.artifactRecords[state.artifactRecords.length - 1];
  artifactStatus.textContent = latestArtifact
    ? `${state.artifactRecords.length} / ${latestArtifact.fileName} / frame ${latestArtifact.ticcount}`
    : "0";
  artifactList.dataset.artifactCount = String(state.artifactRecords.length);
  artifactList.dataset.latestArtifact = latestArtifact?.fileName ?? "";
}

function audioDurationSeconds(): number {
  return state.audioSampleCount / runtimeSampleRate();
}

function runtimeSampleRate(): number {
  return Math.max(8000, state.commandInterface?.soundFrequency() || 44100);
}

function keyCodeFor(key: string | number): number {
  if (typeof key === "number") {
    return key;
  }

  const normalized = key.replace(/[\s_-]/g, "").toUpperCase();
  const mapped = KEY_CODES[normalized] ?? KEY_CODES[`KEY${normalized}`];
  if (mapped) {
    return mapped;
  }

  if (normalized.length === 1) {
    return normalized.charCodeAt(0);
  }

  throw new Error(`Unknown demo key: ${key}`);
}

function readDemoPlan(): DemoPlan | null {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("demo");
  if (!encoded) {
    return null;
  }

  try {
    const plan = normalizeDemoPlan(JSON.parse(decodeBase64Url(encoded)));
    if (!plan) {
      return null;
    }

    const autoStart = params.get("autorun") === "0" ? false : (plan.autoStart ?? true);
    return {
      ...plan,
      autoStart
    };
  } catch (error) {
    statusLine.textContent = error instanceof Error ? error.message : "Invalid demo plan";
    return null;
  }
}

function normalizeDemoPlan(value: unknown): DemoPlan | null {
  if (!isRecord(value) || !Array.isArray(value.steps)) {
    return null;
  }

  const steps = value.steps.filter(isDemoPlanStep);
  if (steps.length === 0) {
    return null;
  }

  const name = typeof value.name === "string" && value.name.trim().length > 0
    ? value.name.trim()
    : "cli-demo";

  return {
    ...(typeof value.autoStart === "boolean" ? { autoStart: value.autoStart } : {}),
    name,
    steps
  };
}

function isDemoPlanStep(value: unknown): value is DemoPlanStep {
  if (!isRecord(value) || typeof value.action !== "string") {
    return false;
  }

  if (value.action === "wait") {
    return typeof value.ms === "number";
  }

  if (value.action === "capture") {
    return true;
  }

  if (value.action === "key" || value.action === "keydown" || value.action === "keyup") {
    return typeof value.key === "string" || typeof value.key === "number";
  }

  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = window.atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function slug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

async function buildInitFs(status: SourceDosStatus): Promise<JsDosFileEntry[]> {
  const assetEntries = await Promise.all(
    DOS_ASSET_FILES.map(async (fileName) => ({
      path: `SRCGAME/${fileName}`,
      contents: await fetchBytes(`/__source-modified-dos/asset/${fileName}`)
    }))
  );

  const sourceExeEntry = {
    path: "SRCGAME/WOLF3D.EXE",
    contents: state.builtExe ?? (await fetchBytes("/__source-modified-dos/source/WOLF3D.EXE"))
  };

  const sourceEntries = await Promise.all(
    status.sourceFiles.map(async (entry) => ({
      path: `SRCROOT/${entry.path}`,
      contents: await fetchBytes(`/__source-modified-dos/source/${encodePath(entry.path)}`)
    }))
  );

  const toolchainEntries = await Promise.all(
    status.toolchain.files.map(async (entry) => ({
      path: `BC/${entry.path}`,
      contents: await fetchBytes(`/__source-modified-dos/toolchain/${encodePath(entry.path)}`)
    }))
  );

  return [...assetEntries, sourceExeEntry, ...sourceEntries, ...toolchainEntries];
}

async function buildSourceBuildFs(status: SourceDosStatus): Promise<JsDosFileEntry[]> {
  const sourceEntries: JsDosFileEntry[] = [];
  const buildSourceFiles = status.sourceFiles.filter((entry) => shouldMountForBuild(entry.path));
  for (const [index, entry] of buildSourceFiles.entries()) {
    sourceEntries.push({
      path: `${BUILD_SOURCE_ROOT}/${entry.path}`,
      contents: await fetchBytes(`/__source-modified-dos/source/${encodePath(entry.path)}`)
    });

    if ((index + 1) % 25 === 0) {
      appendBuildLog(`Mounted source files ${index + 1}/${buildSourceFiles.length}\n`);
    }
  }

  const toolchainEntries: JsDosFileEntry[] = [];
  for (const [index, entry] of status.toolchain.files.entries()) {
    toolchainEntries.push({
      path: `BC30/${entry.path}`,
      contents: await fetchBytes(`/__source-modified-dos/toolchain/${encodePath(entry.path)}`)
    });

    if ((index + 1) % 100 === 0) {
      appendBuildLog(`Mounted Borland files ${index + 1}/${status.toolchain.files.length}\n`);
    }
  }

  return [
    ...sourceEntries,
    ...toolchainEntries,
    {
      path: `${BUILD_SOURCE_ROOT}/BUILD.BAT`,
      contents: encodeText(BUILD_BAT)
    },
    {
      path: `${BUILD_SOURCE_ROOT}/BUILD.CFG`,
      contents: encodeText(BORLAND_BUILD_CFG)
    },
    {
      path: `${BUILD_SOURCE_ROOT}/WOLF3D.MAK`,
      contents: encodeText(BORLAND_MAKEFILE)
    }
  ];
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  return (await response.json()) as T;
}

async function loadBuildEmulators(): Promise<JsDosEmulators> {
  await import("js-dos/dist/emulators/emulators.js");

  if (!window.emulators) {
    throw new Error("js-dos emulator API did not initialize.");
  }

  return window.emulators;
}

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = appRoot.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }

  return element;
}

function encodePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

function encodeText(value: string): Uint8Array {
  return new TextEncoder().encode(value.replace(/\n/g, "\r\n"));
}

function shouldMountForBuild(path: string): boolean {
  const upperPath = path.toUpperCase();
  return upperPath !== "WOLF3D.EXE" && upperPath !== "WOLF3D.MAP";
}

function shortPath(path: string): string {
  const parts = path.replaceAll("\\", "/").split("/");
  return parts.slice(-2).join("/");
}

function appendBuildLog(message: string, reset = false): void {
  const next = reset ? message : `${buildLog.textContent}${message}`;
  buildLog.textContent = next.slice(Math.max(0, next.length - 200000));
  buildLog.scrollTop = buildLog.scrollHeight;
}

async function waitForBuildMarker(
  commandInterface: JsDosCommandInterface,
  timeoutMs: number,
  getObservedResult: () => "ok" | "failed" | null
): Promise<"ok" | "failed"> {
  void commandInterface;
  const start = window.performance.now();

  while (window.performance.now() - start < timeoutMs) {
    const observedResult = getObservedResult();
    if (observedResult) {
      return observedResult;
    }

    await delay(1000);
  }

  throw new Error("Build timed out.");
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function buildFilePaths(fileName: string): string[] {
  const dosRoot = BUILD_SOURCE_ROOT.replaceAll("/", "\\");
  return [
    `${BUILD_SOURCE_ROOT}/${fileName}`,
    `./${BUILD_SOURCE_ROOT}/${fileName}`,
    `/${BUILD_SOURCE_ROOT}/${fileName}`,
    `${dosRoot}\\${fileName}`,
    `.\\${dosRoot}\\${fileName}`,
    `\\${dosRoot}\\${fileName}`,
    `C:\\${dosRoot}\\${fileName}`,
    `C:/${BUILD_SOURCE_ROOT}/${fileName}`,
    `SRCROOT/${fileName}`,
    `/SRCROOT/${fileName}`,
    fileName
  ];
}

async function readOptionalFile(
  commandInterface: JsDosCommandInterface,
  paths: string[],
  timeoutMs = 1500
): Promise<Uint8Array | null> {
  for (const path of paths) {
    try {
      const file = await readFileWithTimeout(commandInterface, path, timeoutMs);
      if (file) {
        return file;
      }
    } catch {
      // Try the next path spelling; js-dos accepts different roots across backends.
    }
  }

  return null;
}

async function readFileWithTimeout(
  commandInterface: JsDosCommandInterface,
  path: string,
  timeoutMs: number
): Promise<Uint8Array | null> {
  return Promise.race([
    commandInterface.fsReadFile(path),
    new Promise<null>((resolve) => {
      window.setTimeout(() => resolve(null), timeoutMs);
    })
  ]);
}

async function readFirstExistingFile(
  commandInterface: JsDosCommandInterface,
  paths: string[],
  timeoutMs = 5000
): Promise<Uint8Array> {
  const file = await readOptionalFile(commandInterface, paths, timeoutMs);
  if (!file) {
    throw new Error(`Unable to read ${paths[0]}.`);
  }

  return file;
}

function exposeBuiltDownload(contents: Uint8Array): void {
  resetBuiltDownload();
  const blobBytes = new Uint8Array(contents);
  const blob = new Blob([blobBytes], {
    type: "application/octet-stream"
  });
  const url = URL.createObjectURL(blob);
  state.buildDownloadUrl = url;
  downloadBuilt.href = url;
  downloadBuilt.download = "WOLF3D-BUILT.EXE";
  downloadBuilt.classList.remove("disabled");
  downloadBuilt.ariaDisabled = "false";
}

function resetBuiltDownload(): void {
  if (state.buildDownloadUrl) {
    URL.revokeObjectURL(state.buildDownloadUrl);
  }

  state.buildDownloadUrl = null;
  downloadBuilt.removeAttribute("href");
  downloadBuilt.removeAttribute("download");
  downloadBuilt.classList.add("disabled");
  downloadBuilt.ariaDisabled = "true";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function formatDuration(seconds: number): string {
  if (seconds < 1) {
    return `${Math.round(seconds * 1000)} ms`;
  }

  return `${seconds.toFixed(1)} s`;
}
