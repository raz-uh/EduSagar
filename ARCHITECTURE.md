# EduSagar Architecture & Workflow

## 1. PROJECT OVERVIEW

**EduSagar** is an AI-powered, decentralized e-learning platform that leverages:
- **React 19** for dynamic UI
- **Google Gemini AI** for intelligent course generation
- **Supabase** for cloud data persistence
- **Web3/Blockchain** for verifiable academic credentials
- **Tailwind CSS** for responsive design

**Purpose**: Enable students (especially in Nepal) to generate personalized courses, earn verifiable credentials, and maintain offline-first learning.

---

## 2. ARCHITECTURE LAYERS

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│  (React Components - App.tsx, UI pages, Sidebar)        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  STATE MANAGEMENT LAYER                  │
│  (useState, useEffect hooks, localStorage integration)  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                   │
│  (Services: Gemini, Supabase, Web3)                    │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                   DATA PERSISTENCE LAYER                 │
│  (localStorage for immediate cache, Supabase for sync) │
└─────────────────────────────────────────────────────────┘
```

---

## 3. DETAILED LAYER BREAKDOWN

### 3.1 PRESENTATION LAYER (UI Components)

**File**: [src/App.tsx](src/App.tsx) (651 lines)

**Key Components:**

1. **Sidebar Navigation**
   - Home Dashboard
   - Courses Library
   - Course Builder
   - Leaderboard
   - User Profile
   - Language Switcher (EN/NP)
   - Low-Data Mode Toggle

2. **View Sections**:
   - **Home**: User stats, recent courses, achievements
   - **Courses**: Browse available courses, enroll
   - **Course Viewer**: Learn lessons, take quizzes, view flashcards
   - **Course Builder**: Generate new courses with AI
   - **Leaderboard**: Top learners by points/streak
   - **Profile**: User credentials, earned badges, SBTs

3. **Interactive Elements**:
   - Course Cards (with progress indicator)
   - Lesson Content (with quiz, audio playback)
   - Flashcard Spaced Repetition (SRS)
   - Deep Dive generation (expand module)
   - Points & Badge display

**UI Framework**: Tailwind CSS with Lucide React icons

---

### 3.2 STATE MANAGEMENT LAYER

**Technology**: React Hooks (useState, useEffect)

**Key State Variables in App.tsx:**

```typescript
// UI State
const [activeTab, setActiveTab] = useState<'home' | 'courses' | 'leaderboard' | 'profile' | 'builder'>('home');
const [lang, setLang] = useState<Language>(Language.EN);
const [lowDataMode, setLowDataMode] = useState(false);

// User Data
const [user, setUser] = useState<UserProfile | null>(null);
const [courses, setCourses] = useState<Course[]>([]);
const [enrollments, setEnrollments] = useState<Record<string, string[]>>({}); // courseId -> lessonIds[]

// Active Context
const [activeCourse, setActiveCourse] = useState<Course | null>(null);
const [activeLesson, setActiveLesson] = useState<{moduleIdx: number, lessonIdx: number} | null>(null);
const [viewingFlashcards, setViewingFlashcards] = useState(false);

