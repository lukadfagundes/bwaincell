// Test interaction builder utilities for Discord.js testing
import {
    ChatInputCommandInteraction,
    User,
    Guild,
    GuildMember,
    TextChannel
} from 'discord.js';

export interface MockInteractionOptions {
    commandName: string;
    subcommand?: string;
    subcommandGroup?: string;
    options?: Record<string, any>;
    user?: Partial<User>;
    guild?: Partial<Guild>;
    member?: Partial<GuildMember>;
    channel?: Partial<TextChannel>;
    replied?: boolean;
    deferred?: boolean;
}

/**
 * Creates a mock ChatInputCommandInteraction with configurable options
 * @param options Configuration for the mock interaction
 * @returns Mock interaction object for testing
 */
export function createMockInteraction(options: MockInteractionOptions): ChatInputCommandInteraction {
    const {
        commandName,
        subcommand,
        subcommandGroup,
        options: commandOptions = {},
        user = {},
        guild = {},
        member = {},
        channel = {},
        replied = false,
        deferred = false
    } = options;

    const mockUser = {
        id: 'test-user-123',
        tag: 'TestUser#0001',
        username: 'TestUser',
        discriminator: '0001',
        bot: false,
        system: false,
        ...user
    };

    const mockGuild = {
        id: 'test-guild-456',
        name: 'Test Guild',
        ownerId: 'owner-123',
        ...guild
    };

    const mockMember = {
        id: mockUser.id,
        user: mockUser,
        guild: mockGuild,
        permissions: {
            has: jest.fn().mockReturnValue(true),
            missing: jest.fn().mockReturnValue([]),
            toArray: jest.fn().mockReturnValue([])
        },
        roles: {
            cache: new Map(),
            highest: { position: 1 }
        },
        ...member
    };

    const mockChannel = {
        id: 'test-channel-789',
        name: 'test-channel',
        type: 0, // GUILD_TEXT
        guild: mockGuild,
        send: jest.fn().mockResolvedValue({}),
        ...channel
    };

    // Create mock options object with all Discord.js option methods
    const mockOptions = {
        getSubcommand: jest.fn().mockReturnValue(subcommand || null),
        getSubcommandGroup: jest.fn().mockReturnValue(subcommandGroup || null),
        getString: jest.fn().mockImplementation((name: string, required?: boolean) => {
            const value = commandOptions[name];
            if (required && value === undefined) {
                throw new Error(`Required option "${name}" not provided`);
            }
            return value || null;
        }),
        getInteger: jest.fn().mockImplementation((name: string, required?: boolean) => {
            const value = commandOptions[name];
            if (required && value === undefined) {
                throw new Error(`Required option "${name}" not provided`);
            }
            return typeof value === 'number' ? value : null;
        }),
        getNumber: jest.fn().mockImplementation((name: string, required?: boolean) => {
            const value = commandOptions[name];
            if (required && value === undefined) {
                throw new Error(`Required option "${name}" not provided`);
            }
            return typeof value === 'number' ? value : null;
        }),
        getBoolean: jest.fn().mockImplementation((name: string, required?: boolean) => {
            const value = commandOptions[name];
            if (required && value === undefined) {
                throw new Error(`Required option "${name}" not provided`);
            }
            return typeof value === 'boolean' ? value : null;
        }),
        getUser: jest.fn().mockImplementation((name: string, required?: boolean) => {
            const value = commandOptions[name];
            if (required && value === undefined) {
                throw new Error(`Required option "${name}" not provided`);
            }
            return value || null;
        }),
        getChannel: jest.fn().mockImplementation((name: string, required?: boolean) => {
            const value = commandOptions[name];
            if (required && value === undefined) {
                throw new Error(`Required option "${name}" not provided`);
            }
            return value || null;
        }),
        getRole: jest.fn().mockImplementation((name: string, required?: boolean) => {
            const value = commandOptions[name];
            if (required && value === undefined) {
                throw new Error(`Required option "${name}" not provided`);
            }
            return value || null;
        }),
        getMentionable: jest.fn().mockImplementation((name: string, required?: boolean) => {
            const value = commandOptions[name];
            if (required && value === undefined) {
                throw new Error(`Required option "${name}" not provided`);
            }
            return value || null;
        }),
        getAttachment: jest.fn().mockImplementation((name: string, required?: boolean) => {
            const value = commandOptions[name];
            if (required && value === undefined) {
                throw new Error(`Required option "${name}" not provided`);
            }
            return value || null;
        }),
        getFocused: jest.fn().mockReturnValue({ name: '', value: '', type: 'STRING' }),
        data: []
    };

    const mockInteraction = {
        // Basic interaction properties
        id: 'interaction-123',
        applicationId: 'app-456',
        type: 2, // APPLICATION_COMMAND
        commandName,
        commandId: 'command-789',
        commandType: 1, // CHAT_INPUT

        // User and guild context
        user: mockUser,
        member: mockMember,
        guild: mockGuild,
        guildId: mockGuild.id,
        channel: mockChannel,
        channelId: mockChannel.id,

        // Interaction state
        replied,
        deferred,
        ephemeral: false,

        // Options
        options: mockOptions,

        // Interaction type checks
        isCommand: jest.fn().mockReturnValue(true),
        isChatInputCommand: jest.fn().mockReturnValue(true),
        isContextMenuCommand: jest.fn().mockReturnValue(false),
        isAutocomplete: jest.fn().mockReturnValue(false),
        isButton: jest.fn().mockReturnValue(false),
        isSelectMenu: jest.fn().mockReturnValue(false),
        isModalSubmit: jest.fn().mockReturnValue(false),
        isMessageComponent: jest.fn().mockReturnValue(false),

        // Response methods
        reply: jest.fn().mockResolvedValue({
            id: 'reply-123',
            content: '',
            embeds: [],
            components: []
        }),
        editReply: jest.fn().mockResolvedValue({
            id: 'reply-123',
            content: '',
            embeds: [],
            components: []
        }),
        deferReply: jest.fn().mockImplementation(async (options?: { ephemeral?: boolean }) => {
            // Simulate the deferred state change
            (mockInteraction as any).deferred = true;
            if (options?.ephemeral) {
                (mockInteraction as any).ephemeral = true;
            }
            return undefined;
        }),
        followUp: jest.fn().mockResolvedValue({
            id: 'followup-123',
            content: '',
            embeds: [],
            components: []
        }),
        deleteReply: jest.fn().mockResolvedValue(undefined),
        fetchReply: jest.fn().mockResolvedValue({
            id: 'reply-123',
            content: '',
            embeds: [],
            components: []
        }),

        // Utility methods
        inGuild: jest.fn().mockReturnValue(true),
        inCachedGuild: jest.fn().mockReturnValue(true),
        inRawGuild: jest.fn().mockReturnValue(false),

        // Additional properties that might be accessed
        token: 'interaction-token-123',
        version: 1,
        createdTimestamp: Date.now(),
        createdAt: new Date(),

        // Locale information
        locale: 'en-US',
        guildLocale: 'en-US'
    };

    return mockInteraction as unknown as ChatInputCommandInteraction;
}

