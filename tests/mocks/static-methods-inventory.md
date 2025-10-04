# Static Methods Inventory

## Task Model (5 methods)

- `createTask(userId: string, guildId: string, description: string, dueDate: Date | null = null): Promise<Task>`
- `getUserTasks(userId: string, guildId: string, filter: 'all' | 'pending' | 'completed' = 'all'): Promise<Task[]>`
- `completeTask(taskId: number, userId: string, guildId: string): Promise<Task | null>`
- `deleteTask(taskId: number, userId: string, guildId: string): Promise<boolean>`
- `editTask(taskId: number, userId: string, guildId: string, newDescription: string): Promise<Task | null>`

## Budget Model (7 methods)

- `addExpense(userId: string, guildId: string, category: string, amount: number, description: string | null = null): Promise<Budget>`
- `addIncome(userId: string, guildId: string, amount: number, description: string | null = null): Promise<Budget>`
- `getSummary(userId: string, guildId: string, month: number | null = null): Promise<BudgetSummary>`
- `getCategories(userId: string, guildId: string): Promise<CategoryResult[]>`
- `getRecentEntries(userId: string, guildId: string, limit: number = 10): Promise<Budget[]>`
- `getMonthlyTrend(userId: string, guildId: string, months: number = 6): Promise<MonthlyTrend[]>`
- `deleteEntry(entryId: number, userId: string, guildId: string): Promise<boolean>`

## List Model (8 methods)

- `createList(userId: string, guildId: string, name: string): Promise<List | null>`
- `addItem(userId: string, guildId: string, listName: string, item: string): Promise<List | null>`
- `removeItem(userId: string, guildId: string, listName: string, itemText: string): Promise<List | null>`
- `getList(userId: string, guildId: string, listName: string): Promise<List | null>`
- `getUserLists(userId: string, guildId: string): Promise<List[]>`
- `clearCompleted(userId: string, guildId: string, listName: string): Promise<List | null>`
- `deleteList(userId: string, guildId: string, listName: string): Promise<boolean>`
- `toggleItem(userId: string, guildId: string, listName: string, itemText: string): Promise<List | null>`

## Note Model (8 methods)

- `createNote(userId: string, guildId: string, title: string, content: string, tags: string[] = []): Promise<Note>`
- `getNotes(userId: string, guildId: string): Promise<Note[]>`
- `getNote(noteId: number, userId: string, guildId: string): Promise<Note | null>`
- `deleteNote(noteId: number, userId: string, guildId: string): Promise<boolean>`
- `searchNotes(userId: string, guildId: string, keyword: string): Promise<Note[]>`
- `updateNote(noteId: number, userId: string, guildId: string, updates: NoteUpdateAttributes): Promise<Note | null>`
- `getNotesByTag(userId: string, guildId: string, tag: string): Promise<Note[]>`
- `getAllTags(userId: string, guildId: string): Promise<string[]>`

## Reminder Model (7 methods)

- `createReminder(...): Promise<Reminder>` (complex parameters)
- `calculateNextTrigger(time: string, frequency: ReminderFrequency, dayOfWeek: number | null): Date`
- `getActiveReminders(): Promise<Reminder[]>`
- `getUserReminders(userId: string, guildId: string): Promise<Reminder[]>`
- `deleteReminder(reminderId: number, userId: string, guildId: string): Promise<boolean>`
- `updateNextTrigger(reminderId: number): Promise<Reminder | null>`
- `getTriggeredReminders(): Promise<Reminder[]>`

## Schedule Model (6 methods)

- `addEvent(...): Promise<Schedule>` (complex parameters)
- `getEvents(userId: string, guildId: string, filter: ScheduleFilter = 'upcoming'): Promise<Schedule[]>`
- `deleteEvent(eventId: number, userId: string, guildId: string): Promise<boolean>`
- `getCountdown(userId: string, guildId: string, eventName: string): Promise<CountdownResult | null>`
- `getTodaysEvents(userId: string, guildId: string): Promise<Schedule[]>`
- `getUpcomingEvents(userId: string, guildId: string, days: number = 7): Promise<Schedule[]>`

## Tracker Model (5 methods)

- `addDataPoint(userId: string, guildId: string, metric: string, value: number): Promise<Tracker>`
- `getStats(userId: string, guildId: string, metric: string, period: TrackerPeriod = 'all'): Promise<TrackerStats | null>`
- `getMetrics(userId: string, guildId: string): Promise<string[]>`
- `deleteMetric(userId: string, guildId: string, metric: string): Promise<boolean>`
- `getRecentData(userId: string, guildId: string, metric: string, limit: number = 10): Promise<Tracker[]>`

## Total: 46 static methods across 7 models
