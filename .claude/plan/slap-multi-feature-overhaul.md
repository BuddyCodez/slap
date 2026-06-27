# Slap Multi-Feature Overhaul Plan

## Overview
This plan addresses 4 critical issues in the Slap native app:
1. **oRPC Integration on Pack Screen** - Fix broken save/get/whatsapp button mutations
2. **Profile Page Redesign** - Add logout + draggable edit sheet (photo/username/bio)
3. **Filter System Fix** - Implement working category/tag filters
4. **Sticky Back Button** - Make back button float and stay visible during scroll

**Estimated effort**: 6-8 hours of implementation + testing
**Risk level**: MEDIUM (complex state management, network requests)

---

## Issue 1: oRPC Integration on Pack Screen

### Current State
- Pack detail screen at `apps/native/app/pack/[id].tsx` uses oRPC correctly ✅
- BUT: The API side (`packages/api/src/routers/`) is missing proper route handlers for save/get mutations
- Client code has working mutations referencing `orpc.saves.save()` and `orpc.download.trackDownload()`
- Missing: Server-side endpoints and router exports

### Root Cause
The oRPC client expects these procedures:
```
- orpc.saves.save() → POST /api/saves/save
- orpc.saves.unsave() → POST /api/saves/unsave
- orpc.saves.list() → GET /api/saves/list
- orpc.download.trackDownload() → POST /api/download/track
```

But the server-side router at `packages/api/src/routers/` likely doesn't export these properly.

### Solution: Phase 1 - Fix Server Routes