// Async States
const [isDeepDiving, setIsDeepDiving] = useState(false);
const [isListening, setIsListening] = useState(false);
```

**State Flow**:
1. On app load → Check localStorage for saved user/courses/enrollments
2. Calculate streak based on `lastActiveDate`
3. Update localStorage whenever state changes
4. Ready for Supabase sync (currently localStorage-only)

---

### 3.3 BUSINESS LOGIC LAYER (Services)

#### **3.3.1 Gemini Service** (`src/services/geminiService.ts`)

**Purpose**: AI-powered content generation

**Functions**:

| Function | Input | Output | Use Case |
|----------|-------|--------|----------|
| `generateCourseSyllabus()` | topic, target level | 5-module course skeleton | Initial course structure |
| `generateModuleDeepDive()` | course title, module, level, language | 4-5 lessons with quizzes & flashcards | Expand module with content |
| `guruBotAnswer()` | question, course context, language | AI tutor response | "Ask Guru" feature |
| `generateBridgeExplanation()` | concept, prerequisite, language | Simplified explanation | Concept bridge learning |
| `generateLessonAudio()` | lesson text | Audio file | Audio playback |

**Flow**:
```
User inputs topic → generateCourseSyllabus() → Creates skeleton
User clicks "Deep Dive" → generateModuleDeepDive() → Fills lessons
User takes quiz → handleCompleteLesson() → Earn points
User asks question → guruBotAnswer() → AI response
```

**API Integration**: 
- Uses `@google/genai` package
- Environment: `VITE_GEMINI_API_KEY` from `.env.local`
- Response: Structured JSON with Course object

---

#### **3.3.2 Supabase Service** (`src/services/supabaseService.ts`)

**Purpose**: Cloud database operations (30+ functions)

**Tables**:
- `users` - Student profiles, points, badges, wallet
- `courses` - Course content (modules as JSON)
- `enrollments` - Course enrollment & progress tracking

**Key Functions**:

**User Operations:**
```typescript
getUserProfile(userId) → UserProfile
createUserProfile(user) → UserProfile
updateUserProfile(userId, updates) → UserProfile
addPoints(userId, points) → void
updateStreak(userId) → void
addBadgeToUser(userId, badgeId) → void
```

**Course Operations:**
```typescript
getCourses(limit, offset) → Course[]
getCourseById(courseId) → Course
createCourse(course) → Course
updateCourse(courseId, updates) → Course
deleteCourse(courseId) → void
```

**Enrollment Operations:**
```typescript
getEnrollments(userId) → Enrollment[]
getEnrollment(userId, courseId) → Enrollment
createEnrollment(userId, courseId) → Enrollment
updateEnrollmentLessons(enrollmentId, lessonIds) → void
```

**Credential Operations:**
```typescript
addSBTCredential(userId, credential) → void
exportUserData(userId) → JSON export
```

**Current Status**: ✅ Fully implemented, ready to integrate into App.tsx
**Migration Path**: Replace localStorage calls with Supabase calls

---

#### **3.3.3 Web3 Service** (`src/services/web3Service.ts`)

**Purpose**: Blockchain credential verification

**Functions**:

| Function | Purpose | Status |
|----------|---------|--------|
| `linkAcademicID()` | Connect wallet via MetaMask | Fully functional |
| `getAcademicCredits()` | Read soulbound balance | Contract integration ready |
| `verifyAchievementOnChain()` | Register module completion on blockchain | Simulation mode |

**Technology**:
- **ethers.js 6.x** for blockchain interaction
- **ERC20-like soulbound token** (non-transferable)
- **Gasless transactions** for student experience

**Workflow**:
```
User clicks "Link Academic ID" → MetaMask popup
→ User connects wallet → Address saved to profile
→ Complete module → Achievement registered on-chain
→ Soulbound Token minted (non-transferable)
```

---

### 3.4 DATA PERSISTENCE LAYER

#### **Current: localStorage** (Browser Storage)

```javascript
// User data
localStorage.setItem('edusagar_user', JSON.stringify(user));

// Courses
localStorage.setItem('edusagar_courses', JSON.stringify(courses));

