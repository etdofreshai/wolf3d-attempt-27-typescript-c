// Verified content for the Developer's Corner (dev.html). Every number here was checked against the
// repo by the dev-corner-content workflow (gate counts, correlation %, byte-exact diffs) — nothing is
// invented. See tmp/devcorner-content.json for the raw gathered data and commit 234ef05 for the audio
// work it describes.

export interface StatTile {
  value: string;
  label: string;
  detail: string;
}

export interface AudioBug {
  title: string;
  detail: string;
}

export interface AudioMetric {
  label: string;
  before: string;
  after: string;
}

export interface AudioTake {
  /** before = pre-fix (commit ca71af5), after = current, reference = a faithful OPL2 (npm opl3). */
  id: "before" | "after" | "reference";
  label: string;
  /** Short note shown when this take is selected. */
  note: string;
  src: string;
}

export interface AudioPlayer {
  id: string;
  label: string;
  description: string;
  takes: AudioTake[];
}

export interface GalleryItem {
  img: string;
  title: string;
  caption: string;
}

const A_NOTE = {
  before: "What you heard before — the from-scratch synth with five FM bugs.",
  after: "After the fixes — the port's OPL2 as it ships today.",
  reference: "A faithful OPL2 (npm opl3, DOSBox-class) fed the identical register stream.",
} as const;

function takes(id: string): AudioTake[] {
  return [
    { id: "before", label: "Before", note: A_NOTE.before, src: `/dev/audio/${id}-before.wav` },
    { id: "after", label: "After", note: A_NOTE.after, src: `/dev/audio/${id}-after.wav` },
    { id: "reference", label: "Reference", note: A_NOTE.reference, src: `/dev/audio/${id}-reference.wav` },
  ];
}

export const HEADER = {
  kicker: "Developer's Corner",
  title: "Engineering Logbook",
  subtitle:
    "Behind the from-scratch TypeScript port: how it's held byte-for-byte to the 1992 binary, and how its AdLib synth was tuned back to the hardware. Listen, compare, and check the receipts.",
};

// Headline numbers — all verified against the oracle gates.
export const STATS: StatTile[] = [
  {
    value: "0 / 64000",
    label: "pixels differ on E1M1",
    detail:
      "The level-start frame renders byte-for-byte identical to the DOS oracle across the full 320×200 indexed framebuffer (check:frame, MAX_DIFF=0).",
  },
  {
    value: "4 / 4",
    label: "demos bit-exact",
    detail:
      "All four attract-mode demos replay tic-for-tic against the oracle trace — 5,386 game tics, every one matching (check:demo-traces).",
  },
  {
    value: "99.9%",
    label: "audio match to real OPL2",
    detail:
      "The E1M1 song's audible partials correlate 99.9% with a faithful OPL2 after the synthesis fixes — up from ~58% (check:opl-fidelity).",
  },
  {
    value: "18,609 / 18,701",
    label: "save bytes identical",
    detail:
      "A port save matches the DOS save fixture across every data field; only 92 build-fragile pointer/checksum bytes are excluded (check:save-data).",
  },
  {
    value: "32",
    label: "oracle gates green",
    detail:
      "Every commit runs 32 differential gates — frame, palette, demos, saves, OPL audio synthesis, end screens — plus a full TypeScript typecheck.",
  },
];

export const AUDIO = {
  heading: "Tuning the FM synth until it matched the hardware",
  intro:
    "The port runs its own from-scratch OPL2 (AdLib) emulator in the browser. It was in tune, but its FM timbre had drifted from real hardware — so we measured it bit-for-bit against an independent faithful OPL2 driven by the identical register stream, and fixed five synthesis bugs until it matched. Flip between Before, After, and the Reference at any moment in playback.",
  players: [
    {
      id: "music",
      label: 'E1M1 theme — "Get Them Before They Get You"',
      description:
        "The first level's AdLib FM song, rendered by the port's OPL2 emulator from the exact register stream the original game writes. Before the fixes its audible partials correlated only ~58% with a faithful OPL2; after, 99.9% across the 67 strongest spectral bins.",
      takes: takes("music"),
    },
    {
      id: "bonus",
      label: "Treasure pickup — AdLib FM, not digitized",
      description:
        "A short FM sound effect played through the same OPL2 path as the music. (In WL6, treasure/health/key pickups are AdLib FM, not Sound Blaster samples.) The harmonic fixes pulled the FM path it rides on from ~60% to 99.9–100% match against the reference chip — so the chime rings true instead of rough.",
      takes: takes("bonus"),
    },
  ] as AudioPlayer[],
  bugs: [
    {
      title: "Exponential table missing its complement",
      detail:
        "The attenuation-to-linear lookup skipped the standard ^0xff step, turning every operator's waveform into a sawtooth within each octave and distorting all FM timbre.",
    },
    {
      title: "Phase modulation lost its sign",
      detail:
        "Modulator and feedback values were masked with &0x3ff before use, so a negative phase offset wrapped to a small positive index and corrupted the FM character; the index is now passed signed and masked only after it's added.",
    },
    {
      title: "Carrier modulation index was half strength",
      detail:
        "The carrier was driven by modOut>>1 instead of the full modOut, so FM brightness was halved versus the OPL's toPhase=4 modulation index.",
    },
    {
      title: "KSL bit mapping was inverted",
      detail:
        "Key-scale-level used [8,4,2,0] instead of [8,1,2,0], making the first KSL field the weakest and skewing per-octave attenuation by up to 11 dB.",
    },
    {
      title: "Sustain level settled twice too quiet",
      detail:
        "Sustain target used sustainLevel*32 (6 dB/step) instead of *16 (the OPL's 3 dB/step), so every held note decayed to half the correct level and thinned out the music.",
    },
  ] as AudioBug[],
  metrics: [
    { label: "FM harmonic series (representative patches)", before: "~60%", after: "99.9–100%" },
    { label: "E1M1 song audible partials (67 strong bins)", before: "~58%", after: "99.9%" },
    { label: "KSL attenuation per 4 octaves vs reference", before: "off by up to 11 dB", after: "within 0.2 dB" },
    { label: "Sustain settling (SL=2 / SL=4)", before: "6 dB too quiet/step", after: "exact (−6.0 / −12.0 dB)" },
    { label: "9-channel mix normalization", before: "/32768 (~2.25× hot)", after: "/73728 (DOSBox scaling)" },
  ] as AudioMetric[],
  takeaway:
    "The register stream is never touched, so all four embedded demos stay bit-exact while the synthesis now matches a DOSBox-class OPL2 (npm opl3, Cozendey) to within 0.1–0.2 dB on harmonics, KSL, sustain, and the real E1M1 song — pinned permanently by the check:opl-fidelity gate.",
};

