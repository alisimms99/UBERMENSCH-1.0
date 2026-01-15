# UBERMENSCH Implementation Plan

## Current State Summary (Issue #32)

**Status:** MVP Complete as of December 25, 2025

### Completed Features
- Full-stack application (React + Flask + SQLite)
- Dashboard with workout tracking and supplement management
- 4 workout templates with 16 exercises
- Video library with 1,318+ indexed videos from NAS
- Server-side transcoding (MPEG4/AVI → H.264)
- Video browsing across 10 categories
- "Start as Workout" feature with timer and completion logging
- CI/CD pipeline (GitHub Actions with ESLint + flake8)
- Database migrations for video sessions and favorites

---

## Open Issues Analysis

| Issue | Title | Priority | Complexity | Phase |
|-------|-------|----------|------------|-------|
| #24 | Sub-Category Headers in Video Library | High | Medium | Now |
| #25 | Cast to TV - Firestick DLNA Support | High | High | 3 |
| #26 | Progress Page Backend Wiring | High | Medium | Now |
| #27 | Video Sessions in Daily Metrics | Medium | Low | Now |
| #28 | Video Favorites | Medium | Low | Now |
| #29 | Video Library Search | Medium | Medium | Now |
| #30 | Custom Workout Builder | Low | High | 4 |
| #31 | Multi-User Support | Low | High | 4 |

---

## Prioritized Implementation Plan

### Tier 1: Quick Wins (Low Complexity, Foundation Building)

**Order: #28 → #27**

#### 1. Issue #28: Video Favorites
**Estimated Effort:** Small | **Dependencies:** None | **Blocks:** Nothing

**Why First:**
- Database table `video_favorites` already exists
- Simple frontend-only toggle implementation
- Quick user-facing win that improves UX immediately

**Implementation:**
1. Add star toggle component to video cards in `LibraryCategory.jsx`
2. Create Favorites section on Library main page
3. Wire up API calls to existing `/api/library/favorites` endpoints

**Files to Modify:**
- `frontend/src/pages/LibraryCategory.jsx`
- `frontend/src/pages/Library.jsx`
- `frontend/src/lib/api.js` (add favorite toggle methods)

---

#### 2. Issue #27: Video Sessions in Daily Metrics
**Estimated Effort:** Small | **Dependencies:** None | **Blocks:** #26 (partial)

