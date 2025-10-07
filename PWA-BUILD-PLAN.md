# Bwaincell PWA Companion App - Build Plan

**Project Name:** Bwain.app
**Target Users:** Personal (2 users - Luke & Wife)
**Timeline:** 4 weeks
**Status:** Planning Phase
**Created:** 2025-10-04

---

## 🎯 **Project Vision**

A beautiful, modern Progressive Web App (PWA) companion for the Bwaincell Discord bot. Provides a mobile-friendly dashboard for managing tasks, lists, notes, reminders, and budget without needing Discord. Features real-time sync, offline support, and a stunning visual design inspired by the anime film "Your Name" (Kimi no Na wa).

### **Core Philosophy**
- **Personal & Intimate** - Built for two people who share their lives
- **Beautiful & Delightful** - Every interaction should feel magical
- **Fast & Reliable** - Works offline, syncs instantly
- **Simple & Powerful** - Easy to use, but feature-rich when needed

---

## 🎨 **Visual Design Language**

### **Color Palette - "Your Name" Inspired**

**Primary Colors (Twilight/Magic Hour)**
```css
/* Twilight Sky Gradient */
--twilight-purple: #8B7AB8;    /* Deep twilight purple */
--twilight-pink: #E8B4B8;      /* Soft pink clouds */
--twilight-orange: #F4B183;    /* Warm sunset orange */
--twilight-blue: #7D9BC3;      /* Evening sky blue */

/* Comet Trail (Accent) */
--comet-teal: #5CC5C5;         /* Bright teal/cyan */
--comet-glow: #A8E6CF;         /* Soft mint glow */

/* Neutrals */
--bg-primary: #1a1a2e;         /* Deep night blue */
--bg-secondary: #16213e;       /* Slightly lighter */
--bg-card: #0f3460;            /* Card backgrounds */
--text-primary: #eef1ff;       /* Soft white */
--text-secondary: #b8c5d6;     /* Muted blue-gray */

/* Semantic Colors */
--success: #6BCF7E;            /* Fresh green */
--warning: #FFB347;            /* Warm amber */
--danger: #FF6B9D;             /* Soft pink-red */
```

**Gradient Backgrounds**
```css
/* Header/Hero Gradient */
background: linear-gradient(135deg, #8B7AB8 0%, #E8B4B8 50%, #F4B183 100%);

/* Card Hover Gradient */
background: linear-gradient(135deg, #0f3460 0%, #1a1a2e 100%);

/* Twilight Sky Background */
background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
```

### **Typography**
```css
/* Primary Font - Clean & Modern */
font-family: 'Outfit', 'Inter', -apple-system, sans-serif;

/* Headers */
H1: 40px, bold, 700, letter-spacing: -0.02em
H2: 32px, semi-bold, 600, letter-spacing: -0.01em
H3: 24px, medium, 500
H4: 20px, medium, 500

/* Body */
Body: 16px, normal, 400, line-height: 1.6
Small: 14px, normal, 400
Tiny: 12px, normal, 400

/* Accent Font - Handwritten Feel (for special touches) */
font-family: 'Caveat', cursive; /* For notes, signatures */
```

### **Visual Elements**
- **Glass Morphism** - Frosted glass cards with blur effects
- **Soft Shadows** - Multiple layered shadows for depth
- **Gradient Borders** - Subtle gradient outlines on cards
- **Particle Effects** - Floating particles on backgrounds (like comet dust)
- **Smooth Transitions** - 300-400ms ease-in-out for all interactions
- **Micro-animations** - Subtle bounce, fade, scale on interactions

---

## 🏗️ **Technical Architecture**