**Files to modify:**
1. `packages/api/src/routers/index.ts` - Export saves and download routers
2. `packages/api/src/routers/profile.ts` - Add saves & download procedures (if missing)
3. Create `packages/api/src/routers/saves.ts` (if doesn't exist) with:
   - `save` mutation: Save a pack to user's collection
   - `unsave` mutation: Remove pack from saves
   - `list` query: Get user's saved packs

### Implementation Details

#### Create/Update Saves Router
```typescript
// packages/api/src/routers/saves.ts
import { protectedProcedure, publicProcedure } from "../index";
import { z } from "zod";
import prisma from "@slap/db";

export const savesRouter = {
  save: protectedProcedure
    .input(z.object({ packId: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const saved = await prisma.save.upsert({
        where: { userId_packId: { userId: ctx.user.id, packId: input.packId } },
        update: {},
        create: { userId: ctx.user.id, packId: input.packId },
      });
      return saved;
    }),

  unsave: protectedProcedure
    .input(z.object({ packId: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      await prisma.save.delete({
        where: { userId_packId: { userId: ctx.user.id, packId: input.packId } },
      });
      return { success: true };
    }),

  list: protectedProcedure
    .input(z.object({ limit: z.number().default(20), cursor: z.number().default(0) }))
    .query(async ({ input, ctx }) => {
      const saves = await prisma.save.findMany({
        where: { userId: ctx.user.id },
        include: { pack: { include: packInclude } },
        take: input.limit,
        skip: input.cursor,
      });
      return saves.map(s => s.pack);
    }),
};
```

#### Update Download Router (if missing)
```typescript
// packages/api/src/routers/download.ts
import { publicProcedure } from "../index";
import { z } from "zod";
import prisma from "@slap/db";

export const downloadRouter = {
  trackDownload: publicProcedure
    .input(z.object({ packId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await prisma.pack.update({
        where: { id: input.packId },
        data: { downloads: { increment: 1 } },
      });
      return { success: true };
    }),
};
```

---

## Issue 2: Profile Page Redesign

### Current State
- Profile page exists at `apps/native/app/(tabs)/profile.tsx`
- Already has EditProfileSheet component (lines 33-150+)
- Missing: Logout button, draggable photo picker, proper sheet layout

### Solution: Phase 2 - Profile Redesign

**Files to modify:**
1. `apps/native/app/(tabs)/profile.tsx` - Add logout, photo picker, improve layout
2. `packages/api/src/routers/profile.ts` - Add upload photo endpoint

### Implementation Details

#### Add Logout & Photo Picker to Profile Sheet
```typescript
// In EditProfileSheet component:
// 1. Add photo picker button (before name input)
// 2. Add logout button (bottom of sheet)
// 3. Make sheet draggable (already using panGesture ✅)

const handlePhotoSelect = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: false,
    quality: 0.8,
    aspect: [1, 1],
  });
  
  if (!result.canceled && result.assets[0]) {
    const formData = new FormData();
    const expoFile = new ExpoFile(result.assets[0].uri);
    formData.append("photo", expoFile as any, result.assets[0].fileName || "photo.jpg");
    
    try {
      const response = await fetch(`${API_URL}/api/profile/upload-photo`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      localQC.invalidateQueries({ queryKey: orpc.profile.me.queryKey() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Photo upload failed");
    }
  }
};

const handleLogout = async () => {
  await authClient.signOut();
  router.replace("/(auth)/sign-in");
};
```

#### Add Photo Upload Endpoint
```typescript
// packages/api/src/routers/profile.ts
export const profileRouter = {
  // ... existing
  
  uploadPhoto: protectedProcedure
    .input(z.object({ /* FormData-like validation */ }))
    .mutation(async ({ input, ctx }) => {
      const url = await uploadToStorage(input.photo);
      const updated = await prisma.user.update({
        where: { id: ctx.user.id },
        data: { image: url },
      });
      return { image: updated.image };
    }),
};
```

---

## Issue 3: Filter System Fix

### Current State
- Filter toggle exists at `apps/native/app/(tabs)/index.tsx` (line 35)
- CategoryFilters component referenced but may not be working
- Problem: Filters open/close but don't actually filter the results

### Root Cause
The `CategoryFilters` component likely exists but:
1. May not update the query state properly
2. May not invalidate/refetch on category change
3. The queryKey for packs.list may not include the activeCategory

### Solution: Phase 3 - Fix Filter Logic

**Files to modify:**
1. `apps/native/app/(tabs)/index.tsx` - Fix filter state management
2. `apps/native/components/home/category-filters.tsx` - Ensure it updates parent state
3. Verify `packages/api/src/routers/packs.ts` supports filtering

### Implementation Details

```typescript
// apps/native/app/(tabs)/index.tsx

const [activeCategory, setActiveCategory] = useState<string | null>(null);
const [filtersOpen, setFiltersOpen] = useState(false);

// FIX: Include activeCategory in queryKey so changing it refetches
const { data: packs, isLoading } = useQuery(
  orpc.packs.list.queryOptions({
    input: {
      category: activeCategory || undefined,
      limit: 20,
      cursor: 0,
      sort: "new",
    },
  })
);

// Pass down handler
<CategoryFilters
  isOpen={filtersOpen}
  onToggle={() => setFiltersOpen(!filtersOpen)}
  activeCategory={activeCategory}
  onCategoryChange={(category) => {
    setActiveCategory(category);
    setFiltersOpen(false); // Close after selection
  }}
/>
```

---

## Issue 4: Sticky Back Button (Already Partially Done ✅)

### Current State
- Back button is already sticky/floating in `apps/native/app/pack/[id].tsx` (lines 168-174)
- Uses `position: absolute` with `zIndex: 100`
- Icon-only (chevron) without text ✅
- Already implemented correctly!

### What's Missing
- May need to apply same pattern to other screens:
  - Profile page
  - Home screen
  - Saved packs screen
  - Upload screen

### Solution: Phase 4 - Standardize Back Button Pattern

**Files to update:**
1. `apps/native/app/(tabs)/profile.tsx` - Add sticky back button
2. `apps/native/app/(tabs)/index.tsx` - Add sticky back button
3. `apps/native/app/(tabs)/saved.tsx` - Add sticky back button
4. `apps/native/app/(tabs)/upload.tsx` - Add sticky back button

**Implementation:** Copy the floating back button pattern from pack/[id].tsx:

```typescript
// Reusable floating back button component
function FloatingBackButton({ onPress, animated = true }) {
  const backScale = useSharedValue(1);
  
  const handlePress = () => {
    backScale.value = withSequence(
      withSpring(0.88, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 8, stiffness: 280 }),
    );
    onPress();
  };
  
  const backAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }],
  }));
  
  return (
    <AnimatedPressable 
      style={[styles.floatingBack, backAnimStyle]} 
      onPress={handlePress}
    >
      <Ionicons name="chevron-back" size={18} color="#FFF500" />
    </AnimatedPressable>
  );
}
```

---

## Implementation Order (TDD Approach)

### Phase 1: oRPC Saves Router (2-3 hours)
- [ ] Create `saves.ts` router with mutations + query
- [ ] Create `download.ts` router with trackDownload
- [ ] Export routers in `routers/index.ts`
- [ ] Test saves/unsave mutations on client
- [ ] Test download tracking
- [ ] Verify queryKey invalidation works

### Phase 2: Profile Redesign (2-3 hours)
- [ ] Add photo picker to EditProfileSheet
- [ ] Add logout button + handler
- [ ] Create photo upload endpoint
- [ ] Update profile.ts router
- [ ] Test photo upload
- [ ] Test logout flow
- [ ] Verify sheet drag behavior still works

### Phase 3: Filter Fix (1-2 hours)
- [ ] Fix queryKey to include activeCategory
- [ ] Update CategoryFilters to call parent handler
- [ ] Test filtering by category/tag
- [ ] Verify refetch on filter change
- [ ] Test clearing filters

### Phase 4: Sticky Back Buttons (1 hour)
- [ ] Extract floating back button component
- [ ] Apply to profile, home, saved, upload screens
- [ ] Test on different screen sizes
- [ ] Verify no z-index conflicts

---

## Key Files Summary

| File | Purpose | Status |
|------|---------|--------|
| `packages/api/src/routers/saves.ts` | Save/unsave mutations | ❌ CREATE |
| `packages/api/src/routers/download.ts` | Download tracking | ❌ CREATE |
| `packages/api/src/routers/index.ts` | Export all routers | ⚠️ UPDATE |
| `packages/api/src/routers/profile.ts` | Profile operations | ⚠️ UPDATE |
| `apps/native/app/pack/[id].tsx` | Pack detail screen | ✅ DONE |
| `apps/native/app/(tabs)/profile.tsx` | Profile page | ⚠️ UPDATE |
| `apps/native/app/(tabs)/index.tsx` | Home with filters | ⚠️ UPDATE |
| `apps/native/app/(tabs)/saved.tsx` | Saved packs | ⚠️ UPDATE |
| `apps/native/app/(tabs)/upload.tsx` | Upload screen | ⚠️ UPDATE |

---

## Testing Checklist

### oRPC + Buttons
- [ ] Save pack → verify in savedByUser field
- [ ] Unsave pack → verify removed from saves
- [ ] Download button → track download count
- [ ] WhatsApp button → opens WhatsApp share dialog
- [ ] All buttons show loading state

### Profile
- [ ] Upload photo → updates in profile
- [ ] Edit username → saves and updates
- [ ] Edit bio → saves and updates
- [ ] Sheet is draggable (dismiss with swipe down)
- [ ] Logout → clears auth and redirects to login

### Filters
- [ ] Click category → filters packs
- [ ] Clear category → shows all packs
- [ ] Filter persists while scrolling
- [ ] Filter state doesn't break when navigating away/back

### Back Buttons
- [ ] Visible even when scrolled
- [ ] Can click while scrolled
- [ ] Animation smooth on all screens
- [ ] Doesn't overlap content on short screens

---

## Notes
- Use TypeScript strict mode (no `any` types)
- Follow immutable update patterns
- All mutations should include error handling
- Coordinate queryKey invalidation to avoid stale data
- Test on both iOS simulator and Android emulator
- Mock network requests in tests
