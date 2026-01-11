# Bwaincell Frontend API Audit

**Date**: 2026-01-11
**Status**: Migration from Fly.io SQLite to Raspberry Pi PostgreSQL completed

## Summary

The frontend expects comprehensive CRUD APIs for all features, but most API routes are either missing implementations or missing dynamic route handlers. The migration successfully moved data to PostgreSQL, but the Next.js API routes need to be fully implemented to connect the frontend to the database.

---

## 1. Lists API

### Frontend Expectations (useLists.ts)

- ✅ `GET /api/lists` - Fetch all lists
- ✅ `POST /api/lists` - Create new list
- ❌ `POST /api/lists/[listName]/items` - Add item to list
- ❌ `DELETE /api/lists/[listName]/items/[itemText]` - Remove item from list
- ❌ `PATCH /api/lists/[listName]/items/[itemText]/toggle` - Toggle item completion
- ❌ `POST /api/lists/[listName]/clear-completed` - Clear completed items
- ❌ `DELETE /api/lists/[listName]` - Delete list

### Current Implementation

- ✅ `/api/lists/route.ts` - Has GET and POST handlers
- ❌ `/api/lists/[listName]/route.ts` - **MISSING** (needs DELETE handler)
- ❌ `/api/lists/[listName]/items/route.ts` - **MISSING** (needs POST handler)
- ❌ `/api/lists/[listName]/items/[itemText]/route.ts` - **MISSING** (needs DELETE handler)
- ❌ `/api/lists/[listName]/items/[itemText]/toggle/route.ts` - **MISSING** (needs PATCH handler)
- ❌ `/api/lists/[listName]/clear-completed/route.ts` - **MISSING** (needs POST handler)

### Required Actions

1. Create `app/api/lists/[listName]/route.ts` with DELETE handler
2. Create `app/api/lists/[listName]/items/route.ts` with POST handler
3. Create `app/api/lists/[listName]/items/[itemText]/route.ts` with DELETE handler
4. Create `app/api/lists/[listName]/items/[itemText]/toggle/route.ts` with PATCH handler
5. Create `app/api/lists/[listName]/clear-completed/route.ts` with POST handler

---

## 2. Tasks API

### Frontend Expectations (useTasks.ts)

- ❌ `GET /api/tasks` - Fetch all tasks
- ❌ `POST /api/tasks` - Create new task
- ❌ `PATCH /api/tasks/[id]` - Update task
- ❌ `DELETE /api/tasks/[id]` - Delete task

### Current Implementation

- ⚠️ `/api/tasks/route.ts` - Has GET and POST stubs (returns empty data, marked as TODO)
- ❌ `/api/tasks/[id]/route.ts` - **MISSING**

### Required Actions

1. Implement `GET /api/tasks` to fetch from PostgreSQL `tasks` table
2. Implement `POST /api/tasks` to create tasks in PostgreSQL
3. Create `app/api/tasks/[id]/route.ts` with PATCH and DELETE handlers

---

## 3. Notes API

### Frontend Expectations (useNotes.ts)

- ❌ `GET /api/notes` - Fetch all notes (with optional search query)
- ❌ `POST /api/notes` - Create new note
- ❌ `PATCH /api/notes/[id]` - Update note
- ❌ `DELETE /api/notes/[id]` - Delete note

### Current Implementation

- ⚠️ `/api/notes/route.ts` - Exists but needs verification
- ❌ `/api/notes/[id]/route.ts` - **MISSING**

### Required Actions

1. Verify `GET /api/notes` implementation (check if it queries PostgreSQL)
2. Verify `POST /api/notes` implementation
3. Create `app/api/notes/[id]/route.ts` with PATCH and DELETE handlers

---

## 4. Reminders API

### Frontend Expectations (useReminders.ts)

- ❌ `GET /api/reminders` - Fetch all reminders
- ❌ `POST /api/reminders` - Create new reminder
- ❌ `DELETE /api/reminders/[id]` - Delete reminder