### **System Overview**
```
┌─────────────────────────────────────────────┐
│          Frontend PWA (Bwain.app)           │
│  Next.js 14 + TypeScript + Tailwind CSS    │
│  - Server Components (App Router)          │
│  - shadcn/ui + Custom Components           │
│  - Framer Motion (Animations)              │
│  - TanStack Query (Data Management)        │
│  - Zustand (Global State)                  │
└─────────────────────────────────────────────┘
                    ↕ REST API + WebSocket
┌─────────────────────────────────────────────┐
│          Backend API Layer (Fastify)        │
│        TypeScript + Zod Validation          │
│  - RESTful API endpoints                   │
│  - WebSocket for real-time sync            │
│  - JWT authentication (simple)             │
│  - Rate limiting & CORS                    │
└─────────────────────────────────────────────┘
                    ↕ SQL Queries
┌─────────────────────────────────────────────┐
│    Database (PostgreSQL via Prisma)         │
│  - Migrated from SQLite                    │
│  - Real-time subscriptions (LISTEN/NOTIFY) │
│  - Shared with Discord Bot                 │
└─────────────────────────────────────────────┘
```

### **Tech Stack**

**Frontend PWA**
| Technology | Purpose | Version |
|------------|---------|---------|
| Next.js | React framework | 14.x (App Router) |
| TypeScript | Type safety | 5.x |
| Tailwind CSS | Styling | 3.x |
| shadcn/ui | Component library | Latest |
| Framer Motion | Animations | 11.x |
| TanStack Query | Server state | 5.x |
| Zustand | Client state | 4.x |
| React Hook Form | Forms | 7.x |
| Zod | Validation | 3.x |
| Recharts | Data visualization | 2.x |
| Tiptap | Rich text editor | 2.x |
| Lucide Icons | Icon library | Latest |

**Backend API**
| Technology | Purpose | Version |
|------------|---------|---------|
| Fastify | API framework | 4.x |
| TypeScript | Type safety | 5.x |
| Prisma | ORM | 5.x |
| Zod | Validation | 3.x |
| Socket.io | WebSocket | 4.x |
| JWT | Authentication | 9.x |
| Pino | Logging | 8.x |

**Database & Deployment**
| Technology | Purpose | Provider |
|------------|---------|----------|
| PostgreSQL | Primary database | Fly.io |
| Vercel | Frontend hosting | Vercel |
| Fly.io | Backend API hosting | Fly.io |
| GitHub Actions | CI/CD pipeline | GitHub |

---

## 📋 **Feature Roadmap**

### **Phase 1: Foundation (Week 1)**

**Infrastructure Setup**
- [ ] Initialize Next.js 14 project with App Router
- [ ] Configure TypeScript (strict mode)
- [ ] Set up Tailwind CSS with custom "Your Name" theme
- [ ] Install and configure shadcn/ui components
- [ ] Set up Fastify API server
- [ ] Configure Prisma with PostgreSQL
- [ ] Implement simple authentication (JWT)

**MVP Features**
- [ ] Task list view (read-only)
- [ ] Task creation with quick-add input
- [ ] Dark theme implementation
- [ ] Basic responsive layout (mobile-first)
- [ ] API connection with error handling

**Deliverables**
- ✅ Working Next.js app with custom theme
- ✅ Fastify API with task endpoints
- ✅ PostgreSQL database migrated from SQLite
- ✅ Basic task viewing and creation

---

### **Phase 2: Core Features (Week 2)**

**Task Management - Full CRUD**
- [ ] Task editing with slide-out panel
- [ ] Task deletion with confirmation
- [ ] Task completion toggle
- [ ] Date/time picker (shadcn calendar)
- [ ] Task filtering (all/pending/completed/today)
- [ ] Task search with fuzzy matching
- [ ] Drag-and-drop reordering
- [ ] Bulk actions (select multiple, complete all, delete)

**List Management**
- [ ] Shopping list view with checkboxes
- [ ] List creation/deletion
- [ ] Item quick-add with Enter key
- [ ] Item reordering
- [ ] List categories/tags
- [ ] List templates (groceries, todos, packing)
- [ ] Shared lists (between Luke & Wife)

**Visual Polish**
- [ ] Implement Framer Motion animations
  - Page transitions (fade + slide)
  - Card hover effects (lift + glow)
  - List item animations (stagger)
- [ ] Loading states (skeleton screens)
- [ ] Optimistic UI updates
- [ ] Toast notifications (success/error/info)
- [ ] Pull-to-refresh on mobile
- [ ] Empty states with illustrations

**Deliverables**
- ✅ Full task management system
- ✅ Complete list functionality
- ✅ Polished animations and interactions
- ✅ Mobile-optimized UI

