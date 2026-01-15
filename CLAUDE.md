# UBERMENSCH Development Guide

## Stack
- Frontend: React (Vite)
- Backend: Flask + SQLite
- Video: 1,318+ files on NAS, server-side transcoding

## Current Sprint: 1 - Foundation & Quick Wins
Active issues: #28, #27

## Implementation Order
See: IMPLEMENTATION_PLAN.md

## Key Files
- Models: backend/src/models/models.py
- Video index: video_index.json (1,318 entries)
- API routes: backend/src/routes/
- Dashboard: frontend/src/components/Dashboard.jsx

## Known Issues
- Hardcoded fallback user in App.jsx
- Duplicate workout session routes
- CORS config may need review

## Convention
- Complete one issue fully before moving to next
- Test on mobile viewport (primary use case)
- Update issue status after completion
```

### Session Workflow

Start each Claude Code session with:
```
Read CLAUDE.md and IMPLEMENTATION_PLAN.md.

We're on Sprint 1, working Issue #28 (Video Favorites).

1. Show me the current VideoFavorite model
2. Show me the existing /api/library/favorites endpoints
3. Identify what's missing to wire this up
4. Propose implementation steps before coding
```

### After Each Issue Completes
```
Issue #28 is complete. 
1. Run tests to verify
2. Update IMPLEMENTATION_PLAN.md to mark #28 done
3. Move to Issue #27 - show me VideoSession model and how it relates to DailyMetrics
```

## One Flag

The plan notes "API connection issues (hardcoded fallback user in `App.jsx`)" - you might want Claude Code to fix that first since it could affect testing the other features. Quick command:
```
Before we start Sprint 1, show me the hardcoded fallback user issue in App.jsx and propose a fix that won't break local development.