export const PARITY = {
  heading: 'Proven parity, not "looks close"',
  intro:
    "This isn't a Wolf3D-inspired remake — it's a 1:1 reimplementation held to the original DOS binary as ground truth. Every render, save, demo, and sound path is checked against captures from the id Software source compiled with Borland C and run in DOSBox. The bar isn't \"looks right,\" it's \"byte-identical\": a chain of 32 oracle gates fails the build the moment a single byte drifts.",
  palette: {
    caption:
      "One byte at the wrong offset turned the iconic blue corridors of E1M1 blood-red. GAMEPAL.OBJ is an OMF object file: its 768-byte VGA palette lives in an LEDATA record whose payload is prefixed by a 2-byte data offset. Reading from file offset 0x76 prepended the offset's high byte and shifted every RGB triplet by one — scrambling every wall, sprite, and HUD color. The frame gate stayed green the whole time (it compares palette indices, not RGB), which is exactly why the bug hid. The fix: read from 0x77, plus a dedicated palette gate that verifies the first colors against the canonical Wolf3D palette.",
    beforeCaption: "Before · offset 0x76 — every color shifted, walls render red/magenta",
    afterCaption: "After · offset 0x77 — the true VGA palette, classic blue & gray stone",
  },
  gallery: [
    { img: "gameplay.png", title: "E1M1, byte-identical", caption: "The opening corridor rendered natively in the browser — no DOSBox — yet pixel-for-pixel identical to the DOS original (0/64000 diff)." },
    { img: "damage-flash.png", title: "Damage flash", caption: "Taking fire tints the screen red via a palette shift — computed and drawn exactly as the original InitRedShifts logic (check:palette-shift)." },
    { img: "bonus-flash.png", title: "Pickup flash", caption: "Grabbing treasure or ammo pulses the palette gold for a few tics — the bonus-shift counterpart to the damage flash." },
    { img: "fizzle.png", title: "Fizzlefade dissolve", caption: "The famous screen-melt transition, driven by the original 16-bit LFSR pixel ordering so the dissolve pattern matches the DOS build (check:fizzle)." },
    { img: "intermission.png", title: "Level-end intermission", caption: "The between-levels tally with its bonus count-up and par time — wired with sounds and verified against the oracle end screens." },
    { img: "victory.png", title: "Victory & ending", caption: "Boss kill through to the WL6 ending text — the full game-flow arc is reachable and parity-checked end to end." },
    { img: "paused.png", title: "Pause overlay", caption: "The PAUSEDPIC overlays the frozen 3D frame at the faithful position — the game pauses exactly as the original did (check:pause)." },
    { img: "highscores.png", title: "High scores & name entry", caption: "The high-score table and arcade name-entry cursor, rendered from the original menu code (check:highscores)." },
    { img: "menu.png", title: "Main menu, native", caption: "The main menu booted in the browser — the actual app the launcher opens — with the true VGA palette (check:browser)." },
  ] as GalleryItem[],
  methodNote:
    "Parity is proven by an oracle, not by eyeballing. The id Software source is compiled with the period-correct Borland toolchain and run headless in DOSBox to capture ground-truth artifacts — per-tic actor state, the indexed framebuffer, save files, and OPL register writes. The port runs the same inputs through its own native pipeline, and differential comparators (oracle/compare-*.mjs) assert byte/tic equality with zero tolerance where it counts. All 32 gates chain into npm run check, so the build goes red on the first byte of drift.",
  // All 32 differential gates chained into `npm run check` (verified against package.json).
  gates: [
    "source-typescript-port", "frame", "gameplay-frame", "palette", "palette-shift", "present", "pause",
    "deathspin", "fizzle", "demo-traces", "demo-playback", "save-data", "saveload-roundtrip",
    "loadsave-screen", "mouse", "digi-sound", "music", "opl", "opl-pitch", "opl-synth", "opl-worklet",
    "opl-fidelity", "victory", "intro-screens", "sound-menu", "confirm", "endtext", "endscreens",
    "changeview", "control-menu", "highscores", "browser",
  ],
};
