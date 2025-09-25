import { handleModalSubmit } from '../../../utils/interactions/modals/modalHandlers';
import { createMockModalSubmitInteraction } from '../../mocks/discord';
import { createMockTask, mockModels } from '../../mocks/database';
import { ModalSubmitInteraction, CacheType } from 'discord.js';

// Mock the database helper
jest.mock('../../../utils/interactions/helpers/databaseHelper', () => ({
    getModels: jest.fn().mockResolvedValue(mockModels),
}));

describe('ModalHandlers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('handleModalSubmit', () => {
        describe('task_add_modal', () => {
            it('should create task with valid description', async () => {
                const mockTask = { ...createMockTask(), id: 42 };
                mockModels.Task.createTask.mockResolvedValue(mockTask);

                const interaction = createMockModalSubmitInteraction('task_add_modal', {
                    'task_description': 'Buy groceries',
                    'task_due_date': ''
                }) as ModalSubmitInteraction<CacheType>;

                await handleModalSubmit(interaction);

                expect(interaction.deferReply).toHaveBeenCalledWith({ ephemeral: true });
                expect(mockModels.Task.createTask).toHaveBeenCalledWith(
                    'test-user',
                    'test-guild',
                    'Buy groceries',
                    undefined
                );
                expect(interaction.followUp).toHaveBeenCalledWith({
                    embeds: expect.any(Array),
                    components: expect.any(Array),
                    ephemeral: true
                });
            });

            it('should create task with due date', async () => {
                const mockTask = { ...createMockTask(), id: 42 };
                mockModels.Task.createTask.mockResolvedValue(mockTask);

                const interaction = createMockModalSubmitInteraction('task_add_modal', {
                    'task_description': 'Submit report',
                    'task_due_date': '2025-12-25 14:00'
                }) as ModalSubmitInteraction<CacheType>;

                await handleModalSubmit(interaction);

                expect(mockModels.Task.createTask).toHaveBeenCalledWith(
                    'test-user',
                    'test-guild',
                    'Submit report',
                    expect.any(Date)
                );
            });

            it('should reject invalid date format', async () => {
                const interaction = createMockModalSubmitInteraction('task_add_modal', {
                    'task_description': 'Test task',
                    'task_due_date': 'invalid-date'
                }) as ModalSubmitInteraction<CacheType>;

                await handleModalSubmit(interaction);

                expect(mockModels.Task.createTask).not.toHaveBeenCalled();
                expect(interaction.editReply).toHaveBeenCalledWith({
                    content: expect.stringContaining('Invalid date format')
                });
            });
        });

        describe('task_edit_modal_', () => {
            it('should update task description', async () => {
                const taskId = 123;
                const mockTask = { ...createMockTask(), id: taskId, description: 'Updated task' };
                mockModels.Task.editTask.mockResolvedValue(mockTask);

                const interaction = createMockModalSubmitInteraction(`task_edit_modal_${taskId}`, {
                    'task_new_description': 'Updated task description'
                }) as ModalSubmitInteraction<CacheType>;

                await handleModalSubmit(interaction);

                expect(mockModels.Task.editTask).toHaveBeenCalledWith(
                    taskId,
                    'test-user',
                    'test-guild',
                    'Updated task description'
                );
                expect(interaction.followUp).toHaveBeenCalledWith({
                    embeds: expect.any(Array),
                    ephemeral: true
                });
            });

            it('should show error for non-existent task', async () => {
                const taskId = 999;
                mockModels.Task.editTask.mockResolvedValue(null);

                const interaction = createMockModalSubmitInteraction(`task_edit_modal_${taskId}`, {
                    'task_new_description': 'Updated task'
                }) as ModalSubmitInteraction<CacheType>;

                await handleModalSubmit(interaction);

                expect(interaction.followUp).toHaveBeenCalledWith({
                    content: expect.stringContaining('not found'),
                    ephemeral: true
                });
            });
        });

        describe('list_add_item_modal_', () => {
            it('should add item to list', async () => {
                const listName = 'Shopping';
                mockModels.List.addItem.mockResolvedValue(true);

                const interaction = createMockModalSubmitInteraction(
                    `list_add_item_modal_${encodeURIComponent(listName)}`,
                    { 'list_item': 'Milk' }
                ) as ModalSubmitInteraction<CacheType>;

                await handleModalSubmit(interaction);

                expect(mockModels.List.addItem).toHaveBeenCalledWith(
                    'test-user',
                    'test-guild',
                    listName,
                    'Milk'
                );
                expect(interaction.editReply).toHaveBeenCalledWith({
                    content: expect.stringContaining('Added "Milk"')
                });
            });

            it('should handle special characters in list name', async () => {
                const listName = 'Shopping & Groceries';
                mockModels.List.addItem.mockResolvedValue(true);

                const interaction = createMockModalSubmitInteraction(
                    `list_add_item_modal_${encodeURIComponent(listName)}`,
                    { 'list_item': 'Bread' }
                ) as ModalSubmitInteraction<CacheType>;

                await handleModalSubmit(interaction);

                expect(mockModels.List.addItem).toHaveBeenCalledWith(
                    'test-user',
                    'test-guild',
                    listName,
                    'Bread'
                );
            });

            it('should show error when list does not exist', async () => {
                const listName = 'NonExistent';
                mockModels.List.addItem.mockResolvedValue(false);

                const interaction = createMockModalSubmitInteraction(
                    `list_add_item_modal_${encodeURIComponent(listName)}`,
                    { 'list_item': 'Item' }
                ) as ModalSubmitInteraction<CacheType>;

                await handleModalSubmit(interaction);

                expect(interaction.editReply).toHaveBeenCalledWith({
                    content: expect.stringContaining('Could not add item')
                });
            });
        });

        describe('error handling', () => {
            it('should handle database errors gracefully', async () => {
                mockModels.Task.createTask.mockRejectedValue(new Error('Database error'));

                const interaction = createMockModalSubmitInteraction('task_add_modal', {
                    'task_description': 'Test task',
                    'task_due_date': ''
                }) as ModalSubmitInteraction<CacheType>;

                await handleModalSubmit(interaction);

                expect(interaction.followUp).toHaveBeenCalled();
            });
        });

        describe('guild validation', () => {
            it('should reject interactions without guild ID', async () => {
                const interaction = createMockModalSubmitInteraction('task_add_modal', {
                    'task_description': 'Test task'
                }, null) as ModalSubmitInteraction<CacheType>;

                await handleModalSubmit(interaction);

                expect(interaction.reply).toHaveBeenCalledWith({
                    content: expect.stringContaining('server'),
                    ephemeral: true
                });
            });
        });
    });
});