**Why Second:**
- `VideoSession` model exists, needs linking to metrics
- Improves data completeness for Progress page (#26)
- Backend-focused, low frontend changes

**Implementation:**
1. Modify `DailyMetrics` model or create linking table
2. Update metrics aggregation to include video workout duration
3. Add "video workout" section to dashboard metrics display

**Files to Modify:**
- `backend/src/routes/metrics.py`
- `backend/src/models/models.py` (if schema change needed)
- `frontend/src/components/Dashboard.jsx`

---

### Tier 2: Core Enhancement (Medium Complexity, High Impact)

**Order: #24 → #26 → #29**

#### 3. Issue #24: Sub-Category Headers in Video Library
**Estimated Effort:** Medium | **Dependencies:** None | **Blocks:** #29 (enhanced by)

**Why Third:**
- High priority per issue
- With 562 videos in single category, UX is significantly degraded
- Foundation for better search/navigation

**Implementation:**
1. **Backend:** Update `index_videos.py` to preserve subfolder hierarchy
2. **Backend:** Modify `/api/library/category` to return nested structure
3. **Frontend:** Add collapsible section components with chevron icons
4. **Frontend:** Show video count per subfolder

**Files to Modify:**
- `backend/src/data/index_videos.py` (or video indexing logic)
- `backend/src/routes/library.py`
- `frontend/src/pages/LibraryCategory.jsx`
- May need new component: `CollapsibleSection.jsx`

---

#### 4. Issue #26: Progress Page Backend Wiring
**Estimated Effort:** Medium | **Dependencies:** #27 (enhances) | **Blocks:** Nothing

**Why Fourth:**
- High priority - core feature is incomplete
- Backend infrastructure exists, needs wiring
- User can't track progress without this

**Implementation:**
1. Create/verify API endpoints for historical workout data
2. Implement trend calculation logic for exercises
3. Add measurement logging endpoints
4. Wire supplement adherence queries
5. Connect Progress.jsx to real backend data

**Files to Modify:**
- `backend/src/routes/progress.py`
- `backend/src/routes/metrics.py`
- `frontend/src/components/Progress.jsx`
- `frontend/src/lib/api.js`

---

#### 5. Issue #29: Video Library Search
**Estimated Effort:** Medium | **Dependencies:** #24 (benefits from) | **Blocks:** Nothing

**Why Fifth:**
- With 1,318+ videos, search is essential
- Benefits from subfolder structure (#24)
- Medium priority but high usability impact

**Implementation:**
1. **Backend:** Create search endpoint `/api/library/search`
2. **Backend:** Index video names, categories for fast search
3. **Frontend:** Add search input to Library page
4. **Frontend:** Implement result highlighting
5. **Frontend:** Add category filter dropdown

**Files to Modify:**
- `backend/src/routes/library.py`
- `frontend/src/pages/Library.jsx`
- `frontend/src/lib/api.js`

---

### Tier 3: Advanced Feature (High Complexity, Specialized)

#### 6. Issue #25: Cast to TV - Firestick DLNA Support
**Estimated Effort:** Large | **Dependencies:** None | **Blocks:** Nothing | **Phase:** 3

**Why Sixth:**
- High priority but high complexity
- Requires network protocol implementation
- Specialized feature for workout room UX

**Implementation Options:**

**Option A: DLNA/UPnP Server**
1. Add DLNA server library to Flask (e.g., `python-dlna`)
2. Implement SSDP discovery
3. Expose video streams as DLNA media items

**Option B: Chromecast Protocol**
1. Use `pychromecast` library
2. Implement device discovery
3. Send stream URLs to cast receiver

**Implementation:**
1. Add "Cast to TV" button in `LibraryPlayer.jsx`
2. Create device discovery service
3. Implement stream URL generation/transmission
4. Add playback controls for remote device

**Files to Modify:**
- `backend/src/routes/video_server.py` (add cast endpoint)
- `frontend/src/pages/LibraryPlayer.jsx`
- New: `backend/src/utils/casting.py`

---

### Tier 4: Future Phase (High Complexity, Low Priority)

**Phase 4 - Deferred**

#### 7. Issue #30: Custom Workout Builder
**Estimated Effort:** Large | **Dependencies:** #24, #26 | **Phase:** 4

**Why Deferred:**
- Low priority per issue
- Complex feature requiring multiple new models
- Current template system covers immediate needs

**When to Implement:**
After core features stable and user feedback gathered

---

#### 8. Issue #31: Multi-User Support
**Estimated Effort:** Very Large | **Dependencies:** All previous | **Phase:** 4

**Why Deferred:**
- Low priority - app is single-user by design
- Requires auth system overhaul
- Most complex change affecting entire codebase

**When to Implement:**
Only if family usage becomes primary requirement

---

## Recommended Sprint Plan

### Sprint 1: Foundation & Quick Wins
- [ ] Issue #28: Video Favorites
- [ ] Issue #27: Video Sessions in Daily Metrics

**Goal:** Improve daily usage experience, complete data integration

### Sprint 2: Library Experience
- [ ] Issue #24: Sub-Category Headers
- [ ] Issue #29: Video Library Search

**Goal:** Make 1,318+ video library navigable and searchable

### Sprint 3: Progress & Analytics
- [ ] Issue #26: Progress Page Backend Wiring

**Goal:** Complete the data story - users can track their journey

### Sprint 4: Premium Experience
- [ ] Issue #25: Cast to TV

**Goal:** Workout room experience enhancement

### Phase 4 (Future)
- Issue #30: Custom Workout Builder
- Issue #31: Multi-User Support

---

## Dependency Graph

```
                    ┌─────────────────────┐
                    │  #28 Video Favorites │ (Start Here)
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ #27 Video in Metrics │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
    ┌─────────────────┐ ┌───────────────┐ ┌───────────────┐
    │ #24 Sub-Category │ │ #26 Progress  │ │ #29 Search    │
    │    Headers       │ │    Backend    │ │               │
    └────────┬────────┘ └───────────────┘ └───────────────┘
             │
             └──────────────────────┐
                                    ▼
                          ┌─────────────────┐
                          │  #25 Cast to TV  │
                          └─────────────────┘

            ═══════════════ Phase 4 ═══════════════

    ┌─────────────────────┐     ┌─────────────────────┐
    │ #30 Custom Workout  │     │ #31 Multi-User      │
    │     Builder         │     │    Support          │
    └─────────────────────┘     └─────────────────────┘
```

---

## Technical Notes

### Existing Infrastructure to Leverage
- `VideoFavorite` model already in `models.py`
- `VideoSession` model exists for tracking
- `ProgressEntry` model available
- Video indexing via `video_index.json` (703KB, 1,318 entries)
- Recharts already integrated for visualizations

### Known Issues to Address
- API connection issues (hardcoded fallback user in `App.jsx`)
- Duplicate route definitions for workout sessions
- CORS configuration may need review

### Testing Strategy
- Each issue should include:
  - Backend route tests
  - Frontend component tests
  - Integration verification
  - Manual QA checklist

---

## Summary

| Priority | Issue | Sprint | Est. Complexity |
|----------|-------|--------|-----------------|
| 1 | #28 Video Favorites | 1 | Low |
| 2 | #27 Video in Metrics | 1 | Low |
| 3 | #24 Sub-Category Headers | 2 | Medium |
| 4 | #29 Video Search | 2 | Medium |
| 5 | #26 Progress Backend | 3 | Medium |
| 6 | #25 Cast to TV | 4 | High |
| 7 | #30 Custom Workout | Future | High |
| 8 | #31 Multi-User | Future | Very High |

**Total Active Issues:** 8
**Immediate Sprint Work:** 6 issues
**Deferred to Phase 4:** 2 issues