---

### **Phase 3: Advanced Features (Week 3)**

**Reminders & Notifications**
- [ ] Reminder list view (upcoming/past)
- [ ] Create/edit/delete reminders
- [ ] Push notifications setup (Web Push API)
- [ ] Notification permissions flow
- [ ] Reminder snooze functionality
- [ ] Recurring reminder management (daily/weekly)
- [ ] Notification preferences panel

**Notes System**
- [ ] Note list view (grid/list toggle)
- [ ] Rich text editor (Tiptap)
  - Bold, italic, underline
  - Bullet/numbered lists
  - Links
  - Code blocks
- [ ] Note categories/tags
- [ ] Search across all notes
- [ ] Pin important notes
- [ ] Note sharing between users
- [ ] Quick note widget

**Budget Tracking**
- [ ] Expense list view
- [ ] Income/expense creation
- [ ] Category management
- [ ] Monthly summary dashboard
- [ ] Visualization with charts (Recharts)
  - Category breakdown (pie chart)
  - Monthly trend (line chart)
  - Income vs Expense (bar chart)
- [ ] Export to CSV
- [ ] Budget goals and alerts

**Deliverables**
- ✅ Complete reminder system with push notifications
- ✅ Rich notes functionality
- ✅ Budget tracking with visualizations

---

### **Phase 4: PWA Features & Polish (Week 4)**

**Progressive Web App Capabilities**
- [ ] Service worker setup (Workbox)
- [ ] Offline support (cache-first strategy)
- [ ] Install prompt (custom UI)
- [ ] App manifest configuration
- [ ] Standalone mode (no browser chrome)
- [ ] Background sync (sync when back online)
- [ ] Share target API (add from other apps)
- [ ] App shortcuts (quick actions from home screen)

