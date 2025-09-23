const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Note = require('../database/models/Note');

module.exports = {
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

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        try {
            switch (subcommand) {
                case 'add': {
                    const title = interaction.options.getString('title');
                    const content = interaction.options.getString('content');
                    const tagsString = interaction.options.getString('tags');
                    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()) : [];

                    const note = await Note.createNote(userId, guildId, title, content, tags);

                    const embed = new EmbedBuilder()
                        .setTitle('Note Created')
                        .setDescription(`📝 **${title}**`)
                        .addFields({ name: 'Note ID', value: `#${note.id}` })
                        .setColor(0x00FF00)
                        .setTimestamp();

                    if (tags.length > 0) {
                        embed.addFields({ name: 'Tags', value: tags.join(', ') });
                    }

                    await interaction.reply({ embeds: [embed] });
                    break;
                }

                case 'list': {
                    const notes = await Note.getNotes(userId, guildId);

                    if (notes.length === 0) {
                        await interaction.reply({
                            content: 'You have no notes.',
                            ephemeral: true
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

                    await interaction.reply({ embeds: [embed] });
                    break;
                }

                case 'view': {
                    const noteId = interaction.options.getInteger('note_id');
                    const note = await Note.getNote(noteId, userId, guildId);

                    if (!note) {
                        await interaction.reply({
                            content: `Note #${noteId} not found or doesn't belong to you.`,
                            ephemeral: true
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

                    await interaction.reply({ embeds: [embed] });
                    break;
                }

                case 'delete': {
                    const noteId = interaction.options.getInteger('note_id');
                    const deleted = await Note.deleteNote(noteId, userId, guildId);

                    if (!deleted) {
                        await interaction.reply({
                            content: `Note #${noteId} not found or doesn't belong to you.`,
                            ephemeral: true
                        });
                        return;
                    }

                    await interaction.reply({
                        content: `Note #${noteId} has been deleted.`,
                        ephemeral: true
                    });
                    break;
                }

                case 'search': {
                    const keyword = interaction.options.getString('keyword');
                    const notes = await Note.searchNotes(userId, guildId, keyword);

                    if (notes.length === 0) {
                        await interaction.reply({
                            content: `No notes found containing "${keyword}".`,
                            ephemeral: true
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

                    await interaction.reply({ embeds: [embed] });
                    break;
                }

                case 'edit': {
                    const noteId = interaction.options.getInteger('note_id');
                    const newTitle = interaction.options.getString('title');
                    const newContent = interaction.options.getString('content');
                    const tagsString = interaction.options.getString('tags');

                    const updates = {};
                    if (newTitle) updates.title = newTitle;
                    if (newContent) updates.content = newContent;
                    if (tagsString !== null) updates.tags = tagsString.split(',').map(tag => tag.trim());

                    if (Object.keys(updates).length === 0) {
                        await interaction.reply({
                            content: 'No changes provided.',
                            ephemeral: true
                        });
                        return;
                    }

                    const note = await Note.updateNote(noteId, userId, guildId, updates);

                    if (!note) {
                        await interaction.reply({
                            content: `Note #${noteId} not found or doesn't belong to you.`,
                            ephemeral: true
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

                    await interaction.reply({ embeds: [embed] });
                    break;
                }

                case 'tag': {
                    const tag = interaction.options.getString('tag');
                    const notes = await Note.getNotesByTag(userId, guildId, tag);

                    if (notes.length === 0) {
                        await interaction.reply({
                            content: `No notes found with tag "${tag}".`,
                            ephemeral: true
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

                    await interaction.reply({ embeds: [embed] });
                    break;
                }

                case 'tags': {
                    const tags = await Note.getAllTags(userId, guildId);

                    if (tags.length === 0) {
                        await interaction.reply({
                            content: 'No tags found in your notes.',
                            ephemeral: true
                        });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('Your Tags')
                        .setDescription(tags.map(tag => `🏷️ ${tag}`).join('\n'))
                        .setColor(0x0099FF)
                        .setFooter({ text: `${tags.length} unique tag(s)` })
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed] });
                    break;
                }
            }
        } catch (error) {
            console.error(`Error in note ${subcommand}:`, error);
            const errorMessage = {
                content: 'An error occurred while processing your request.',
                ephemeral: true
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }
};