@AGENTS.md

## Known bugs

1. ~~Mobile: lightbox zooms to 2.5× immediately on open when tapping a tile~~ **RESOLVED**
   - Fixed by removing tap-to-zoom from `onLbImageClick` (body is now just `e.stopPropagation()`). Pinch-to-zoom via `onLbTouchStart`/`onLbTouchMove`/`onLbTouchEnd` remains.
   - Root cause: the browser fires a ghost synthetic `click` after a touch, which arrived at `onLbImageClick` before any lightbox touch handler had run, so the `lbWasTouchRef` guard was always `false` and zoom triggered on every open.
   - Tap-to-zoom is intentionally absent. Do not re-add it without solving the ghost click problem first.
