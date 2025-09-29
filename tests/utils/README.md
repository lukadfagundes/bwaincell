# Test Utilities Framework

## Bwaincell Test Architecture Refactor - Work Order #008

This directory contains the new centralized test utilities framework implementing the architectural patterns defined in Work Order #008.

## 🏗️ Architecture Principles

### Core Principle: Mock External Dependencies Only

- ✅ **Mock**: Discord.js, database connections, file system, HTTP APIs
- ❌ **Don't Mock**: Commands, models, internal utilities, business logic

### Test Types

- **Unit Tests**: Test individual functions with mocked external dependencies
- **Integration Tests**: Test component interactions with test database
- **End-to-End Tests**: Test complete user workflows (future)

## 📁 Directory Structure

```
tests/utils/
├── fixtures/           # Test data and scenarios
│   ├── discord-fixtures.ts    # Discord.js test objects
│   └── database-fixtures.ts   # Database test data
├── helpers/           # Test utility functions
│   ├── test-client.ts         # Mock Discord client builder
│   ├── test-database.ts       # Test database management
│   └── test-interaction.ts    # Interaction builders
├── mocks/             # External dependency mocks
│   └── external-only.ts       # Centralized external mocks
└── README.md          # This file
```

## 🚀 Quick Start

### Basic Command Test

```typescript
import { createMockInteraction } from '../utils/helpers/test-interaction';
import { mockEssentials } from '../utils/mocks/external-only';
import taskCommand from '../../commands/task';

// Mock only external dependencies
mockEssentials();

describe('Task Command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new task', async () => {
    // Arrange
    const interaction = createMockInteraction({
      commandName: 'task',
      subcommand: 'add',
      options: {
        description: 'Test task',
        priority: 'high',
      },
    });

    // Act - Test actual command implementation
    await taskCommand.execute(interaction);

    // Assert - Verify behavior through mocks
    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('Task added'),
      })
    );
  });
});
```

### Database Integration Test

```typescript
import { setupTestDatabase, clearTestData } from '../utils/helpers/test-database';
import { taskFixtures } from '../utils/fixtures/database-fixtures';
import Task from '../../database/models/Task';

describe('Task Model Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();
  });

  it('should create and retrieve tasks', async () => {
    // Create real database entry
    const task = await Task.create(taskFixtures.basic);

    // Verify actual database behavior
    expect(task.id).toBeDefined();
    expect(task.description).toBe(taskFixtures.basic.description);

    // Test retrieval
    const retrieved = await Task.findByPk(task.id);
    expect(retrieved).toBeTruthy();
    expect(retrieved.description).toBe(task.description);
  });
});
```

## 📋 Available Utilities

### Test Interaction Builder

```typescript
import { createMockInteraction, InteractionScenarios } from '../utils/helpers/test-interaction';

// Custom interaction
const interaction = createMockInteraction({
  commandName: 'task',
  subcommand: 'add',
  options: { description: 'Test task' },
});

// Pre-built scenarios
const taskAddInteraction = InteractionScenarios.taskAdd('My task', 'high');
const budgetAddInteraction = InteractionScenarios.budgetAdd('Coffee', 5.5, 'Food');
```

### Test Database Management

```typescript
import {
  setupTestDatabase,
  clearTestData,
  DatabaseTestUtils,
  JestDatabaseHelpers,
} from '../utils/helpers/test-database';

// Jest hooks
describe('Database Tests', () => {
  beforeAll(JestDatabaseHelpers.beforeAll);
  afterAll(JestDatabaseHelpers.afterAll);
  beforeEach(JestDatabaseHelpers.beforeEach);

  // Your tests here
});

// Manual management
await setupTestDatabase();
await clearTestData();
await DatabaseTestUtils.createFixtures({
  Task: [taskFixtures.basic, taskFixtures.urgent],
});
```

### Test Client Builder

```typescript
import { TestClientBuilder, ClientScenarios } from '../utils/helpers/test-client';

// Fluent builder
const client = new TestClientBuilder()
  .withUser(testUsers.bot)
  .withGuild(testGuilds.standard)
  .withCommand('task', taskCommand)
  .build();

// Pre-built scenarios
const basicClient = ClientScenarios.basic();
const multiGuildClient = ClientScenarios.multiGuild();
```

### Test Fixtures

```typescript
import {
  taskFixtures,
  budgetFixtures,
  DatabaseFixtureFactory,
} from '../utils/fixtures/database-fixtures';

import { testUsers, testGuilds, DiscordFixtureFactory } from '../utils/fixtures/discord-fixtures';

// Use predefined fixtures
const task = taskFixtures.basic;
const user = testUsers.standard;

// Create custom fixtures
const customTask = DatabaseFixtureFactory.createTask({
  description: 'Custom task',
  priority: 'high',
});

const customUser = DiscordFixtureFactory.createUser({
  username: 'CustomUser',
});
```

