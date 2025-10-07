# Test Fix Patterns - CI/CD Hardening Work Order

## Status: 41 Failing Tests → Patterns Identified

### Root Causes Identified

1. **Mock Interaction State**: Tests use `deferred: false` but commands expect `deferred: true`
2. **Response Methods**: Tests expect `reply()` but commands use `editReply()` (because bot.js defers all interactions)
3. **Error Handling**: Tests expect `editReply()` for errors but commands use `followUp()` when deferred
4. **Model Methods**: Tests mock Sequelize methods (`create`, `findAll`) but commands use custom static methods (`createTask`, `getUserTasks`)

---

## Fix Pattern #1: Update createMockInteraction Helper

**File**: `tests/utils/helpers/test-interaction.ts`

**Change Made**:

```typescript
// Before
deferred = false;

// After
deferred = true; // Default to true since bot.js defers all interactions
```

**Status**: ✅ COMPLETED

---

## Fix Pattern #2: Use editReply Instead of reply

**Pattern**:

```typescript
// ❌ Wrong
expect(mockInteraction.reply).toHaveBeenCalledWith(...)

// ✅ Correct
expect(mockInteraction.editReply).toHaveBeenCalledWith(...)
```

**Affected Files**:

- `tests/unit/commands/random.test.ts`
- `tests/unit/commands/schedule.test.ts`
- `tests/unit/commands/task.test.ts`
- `tests/unit/commands.test.ts`

**Status**: ⚠️ NEEDS BULK UPDATE

---

## Fix Pattern #3: Error Handling Uses followUp

**Pattern**:

```typescript
// ❌ Wrong
expect(mockInteraction.editReply).toHaveBeenCalledWith(
  expect.objectContaining({
    content: expect.stringContaining('error'),
  })
);

// ✅ Correct (when deferred=true)
expect(mockInteraction.followUp).toHaveBeenCalledWith(
  expect.objectContaining({
    content: expect.stringContaining('error'),
  })
);
```

**Affected Files**: All error handling tests

**Status**: ⚠️ NEEDS BULK UPDATE

---

## Fix Pattern #4: Mock Custom Model Methods

### Task Model Example

**❌ Wrong Mock**:

```typescript
jest.mock('../../database/models/Task', () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
}));
```

**✅ Correct Mock**:

```typescript
const mockTaskCreateTask = jest.fn();
const mockTaskGetUserTasks = jest.fn();
const mockTaskCompleteTask = jest.fn();
const mockTaskDeleteTask = jest.fn();

jest.mock('../../database/models/Task', () => ({
  __esModule: true,
  default: {
    createTask: mockTaskCreateTask,
    getUserTasks: mockTaskGetUserTasks,
    completeTask: mockTaskCompleteTask,
    deleteTask: mockTaskDeleteTask,
  },
}));
```

**Model Method Mapping**:
| Command Uses | Mock Should Provide |
|--------------|---------------------|
| `Task.createTask(userId, guildId, description, dueDate)` | `createTask` |
| `Task.getUserTasks(userId, guildId, filter)` | `getUserTasks` |
| `Task.completeTask(taskId, userId, guildId)` | `completeTask` |
| `Task.deleteTask(taskId, userId, guildId)` | `deleteTask` |

**Status**: ⚠️ NEEDS APPLICATION TO OTHER MODELS

---

## Fix Pattern #5: User/Guild IDs from Test Helper

**Pattern**:

```typescript
// Test helper creates these IDs:
// user.id = 'test-user-123'
// guild.id = 'test-guild-456'

// So assertions must use these values:
expect(mockTaskCreateTask).toHaveBeenCalledWith(
  'test-user-123',  // ✅ Correct
  'test-guild-456', // ✅ Correct
  'Test task description',
  undefined
);

// ❌ Wrong
expect(mockTaskCreateTask).toHaveBeenCalledWith(
  'user-1',   // Wrong ID
  'guild-1',  // Wrong ID
  ...
);
```

**Status**: ✅ PATTERN ESTABLISHED

---

## Fix Pattern #6: Null vs Undefined

**Pattern**:

```typescript
// When optional parameters are not provided, they're undefined (not null)

// ✅ Correct
expect(mockTaskCreateTask).toHaveBeenCalledWith(
  'test-user-123',
  'test-guild-456',
  'Test task description',
  undefined // Not null!
);
```

**Status**: ✅ PATTERN ESTABLISHED

---

## Automated Fix Strategy

### Recommended Approach:

1. **Bulk Find/Replace in VSCode**:
   - Find: `expect(mockInteraction.reply)`
   - Replace: `expect(mockInteraction.editReply)`
   - Files: `tests/unit/**/*.test.ts`

2. **Model-Specific Fixes**:
   - Identify each model's actual static methods
   - Update mocks to match
   - Update test assertions

3. **Error Test Pattern**:
   - Find all tests with `'error'` in description
   - Update to use `followUp` instead of `editReply`/`reply`

---

## Test Files Status

### ✅ Passing (Fixed)

- `tests/unit/commands.test.new.test.ts` - **5 tests passing**

### ⚠️ Needs Fixes (Same Patterns)

- `tests/unit/commands/random.test.ts` - Mock interaction methods
- `tests/unit/commands/schedule.test.ts` - Mock model methods
- `tests/unit/commands/task.test.ts` - Mock model methods
- `tests/unit/commands.test.ts` - Multiple command mocks

### ✅ Already Passing

- All integration tests
- Most utility tests
- Helper tests

---

## Next Steps for Complete Test Fix

1. Create a script to bulk update `reply` → `editReply`
2. Document each model's static methods
3. Update mocks systematically per model
4. Run tests iteratively until all pass

---

## CI/CD Priority

**Decision**: Given that:

- 267/308 tests are passing (87% pass rate)
- Patterns are well understood
- CI/CD configuration is the primary concern

**Recommendation**:

- Proceed with CI/CD hardening now
- Document test patterns for future fixes
- Tests can be fixed incrementally without blocking CI/CD improvements

---

**Created**: 2025-10-07
**Status**: Test patterns documented, ready for CI/CD improvements
