# Implementation Plan: Upload Pipeline Overhaul + DotMatrix Loader + Page Rename

## Task Type
- [x] Fullstack

## Overview

Three workstreams:
1. **Backend**: Move sharp processing to API handler, make queue lightweight, add retries
2. **Frontend**: Create React Native DotMatrix loader, replace ActivityIndicator everywhere
3. **Navigation**: Rename home→discover, remove old discover page

---

## Implementation Steps

### Phase 1: Backend — Fast inline processing + lightweight queue

#### Step 1.1: Create `packages/api/src/lib/image-processing.ts`

New module with `processImageToWebp()`:
- Takes raw `Buffer` input
- Runs `sharp` resize + webp conversion
- **Progressive quality reduction**: try q90 → q80 → q70 → q60 until ≤512KB or bail with clear error
- Returns `{ webp: Buffer, width: number, height: number }`
- Throws descriptive error if image is invalid (CMYK, corrupt, etc.)

```ts
// Pseudo-code
export async function processImageToWebp(input: Buffer): Promise<ProcessedImage> {
  const image = sharp(input, { failOn: "warning" }).rotate();
  const meta = await image.metadata();
  // validate dimensions
  let resized = image;
  if (meta.width > 512 || meta.height > 512) {
    resized = image.resize(512, 512, { fit: "inside" });
  }
  // Progressive quality
  for (const quality of [90, 80, 70, 60]) {
    const buf = await resized.clone().webp({ quality }).toBuffer();
    if (buf.byteLength <= 512 * 1024) {
      return { webp: buf, width: meta.width!, height: meta.height! };
    }
  }
  throw new Error("Image too large even at minimum quality");
}
```

#### Step 1.2: Update `create-formdata` endpoint in `apps/server/src/index.ts`

**Before queueing**, process each sticker inline:
1. `validateStickerUpload(file)` — keep existing validation
2. `processImageToWebp(buffer)` — NEW, fail fast with user-visible error
3. Upload processed webp directly to final R2 key (skip temp storage entirely)
4. If ANY sticker fails processing, return 400 with which sticker index and why

**Then** enqueue a lightweight job with only metadata:
```ts
// Job payload is tiny — just keys + metadata
imageProcessQueue.add("finalize-pack", {
  packId: pack.id,
  stickers: staged.map(s => ({
    stickerId: s.stickerId,
    r2Key: s.r2Key,
    url: s.url,
    width: s.width,
    height: s.height,
    sizeBytes: s.sizeBytes,
    order: s.order,
  })),
}, {
  attempts: 3,
  backoff: { type: "exponential", delay: 2000 },
});
```

#### Step 1.3: Refactor queue job type in `packages/api/src/lib/queues.ts`

```ts
export type ImageProcessJob = {
  packId: string;
  stickers: {
    stickerId: string;
    r2Key: string;      // already uploaded final webp
    url: string;        // public URL
    width: number;
    height: number;
    sizeBytes: number;
    order: number;
  }[];
};
```

#### Step 1.4: Rewrite worker `packages/api/src/workers/image-process.ts`

Lightweight worker that:
1. Generates thumbnail from first sticker (download one webp from R2, sharp resize to 96×96, upload thumbnail)
2. Updates each sticker DB record to READY independently (not all-or-nothing)
3. Updates pack status to READY
4. Logs errors with context

**Worker config**:
```ts
new Worker<ImageProcessJob>("image-process", processPack, {
  connection: redisConnection,
  concurrency: 5,
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
});
```

**Per-sticker independence**: If sticker 3 DB update fails, stickers 1,2,4..N still go READY. If thumbnail generation fails, pack still goes READY without thumbnail.

#### Step 1.5: Clean up temp storage

- Remove `tempStickerKey()` from `packages/api/src/lib/storage.ts`
- Stop writing `tempUrl` to sticker records
- Keep `getObjectBuffer()` — still needed for thumbnail generation in worker

---

### Phase 2: Frontend — DotMatrix Loader for React Native

#### Step 2.1: Create `apps/native/components/ui/DotMatrixLoader.tsx`

React Native port of the web DotMatrix pattern:
- 5×5 grid of `View` dots
- `useEffect` + `setInterval` for stepped animation (column-fill → blink → drain)
- Props: `size?: number` (default 40), `color?: string` (default `#FFF500`), `speed?: number` (default 1)
- Pure RN Views with opacity — no external animation library needed

#### Step 2.2: Replace ActivityIndicator in `CreatePackForm.tsx` (line 267)

Replace `<ActivityIndicator color="#000000" />` with `<DotMatrixLoader color="#000000" size={24} />`

#### Step 2.3: Add DotMatrixLoader to loading states across tabs

- `index.tsx` — show loader while trending/list queries are loading
- `saved.tsx` — show loader while saves list loads
- `profile.tsx` — show loader while profile data loads

---

### Phase 3: Navigation — Home → Discover rename + remove old discover

#### Step 3.1: Update `_layout.tsx`

- Change index tab label from "Home" to "Discover"
- Change index tab icon from house to compass
- Remove the `discover.tsx` tab screen entry entirely
- Result: 4 tabs — Discover, Upload, Saved, Profile

#### Step 3.2: Delete `apps/native/app/(tabs)/discover.tsx`

Remove the static placeholder page entirely.

---

## Key Files

| File | Operation | Description |
|------|-----------|-------------|
| `packages/api/src/lib/image-processing.ts` | Create | Sharp processing + progressive quality |
| `apps/server/src/index.ts:105-292` | Modify | Inline processing before queue |
| `packages/api/src/lib/queues.ts` | Modify | Lightweight job type |
| `packages/api/src/workers/image-process.ts` | Rewrite | DB updates + thumbnail only, with retries |
| `packages/api/src/lib/storage.ts` | Modify | Remove tempStickerKey |
| `apps/native/components/ui/DotMatrixLoader.tsx` | Create | RN dot matrix animation |
| `apps/native/components/upload/CreatePackForm.tsx:267` | Modify | Replace ActivityIndicator |
| `apps/native/app/(tabs)/_layout.tsx` | Modify | Rename home→discover, remove discover tab |
| `apps/native/app/(tabs)/discover.tsx` | Delete | Remove static placeholder |
| `apps/native/app/(tabs)/index.tsx` | Modify | Add DotMatrixLoader for loading states |

## Risks and Mitigation

| Risk | Mitigation |
|------|------------|
| 30 stickers × sharp = slow API response | ~100-200ms per image; parallelize with Promise.all → ~3-6s total. Acceptable. |
| Large Redis payloads | Only metadata in queue (~1KB), not image buffers |
| RN animation perf on low-end | 25 dots with simple opacity, no Animated API overhead |
| Old PROCESSING packs in queue | Drain queue before deploy, or version-check job format in worker |

## Performance Impact

| Metric | Before | After |
|--------|--------|-------|
| User feedback on bad image | 10-15 min (async fail) | <1s (sync 400 error) |
| Time to pack READY | 10-15 min | ~5-10s (inline) + ~2-5s (queue) |
| R2 trips per sticker | 4 (temp up, temp down, final up, thumb) | 1 (final up) + 1 thumb total |
| Failure visibility | Silent, no logs | Instant error with sticker index + reason |

## SESSION_ID
- CODEX_SESSION: N/A (ccg-workflow not installed)
- GEMINI_SESSION: N/A (ccg-workflow not installed)
