# oracle — the reference ground truth

The faithful TypeScript port (`apps/source-typescript`) is validated against the
**original 16-bit DOS game**, not against opinion. This directory holds the
tooling and findings for producing and inspecting that reference. It backs
[PORTING.md](../PORTING.md) §8 (the oracle) and §10 (byte-identical saves).

**Roles** (see PORTING.md §8): the *authority* is the unmodified retail
`steam/base/wolf3d.exe` (run via `apps/source-dos`). The Borland **rebuild** of
`source/WOLFSRC` reproduces its behavior and is where source-level
instrumentation will live (`apps/source-modified-dos`). This folder is the
build/inspection recipe that ties them together.

---

## Step-1 gate result (DONE)

**Question:** does rebuilding `source/WOLFSRC` with the vendored Borland C++ 3.1
reproduce the shipped `wolf3d.exe` byte-for-byte?

**Answer: no — and the reasons are structural, not build errors.**

1. **The shipped EXE is LZEXE 0.91-compressed.** Signature `"LZ91"` at file
   offset `0x1C`; 108,779 compressed bytes wrap a ~254 KB real-mode image. Any
   byte comparison must be done *image-vs-image* (decompress first — see below).
2. **The released `WOLF3D.PRJ` is the developer *debug* config** (`-v`, TLINK
   `/v`), which appends ~183 KB of symbolic debug info. A debug build is
   491,452 bytes; a *release* build (`-v-`, no `/v`) is **254,046 bytes**.

After decompressing the shipped EXE:

| | bytes |
|---|---|
| Decompressed **retail** load image | **254,014** |
| Our **release** rebuild load image | **254,046** |
| Difference | **32 (0.01%)** |

The two are unmistakably the **same program** (same size class; `Wolfenstein` /
`Episode` / `VSWAP` strings present in both). They are **not** byte-identical:
the first divergence is at offset 1 — a `mov dx,seg` immediate that differs only
because the data segment lands at a different paragraph — and the rest diverges
on segment-relocation words. The 32-byte size delta means our `WOLFSRC` is
*extremely close to but not exactly* the retail source revision.

**Consequence (locked into PORTING.md §8/§10/§11):** behavior comes from the
rebuild; the **byte-identical save layout is taken from the decompressed shipped
binary** (its DGROUP is the authority). The rebuild's `.MAP` is a strong
cross-check but not automatically authoritative given the 32-byte margin.

**Locked binary** (PORTING.md §2): `steam/base/wolf3d.exe`, 108,779 bytes,
sha256 `48d9594649f330956e86ea1892bab76b2d83cfd4038e262ff8f3383ba945ec09`.
It identifies as an **Apogee** WL6 build; LZEXE info table reports the original
(decompressed) entry CS:IP `0000:0000`, SS:SP `4888:0080`.

---

## Building the oracle (Borland C++ 3.1 under DOSBox, headless)

Everything is vendored: `deps/borland` (BCC, TASM, TLINK, MAKE, PRJ2MAK + LIB/
INCLUDE) and `steam/DOSBox` (DOSBox 0.74-3). DOSBox runs **headless** with
`SDL_VIDEODRIVER=dummy`, executing an `[autoexec]` batch that ends in `exit`, so
output files can be read back. The build model is **MEDIUM** (`-mm`, `c0m`/`cm`/
`mathm`/`emu`, `-a` word alignment) — this fixes the struct layout saves depend
on (near 2-byte data pointers).

### Recipe