// Enrollments (courseId -> completedLessonIds)
localStorage.setItem('edusagar_enrollments', JSON.stringify(enrollments));
```

**Limitations**:
- ❌ No sync across devices
- ❌ Lost if browser cache is cleared
- ❌ ~5-10MB limit per domain
- ✅ Works offline

#### **Future: Supabase** (Cloud Database)

- ✅ Real-time sync across devices
- ✅ Persistent cloud storage
- ✅ User authentication (future)
- ✅ Row-level security

**Migration Steps** (documented in SETUP_CHECKLIST.md):
1. Initialize Supabase in App.tsx
2. Replace localStorage writes with `supabaseService` calls
3. Sync historical localStorage data to cloud
4. Toggle per-feature migration

---

## 4. DATA FLOW WORKFLOWS

### 4.1 Course Creation Workflow

```
┌──────────────────┐
│  User (Courses   │
│   Tab) Inputs    │
│  Topic + Level   │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  App.tsx: setActiveTab('builder')    │
│  Renders CourseBuilder component     │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ User clicks "Generate Course"        │
│ Topic: "React.js", Level: "Secondary"│
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ generateCourseSyllabus(topic, level) │
│ [geminiService.ts]                   │
│ Calls Google Gemini API              │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Gemini returns:                      │
│ {                                    │
│   modules: [ Module x5 ]             │
│   flashcards: [ Flashcard x20 ]     │
│   status: 'skeleton'                 │
│   points: 100                        │
│ }                                    │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ App.tsx:                             │
│ setCourses([...courses, newCourse])  │
│ localStorage.setItem('edusagar_courses') │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ UI renders new course in library     │
│ Status: "skeleton" (skeleton icon)   │
│ User sees "Deep Dive" button         │
└──────────────────────────────────────┘
```

### 4.2 Course Learning Workflow

```
┌──────────────────┐
│  User enrolls    │
│  in course       │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ enrollInCourse(course)               │
│ setActiveCourse(course)              │
│ setActiveLesson({moduleIdx: 0, ...}) │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ UI: CourseViewer component renders   │
│ - Module list (left sidebar)         │
│ - Lesson content (center)            │
│ - Quiz (right panel)                 │
│ - Flashcards option (bottom)         │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ User reads lesson → Takes quiz       │
│ Selects answer (A, B, C, or D)       │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ handleCompleteLesson(lessonId, score)│
│ Calculation:                         │
│   earned = 10 + (score * 10)         │
│   Points: 10-110 per lesson          │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Update state:                        │
│ - enrollments[courseId] += lessonId  │
│ - user.totalPoints += earned         │
│ - user.weeklyPoints += earned        │
│ - localStorage sync                  │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Check if module complete:            │
│ if allLessonsDone && walletLinked {  │
│   verifyAchievementOnChain()         │
│   mint SBT credential                │
│ }                                    │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ UI feedback:                         │
│ ✓ Lesson marked complete             │
│ ⭐ Points awarded                     │
│ 🎖️ Potential badge unlocked          │
│ ⛓️ SBT credential minted (optional)  │
└──────────────────────────────────────┘
```

### 4.3 Deep Dive Content Generation

```
User sees Module (skeleton) with "Deep Dive" button
              │
              ▼
    handleDeepDive(moduleIdx)
              │
              ▼
  generateModuleDeepDive(
    course.title,
    module.title,
    module.description,
    targetLevel,
    language
  ) [geminiService.ts]
              │
              ▼
  Gemini AI generates:
  - 4-5 detailed lessons
  - Quiz for each lesson
  - 8-10 flashcards per lesson
  - Audio content (optional)
              │
              ▼
  Update state:
  - activeCourse.modules[idx] = newContent
  - activeCourse.flashcards.push(...newCards)
  - localStorage sync
              │
              ▼
  UI: Module transitions from
  "skeleton" to "published" status
  Lessons become readable/interactive
```

### 4.4 Gamification Workflow (Points & Badges)

```
┌─────────────────────┐
│  Daily Login        │
│  Last active: 1 day │
│  ago                │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Streak Calculation │
│  diffDays == 1 →    │
│  streak++           │
│  (max: ∞)           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Lesson Completion Points                │
│  BASE: 10 points                        │
│  BONUS: 0-100 (10 × quiz score %)       │
│  TOTAL: 10-110 per lesson               │
│                                         │
│  Weekly Reset: totalPoints → weeklyPoints│
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Badge Unlocking System                  │
│  - Early Bird: 1st lesson               │
│  - Scholar: 5 modules complete          │
│  - Identity Verified: Wallet linked      │
│  - Top Learner: 1000 total points       │
│  - Streak Star: 5-day learning streak   │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Leaderboard Ranking                     │
│  Sorted by: totalPoints DESC            │
│  Display: Top 20 learners                │
│  Update: Real-time from state            │
└─────────────────────────────────────────┘
```

---

## 5. TYPE SYSTEM (TypeScript)

**File**: [src/types/index.ts](src/types/index.ts)

**Core Interfaces**:

```typescript
// User Profile
UserProfile {
  id: string
  name: string
  email: string
  avatar: string
  language: Language (EN | NP)
  walletAddress: string (optional)
  totalPoints: number
  weeklyPoints: number
  badges: string[] (badge IDs)
  streak: number
  lastActiveDate: ISO timestamp
  srsData: {} (spaced repetition intervals)
  sbtCredentials: [] (blockchain credentials)
}

