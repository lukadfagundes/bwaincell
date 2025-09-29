// Track Command Tests - REFACTORED using Work Order #010 Architecture
// Tests the actual command implementation with external dependencies mocked

import { createMockInteraction } from '../../utils/helpers/test-interaction';
import { mockEssentials } from '../../utils/mocks/external-only';
import trackCommand from '../../../commands/track';
import Tracker from '../../../database/models/Tracker';

// ✅ NEW ARCHITECTURE: Mock only external dependencies
mockEssentials();

describe('Track Command', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // ✅ NO jest.resetModules() - keeps module loading stable
    });

    describe('Command Structure', () => {
        it('should have correct command data', () => {
            // ✅ Static import - no dynamic loading needed
            expect(trackCommand.data).toBeDefined();
            expect(trackCommand.data.name).toBe('track');
            expect(trackCommand.data.description).toContain('Track');
        });

        it('should have all required subcommands', () => {
            const commandData = trackCommand.data.toJSON();
            const subcommandNames = commandData.options.map((opt: any) => opt.name);

            expect(subcommandNames).toContain('add');
            expect(subcommandNames).toContain('stats');
            expect(subcommandNames).toContain('list');
            expect(subcommandNames).toContain('delete');
        });

        it('should have execute function', () => {
            expect(typeof trackCommand.execute).toBe('function');
        });
    });

    describe('Add Subcommand', () => {
        it('should add a new data point', async () => {
            // Arrange
            const interaction = createMockInteraction({
                commandName: 'track',
                subcommand: 'add',
                options: {
                    metric: 'weight',
                    value: 75.5
                }
            });

            const mockDataPoint = {
                id: 1,
                userId: interaction.user.id,
                guildId: interaction.guildId,
                metric: 'weight',
                value: 75.5,
                timestamp: new Date()
            };
            jest.spyOn(Tracker, 'addDataPoint').mockResolvedValue(mockDataPoint as any);

            // Act - Execute actual command
            await trackCommand.execute(interaction);

            // Assert - Verify actual behavior
            expect(Tracker.addDataPoint).toHaveBeenCalledWith(
                interaction.user.id,
                interaction.guildId,
                'weight',
                75.5
            );

            expect(interaction.editReply).toHaveBeenCalledWith(
                expect.objectContaining({
                    embeds: expect.arrayContaining([
                        expect.objectContaining({
                            data: expect.objectContaining({
                                title: 'Data Point Logged'
                            })
                        })
                    ])
                })
            );
        });

        it('should handle missing guild context', async () => {
            // Arrange - Interaction without guild
            const interaction = createMockInteraction({
                commandName: 'track',
                subcommand: 'add',
                options: {
                    metric: 'steps',
                    value: 10000
                },
                guild: null
            });
            (interaction as any).guild = null;
            (interaction as any).guildId = null;

            // Act
            await trackCommand.execute(interaction);

            // Assert
            expect(Tracker.addDataPoint).not.toHaveBeenCalled();
            expect(interaction.editReply).toHaveBeenCalledWith({
                content: 'This command can only be used in a server.'
            });
        });
    });

    describe('Stats Subcommand', () => {
        it('should display statistics for a metric', async () => {
            // Arrange
            const interaction = createMockInteraction({
                commandName: 'track',
                subcommand: 'stats',
                options: {
                    metric: 'weight',
                    period: 'month'
                }
            });

            const mockStats = {
                count: 10,
                average: '75.2',
                latest: '76.0',
                min: '74.5',
                max: '76.8',
                sum: '752.0',
                data: [
                    { timestamp: new Date(), value: 75.5 },
                    { timestamp: new Date(), value: 76.0 }
                ]
            };
            jest.spyOn(Tracker, 'getStats').mockResolvedValue(mockStats as any);

            // Act
            await trackCommand.execute(interaction);

            // Assert
            expect(Tracker.getStats).toHaveBeenCalledWith(
                interaction.user.id,
                interaction.guildId,
                'weight',
                'month'
            );

            expect(interaction.editReply).toHaveBeenCalledWith(
                expect.objectContaining({
                    embeds: expect.arrayContaining([
                        expect.objectContaining({
                            data: expect.objectContaining({
                                title: 'Statistics: weight'
                            })
                        })
                    ])
                })
            );
        });

        it('should handle no data found for metric', async () => {
            // Arrange
            const interaction = createMockInteraction({
                commandName: 'track',
                subcommand: 'stats',
                options: {
                    metric: 'nonexistent'
                }
            });

            jest.spyOn(Tracker, 'getStats').mockResolvedValue(null);

            // Act
            await trackCommand.execute(interaction);

            // Assert
            expect(interaction.editReply).toHaveBeenCalledWith({
                content: 'No data found for metric "nonexistent".'
            });
        });

        it('should use default period when not specified', async () => {
            // Arrange
            const interaction = createMockInteraction({
                commandName: 'track',
                subcommand: 'stats',
                options: {
                    metric: 'steps'
                    // No period specified
                }
            });

            const mockStats = {
                count: 5,
                average: '8500',
                latest: '9000',
                min: '7500',
                max: '9500',
                sum: '42500'
            };
            jest.spyOn(Tracker, 'getStats').mockResolvedValue(mockStats as any);

            // Act
            await trackCommand.execute(interaction);

            // Assert
            expect(Tracker.getStats).toHaveBeenCalledWith(
                interaction.user.id,
                interaction.guildId,
                'steps',
                'all'  // Default period
            );
        });
    });

    describe('List Subcommand', () => {
        it('should display all tracked metrics', async () => {
            // Arrange
            const interaction = createMockInteraction({
                commandName: 'track',
                subcommand: 'list'
            });

            const mockMetrics = ['weight', 'steps', 'mood', 'sleep_hours'];
            jest.spyOn(Tracker, 'getMetrics').mockResolvedValue(mockMetrics);

            // Act
            await trackCommand.execute(interaction);

            // Assert
            expect(Tracker.getMetrics).toHaveBeenCalledWith(
                interaction.user.id,
                interaction.guildId
            );

            expect(interaction.editReply).toHaveBeenCalledWith(
                expect.objectContaining({
                    embeds: expect.arrayContaining([
                        expect.objectContaining({
                            data: expect.objectContaining({
                                title: 'Your Tracked Metrics'
                            })
                        })
                    ])
                })
            );
        });

        it('should handle no tracked metrics', async () => {
            // Arrange
            const interaction = createMockInteraction({
                commandName: 'track',
                subcommand: 'list'
            });

            jest.spyOn(Tracker, 'getMetrics').mockResolvedValue([]);

            // Act
            await trackCommand.execute(interaction);

            // Assert
            expect(interaction.editReply).toHaveBeenCalledWith({
                content: 'You are not tracking any metrics.'
            });
        });
    });

    describe('Delete Subcommand', () => {
        it('should delete metric data', async () => {
            // Arrange
            const interaction = createMockInteraction({
                commandName: 'track',
                subcommand: 'delete',
                options: {
                    metric: 'old_metric'
                }
            });

            jest.spyOn(Tracker, 'deleteMetric').mockResolvedValue(true);

            // Act
            await trackCommand.execute(interaction);

            // Assert
            expect(Tracker.deleteMetric).toHaveBeenCalledWith(
                interaction.user.id,
                interaction.guildId,
                'old_metric'
            );

            expect(interaction.editReply).toHaveBeenCalledWith({
                content: 'All data for metric "old_metric" has been deleted.'
            });
        });

        it('should handle metric not found for deletion', async () => {
            // Arrange
            const interaction = createMockInteraction({
                commandName: 'track',
                subcommand: 'delete',
                options: {
                    metric: 'nonexistent'
                }
            });

            jest.spyOn(Tracker, 'deleteMetric').mockResolvedValue(false);

            // Act
            await trackCommand.execute(interaction);

            // Assert
            expect(interaction.editReply).toHaveBeenCalledWith({
                content: 'Metric "nonexistent" not found.'
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle database errors gracefully', async () => {
            // Arrange
            const interaction = createMockInteraction({
                commandName: 'track',
                subcommand: 'add',
                options: {
                    metric: 'test_metric',
                    value: 100
                }
            });

            // Mock the interaction as deferred (like in actual bot flow)
            (interaction as any).deferred = true;

            const mockError = new Error('Database connection failed');
            jest.spyOn(Tracker, 'addDataPoint').mockRejectedValue(mockError);

            // Act
            await trackCommand.execute(interaction);

            // Assert - Should handle error gracefully
            expect(interaction.followUp).toHaveBeenCalledWith({
                content: 'An error occurred while processing your request.'
            });
        });

        it('should use editReply when interaction not replied yet', async () => {
            // Arrange
            const interaction = createMockInteraction({
                commandName: 'track',
                subcommand: 'list'
            });

            const mockError = new Error('Database error');

            // Mock interaction state
            (interaction as any).replied = false;
            (interaction as any).deferred = false;

            jest.spyOn(Tracker, 'getMetrics').mockRejectedValue(mockError);

            // Act
            await trackCommand.execute(interaction);

            // Assert
            expect(interaction.editReply).toHaveBeenCalledWith({
                content: 'An error occurred while processing your request.'
            });
        });
    });
});