1. **Copy** `source/WOLFSRC` to a scratch build dir (so generated `.obj`/`.exe`
   don't touch the repo). It must contain `OBJ/` with the prebuilt `SIGNON.OBJ`
   and `GAMEPAL.OBJ` (these can't be recompiled from C and are checked in).
2. **Generate the makefile** from the binary project file: run `PRJ2MAK WOLF3D`
   in DOSBox → `WOLF3D.MAK`.
3. **Apply two fixes to `WOLF3D.MAK`** (both are PRJ2MAK / stale-path artifacts):
   - **Drop the stock startup.** PRJ2MAK auto-prepends Borland's `c0m.obj` to the
     TLINK list, but id's `C0.ASM` is a *full custom startup* (defines `_psp@`,
     PSP setup, `_main` entry, every `c0` symbol). Linking both ⇒ duplicate
     symbols. **Remove the `c0m.obj+` line** from the TLINK response file.
   - **Repoint stale absolute paths** (the original dev's machine):
     `LIBPATH G:\BC30\LIB → D:\LIB`, `INCLUDEPATH G:\BC30\INCLUDE → D:\INCLUDE`,
     and `c:\source\wolf\obj\{signon,gamepal}.obj → obj\{signon,gamepal}.obj`
     (4 occurrences: 2 in the dependency list, 2 in the TLINK list).
   - *(For a retail-equivalent **release** build:* also flip `-v → -v-` in the
     generated `wolf3d.cfg` section and drop `/v` from the `TLINK` flags.*)*
4. **Build clean.** Restore `OBJ/` to just `SIGNON.OBJ` + `GAMEPAL.OBJ` and
   delete cached `WOLF3D.SYM`/`.CFG`/`.MAP` before each run — TASM fails to
   overwrite a pre-existing `OBJ\*.OBJ` on a rebuild. Then `MAKE -fWOLF3D.MAK`.
   Output: `OBJ\WOLF3D.EXE` + `OBJ\WOLF3D.MAP` (the `/s` segment + publics map).

### DOSBox autoexec (mount C: = build dir, D: = Borland)

```
[sdl]
output=surface
[cpu]
core=auto
cputype=auto
cycles=max
[autoexec]
@echo off
mount c <scratch-build-dir>
mount d <repo>\deps\borland
path=d:\bin
set INCLUDE=d:\include
set LIB=d:\lib
c:
make -fwolf3d.mak > c:\make.log
dir obj\wolf3d.exe >> c:\make.log
exit
```

Launch headless from PowerShell:

```powershell
$env:SDL_VIDEODRIVER='dummy'
Start-Process -Wait '<repo>\steam\DOSBox\DOSBox.exe' -ArgumentList '-conf','<conf>'
```

> A one-shot script that automates copy → PRJ2MAK → fixes → clean → build is a
> TODO (the steps above are validated manually). Until then, follow the recipe.

---

## Decompressing the shipped EXE

`unlzexe.mjs` is a validated LZEXE 0.90/0.91 decompressor (the one subtlety —
eager 16-bit control-word refill — is documented in the file):

```bash
node oracle/unlzexe.mjs steam/base/wolf3d.exe tmp/retail_image.bin
# -> decompressed load image: 254014 bytes ; sanity strings: Wolfenstein✓ Episode✓ VSWAP✓
```

The output is the raw real-mode load image (code segments, then DGROUP last in
the MEDIUM model).

---

## DGROUP / save-layout fixture

`generate-dgroup-layout.mjs` parses the Borland linker map and emits the current
save-layout fixture:

```bash
npm run generate:dgroup-layout
```

Outputs:

- `oracle/generated/dgroup-layout.json`
- `apps/source-typescript/src/WOLFSRC/TS_DGROUP_LAYOUT.ts`

The fixture records the locked retail EXE hash/decompressed size, the rebuild
MAP hash, save-critical public symbols (`gamestate`, `objlist`, `statetype`
tables, doors/statics/push-wall fields), Borland medium-model struct layouts,
and `SaveTheGame` checksum inclusion/exclusion.

For a bounded retail/rebuild image check without regenerating anything:

```bash
node oracle/compare-retail-dgroup.mjs
```

This decompresses the locked retail EXE, reports the MAP-derived DGROUP range,
checks how much of that range is physically present in the decompressed retail
image, and compares the overlap against an existing rebuild MZ image when one is
present. Treat the output as confirmation evidence: retail symbols are still not
available, and an overlap comparison cannot prove retail DGROUP offset equality
by itself.

Important caveat: this is **rebuild-MAP-derived evidence**, not yet a final
retail-authoritative map. The locked retail EXE is decompressed and verified,
but its DGROUP symbol equality still needs the instrumented/extracted retail
confirmation described in PORTING.md §10.

`npm run check` now includes `check:source-typescript-port`, which validates
this fixture alongside the current structural and WL6 asset-extraction gates.

---

## Next oracle tasks

- **Retail DGROUP confirmation (§10).** The rebuild-MAP-derived fixture now
  exists. Next, compare the decompressed retail vs rebuild DGROUP *aligned by
  DGROUP start* or add instrumentation/extraction that proves the retail DS
  offsets match (or replaces the fixture with retail-derived offsets). This is
  the final input to byte-identical saves.
- **Per-tic instrumentation** in `apps/source-modified-dos`: state hash,
  320×200 framebuffer, OPL register stream — the fixtures for acceptance tiers
  T2/T4 (PORTING.md §9).