// Course Structure
Course {
  id: string
  creatorId: string
  title: string
  description: string
  modules: Module[] (exactly 5)
  status: 'skeleton' | 'published'
  points: number (100-500)
  targetLevel: TargetLevel (6 levels)
  verifications: number (user count)
  confidenceScore: number (0-100)
  flashcards: Flashcard[]
  isSavedOffline: boolean
  ncfMapping: string (Nepal Curriculum Framework)
}

// Learning Progress
Enrollment {
  id: string (UUID)
  user_id: string
  course_id: string
  completed_lessons: string[] (lesson IDs)
  enrolled_at: timestamp
  completed_at: timestamp | null
  progress_percent: number (0-100)
}

// Module/Lesson/Quiz
Module {
  id: string
  title: string
  description: string
  isGenerated: boolean
  lessons: Lesson[]
}

Lesson {
  id: string
  title: string
  content: string (1000-2000 words)
  quiz: {
    question: string
    options: string[] (4 options)
    answer: string (correct option)
  }
  citation: string (URL reference)
  audioGenerated: boolean
}

Flashcard {
  id: string
  front: string (term/question)
  back: string (definition/answer)
  nextReviewDate: ISO date
  interval: number (SRS interval in days)
  easeFactor: number (2.5-4.0)
}
```

---

## 6. KEY WORKFLOWS & FEATURES

### Feature: Spaced Repetition System (SRS)

**Algorithm**:
- Flashcards track: `nextReviewDate`, `interval`, `easeFactor`
- User rates answer: Easy (4) → Medium (3) → Hard (2) → Fail (1)
- SM-2 Algorithm adjusts interval based on response
- Shows cards when `nextReviewDate <= today`

**Code Location**: App.tsx (Flashcard component)

---

### Feature: Streak & Daily Motivation

**Logic**:
```typescript
const today = new Date();
const lastActive = new Date(user.lastActiveDate);
const diffDays = Math.ceil(
  Math.abs(today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
);

if (diffDays === 1) {
  user.streak++; // Consecutive learning!
} else if (diffDays > 1) {
  user.streak = 1; // Reset streak
}
```

---

### Feature: Offline-First Architecture

**Implementation**:
- All data stored in `localStorage`
- App works 100% without internet
- Low-Data Mode: Disables images, simplifies UI
- Export bundle: Download course as JSON for offline sync

**Code**:
```typescript
const savedUser = localStorage.getItem('edusagar_user');
const savedCourses = localStorage.getItem('edusagar_courses');
const savedEnrollments = localStorage.getItem('edusagar_enrollments');
```

---

## 7. ENVIRONMENT CONFIGURATION

**File**: `.env.local`

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_GEMINI_API_KEY=AIzaSy...
```

**Build Configuration** (`vite.config.ts`):
- Root: `process.cwd()` (project root)
- Public Dir: `'public/'` (static assets)
- Port: 3000 (dev server)
- Output: `dist/` (production build)

---

## 8. COMPONENT HIERARCHY

```
App (Main Container)
├── Sidebar
│   ├── Logo (EduSagar)
│   ├── Nav Links
│   │   ├── Home
│   │   ├── Courses
│   │   ├── Builder
│   │   ├── Leaderboard
│   │   └── Profile
│   └── Language/Settings
│
├── Main Content Area
│   ├── Tab: Home (Dashboard)
│   │   ├── User Stats
│   │   ├── Recent Courses
│   │   └── Badges Display
│   │
│   ├── Tab: Courses (Library)
│   │   ├── Search/Filter
│   │   ├── Course Cards[]
│   │   │   ├── Title, Description
│   │   │   ├── Progress Bar
│   │   │   └── Enroll Button
│   │   └── Course Viewer (Active)
│   │       ├── Module Sidebar
│   │       ├── Lesson Content
│   │       ├── Quiz Panel
│   │       └── Flashcard View
│   │
│   ├── Tab: Builder (Course Generator)
│   │   ├── Input Form
│   │   │   ├── Topic
│   │   │   ├── Target Level
│   │   │   └── Language
│   │   └── Generated Preview
│   │       └── 5 Modules (Skeleton)
│   │
│   ├── Tab: Leaderboard
│   │   ├── Top 20 Users
│   │   └── Ranking Table
│   │
│   └── Tab: Profile
│       ├── User Info
│       ├── Stats (Points, Streak)
│       ├── Badges
│       ├── SBT Credentials
│       ├── Wallet Link
│       └── Export Data
```

---

## 9. INTEGRATION POINTS

### Gemini Integration
- **When**: Course generation, deep dive, Q&A
- **How**: `generateCourseSyllabus()`, `generateModuleDeepDive()`, `guruBotAnswer()`
- **API Key**: `VITE_GEMINI_API_KEY`

### Supabase Integration
- **When**: User registration, course sync, leaderboard
- **How**: 30+ CRUD functions in `supabaseService.ts`
- **Credentials**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **Status**: Ready to activate in App.tsx

### Web3 Integration
- **When**: User links wallet, module completion
- **How**: `linkAcademicID()`, `verifyAchievementOnChain()`
- **Network**: Ethereum/Polygon testnet
- **SBT**: Non-transferable credentials

---

## 10. DEPLOYMENT & BUILD

### Development
```bash
npm install
npm run dev          # Starts on http://localhost:3001
```

### Production
```bash
npm run build        # Creates dist/ folder
npm run preview      # Preview production build
```

**Build Output**:
- `dist/index.html` - Entry point
- `dist/assets/index-*.js` - Bundled code (~502 KB)
- `dist/assets/index-*.css` - Styles (included in JS)

---

## 11. SECURITY CONSIDERATIONS

### Data Protection
- ✅ Supabase Row Level Security (RLS) enabled
- ✅ User can only access own profile
- ✅ Courses publicly viewable, enrollments private
- ✅ No sensitive data in localStorage

### API Keys
- ✅ Keys in `.env.local` (gitignored)
- ✅ Build-time environment variable injection
- ✅ Supabase anon key has limited RLS scope

### Blockchain
- ✅ Soulbound tokens (non-transferable)
- ✅ Gasless transactions (meta-transactions)
- ✅ Credential immutability via blockchain

---

## 12. ROADMAP & FUTURE ENHANCEMENTS

| Feature | Status | Timeline |
|---------|--------|----------|
| Supabase sync in App.tsx | 🔄 Ready to integrate | Q1 2026 |
| User authentication (email/Google) | 📋 Planned | Q2 2026 |
| Real-time collaboration (courses) | 📋 Planned | Q2 2026 |
| Mobile app (React Native) | 📋 Planned | Q3 2026 |
| Video lessons (YouTube embed) | 📋 Planned | Q2 2026 |
| Payment integration (courses) | 📋 Planned | Q3 2026 |
| NFT badges (burnable) | 🔄 Ready | Q2 2026 |
| Offline PWA mode | 📋 Planned | Q1 2026 |

---

## 13. SUMMARY

**EduSagar** follows a **layered architecture** with:
1. **UI Layer**: React components with Tailwind CSS
2. **State Layer**: React hooks + localStorage
3. **Service Layer**: Gemini, Supabase, Web3 integration
4. **Data Layer**: localStorage (current) → Supabase (future)

**Key Strengths**:
- ✅ Offline-first design (works without internet)
- ✅ AI-powered personalized content
- ✅ Blockchain credentials (verifiable)
- ✅ Gamification (points, badges, streaks)
- ✅ Multilingual support (EN/NP)

**Next Steps**:
1. Run SQL schema in Supabase
2. Create `.env.local` with credentials
3. Start dev server: `npm run dev`
4. Optionally migrate App.tsx to use Supabase functions
