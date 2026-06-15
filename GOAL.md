# Goal

Complete the full `apps/source-typescript` Wolf3D port to the `PORTING.md` T0-T4 definition of done.

Do not stop at generated mirrors, removed stubs, typechecks, or checker coverage. Those are milestones only.

Done means:

- The `apps/source-typescript` browser app boots into a real Wolf3D experience, not a placeholder or black canvas.
- The game is fully playable from the browser with rendering, input, timing, menus/game flow, and audio wired through the TypeScript port.
- `PORTING.md` T0-T4 are satisfied:
  - T0 structural mirror is complete.
  - T1 asset extraction parity is byte-identical.
  - T2 all embedded demos match the oracle per tic.
  - T3 save-game interop is byte-identical.
  - T4 framebuffer and audio parity are verified.
- The automated checks prove the above, and the app itself visibly confirms it by being playable.

Use `PORTING.md` for fidelity constraints. If a shortcut makes the app playable but weakens parity, it is not acceptable as final completion.
