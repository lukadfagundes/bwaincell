import {
    SlashCommandBuilder,
    EmbedBuilder,
    ChatInputCommandInteraction
} from 'discord.js';
import { logger } from '../shared/utils/logger';
import Note from '../database/models/Note';

interface NoteUpdateData {
    title?: string;
    content?: string;
    tags?: string[];
}

export default {
    data: new SlashCommandBuilder()
        .setName('note')
        .setDescription('Manage your notes')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Create a new note')
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('Note title')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('content')
                        .setDescription('Note content')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('tags')
                        .setDescription('Comma-separated tags')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Show all your notes'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('Display a specific note')
                .addIntegerOption(option =>
                    option.setName('note_id')
                        .setDescription('Note ID to view')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Remove a note')
                .addIntegerOption(option =>
                    option.setName('note_id')
                        .setDescription('Note ID to delete')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('search')
                .setDescription('Search notes by keyword')
                .addStringOption(option =>
                    option.setName('keyword')
                        .setDescription('Keyword to search for')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit an existing note')
                .addIntegerOption(option =>
                    option.setName('note_id')
                        .setDescription('Note ID to edit')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('New title (leave empty to keep current)')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('content')
                        .setDescription('New content (leave empty to keep current)')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('tags')
                        .setDescription('New comma-separated tags')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('tag')
                .setDescription('Find notes by tag')
                .addStringOption(option =>
                    option.setName('tag')
                        .setDescription('Tag to search for')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('tags')
                .setDescription('List all your tags')),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        // Note: Interaction is already deferred by bot.js for immediate acknowledgment

        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const guildId = interaction.guild?.id;

        if (!guildId) {
            await interaction.editReply({
                content: 'This command can only be used in a server.'
            });
            return;
        }

        try {
            switch (subcommand) {
                case 'add': {
                    const title = interaction.options.getString('title', true);
                    const content = interaction.options.getString('content', true);
                    const tagsString = interaction.options.getString('tags');
                    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()) : [];const note= await Note.createNote(userId, guildId, title, content, tags);

                    const embed = new EmbedBuilder()
                        .setTitle('Note Created')
                        .setDescription(`📝 **${title}**`)
                        .addFields({ name: 'Note ID', value: `#${note.id}` })
                        .setColor(0x00FF00)
                        .setTimestamp();

                    if (tags.length > 0) {
                        embed.addFields({ name: 'Tags', value: tags.join(', ') });
                    }

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case 'list': {const notes= await Note.getNotes(userId, guildId);

                    if (notes.length === 0) {
                        await interaction.editReply({
                            content: 'You have no notes.'

                        });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('Your Notes')
                        .setColor(0x0099FF)
                        .setTimestamp();

                    const noteList = notes.slice(0, 10).map(note => {
                        const tags = note.tags && note.tags.length > 0 ? ` [${note.tags.join(', ')}]` : '';
                        const preview = note.content.substring(0, 50) + (note.content.length > 50 ? '...' : '');
                        return `**#${note.id}** - ${note.title}${tags}\n📝 ${preview}`;
                    }).join('\n\n');

                    embed.setDescription(noteList);

                    if (notes.length > 10) {
                        embed.setFooter({ text: `Showing 10 of ${notes.length} notes` });
                    } else {
                        embed.setFooter({ text: `${notes.length} note(s)` });
                    }

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case 'view': {
                    const noteId = interaction.options.getInteger('note_id', true);const note = await Note.getNote(noteId, userId, guildId);

                    if (!note) {
                        await interaction.editReply({
                            content: `Note #${noteId} not found or doesn't belong to you.`

                        });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle(note.title)
                        .setDescription(note.content)
                        .setColor(0x0099FF)
                        .addFields(
                            { name: 'Note ID', value: `#${note.id}`, inline: true },
                            { name: 'Created', value: new Date(note.created_at).toLocaleDateString(), inline: true }
                        )
                        .setTimestamp();

                    if (note.tags && note.tags.length > 0) {
                        embed.addFields({ name: 'Tags', value: note.tags.join(', ') });
                    }

                    if (note.updated_at !== note.created_at) {
                        embed.addFields({ name: 'Last Updated', value: new Date(note.updated_at).toLocaleDateString() });
                    }

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case 'delete': {
                    const noteId = interaction.options.getInteger('note_id', true);
                    const deleted: boolean = await Note.deleteNote(noteId, userId, guildId);

                    if (!deleted) {
                        await interaction.editReply({
                            content: `Note #${noteId} not found or doesn't belong to you.`,
                            
                        });
                        return;
                    }

                    await interaction.editReply({
                        content: `Note #${noteId} has been deleted.`,
                        
                    });
                    break;
                }

                case 'search': {
                    const keyword = interaction.options.getString('keyword', true);const notes= await Note.searchNotes(userId, guildId, keyword);

                    if (notes.length === 0) {
                        await interaction.editReply({
                            content: `No notes found containing "${keyword}".`

                        });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle(`Search Results for "${keyword}"`)
                        .setColor(0x0099FF)
                        .setTimestamp();

                    const noteList = notes.slice(0, 10).map(note => {
                        const tags = note.tags && note.tags.length > 0 ? ` [${note.tags.join(', ')}]` : '';
                        return `**#${note.id}** - ${note.title}${tags}`;
                    }).join('\n');

                    embed.setDescription(noteList);
                    embed.setFooter({ text: `Found ${notes.length} note(s)` });

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case 'edit': {
                    const noteId = interaction.options.getInteger('note_id', true);
                    const newTitle = interaction.options.getString('title');
                    const newContent = interaction.options.getString('content');
                    const tagsString = interaction.options.getString('tags');

                    const updates: NoteUpdateData = {};
                    if (newTitle) updates.title = newTitle;
                    if (newContent) updates.content = newContent;
                    if (tagsString !== null) updates.tags = tagsString.split(',').map(tag => tag.trim());

                    if (Object.keys(updates).length === 0) {
                        await interaction.editReply({
                            content: 'No changes provided.',
                            
                        });
                        return;
                    }const note = await Note.updateNote(noteId, userId, guildId, updates);

                    if (!note) {
                        await interaction.editReply({
                            content: `Note #${noteId} not found or doesn't belong to you.`

                        });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('Note Updated')
                        .setDescription(`Note #${noteId} has been updated successfully.`)
                        .addFields({ name: 'Title', value: note.title })
                        .setColor(0x00FF00)
                        .setTimestamp();

                    if (note.tags && note.tags.length > 0) {
                        embed.addFields({ name: 'Tags', value: note.tags.join(', ') });
                    }

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case 'tag': {
                    const tag = interaction.options.getString('tag', true);const notes= await Note.getNotesByTag(userId, guildId, tag);

                    if (notes.length === 0) {
                        await interaction.editReply({
                            content: `No notes found with tag "${tag}".`

                        });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle(`Notes tagged with "${tag}"`)
                        .setColor(0x0099FF)
                        .setTimestamp();

                    const noteList = notes.slice(0, 10).map(note => {
                        return `**#${note.id}** - ${note.title}`;
                    }).join('\n');

                    embed.setDescription(noteList);
                    embed.setFooter({ text: `Found ${notes.length} note(s)` });

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case 'tags': {
                    const tags: string[] = await Note.getAllTags(userId, guildId);

                    if (tags.length === 0) {
                        await interaction.editReply({
                            content: 'No tags found in your notes.',
                            
                        });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('Your Tags')
                        .setDescription(tags.map(tag => `🏷️ ${tag}`).join('\n'))
                        .setColor(0x0099FF)
                        .setFooter({ text: `${tags.length} unique tag(s)` })
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;

            logger.error('Error in note command', {
                command: interaction.commandName,
                subcommand,
                error: errorMessage,
                stack: errorStack,
                userId: interaction.user.id,
                guildId: interaction.guild?.id
            });

            const replyMessage = {
                content: 'An error occurred while processing your request.',
                
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(replyMessage);
            } else {
                await interaction.editReply(replyMessage);
            }
        }
    }
};