**Real-time Sync**
- [ ] WebSocket connection setup
- [ ] Live updates when other user adds/edits
- [ ] Presence indicator (who's online)
- [ ] Optimistic updates with rollback
- [ ] Conflict resolution (last-write-wins)
- [ ] Connection status indicator
- [ ] Reconnection handling

**UX Enhancements**
- [ ] Keyboard shortcuts
  - Cmd/Ctrl + K (command palette)
  - Cmd/Ctrl + N (new task)
  - Cmd/Ctrl + F (search)
  - Esc (close modals)
- [ ] Gesture controls
  - Swipe left to delete
  - Swipe right to complete
  - Long press for context menu
- [ ] Haptic feedback on mobile
- [ ] Voice input for tasks (Web Speech API)
- [ ] Widget-like home screen components

**Performance Optimization**
- [ ] Image optimization (Next.js Image)
- [ ] Code splitting (route-based)
- [ ] Bundle size optimization
- [ ] Lighthouse score > 95
- [ ] First Contentful Paint < 1s
- [ ] Time to Interactive < 2s

**Deliverables**
- ✅ Full PWA with offline support
- ✅ Real-time sync between users
- ✅ Advanced UX features
- ✅ Performance optimized (95+ Lighthouse)

---

## 🎨 **User Interface Design**

### **Home Dashboard**
```
┌───────────────────────────────────────────┐
│  ✨ Good evening, Luke                    │
│  [Twilight gradient background]           │
│  ───────────────────────────────────────  │
│                                           │
│  📊 Today's Overview                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│  │    3    │ │    5    │ │    2    │    │
│  │  Tasks  │ │  Lists  │ │Reminders│    │
│  │ pending │ │ active  │ │  today  │    │
│  └─────────┘ └─────────┘ └─────────┘    │
│                                           │
│  ⚡ Quick Add                             │
│  [+ New Task] [+ List Item] [+ Note]     │
│                                           │
│  📝 Today's Tasks                         │
│  ┌─────────────────────────────────────┐ │
│  │ ☐ Buy groceries          🕐 3:00 PM │ │
│  │ ☐ Call dentist                      │ │
│  │ ☑ Morning workout                   │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  🛒 Shopping List                         │
│  ┌─────────────────────────────────────┐ │
│  │ ☐ Milk                              │ │
│  │ ☐ Eggs                              │ │
│  │ ☑ Coffee                            │ │
│  │ [+ Add item...]                     │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  ⏰ Upcoming Reminders                    │
│  Dentist appointment - Tomorrow 2pm      │
│  Weekly planning - Friday 7pm            │
└───────────────────────────────────────────┘
```

### **Navigation Structure**

**Mobile (Bottom Tab Bar)**
```
┌───────────────────────────────────────────┐
│                                           │
│           [Main Content Area]             │
│                                           │
└───────────────────────────────────────────┘
┌───────────────────────────────────────────┐
│  🏠      ✓       📋      📝      ⏰      │
│ Home   Tasks   Lists   Notes  Reminders  │
└───────────────────────────────────────────┘
```

**Desktop (Sidebar)**
```
┌──────────┬────────────────────────────────┐
│  🏠 Home │                                │
│  ✓ Tasks │                                │
│  📋 Lists│      [Main Content Area]       │
│  📝 Notes│                                │
│  ⏰ Remind│                                │
│  💰 Budget│                                │
│  ⚙️ Settings                              │
└──────────┴────────────────────────────────┘
```

### **Task Detail Panel (Slide-out)**
```
┌─────────────────────────────────────────┐
│  ← Back              [Edit]  [Delete]   │
│  ─────────────────────────────────────  │
│                                         │
│  Buy groceries                          │
│  ☐ Mark as complete                     │
│                                         │
│  📅 Due Date & Time                     │
│  ┌─────────────────────────────────┐   │
│  │  Today at 3:00 PM               │   │
│  │  [Calendar picker]              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  📝 Description                         │
│  ┌─────────────────────────────────┐   │
│  │  Get milk, eggs, bread          │   │
│  │  from the grocery store         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  🏷️ Tags                                │
│  [Shopping] [Urgent] [+ Add tag]       │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │        [Save Changes]           │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### **Animations & Interactions**

**Page Transitions**
```javascript
// Fade + slide in from right
variants={{
  enter: { x: 50, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -50, opacity: 0 }
}}
transition={{ duration: 0.3, ease: "easeInOut" }}
```

**Card Hover Effects**
```css
/* Lift + glow on hover */
.card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 0 20px rgba(92, 197, 197, 0.3),
    0 10px 40px rgba(0, 0, 0, 0.3);
}
```

**List Item Animations**
```javascript
// Stagger animation for lists
variants={{
  visible: i => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
    },
  }),
  hidden: { opacity: 0, y: 20 },
}}
```

---

## 🔌 **API Architecture**

### **RESTful Endpoints**

**Authentication**
```
POST   /api/auth/login          - Login (simple password)
POST   /api/auth/logout         - Logout
GET    /api/auth/me             - Get current user
```

**Tasks**
```
GET    /api/tasks               - List all tasks
POST   /api/tasks               - Create task
GET    /api/tasks/:id           - Get task details
PATCH  /api/tasks/:id           - Update task
DELETE /api/tasks/:id           - Delete task
PATCH  /api/tasks/:id/complete  - Toggle complete
PATCH  /api/tasks/bulk          - Bulk operations
```

**Lists**
```
GET    /api/lists               - List all lists
POST   /api/lists               - Create list
GET    /api/lists/:id           - Get list with items
PATCH  /api/lists/:id           - Update list
DELETE /api/lists/:id           - Delete list
POST   /api/lists/:id/items     - Add item to list
PATCH  /api/lists/:id/items/:itemId - Update/toggle item
DELETE /api/lists/:id/items/:itemId - Delete item
```

**Notes**
```
GET    /api/notes               - List all notes
POST   /api/notes               - Create note
GET    /api/notes/:id           - Get note
PATCH  /api/notes/:id           - Update note
DELETE /api/notes/:id           - Delete note
GET    /api/notes/search?q=     - Search notes
```

**Reminders**
```
GET    /api/reminders           - List all reminders
POST   /api/reminders           - Create reminder
GET    /api/reminders/:id       - Get reminder
PATCH  /api/reminders/:id       - Update reminder
DELETE /api/reminders/:id       - Delete reminder
POST   /api/reminders/:id/snooze - Snooze reminder
```

**Budget**
```
GET    /api/budget/entries      - List entries
POST   /api/budget/entries      - Create entry
DELETE /api/budget/entries/:id  - Delete entry
GET    /api/budget/summary      - Monthly summary
GET    /api/budget/categories   - Category breakdown
GET    /api/budget/export       - Export to CSV
```

### **WebSocket Events**

**Client → Server**
```javascript
// Connection
socket.emit('authenticate', { token: 'jwt-token' });

