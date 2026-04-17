# Moment Library

Slot-organized library of concrete Moment implementations.

```
library/
├── skin/        # palette / tone / copy — whole-screen colour layer (1 per screen)
├── glance/      # "1 year ago today" compound-memory surface (0–1 per screen)
├── hero/        # StoryCard-grade narrative surface (1–2 per screen)
├── row/         # TimeRiver row items (3–7 per screen)
└── floating/    # NextActionPrompt zero-friction surface (0–1 per screen)
```

## Adding a Moment

1. Create `library/<slot>/<moment-id>.ts` exporting a `Moment` object.
2. Import and call `registerMoment(...)` in the slot's `index.ts`.
3. Implement all 5 event hooks (`exposed`, `tapped`, `dwell`, `dismissed`, `resultingMemory`).
4. Ensure `MomentRenderResult` includes `accessibilityLabel`, `minTouchPt >= 44`, and `explanation`.
5. Run `npx tsc --noEmit` and tests.

P0 Moments (Task #17):
- `tpo-signature` (skin)
- `next-step` (floating)
- `quiet-weave` (hero)
