// Mock the database helper before any imports
jest.mock('../../../utils/interactions/helpers/databaseHelper');

import { handleTaskButton } from '../../../utils/interactions/handlers/taskHandlers';
import { createMockButtonInteraction } from '../../mocks/discord';
import { createMockTask } from '../../mocks/database';
import { ButtonInteraction, CacheType } from 'discord.js';

const mockModels = {
    Task: {
        findOne: jest.fn(),
        findAll: jest.fn(),
        create: jest.fn(),
        createTask: jest.fn(),
        getUserTasks: jest.fn(),
        completeTask: jest.fn(),
        editTask: jest.fn(),
        deleteTask: jest.fn(),
    },
};

// Mock implementation
const databaseHelper = require('../../../utils/interactions/helpers/databaseHelper');
databaseHelper.getModels = jest.fn().mockResolvedValue(mockModels);

describe('TaskHandlers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('handleTaskButton', () => {
        describe('task_add_new', () => {
            it('should show modal for adding new task', async () => {
                const interaction = createMockButtonInteraction('task_add_new') as ButtonInteraction<CacheType>;

                await handleTaskButton(interaction);

                expect(interaction.showModal).toHaveBeenCalledTimes(1);
                const modalCall = (interaction.showModal as jest.Mock).mock.calls[0][0];
                expect(modalCall.data.custom_id).toBe('task_add_modal');
                expect(modalCall.data.title).toBe('Create New Task');
            });
        });

        describe('task_done_', () => {
            it('should mark task as complete for valid task ID', async () => {
                const taskId = 123;
                const mockTask = createMockTask();
                mockModels.Task.completeTask.mockResolvedValue(mockTask);

                const interaction = createMockButtonInteraction(`task_done_${taskId}`) as ButtonInteraction<CacheType>;

                await handleTaskButton(interaction);

                expect(mockModels.Task.completeTask).toHaveBeenCalledWith(taskId, 'test-user', 'test-guild');
                expect(interaction.followUp).toHaveBeenCalledWith({
                    content: expect.stringContaining(`Task #${taskId}`),
                    ephemeral: true
                });
            });

            it('should return error for non-existent task', async () => {
                const taskId = 999;
                mockModels.Task.completeTask.mockResolvedValue(null);

                const interaction = createMockButtonInteraction(`task_done_${taskId}`) as ButtonInteraction<CacheType>;

                await handleTaskButton(interaction);

                expect(mockModels.Task.completeTask).toHaveBeenCalledWith(taskId, 'test-user', 'test-guild');
                expect(interaction.followUp).toHaveBeenCalledWith({
                    content: expect.stringContaining('not found'),
                    ephemeral: true
                });
            });
        });

        describe('task_edit_', () => {
            it('should show edit modal for existing task', async () => {
                const taskId = 123;
                const mockTask = createMockTask();
                mockModels.Task.findOne.mockResolvedValue(mockTask);

                const interaction = createMockButtonInteraction(`task_edit_${taskId}`) as ButtonInteraction<CacheType>;

                await handleTaskButton(interaction);

                expect(mockModels.Task.findOne).toHaveBeenCalledWith({
                    where: { id: taskId, user_id: 'test-user', guild_id: 'test-guild' }
                });
                expect(interaction.showModal).toHaveBeenCalledTimes(1);
            });

            it('should show error for non-existent task', async () => {
                const taskId = 999;
                mockModels.Task.findOne.mockResolvedValue(null);

                const interaction = createMockButtonInteraction(`task_edit_${taskId}`) as ButtonInteraction<CacheType>;

                await handleTaskButton(interaction);

                expect(interaction.followUp).toHaveBeenCalledWith({
                    content: expect.stringContaining('not found'),
                    ephemeral: true
                });
            });
        });

        describe('task_delete_', () => {
            it('should delete task successfully', async () => {
                const taskId = 123;
                mockModels.Task.deleteTask.mockResolvedValue(true);

                const interaction = createMockButtonInteraction(`task_delete_${taskId}`) as ButtonInteraction<CacheType>;

                await handleTaskButton(interaction);

                expect(mockModels.Task.deleteTask).toHaveBeenCalledWith(taskId, 'test-user', 'test-guild');
                expect(interaction.followUp).toHaveBeenCalledWith({
                    content: expect.stringContaining('deleted'),
                    ephemeral: true
                });
            });

            it('should show error for failed deletion', async () => {
                const taskId = 999;
                mockModels.Task.deleteTask.mockResolvedValue(false);

                const interaction = createMockButtonInteraction(`task_delete_${taskId}`) as ButtonInteraction<CacheType>;

                await handleTaskButton(interaction);

                expect(interaction.followUp).toHaveBeenCalledWith({
                    content: expect.stringContaining('not found'),
                    ephemeral: true
                });
            });
        });

        describe('task_quick_complete', () => {
            it('should show select menu with pending tasks', async () => {
                const mockTasks = [createMockTask(), createMockTask()];
                mockModels.Task.getUserTasks.mockResolvedValue(mockTasks);

                const interaction = createMockButtonInteraction('task_quick_complete') as ButtonInteraction<CacheType>;

                await handleTaskButton(interaction);

                expect(mockModels.Task.getUserTasks).toHaveBeenCalledWith('test-user', 'test-guild', 'pending');
                expect(interaction.followUp).toHaveBeenCalledWith({
                    content: expect.stringContaining('Select a task'),
                    components: expect.any(Array),
                    ephemeral: true
                });
            });

            it('should show error when no pending tasks', async () => {
                mockModels.Task.getUserTasks.mockResolvedValue([]);

                const interaction = createMockButtonInteraction('task_quick_complete') as ButtonInteraction<CacheType>;

                await handleTaskButton(interaction);

                expect(interaction.followUp).toHaveBeenCalledWith({
                    content: expect.stringContaining('No pending tasks'),
                    ephemeral: true
                });
            });
        });

        describe('error handling', () => {
            it('should handle database errors gracefully', async () => {
                mockModels.Task.completeTask.mockRejectedValue(new Error('Database error'));

                const interaction = createMockButtonInteraction('task_done_123') as ButtonInteraction<CacheType>;

                await handleTaskButton(interaction);

                expect(interaction.followUp).toHaveBeenCalled();
            });
        });

        describe('guild validation', () => {
            it('should reject interactions without guild ID', async () => {
                const interaction = createMockButtonInteraction('task_add_new', 'test-user', null) as ButtonInteraction<CacheType>;

                await handleTaskButton(interaction);

                expect(interaction.followUp).toHaveBeenCalledWith({
                    content: expect.stringContaining('server'),
                    ephemeral: true
                });
            });
        });
    });
});