// Presence
socket.emit('presence:update', { status: 'online' });

// Data updates
socket.emit('task:update', { id: 1, data: {...} });
```

**Server → Client**
```javascript
// Real-time updates
socket.on('task:created', (task) => {...});
socket.on('task:updated', (task) => {...});
socket.on('task:deleted', (id) => {...});

socket.on('list:updated', (list) => {...});
socket.on('note:created', (note) => {...});

// Presence
socket.on('presence:user-online', (user) => {...});
socket.on('presence:user-offline', (user) => {...});

// System
socket.on('sync:required', () => {...}); // Trigger full sync
```

### **Request/Response Format**

**Success Response**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "description": "Buy groceries",
    "completed": false,
    "dueDate": "2025-10-04T15:00:00Z"
  },
  "meta": {
    "timestamp": "2025-10-04T10:30:00Z"
  }
}
```

**Error Response**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid task description",
    "details": [
      {
        "field": "description",
        "message": "Description is required"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-10-04T10:30:00Z"
  }
}
```

---

## 🗄️ **Database Schema (Prisma)**

### **User Model**
```prisma
model User {
  id            String      @id @default(cuid())
  discordId     String      @unique
  username      String
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  tasks         Task[]
  lists         List[]
  notes         Note[]
  reminders     Reminder[]
  budgetEntries BudgetEntry[]
}
```

### **Task Model**
```prisma
model Task {
  id          Int       @id @default(autoincrement())
  description String
  completed   Boolean   @default(false)
  dueDate     DateTime?
  userId      String
  guildId     String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user        User      @relation(fields: [userId], references: [discordId])

  @@index([userId, guildId])
  @@index([dueDate])
}
```

### **List Model**
```prisma
model List {
  id        Int        @id @default(autoincrement())
  name      String
  userId    String
  guildId   String
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  items     ListItem[]
  user      User       @relation(fields: [userId], references: [discordId])

  @@index([userId, guildId])
}

model ListItem {
  id        Int      @id @default(autoincrement())
  text      String
  completed Boolean  @default(false)
  listId    Int
  order     Int      @default(0)

  list      List     @relation(fields: [listId], references: [id], onDelete: Cascade)

  @@index([listId])
}
```

### **Note Model**
```prisma
model Note {
  id        Int      @id @default(autoincrement())
  title     String
  content   String   @db.Text
  tags      String[] @default([])
  pinned    Boolean  @default(false)
  userId    String
  guildId   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [discordId])

  @@index([userId, guildId])
  @@index([pinned])
}
```

### **Reminder Model**
```prisma
model Reminder {
  id          Int      @id @default(autoincrement())
  message     String
  time        String
  frequency   String
  dayOfWeek   String?
  channelId   String
  userId      String
  guildId     String
  active      Boolean  @default(true)
  nextTrigger DateTime?
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [discordId])

  @@index([userId, guildId])
  @@index([nextTrigger])
}
```

### **Budget Entry Model**
```prisma
model BudgetEntry {
  id          Int      @id @default(autoincrement())
  type        String   // 'expense' or 'income'
  amount      Float
  category    String
  description String?
  date        DateTime @default(now())
  userId      String
  guildId     String
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [discordId])

  @@index([userId, guildId])
  @@index([date])
  @@index([category])
}
```

---

## 🚀 **Deployment Strategy**

### **Frontend (PWA)**
**Platform:** Vercel
- Free tier (generous limits)
- Automatic HTTPS
- Global CDN (edge network)
- Auto-deploy on push to main
- Environment variables for API URL

**Custom Domain**
- `bwain.app` or `app.bwaincell.com`
- SSL certificate (automatic via Vercel)

**Performance Targets**
- First Contentful Paint: < 1s
- Time to Interactive: < 2s
- Lighthouse Score: > 95

### **Backend API**
**Platform:** Fly.io
- Same platform as Discord bot (easy integration)
- Start with 1 instance (256MB RAM)
- Auto-scaling if needed
- PostgreSQL database on same platform

**Configuration**
```toml
# fly.toml for API
app = "bwaincell-api"
primary_region = "iad"