/**
 * Creates a mock autocomplete interaction for testing autocomplete handlers
 */
export function createMockAutocompleteInteraction(options: {
    commandName: string;
    focusedOption: { name: string; value: string; type: string };
    user?: Partial<User>;
    guild?: Partial<Guild>;
}) {
    const baseInteraction = createMockInteraction({
        commandName: options.commandName,
        user: options.user,
        guild: options.guild
    });

    // Override for autocomplete-specific behavior
    const autocompleteInteraction = {
        ...baseInteraction,
        type: 4, // APPLICATION_COMMAND_AUTOCOMPLETE
        isAutocomplete: jest.fn().mockReturnValue(true),
        isChatInputCommand: jest.fn().mockReturnValue(false),
        options: {
            ...baseInteraction.options,
            getFocused: jest.fn().mockReturnValue(options.focusedOption)
        },
        respond: jest.fn().mockResolvedValue(undefined)
    };

    return autocompleteInteraction;
}

/**
 * Helper to create common interaction scenarios
 */
export const InteractionScenarios = {
    taskAdd: (description: string, priority?: string) => createMockInteraction({
        commandName: 'task',
        subcommand: 'add',
        options: {
            description,
            priority: priority || 'medium'
        }
    }),

    taskList: (filter?: string) => createMockInteraction({
        commandName: 'task',
        subcommand: 'list',
        options: {
            filter: filter || 'all'
        }
    }),

    taskComplete: (taskId: number) => createMockInteraction({
        commandName: 'task',
        subcommand: 'done',
        options: {
            task_id: taskId
        }
    }),

    budgetAdd: (description: string, amount: number, category?: string) => createMockInteraction({
        commandName: 'budget',
        subcommand: 'add',
        options: {
            description,
            amount,
            category: category || 'General'
        }
    }),

    scheduleAdd: (title: string, datetime: string, recurring?: boolean) => createMockInteraction({
        commandName: 'schedule',
        subcommand: 'add',
        options: {
            title,
            datetime,
            recurring: recurring || false
        }
    })
};
