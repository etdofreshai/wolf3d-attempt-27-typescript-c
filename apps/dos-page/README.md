# @wolf3d/dos-page

Browser-hosted TypeScript slice for experimenting with the original Wolfenstein 3D DOS loop.

This is not a full port yet. It keeps the original source tree as reference input and implements a small playable raycasting scene with the same broad runtime shape:

- `CalcTics` style fixed-rate timing with a `MAXTICS` clamp.
- `PollControls` and `ControlMovement` style `controlx` / `controly` movement.
- `Thrust` style fixed-point sin/cos movement.
- `ThreeDRefresh` style clear, wall refresh, and sprite pass.

Run from the repo root:

```powershell
npm install
npm run dev
```

Build/check from the repo root:

```powershell
npm run check
npm run build
```