### External Mocks

```typescript
import { mockEssentials, mockAllExternal, ExternalMocks } from '../utils/mocks/external-only';

// Most common - Discord.js + Sequelize
mockEssentials();

// Everything
mockAllExternal();

// Individual mocks
ExternalMocks.discordJs();
ExternalMocks.fileSystem();
```

## 🔧 Migration Guide

### From Old Pattern (❌ Don't Do This)

```typescript
// OLD - Mocking the command itself
jest.mock('../../../commands/task', () => ({
  execute: jest.fn().mockResolvedValue(undefined),
}));

// This tests the mock, not the actual command!
await taskCommand.execute(interaction);
expect(taskCommand.execute).toHaveBeenCalled(); // ❌ Meaningless
```

### To New Pattern (✅ Do This)

```typescript
// NEW - Mock only external dependencies
import { mockEssentials } from '../utils/mocks/external-only';
import taskCommand from '../../../commands/task';

mockEssentials();

// This tests the actual command implementation!
await taskCommand.execute(interaction);
expect(interaction.reply).toHaveBeenCalledWith(/* expected response */); // ✅ Meaningful
```

## 🏃‍♂️ Running Tests

### All Tests

```bash
npm test
```

### Specific Test Files

```bash
npm test -- tests/unit/commands/task.test.ts
npm test -- tests/integration/
```

### With Coverage

```bash
npm test -- --coverage
```

### Watch Mode

```bash
npm test -- --watch
```

## 📊 Test Performance

### Target Metrics

- **Pass Rate**: 100% (269/269 tests)
- **Execution Time**: <10 seconds total
- **Memory Usage**: <500MB during test runs
- **Coverage**: >90% code coverage

### Performance Tips

1. Use `mockEssentials()` instead of `mockAllExternal()` when possible
2. Clear test data between tests, not recreate database
3. Use test database transactions for isolation
4. Avoid `jest.resetModules()` - it breaks module caching

## 🐛 Troubleshooting

### Common Issues

#### "Cannot read properties of undefined"

```typescript
// ❌ Property access error
expect(command.data.name).toBe('task');

// ✅ Correct property access
expect(command.default.data.name).toBe('task');
```

#### "Mock conflicts"

```typescript
// ❌ Conflicting mocks
jest.mock('../../../commands/task');
await taskCommand.execute(); // Tests mock, not real code

// ✅ Mock externals only
mockEssentials();
await taskCommand.execute(); // Tests real implementation
```

#### "Database connection errors"

```typescript
// ❌ Missing database setup
describe('Model tests', () => {
  it('should work', async () => {
    await Task.create({}); // Error: no database
  });
});

// ✅ Proper database setup
describe('Model tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();
  });
});
```

### Test Debugging

```typescript
// Enable SQL logging for database tests
const db = getTestDatabase();
db.options.logging = console.log;

// Check what methods were called
console.log(mockInteraction.reply.mock.calls);

// Verify database state
const tasks = await DatabaseTestUtils.findRecords('Task');
console.log('Current tasks:', tasks);
```

## 📚 Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// ❌ Testing implementation details
expect(Task.create).toHaveBeenCalledWith(specificObject);

// ✅ Testing behavior
expect(interaction.reply).toHaveBeenCalledWith(
  expect.objectContaining({
    content: expect.stringContaining('success'),
  })
);
```

### 2. Use Descriptive Test Names

```typescript
// ❌ Unclear
it('should work', () => {});

// ✅ Clear
it('should create a task when valid description is provided', () => {});
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('should complete a task', async () => {
  // Arrange
  const task = await Task.create(taskFixtures.basic);
  const interaction = InteractionScenarios.taskComplete(task.id);

  // Act
  await taskCommand.execute(interaction);

  // Assert
  const updatedTask = await Task.findByPk(task.id);
  expect(updatedTask.status).toBe('completed');
});
```

### 4. Keep Tests Independent

```typescript
// ✅ Each test is self-contained
beforeEach(async () => {
  await clearTestData(); // Clean slate for each test
});
```

### 5. Test Edge Cases

```typescript
describe('Task Creation', () => {
  it('should handle valid input', () => {});
  it('should reject empty description', () => {});
  it('should handle very long descriptions', () => {});
  it('should handle special characters', () => {});
  it('should handle database errors gracefully', () => {});
});
```

## 🔄 Updates and Maintenance

This framework is part of Work Order #008 and follows Trinity Method v7.0 protocols.

### Updating Utilities

1. Follow the "external mocks only" principle
2. Update fixtures when database schema changes
3. Maintain backward compatibility when possible
4. Document breaking changes

### Adding New Utilities

1. Place in appropriate subdirectory
2. Follow existing naming conventions
3. Include TypeScript types
4. Add usage examples to this README

---

_For questions or issues with the test framework, refer to Work Order #008 documentation or the Trinity Method knowledge base._
