// Budget Command Tests - REFACTORED using Work Order #008 Architecture
// Tests the actual command implementation with external dependencies mocked

import { createMockInteraction, InteractionScenarios } from '../../utils/helpers/test-interaction';
import { mockEssentials } from '../../utils/mocks/external-only';
import { budgetFixtures } from '../../utils/fixtures/database-fixtures';
import budgetCommand from '../../../commands/budget';

// ✅ NEW ARCHITECTURE: Mock only external dependencies
mockEssentials();

// Mock the Budget model
jest.mock('../../../database/models/Budget');
import Budget from '../../../database/models/Budget';

describe('Budget Command', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // ✅ NO jest.resetModules() - keeps module loading stable
    });

    describe('Command Structure', () => {
        it('should have correct command data', () => {
            // ✅ Static import - no dynamic loading needed
            expect(budgetCommand.data).toBeDefined();
            expect(budgetCommand.data.name).toBe('budget');
            expect(budgetCommand.data.description).toContain('budget');
        });

        it('should have all required subcommands', () => {
            const commandData = budgetCommand.data.toJSON();
            const subcommandNames = commandData.options?.map((opt: any) => opt.name) || [];

            expect(subcommandNames).toContain('add');
            expect(subcommandNames).toContain('view');
            expect(subcommandNames).toContain('delete');
        });

        it('should have execute function', () => {
            expect(typeof budgetCommand.execute).toBe('function');
        });
    });

    describe('Add Budget Entry Subcommand', () => {
        it('should create a new budget entry', async () => {
            // Arrange
            const interaction = InteractionScenarios.budgetAdd('Coffee and snacks', 25.50, 'Food');

            const mockEntry = {
                id: 1,
                userId: interaction.user.id,
                guildId: interaction.guildId,
                description: 'Coffee and snacks',
                amount: 25.50,
                category: 'Food',
                createdAt: new Date()
            };
            (Budget.create as jest.Mock).mockResolvedValue(mockEntry);

            // Act - Execute actual command
            await budgetCommand.execute(interaction);

            // Assert - Verify actual behavior
            expect(Budget.create).toHaveBeenCalledWith({
                userId: interaction.user.id,
                guildId: interaction.guildId,
                description: 'Coffee and snacks',
                amount: 25.50,
                category: 'Food'
            });

            expect(interaction.reply).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: expect.stringContaining('added'),
                    ephemeral: true
                })
            );
        });

        it('should handle large expense amounts', async () => {
            // Arrange
            const interaction = createMockInteraction({
                commandName: 'budget',
                subcommand: 'add',
                options: {
                    description: 'Laptop purchase',
                    amount: 1200.00,
                    category: 'Technology'
                }
            });

            const mockEntry = { ...budgetFixtures.largeExpense, id: 1 };
            (Budget.create as jest.Mock).mockResolvedValue(mockEntry);

            // Act
            await budgetCommand.execute(interaction);

            // Assert
            expect(Budget.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    amount: 1200.00,
                    category: 'Technology'
                })
            );
        });

        it('should handle income entries', async () => {
            // Arrange
            const interaction = createMockInteraction({
                commandName: 'budget',
                subcommand: 'add',
                options: {
                    description: 'Freelance payment',
                    amount: 500.00,
                    category: 'Work',
                    type: 'income'
                }
            });

            const mockEntry = { ...budgetFixtures.income, id: 1 };
            (Budget.create as jest.Mock).mockResolvedValue(mockEntry);

            // Act
            await budgetCommand.execute(interaction);

            // Assert
            expect(Budget.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'income',
                    amount: 500.00
                })
            );
        });

        it('should handle missing guild context', async () => {
            // Arrange - Interaction without guild
            const interaction = createMockInteraction({
                commandName: 'budget',
                subcommand: 'add',
                options: {
                    description: 'Test expense',
                    amount: 10.00
                },
                guild: undefined
            });
            (interaction as any).guild = null;
            (interaction as any).guildId = null;

            // Act
            await budgetCommand.execute(interaction);

            // Assert
            expect(Budget.create).not.toHaveBeenCalled();
            expect(interaction.reply).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: expect.stringContaining('server'),
                    ephemeral: true
                })
            );
        });

        it('should handle database errors gracefully', async () => {
            // Arrange
            const interaction = InteractionScenarios.budgetAdd('Test expense', 25.00);
            const mockError = new Error('Database connection failed');
            (Budget.create as jest.Mock).mockRejectedValue(mockError);

            // Act
            await budgetCommand.execute(interaction);

            // Assert
            expect(interaction.reply).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: expect.stringContaining('error'),
                    ephemeral: true
                })
            );
        });
    });

    describe('View Budget Subcommand', () => {
        it('should display budget entries', async () => {
            // Arrange
            const interaction = createMockInteraction({
                commandName: 'budget',
                subcommand: 'view',
                options: {
                    period: 'month'
                }
            });

            const mockEntries = [
                { ...budgetFixtures.expense, id: 1 },
                { ...budgetFixtures.transport, id: 2 },
                { ...budgetFixtures.income, id: 3 }
            ];
            (Budget.findAll as jest.Mock).mockResolvedValue(mockEntries);

            // Act
            await budgetCommand.execute(interaction);

            // Assert
            expect(Budget.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        userId: interaction.user.id,
                        guildId: interaction.guildId
                    })
                })
            );

            expect(interaction.reply).toHaveBeenCalled();
        });

        it('should handle empty budget list', async () => {
            // Arrange
            const interaction = createMockInteraction({
                commandName: 'budget',
                subcommand: 'view'
            });

            (Budget.findAll as jest.Mock).mockResolvedValue([]);

            // Act
            await budgetCommand.execute(interaction);

            // Assert
            expect(interaction.reply).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: expect.stringContaining('No budget entries'),
                    ephemeral: true
                })
            );
        });

        it('should calculate budget summary correctly', async () => {
            // Arrange
            const interaction = createMockInteraction({
                commandName: 'budget',
                subcommand: 'view',
                options: {
                    period: 'week'
                }
            });

            const mockEntries = [
                { ...budgetFixtures.expense, amount: 25.50, type: 'expense' },
                { ...budgetFixtures.income, amount: 100.00, type: 'income' },
                { ...budgetFixtures.transport, amount: 45.00, type: 'expense' }
            ];
            (Budget.findAll as jest.Mock).mockResolvedValue(mockEntries);
            (Budget.sum as jest.Mock).mockImplementation((_field: any, options: any) => {
                const type = options?.where?.type;
                if (type === 'income') return Promise.resolve(100.00);
                if (type === 'expense') return Promise.resolve(70.50);
                return Promise.resolve(0);
            });

            // Act
            await budgetCommand.execute(interaction);

            // Assert
            expect(Budget.sum).toHaveBeenCalledWith('amount', expect.objectContaining({
                where: expect.objectContaining({
                    type: 'income'
                })
            }));
            expect(Budget.sum).toHaveBeenCalledWith('amount', expect.objectContaining({
                where: expect.objectContaining({
                    type: 'expense'
                })
            }));
        });
    });

    describe('Delete Budget Entry Subcommand', () => {
        it('should delete existing budget entry', async () => {
            // Arrange
            const interaction = createMockInteraction({
                commandName: 'budget',
                subcommand: 'delete',
                options: {
                    entry_id: 1
                }
            });

            (Budget.destroy as jest.Mock).mockResolvedValue(1);

            // Act
            await budgetCommand.execute(interaction);

            // Assert
            expect(Budget.destroy).toHaveBeenCalledWith({
                where: {
                    id: 1,
                    userId: interaction.user.id,
                    guildId: interaction.guildId
                }
            });

            expect(interaction.reply).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: expect.stringContaining('deleted'),
                    ephemeral: true
                })
            );
        });

        it('should handle non-existent entry deletion', async () => {
            // Arrange
            const interaction = createMockInteraction({
                commandName: 'budget',
                subcommand: 'delete',
                options: {
                    entry_id: 999
                }
            });

            (Budget.destroy as jest.Mock).mockResolvedValue(0);

            // Act
            await budgetCommand.execute(interaction);

            // Assert
            expect(interaction.reply).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: expect.stringContaining('not found'),
                    ephemeral: true
                })
            );
        });

        it('should handle database errors during deletion', async () => {
            // Arrange
            const interaction = createMockInteraction({
                commandName: 'budget',
                subcommand: 'delete',
                options: {
                    entry_id: 1
                }
            });

            (Budget.destroy as jest.Mock).mockRejectedValue(new Error('Database error'));

            // Act
            await budgetCommand.execute(interaction);

            // Assert
            expect(interaction.reply).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: expect.stringContaining('error'),
                    ephemeral: true
                })
            );
        });
    });

    describe('Budget Categories', () => {
        it('should handle various expense categories', async () => {
            // Arrange
            const categories = ['Food', 'Transport', 'Entertainment', 'Technology', 'Health'];

            for (const category of categories) {
                const interaction = createMockInteraction({
                    commandName: 'budget',
                    subcommand: 'add',
                    options: {
                        description: `${category} expense`,
                        amount: 50.00,
                        category
                    }
                });

                (Budget.create as jest.Mock).mockResolvedValue({
                    id: 1,
                    category,
                    amount: 50.00
                } as any);

                // Act
                await budgetCommand.execute(interaction);

                // Assert
                expect(Budget.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        category
                    })
                );

                jest.clearAllMocks();
            }
        });
    });

    describe('Budget Validation', () => {
        it('should handle zero amount entries', async () => {
            // Arrange
            const interaction = createMockInteraction({
                commandName: 'budget',
                subcommand: 'add',
                options: {
                    description: 'Free sample',
                    amount: 0.00,
                    category: 'Food'
                }
            });

            jest.spyOn(Budget, 'create').mockResolvedValue({
                id: 1,
                amount: 0.00
            } as any);

            // Act
            await budgetCommand.execute(interaction);

            // Assert
            expect(Budget.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    amount: 0.00
                })
            );
        });

        it('should handle negative amounts for refunds', async () => {
            // Arrange
            const interaction = createMockInteraction({
                commandName: 'budget',
                subcommand: 'add',
                options: {
                    description: 'Refund for returned item',
                    amount: -25.00,
                    category: 'Shopping'
                }
            });

            jest.spyOn(Budget, 'create').mockResolvedValue({
                id: 1,
                amount: -25.00
            } as any);

            // Act
            await budgetCommand.execute(interaction);

            // Assert
            expect(Budget.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    amount: -25.00
                })
            );
        });
    });
});
