# UBERMENSCH - Personal Health Optimization System
## Comprehensive Design Specification v1.0
### December 2024

---

## Executive Summary

Ubermensch is a personal health optimization application designed to help the user (Ali, 55, business owner) reclaim morning time for health practices now that his business (OJPM) is stabilizing. The app integrates fitness tracking, supplement management, recipe recommendations, daily journaling, and AI-powered health coaching into a single cohesive system.

**Philosophy**: Built on Nietzsche's Übermensch principles of self-mastery, continuous becoming, and overcoming—combined with Aristotelian balance and practical TCM/naturopathic wisdom.

**Target User**: The sole user is Ali. This is a personal tool, not a SaaS product (SaaS potential exists for future but is out of scope for MVP).

---

## Table of Contents

1. [MVP Feature Scope](#mvp-feature-scope)
2. [Data Models](#data-models)
3. [Feature Specifications](#feature-specifications)
4. [Technical Architecture](#technical-architecture)
5. [Existing Code Assets](#existing-code-assets)
6. [UI/UX Requirements](#uiux-requirements)
7. [Phase 2+ Features](#phase-2-features)
8. [Implementation Roadmap](#implementation-roadmap)

---

## MVP Feature Scope

### In Scope (MVP)

| Feature | Priority | Description |
|---------|----------|-------------|
| **Workout System** | P0 | Templates for Qigong, calisthenics, walking with timer support |
| **Video Library** | P0 | Stream workout videos from local server/Google Drive (2,000+ videos) |
| **Supplement Tracking** | P0 | Track daily supplement intake, inventory, scheduling |
| **Daily Metrics** | P0 | Log energy, sleep, libido, cramping, water intake, symptoms |
| **Morning/Evening Diary** | P0 | Structured journaling for health observations |
| **Recipe Database** | P1 | Keto/Blood Type diet recipes with ingredient search |
| **AI Health Coach** | P1 | Contextual recommendations based on logged data |
| **Pantry/Inventory** | P1 | Track what's in fridge/pantry for recipe suggestions |

### Out of Scope (MVP)

| Feature | Reason | Target Phase |
|---------|--------|--------------|
| Astrological timing | Handled by StormEye app | N/A |
| Bloodwork/Labs tracking | Complex, needs medical data integration | Phase 2 |
| Grocery shopping agent | Depends on recipe + vendor database | Phase 2 |
| Calendar view of history | Nice-to-have analytics | Phase 2 |
| Multi-user/SaaS | Personal tool first | Phase 3+ |
| Mobile native app | PWA sufficient for MVP | Phase 3+ |

---

## Data Models

### User Profile

```json
{
  "user": {
    "id": "ali_001",
    "name": "Ali",
    "birthdate": "1969-XX-XX",
    "age": 55,
    "weight_lbs": null,
    "height_inches": null,
    "blood_type": "O+",
    "health_conditions": ["kidney_stone_history"],
    "fitness_level": "returning",
    "goals": {
      "primary": "rebuild_morning_routine",
      "fitness": ["qigong_daily", "calisthenics_3x_week", "walking_daily"],
      "health": ["supplement_consistency", "energy_optimization", "weight_management"]
    },
    "preferences": {
      "diet_type": ["keto", "blood_type_diet"],
      "medicine_philosophy": ["naturopathic", "tcm", "whole_food_supplements"],
      "workout_time": "morning",
      "workout_duration_minutes": 60
    }
  }
}
```

### Supplement

```json
{
  "supplement": {
    "id": "supp_001",
    "name": "Magnesium Glycinate",
    "brand": "Pure Encapsulations",
    "dosage": "400mg",
    "form": "capsule",
    "category": "mineral",
    "schedule": {
      "frequency": "daily",
      "times": ["evening"],
      "with_food": true
    },
    "inventory": {
      "quantity_remaining": 45,
      "unit": "capsules",
      "reorder_threshold": 14,
      "vendor": "Amazon",
      "vendor_url": "https://...",
      "price_per_unit": 0.35
    },
    "benefits": ["sleep", "muscle_relaxation", "kidney_health"],
    "interactions": [],
    "notes": "Take 30 min before bed"
  }
}
```

### Supplement Log Entry

```json
{
  "supplement_log": {
    "id": "log_001",
    "date": "2024-12-23",
    "supplement_id": "supp_001",
    "taken": true,
    "time_taken": "21:30",
    "dosage_taken": "400mg",
    "notes": ""
  }
}
```

### Daily Metrics

```json
{
  "daily_metrics": {
    "id": "metrics_001",
    "date": "2024-12-23",
    "morning": {
      "wake_time": "06:00",
      "sleep_quality": 4,
      "energy_level": 3,
      "mood": 4,
      "weight_lbs": null,
      "symptoms": ["mild_stiffness"],
      "notes": "Slept well, slight lower back tightness"
    },
    "evening": {
      "energy_level": 3,
      "mood": 4,
      "libido": 3,
      "cramping": "none",
      "stress_level": 2,
      "symptoms": [],
      "notes": "Good productive day"
    },
    "throughout_day": {
      "water_oz": 64,
      "movement_minutes": 45,
      "steps": 8500,
      "bowel_movements": 1,
      "supplements_taken": true
    }
  }
}
```

### Exercise

```json
{
  "exercise": {
    "id": "ex_001",
    "name": "8 Brocades (Ba Duan Jin)",
    "category": "qigong",
    "subcategory": "morning_routine",
    "type": "timed",
    "default_duration_seconds": 900,
    "instructions": "Traditional 8-movement Qigong sequence for health and vitality",
    "progression_notes": "Add standing meditation after mastering basic sequence",
    "beginner_modification": "Perform seated or with smaller movements",
    "video_paths": [
      "Breath Work, Tai Chi & Qi Gong/!Chi Gong/!Movements/!Ba Duan Jin/",
      "Breath Work, Tai Chi & Qi Gong/!Chi Gong/Morning Routines/"
    ],
    "equipment_needed": [],
    "targets": ["energy", "flexibility", "internal_strength"]
  }
}
```

### Workout Template

```json
{
  "workout_template": {
    "id": "template_001",
    "name": "Getting Back Into It",
    "description": "Gentle reintroduction to morning practice",
    "duration_minutes": 30,
    "difficulty": "beginner",
    "frequency": "2-3x per week",
    "phases": [
      {
        "name": "Qigong Warm-up",
        "duration_minutes": 10,
        "exercises": [
          {"exercise_id": "ex_001", "duration_seconds": 600},
          {"exercise_id": "ex_002", "duration_seconds": 180}
        ]
      },
      {
        "name": "Light Calisthenics",
        "duration_minutes": 15,
        "exercises": [
          {"exercise_id": "ex_010", "reps": 10, "sets": 2, "percentage_of_max": 50},
          {"exercise_id": "ex_011", "reps": 8, "sets": 2, "percentage_of_max": 50},
          {"exercise_id": "ex_012", "duration_seconds": 30}
        ]
      },
      {
        "name": "Walking",
        "duration_minutes": 15,
        "exercises": [
          {"exercise_id": "ex_020", "loops": 1, "loop_distance_miles": 1.37}
        ]
      }
    ]
  }
}
```

### Workout Session (Completed)

```json
{
  "workout_session": {
    "id": "session_001",
    "date": "2024-12-23",
    "template_id": "template_001",
    "started_at": "06:15",
    "completed_at": "06:52",
    "duration_minutes": 37,
    "exercises_completed": [
      {
        "exercise_id": "ex_001",
        "completed": true,
        "actual_duration_seconds": 620,
        "notes": "Felt good, held positions longer"
      },
      {
        "exercise_id": "ex_010",
        "completed": true,
        "actual_reps": 12,
        "actual_sets": 2,
        "skipped": false,
        "notes": ""
      }
    ],
    "overall_notes": "Good session, energy was high",
    "perceived_difficulty": 3,
    "videos_watched": ["video_id_001", "video_id_002"]
  }
}
```

### Recipe

```json
{
  "recipe": {
    "id": "recipe_001",
    "name": "Anti-Inflammatory Green Smoothie",
    "category": "smoothie",
    "diet_compatibility": ["keto", "blood_type_O"],
    "prep_time_minutes": 5,
    "servings": 1,
    "health_benefits": ["anti_inflammatory", "energy", "kidney_support"],
    "best_for_symptoms": ["fatigue", "inflammation", "morning_boost"],
    "ingredients": [
      {"name": "spinach", "amount": 2, "unit": "cups", "pantry_category": "produce"},
      {"name": "avocado", "amount": 0.5, "unit": "whole", "pantry_category": "produce"},
      {"name": "coconut milk", "amount": 1, "unit": "cup", "pantry_category": "dairy_alt"},
      {"name": "ginger", "amount": 1, "unit": "inch", "pantry_category": "produce"},
      {"name": "turmeric powder", "amount": 0.5, "unit": "tsp", "pantry_category": "spices"},
      {"name": "MCT oil", "amount": 1, "unit": "tbsp", "pantry_category": "oils"}
    ],
    "instructions": [
      "Add coconut milk to blender",
      "Add spinach and blend until smooth",
      "Add remaining ingredients and blend until creamy",
      "Serve immediately"
    ],
    "nutritional_info": {
      "calories": 320,
      "fat_g": 28,
      "net_carbs_g": 6,
      "protein_g": 5,
      "fiber_g": 8
    },
    "tcm_properties": {
      "nature": "cooling",
      "benefits": ["clears heat", "nourishes yin"]
    },
    "vendor_links": {
      "MCT oil": "https://amazon.com/...",
      "turmeric powder": "https://amazon.com/..."
    }
  }
}
```

### Pantry Item

```json
{
  "pantry_item": {
    "id": "pantry_001",
    "name": "Spinach",
    "category": "produce",
    "location": "refrigerator",
    "quantity": 1,
    "unit": "bag",
    "expiration_date": "2024-12-28",
    "low_stock_threshold": 1,
    "preferred_vendor": "Costco",
    "notes": ""
  }
}
```

### Video

```json
{
  "video": {
    "id": "video_001",
    "title": "8 Brocades Full Practice",
    "file_path": "Breath Work, Tai Chi & Qi Gong/!Chi Gong/!Movements/!Ba Duan Jin/8_brocades_full.mp4",
    "category": "qigong",
    "subcategory": "ba_duan_jin",
    "duration_seconds": 1200,
    "instructor": "Unknown",
    "difficulty": "beginner",
    "exercise_mappings": ["ex_001"],
    "favorite": true,
    "last_watched": "2024-12-20",
    "watch_count": 15
  }
}
```

### Diary Entry

```json
{
  "diary_entry": {
    "id": "diary_001",
    "date": "2024-12-23",
    "type": "morning",
    "timestamp": "06:00",
    "content": {
      "gratitude": "Grateful for having more time now that OJPM is stabilizing",
      "intentions": "Complete full Qigong practice, stay hydrated",
      "physical_state": "Rested, slight stiffness in lower back",
      "mental_state": "Calm, focused",
      "dreams": "Nothing notable"
    }
  }
}
```

---

## Feature Specifications

### 1. Workout System

#### 1.1 Workout Templates

**Pre-built Templates** (from existing code):

1. **"Getting Back Into It"** (30-45 min)
   - Qigong warm-up: 8 Brocades + basic standing meditation
   - Light calisthenics: 50% pushup target, 50% situp target, 30s plank
   - Walking: 1-2 loops (1.37 miles each)
   - Frequency: 2-3x per week

2. **"Building Strength"** (45-60 min)
   - Qigong: Full 8 Brocades + 3-minute Zhan Zhuang
   - Strength: Full targets, multiple exercises
   - Walking: 2-3 loops
   - Frequency: 2x per week

3. **"Full Workout"** (60 min)
   - Complete Qigong practice
   - Full calisthenics circuit
   - Walking: 2+ loops
   - Frequency: 1x per week

4. **"Qigong & Walk"** (20-30 min)
   - Qigong only: 8 Brocades + meditation
   - Recovery walking: 1-2 loops
   - Frequency: Daily option / rest days

#### 1.2 Exercise Library

**Categories**:
- **Qigong**: 8 Brocades, Zhan Zhuang, Cloud Hands, Flowing Movements
- **Calisthenics**: Pushups, Situps, Plank, Squats, Mountain Climbers
- **Core**: Dead Bugs, Bird Dogs, Leg Raises, Glute Bridges
- **Cardio**: Walking (with loop tracking)
- **Boxing**: Basic combinations, footwork (from video library)

**Each Exercise Includes**:
- Name, category, type (timed vs reps)
- Instructions (2-3 sentences)
- Progression notes
- Beginner modifications
- Video paths (mapped to video library)
- Equipment needed

#### 1.3 Workout Session Interface

**Features**:
- Phase-by-phase progression
- Timer for timed exercises (Qigong, planks)
- Rep counter for strength exercises
- Checkbox completion tracking
- "Skip exercise" with reason tracking (injury, equipment, time)
- "Add extra set" for overachievement
- Notes field per exercise
- Video player integration (plays relevant video during exercise)
- Session summary on completion

### 2. Video Library Integration

#### 2.1 Video Sources

**Primary**: Local server (same machine hosting videos)
**Secondary**: Google Drive (backup access)

**Library Contents** (1,300+ videos):
- Boxing Training (Adolfo series, Title Boxing Vol 1-23, Everlast, etc.)
- Cardio (21 Day Fix, TurboFire, CIZE, Insanity, etc.)
- Strength Training (Convict Conditioning, P90X, etc.)
- Qigong/Tai Chi (Ba Duan Jin, Zhan Zhuang, etc.)
- Yoga
- Martial Arts (Krav Maga, Gracie Combatives, etc.)

#### 2.2 Video Features

- Category-based browsing matching folder structure
- Search by title, instructor, category
- Favorites system
- Recently watched
- Exercise-to-video mapping (auto-suggest video for current exercise)
- Streaming player with speed controls (0.5x - 2x)
- Offline indicator (graceful degradation if server unavailable)

### 3. Supplement Tracking

#### 3.1 Supplement Management

**Current Supplements to Track**:
- TRT (injection schedule tracking)
- Magnesium
- Omega-3
- Sea Moss
- (User can add custom supplements)

**Features**:
- Supplement database with dosage, timing, interactions
- Daily checklist interface
- Inventory tracking with reorder alerts
- Vendor links for reordering
- Consistency reports (% taken over time)
- Correlation analysis (supplements vs energy/libido metrics)

#### 3.2 Supplement Schedule

- Morning supplements
- With-meal supplements
- Evening supplements
- Weekly supplements (like B12 injection)
- Custom schedules

### 4. Daily Metrics

#### 4.1 Morning Check-in

**Captures**:
- Wake time
- Sleep quality (1-5)
- Sleep duration
- Energy level (1-5)
- Mood (1-5)
- Weight (optional)
- Morning symptoms (checklist + free text)
- Diary entry

#### 4.2 Evening Check-in

**Captures**:
- Energy level (1-5)
- Mood (1-5)
- Libido (1-5)
- Stress level (1-5)
- Cramping (None/Mild/Moderate/Severe)
- Evening symptoms
- Day summary notes
- Tomorrow's intentions

#### 4.3 Throughout-Day Tracking

- Water intake (oz or glasses)
- Movement minutes
- Steps (manual or future integration)
- Bowel movements
- Supplements taken (links to supplement module)

### 5. Morning/Evening Diary

#### 5.1 Morning Diary Structure

- **Gratitude**: What am I grateful for today?
- **Intentions**: What do I want to accomplish?
- **Physical state**: How does my body feel?
- **Mental state**: How is my mind?
- **Dreams**: Any notable dreams? (optional)
- **Free notes**: Anything else

#### 5.2 Evening Diary Structure

- **Wins**: What went well today?
- **Challenges**: What was difficult?
- **Lessons**: What did I learn?
- **Health observations**: Any notable symptoms or changes?
- **Tomorrow focus**: One thing to prioritize
- **Free notes**: Anything else

### 6. Recipe Database

#### 6.1 Recipe Categories

- **Smoothies**: Quick morning options
- **Breakfast**: Keto-friendly starts
- **Lunch**: Simple, portable options
- **Dinner**: Full meals
- **Snacks**: Blood-sugar friendly
- **Therapeutic**: Condition-specific (kidney support, anti-inflammatory)

#### 6.2 Recipe Features

- Filter by diet (keto, blood type O)
- Filter by available pantry ingredients
- Filter by health benefit / symptom relief
- Nutritional info (macros, net carbs)
- TCM properties (warming/cooling, organ targets)
- Vendor links for specialty ingredients
- Scaling for servings
- Favorite recipes
- Recently made

#### 6.3 Recipe Recommendations

AI-powered suggestions based on:
- Current pantry inventory
- Recent symptoms logged
- Energy levels (suggest energizing foods if low)
- Time of day
- Recent eating patterns

### 7. Pantry/Inventory Management

#### 7.1 Pantry Tracking

**Locations**:
- Refrigerator
- Freezer
- Pantry/Cupboard
- Supplement shelf

**Features**:
- Add/remove items
- Track quantities
- Expiration date alerts
- Low stock alerts
- "What can I make?" recipe suggestions
- Shopping list generation

### 8. AI Health Coach

#### 8.1 Contextual Recommendations

The AI coach has access to:
- All logged metrics (energy, sleep, symptoms)
- Supplement history
- Workout completion
- Diary entries
- Recipe history

**Provides**:
- Daily insights ("Your energy has been low the past 3 days—consider adding more B vitamins")
- Workout suggestions based on energy levels
- Recipe recommendations based on symptoms
- Supplement reminders
- Pattern identification
- Encouragement aligned with Übermensch philosophy

#### 8.2 Interaction Modes

- **Dashboard insights**: Proactive cards with observations
- **Chat interface**: Ask questions about your health data
- **Contextual prompts**: During workout ("Great job! You've done 3 more pushups than last week")

---

## Technical Architecture

### Stack Recommendation

**Frontend**: React + TypeScript (existing)
- Tailwind CSS for styling
- Recharts for data visualization
- PWA support for offline access

**Backend**: Flask + Python (existing)
- SQLAlchemy ORM
- SQLite database (local storage)
- REST API

**Video Streaming**: 
- Local file server (Flask static files or nginx)
- Google Drive API as fallback

**AI Integration**:
- OpenAI API or Claude API for health coaching
- Local context injection from database

### Deployment Options

1. **Local Only**: Run on laptop, access via localhost
2. **Home Server**: Deploy to Ali's backup server, access on local network
3. **Google Site + Drive**: Static frontend on Google Site, videos from Drive (limited)

**Recommended**: Home server deployment
- Videos already on server
- Can access from any device on network
- No cloud costs
- Full control

### File Structure

```
ubermensch/
├── backend/
│   ├── src/
│   │   ├── main.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── supplement.py
│   │   │   ├── exercise.py
│   │   │   ├── workout.py
│   │   │   ├── recipe.py
│   │   │   ├── pantry.py
│   │   │   ├── metrics.py
│   │   │   ├── diary.py
│   │   │   └── video.py
│   │   ├── routes/
│   │   │   ├── supplements.py
│   │   │   ├── workouts.py
│   │   │   ├── recipes.py
│   │   │   ├── metrics.py
│   │   │   ├── videos.py
│   │   │   └── ai_coach.py
│   │   └── services/
│   │       ├── ai_coach.py
│   │       └── video_server.py
│   ├── data/
│   │   ├── seed_exercises.py
│   │   ├── seed_templates.py
│   │   └── seed_supplements.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── WorkoutSession.jsx
│   │   │   ├── VideoPlayer.jsx
│   │   │   ├── SupplementTracker.jsx
│   │   │   ├── DailyMetrics.jsx
│   │   │   ├── DiaryEntry.jsx
│   │   │   ├── RecipeBrowser.jsx
│   │   │   ├── PantryManager.jsx
│   │   │   └── AICoach.jsx
│   │   ├── utils/
│   │   │   └── validation.js
│   │   └── App.jsx
│   └── package.json
├── videos/                    # Symlink to video library
├── recipes/                   # JSON recipe files
│   ├── smoothies.json
│   ├── breakfast.json
│   └── ...
└── README.md
```

---

## Existing Code Assets

### Reusable from Current Codebase

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| Workout Templates Model | `models/workout_templates.py` | ✅ Ready | 4 templates defined |
| Exercise Library | `data/seed_templates.py` | ✅ Ready | 14 exercises |
| Video Server Routes | `routes/video_server.py` | ✅ Ready | Streaming infrastructure |
| Video Library Models | `models/video_library.py` | ✅ Ready | Category system |
| VideoPlayer Component | `components/VideoPlayer.jsx` | ✅ Ready | Full controls |
| VideoWorkoutSession | `components/VideoWorkoutSession.jsx` | ✅ Ready | Video + exercise integration |
| VideoLibraryBrowser | `components/VideoLibraryBrowser.jsx` | ✅ Ready | Browse/search/favorites |
| Validation System | `utils/validation.js` | ✅ Ready | Form validation |
| Error Boundaries | `components/ErrorBoundary.jsx` | ✅ Ready | Crash protection |
| Toast Notifications | `components/ToastNotification.jsx` | ✅ Ready | User feedback |
| Profile Editor | `components/ProfileEditor.jsx` | ✅ Ready | User settings |
| Data Management | `components/DataManagement.jsx` | ✅ Ready | Export/import/reset |

### Needs Building

| Component | Priority | Complexity |
|-----------|----------|------------|
| Supplement models + routes | P0 | Medium |
| Supplement tracking UI | P0 | Medium |
| Daily metrics models | P0 | Low |
| Morning/evening check-in UI | P0 | Medium |
| Diary models + UI | P0 | Low |
| Recipe models | P1 | Medium |
| Recipe browser UI | P1 | Medium |
| Pantry models + UI | P1 | Medium |
| AI coach service | P1 | High |
| AI coach UI | P1 | Medium |

---

## UI/UX Requirements

### Design Principles

1. **Morning-friendly**: Large touch targets, high contrast, minimal cognitive load
2. **Quick logging**: One-tap supplement tracking, swipe gestures
3. **Motivational**: Progress visualization, streak tracking, encouraging language
4. **Philosophical framing**: Occasional Nietzsche/Übermensch quotes and framing

### Key Screens

1. **Dashboard**
   - Today's workout status
   - Supplement checklist (quick toggle)
   - Key metrics summary
   - AI coach insight card
   - Quick actions (start workout, log metrics, browse recipes)

2. **Workout Session**
   - Current exercise with video
   - Timer/rep counter
   - Progress through phases
   - Notes field
   - Skip/complete controls

3. **Supplement Tracker**
   - Today's schedule with checkboxes
   - Inventory overview
   - Reorder alerts
   - Add new supplement

4. **Daily Check-in** (Morning)
   - Sleep quality slider
   - Energy level slider
   - Symptom checklist
   - Diary text area
   - Quick submit

5. **Recipe Browser**
   - Filter sidebar (diet, symptoms, time)
   - Recipe cards with images
   - "What can I make?" based on pantry
   - Recipe detail with instructions

6. **AI Coach**
   - Chat interface
   - Insight cards
   - Data context display

### Mobile Responsiveness

- PWA installable
- Touch-optimized (44px minimum targets)
- Works offline (local storage caching)
- Portrait and landscape support

---

## Phase 2+ Features

### Phase 2 (Post-MVP)

1. **Bloodwork/Labs Tracking**
   - Upload lab results
   - Track key markers over time
   - AI interpretation
   - Correlation with symptoms

2. **Grocery Shopping Agent**
   - Generate shopping lists from recipes
   - Vendor price comparison
   - One-click ordering (Amazon, etc.)

3. **Calendar View**
   - Historical view of all data
   - Pattern visualization
   - Compare periods

4. **Advanced Analytics**
   - Correlation dashboards
   - Trend predictions
   - Goal tracking with milestones

### Phase 3 (Future)

1. **Wearable Integration**
   - Apple Watch / Fitbit sync
   - Automatic step counting
   - Sleep tracking import

2. **SaaS Conversion**
   - Multi-user support
   - Subscription billing
   - Marketing site

3. **Mobile Native App**
   - iOS / Android builds
   - Push notifications
   - Background tracking

---

## Implementation Roadmap

### Sprint 1: Foundation (Week 1-2)
- [ ] Set up clean project structure
- [ ] Migrate reusable components from existing code
- [ ] Implement supplement models and database
- [ ] Create supplement tracking UI
- [ ] Basic dashboard with supplement checklist

### Sprint 2: Workouts (Week 3-4)
- [ ] Migrate workout system from existing code
- [ ] Connect video library to local server
- [ ] Test video streaming
- [ ] Complete workout session interface

### Sprint 3: Metrics & Diary (Week 5-6)
- [ ] Implement daily metrics models
- [ ] Create morning check-in UI
- [ ] Create evening check-in UI
- [ ] Implement diary system
- [ ] Dashboard integration

### Sprint 4: Recipes & Pantry (Week 7-8)
- [ ] Create recipe data model
- [ ] Build initial recipe database (20-30 recipes)
- [ ] Recipe browser UI
- [ ] Pantry inventory system
- [ ] "What can I make?" feature

### Sprint 5: AI Coach (Week 9-10)
- [ ] Design AI prompt structure
- [ ] Implement context injection from database
- [ ] Create AI coach service
- [ ] Build chat interface
- [ ] Add insight cards to dashboard

### Sprint 6: Polish & Deploy (Week 11-12)
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Deploy to home server
- [ ] Documentation
- [ ] User acceptance testing

---

## Appendix A: Video Library Structure

```
!Boxing Training/
├── Boxing With Adolfo - Beginner's Boxing Lessons/ (11 videos)
├── DAVID HAYE'S BOX AND TONE/ (17 videos)
├── Everlast Advanced Boxing Workout/ (9 videos)
├── Kenny Weldon - How to Become a Better Boxer/ (3 videos)
└── Title Boxing Vol. 1-23/ (23 videos)

!Cardio/
├── 21 Day Fix/ (9 videos)
├── Beachbody - TurboFire/ (15 videos)
├── CIZE/ (videos)
├── Insanity/ (videos)
└── ...

!Strength Training/
├── Convict Conditioning/ (series)
├── P90X/ (series)
└── ...

Breath Work, Tai Chi & Qi Gong/
├── !Chi Gong/
│   ├── Morning Routines/
│   ├── !Movements/
│   │   ├── !Ba Duan Jin/
│   │   ├── !Zhan Zhuang/
│   │   └── Cloud Hands/
│   └── ...
└── ...

Gracie Combatives/ (13 videos)
Krav Maga/ (multiple series)
Shaolin Warrior Workout/ (3 volumes)
Coach Firas Zahabi/ (tutorials)
```

---

## Appendix B: Supplement Database (Initial)

| Name | Dosage | Frequency | Time | Category |
|------|--------|-----------|------|----------|
| TRT | varies | weekly | morning | hormone |
| Magnesium Glycinate | 400mg | daily | evening | mineral |
| Omega-3 Fish Oil | 2000mg | daily | with meal | fatty acid |
| Sea Moss | 1 tbsp | daily | morning | superfood |
| Vitamin D3 | 5000 IU | daily | morning | vitamin |
| Zinc | 30mg | daily | evening | mineral |
| B-Complex | 1 cap | daily | morning | vitamin |

---

## Appendix C: Recipe Categories (Initial)

### Smoothies (10 recipes)
- Anti-Inflammatory Green
- Kidney Support Berry
- Energy Booster
- Protein Power
- Detox Morning
- ...

### Breakfast (10 recipes)
- Keto Egg Muffins
- Avocado Toast (keto bread)
- Bulletproof Coffee
- ...

### Lunch (10 recipes)
- Salmon Salad
- Chicken Lettuce Wraps
- ...

### Dinner (10 recipes)
- Grass-Fed Steak with Vegetables
- Baked Salmon with Asparagus
- ...

---

*Document Version: 1.0*
*Created: December 23, 2024*
*Author: Claude (with Ali's vision)*
*Status: Ready for Development*
