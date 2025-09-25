import { handleListButton } from '../../../utils/interactions/handlers/listHandlers';
import { createMockButtonInteraction } from '../../mocks/discord';
import { createMockList, mockModels } from '../../mocks/database';
import { ButtonInteraction, CacheType } from 'discord.js';

// Mock the database helper
jest.mock('../../../utils/interactions/helpers/databaseHelper', () => ({
    getModels: jest.fn().mockResolvedValue(mockModels),
}));

describe('ListHandlers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('handleListButton', () => {
        describe('list_add_', () => {
            it('should show modal for adding item to list', async () => {
                const listName = 'Shopping';
                const interaction = createMockButtonInteraction(`list_add_${listName}`) as ButtonInteraction<CacheType>;

                await handleListButton(interaction);

                expect(interaction.showModal).toHaveBeenCalledTimes(1);
                const modalCall = (interaction.showModal as jest.Mock).mock.calls[0][0];
                expect(modalCall.data.custom_id).toBe(`list_add_item_modal_${encodeURIComponent(listName)}`);
                expect(modalCall.data.title).toBe(`Add Item to ${listName}`);
            });
        });

        describe('list_view_', () => {
            it('should display list with items', async () => {
                const listName = 'Shopping';
                const mockList = {
                    ...createMockList(),
                    name: listName,
                    items: [
                        { text: 'Milk', completed: false },
                        { text: 'Bread', completed: true },
                        { text: 'Eggs', completed: false }
                    ]
                };
                mockModels.List.findOne.mockResolvedValue(mockList);

                const interaction = createMockButtonInteraction(`list_view_${listName}`) as ButtonInteraction<CacheType>;

                await handleListButton(interaction);

                expect(mockModels.List.findOne).toHaveBeenCalledWith({
                    where: { user_id: 'test-user', guild_id: 'test-guild', name: listName }
                });
                expect(interaction.followUp).toHaveBeenCalledWith({
                    embeds: expect.any(Array),
                    components: expect.any(Array),
                    ephemeral: true
                });

                const embedCall = (interaction.followUp as jest.Mock).mock.calls[0][0];
                expect(embedCall.embeds[0].data.title).toContain(listName);
                expect(embedCall.embeds[0].data.footer.text).toContain('1/3 completed');
            });

            it('should display empty list message', async () => {
                const listName = 'Shopping';
                const mockList = {
                    ...createMockList(),
                    name: listName,
                    items: []
                };
                mockModels.List.findOne.mockResolvedValue(mockList);

                const interaction = createMockButtonInteraction(`list_view_${listName}`) as ButtonInteraction<CacheType>;

                await handleListButton(interaction);

                const embedCall = (interaction.followUp as jest.Mock).mock.calls[0][0];
                expect(embedCall.embeds[0].data.description).toContain('empty');
            });

            it('should show error for non-existent list', async () => {
                const listName = 'NonExistent';
                mockModels.List.findOne.mockResolvedValue(null);

                const interaction = createMockButtonInteraction(`list_view_${listName}`) as ButtonInteraction<CacheType>;

                await handleListButton(interaction);

                expect(interaction.followUp).toHaveBeenCalledWith({
                    content: expect.stringContaining('not found'),
                    ephemeral: true
                });
            });
        });

        describe('list_clear_', () => {
            it('should clear completed items from list', async () => {
                const listName = 'Shopping';
                const mockList = {
                    ...createMockList(),
                    name: listName,
                    items: [
                        { text: 'Milk', completed: false },
                        { text: 'Bread', completed: true },
                        { text: 'Eggs', completed: true }
                    ]
                };
                mockModels.List.findOne.mockResolvedValue(mockList);

                const interaction = createMockButtonInteraction(`list_clear_${listName}`) as ButtonInteraction<CacheType>;

                await handleListButton(interaction);

                expect(mockList.save).toHaveBeenCalled();
                expect(mockList.items).toHaveLength(1);
                expect(mockList.items[0].text).toBe('Milk');
                expect(interaction.followUp).toHaveBeenCalledWith({
                    content: expect.stringContaining('Cleared 2'),
                    ephemeral: true
                });
            });

            it('should handle empty list', async () => {
                const listName = 'Shopping';
                const mockList = {
                    ...createMockList(),
                    name: listName,
                    items: []
                };
                mockModels.List.findOne.mockResolvedValue(mockList);

                const interaction = createMockButtonInteraction(`list_clear_${listName}`) as ButtonInteraction<CacheType>;

                await handleListButton(interaction);

                expect(interaction.followUp).toHaveBeenCalledWith({
                    content: expect.stringContaining('Cleared 0'),
                    ephemeral: true
                });
            });
        });

        describe('list_refresh_', () => {
            it('should refresh list view by calling command', async () => {
                const listName = 'Shopping';
                const mockCommand = { execute: jest.fn(), data: {} };
                const interaction = createMockButtonInteraction(`list_refresh_${listName}`) as ButtonInteraction<CacheType>;
                interaction.client.commands.set('list', mockCommand);

                await handleListButton(interaction);

                expect(mockCommand.execute).toHaveBeenCalledWith(
                    expect.objectContaining({
                        options: expect.objectContaining({
                            getSubcommand: expect.any(Function),
                            getString: expect.any(Function)
                        })
                    })
                );
            });
        });

        describe('error handling', () => {
            it('should handle database errors gracefully', async () => {
                mockModels.List.findOne.mockRejectedValue(new Error('Database error'));

                const interaction = createMockButtonInteraction('list_view_Shopping') as ButtonInteraction<CacheType>;

                await handleListButton(interaction);

                expect(interaction.followUp).toHaveBeenCalled();
            });
        });

        describe('guild validation', () => {
            it('should reject interactions without guild ID', async () => {
                const interaction = createMockButtonInteraction('list_add_Shopping', 'test-user', null) as ButtonInteraction<CacheType>;

                await handleListButton(interaction);

                expect(interaction.followUp).toHaveBeenCalledWith({
                    content: expect.stringContaining('server'),
                    ephemeral: true
                });
            });
        });
    });
});