[build]

[env]
  NODE_ENV = "production"
  PORT = "8080"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

### **Database Migration (SQLite → PostgreSQL)**

**Migration Steps:**
1. Export existing SQLite data
2. Set up PostgreSQL on Fly.io
3. Update Prisma schema
4. Run migrations
5. Import data
6. Update Discord bot connection string
7. Test data integrity

**Why PostgreSQL?**
- Better for concurrent connections (PWA + Bot)
- Real-time features (LISTEN/NOTIFY)
- Better performance at scale
- Industry standard

### **CI/CD Pipeline**

**GitHub Actions Workflow**
```yaml
name: Deploy PWA

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: vercel/actions@v2
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm test
      - uses: superfly/flyctl-actions@v1
        with:
          args: "deploy"
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

---

## 📱 **PWA Installation Guide**

### **iOS (iPhone/iPad)**
1. Open Safari browser
2. Navigate to `bwain.app`
3. Tap the Share button
4. Scroll down and tap "Add to Home Screen"
5. Name the app "Bwain"
6. Tap "Add"
7. App icon appears on home screen

### **Android**
1. Open Chrome browser
2. Navigate to `bwain.app`
3. Tap menu (three dots)
4. Tap "Install app" or "Add to Home Screen"
5. Confirm installation
6. App appears in app drawer and home screen

### **Desktop (Chrome/Edge)**
1. Open Chrome or Edge
2. Navigate to `bwain.app`
3. Look for install icon in address bar
4. Click "Install Bwain"
5. App opens in standalone window
6. Access from Start Menu / Applications

---

## 🔒 **Security & Privacy**

### **Authentication**
- Simple password-based auth (just 2 users)
- JWT tokens with 7-day expiration
- Secure HttpOnly cookies
- CSRF protection

### **API Security**
- HTTPS only (enforced)
- CORS configuration (whitelist PWA domain)
- Rate limiting (100 req/min per IP)
- Input validation (Zod schemas)
- SQL injection prevention (Prisma ORM)

### **Data Privacy**
- No analytics or tracking
- No third-party services
- Data stored only on Fly.io (US region)
- No data sharing
- Export capability (own your data)

---

## 📊 **Success Metrics**

### **Performance**
- [ ] Lighthouse Performance Score > 95
- [ ] First Contentful Paint < 1s
- [ ] Time to Interactive < 2s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1

### **Reliability**
- [ ] 99.9% uptime
- [ ] < 1% error rate
- [ ] API response time < 200ms (p95)
- [ ] WebSocket reconnection < 2s

### **User Experience**
- [ ] Works offline (view cached data)
- [ ] Real-time sync < 500ms latency
- [ ] Mobile-responsive (all screen sizes)
- [ ] Supports iOS Safari, Chrome, Edge

---

## 🎯 **Implementation Timeline**

### **Week 1: Foundation (Oct 5-11)**
**Days 1-2: Setup**
- Initialize Next.js project
- Configure Tailwind with "Your Name" theme
- Set up Fastify API
- Configure Prisma + PostgreSQL

**Days 3-4: Basic Features**
- Task CRUD API endpoints
- Task list UI (read + create)
- Authentication flow

**Days 5-7: Polish**
- Implement custom theme
- Add animations
- Mobile responsive layout

### **Week 2: Core Features (Oct 12-18)**
**Days 8-10: Tasks**
- Full task management
- Drag-drop reordering
- Filters and search

**Days 11-13: Lists**
- Shopping list UI
- Item management
- List templates

**Days 14: Polish**
- Animations
- Loading states
- Error handling

### **Week 3: Advanced (Oct 19-25)**
**Days 15-17: Reminders & Notes**
- Reminder system
- Push notifications
- Rich text notes

**Days 18-19: Budget**
- Budget tracking
- Data visualization
- Charts and graphs

**Days 20-21: Integration**
- API integration complete
- Data migration testing

### **Week 4: PWA & Launch (Oct 26-Nov 1)**
**Days 22-24: PWA**
- Service worker
- Offline support
- Install prompt

**Days 25-26: Real-time**
- WebSocket sync
- Live updates
- Presence

**Days 27-28: Launch**
- Performance optimization
- Final testing
- Deploy to production

---

## ✅ **Definition of Done**

### **Feature Complete**
- [ ] All Phase 1-4 features implemented
- [ ] Works on iOS (Safari), Android (Chrome), Desktop (Chrome/Edge)
- [ ] Offline support (view data without internet)
- [ ] Real-time sync between users
- [ ] Push notifications working

### **Quality Gates**
- [ ] TypeScript strict mode (no errors)
- [ ] All unit tests passing (>80% coverage)
- [ ] E2E tests for critical flows
- [ ] Lighthouse score > 95
- [ ] No console errors or warnings
- [ ] Accessibility (WCAG AA)

### **Deployment**
- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Fly.io
- [ ] Database migrated to PostgreSQL
- [ ] CI/CD pipeline working
- [ ] Monitoring set up (errors, performance)

### **Documentation**
- [ ] API documentation (endpoints, schemas)
- [ ] User guide (how to install, use features)
- [ ] Developer docs (architecture, setup)
- [ ] Deployment runbook

---

## 🚨 **Risks & Mitigation**

### **Technical Risks**

**Risk:** Database migration from SQLite to PostgreSQL fails
- **Impact:** High - App won't work
- **Mitigation:** Test migration in staging, keep SQLite backup, rollback plan

**Risk:** Real-time sync causes conflicts
- **Impact:** Medium - Data inconsistency
- **Mitigation:** Last-write-wins strategy, conflict UI, sync logs

**Risk:** Push notifications don't work on iOS
- **Impact:** Low - Feature missing on one platform
- **Mitigation:** Document limitation, use in-app notifications fallback

**Risk:** Offline support causes stale data
- **Impact:** Low - User sees old data
- **Mitigation:** Timestamp caching, sync on reconnect, visual indicators

### **Timeline Risks**

**Risk:** Scope creep - too many features
- **Impact:** High - Miss deadline
- **Mitigation:** Strict phase gates, MVP-first approach, defer nice-to-haves

**Risk:** Unfamiliar tech (Prisma, Fastify)
- **Impact:** Medium - Slower development
- **Mitigation:** Allocate learning time, use documentation, keep it simple

---

## 📚 **Resources & References**

### **Design Inspiration**
- Anime: "Your Name" (Kimi no Na wa) - Color palette, twilight aesthetic
- Apps: Todoist, Things 3, Notion - UI patterns
- Design Systems: Vercel, Linear - Component design

### **Technical Documentation**
- [Next.js 14 Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Prisma](https://www.prisma.io/docs)
- [Fastify](https://www.fastify.io/docs/)
- [PWA Guide](https://web.dev/progressive-web-apps/)

### **Tutorials & Guides**
- PWA with Next.js: [web.dev/progressive-web-apps](https://web.dev/progressive-web-apps/)
- WebSocket with Fastify: [fastify.dev/docs/latest/guides/websocket](https://fastify.dev/docs/latest/guides/websocket/)
- Push Notifications: [web.dev/push-notifications](https://web.dev/push-notifications/)

---

## 📝 **Next Steps**

1. **Review & Approve** - Luke & Wife review this build plan
2. **AJ Review** - Have AJ audit for ambiguities and gaps
3. **Refinement** - Address any concerns or questions
4. **Project Setup** - Initialize repositories, tools, accounts
5. **Sprint Planning** - Break down Week 1 into daily tasks
6. **Implementation** - Begin Phase 1 development

---

**Build Plan Version:** 1.0
**Last Updated:** 2025-10-04
**Status:** Awaiting Review
**Next Review:** After AJ audit