### Current Implementation

- ⚠️ `/api/reminders/route.ts` - Exists but needs verification
- ❌ `/api/reminders/[id]/route.ts` - **MISSING**

### Required Actions

1. Verify `GET /api/reminders` implementation
2. Verify `POST /api/reminders` implementation
3. Create `app/api/reminders/[id]/route.ts` with DELETE handler

---

## 5. Budget API

### Frontend Expectations (useBudget.ts)

- ❌ `GET /api/budget/transactions` - Fetch all transactions
- ❌ `POST /api/budget/transactions` - Create new transaction
- ❌ `PATCH /api/budget/transactions/[id]` - Update transaction
- ❌ `DELETE /api/budget/transactions/[id]` - Delete transaction

### Current Implementation

- ⚠️ `/api/budget/route.ts` - Exists but needs verification
- ❌ `/api/budget/transactions/route.ts` - **POSSIBLY MISSING**
- ❌ `/api/budget/transactions/[id]/route.ts` - **MISSING**

### Required Actions

1. Check if `/api/budget/route.ts` handles `/api/budget/transactions`
2. If not, create `app/api/budget/transactions/route.ts` with GET and POST handlers
3. Create `app/api/budget/transactions/[id]/route.ts` with PATCH and DELETE handlers

---

## 6. Schedule API

### Frontend Expectations (useSchedule.ts)

- ❌ `GET /api/schedule` - Fetch all events
- ❌ `POST /api/schedule` - Create new event
- ❌ `PATCH /api/schedule/[id]` - Update event
- ❌ `DELETE /api/schedule/[id]` - Delete event

### Current Implementation

- ⚠️ `/api/schedule/route.ts` - Exists but needs verification
- ❌ `/api/schedule/[id]/route.ts` - **MISSING**

### Required Actions

1. Verify `GET /api/schedule` implementation
2. Verify `POST /api/schedule` implementation
3. Create `app/api/schedule/[id]/route.ts` with PATCH and DELETE handlers

---

## Database Schema Reference

All API routes should connect to the PostgreSQL database at:

```
postgresql://bwaincell:RUhdJ1dZScrHpeiSWImJJx+lPyol+wpt3qoYzsaLMSI=@localhost:5433/bwaincell
```

### Tables (from migration):

- ✅ `tasks` - 0 rows
- ✅ `lists` - 15 rows (JSONB items column)
- ✅ `notes` - 0 rows (JSONB tags column)
- ✅ `reminders` - 17 rows
- ✅ `budgets` - 0 rows
- ✅ `schedules` - 0 rows
- ✅ `users` - 2 rows

---

## Priority Actions

### HIGH PRIORITY (Broken Functionality)

1. **Lists**: Create all missing dynamic routes for list item operations
   - User can create lists but cannot delete them
   - Cannot add/remove/toggle items

### MEDIUM PRIORITY (Stub Implementations)

2. **Tasks**: Implement full CRUD operations
3. **Notes**: Implement dynamic routes for update/delete
4. **Reminders**: Implement delete endpoint
5. **Schedule**: Implement dynamic routes for update/delete
6. **Budget**: Verify routing and implement dynamic routes

### LOW PRIORITY (Verification Needed)

7. Verify all existing route implementations connect to PostgreSQL
8. Add error handling and validation to all routes
9. Add tests for all API endpoints

---

## Implementation Pattern

All routes should follow this pattern (from `/api/lists/route.ts`):

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { guildId: true },
  });

  // Query database using Prisma...

  return NextResponse.json({ success: true, data: result });
}
```

---

## Testing Checklist

After implementation, test each endpoint:

- [ ] Lists: Create, add items, toggle items, remove items, clear completed, delete list
- [ ] Tasks: Create, read, update, delete
- [ ] Notes: Create, read, update, delete, search
- [ ] Reminders: Create, read, delete
- [ ] Budget: Create, read, update, delete transactions
- [ ] Schedule: Create, read, update, delete events
