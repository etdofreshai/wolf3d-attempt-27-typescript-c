# platform — browser hardware layer

The modern stand-in for the original's DOS hardware layer. The faithful port in
[`WOLFSRC/`](../WOLFSRC) targets the same low-level seams the original did; this
directory grounds those seams in browser APIs:

| Original seam        | Backed by (browser)                     |
|----------------------|-----------------------------------------|
| `ID_VL` (VGA output) | `<canvas>` 320×200 indexed framebuffer + palette |
| `ID_IN` (keyboard/mouse) | DOM keyboard / pointer events       |
| `ID_SD` (AdLib/PC speaker/digi) | Web Audio + the Nuked-OPL core   |

This is the **only** legitimately-separate code from the C mirror — everything
else lives in `WOLFSRC/`. Keep this layer thin: it translates events and buffers,
it does not contain game logic.

See [PORTING.md](../../../../PORTING.md) for the full plan.

This directory is empty until porting begins.
