const { Model, Op } = require('sequelize');
const schemas = require('../schema');

class Note extends Model {
    static init(sequelize) {
        return super.init(schemas.note, {
            sequelize,
            modelName: 'Note',
            tableName: 'notes',
            timestamps: false
        });
    }

    static async createNote(userId, guildId, title, content, tags = []) {
        return await this.create({
            user_id: userId,
            guild_id: guildId,
            title,
            content,
            tags
        });
    }

    static async getNotes(userId, guildId) {
        return await this.findAll({
            where: { user_id: userId, guild_id: guildId },
            order: [['created_at', 'DESC']]
        });
    }

    static async getNote(noteId, userId, guildId) {
        return await this.findOne({
            where: { id: noteId, user_id: userId, guild_id: guildId }
        });
    }

    static async deleteNote(noteId, userId, guildId) {
        const result = await this.destroy({
            where: { id: noteId, user_id: userId, guild_id: guildId }
        });

        return result > 0;
    }

    static async searchNotes(userId, guildId, keyword) {
        return await this.findAll({
            where: {
                user_id: userId,
                guild_id: guildId,
                [Op.or]: [
                    { title: { [Op.like]: `%${keyword}%` } },
                    { content: { [Op.like]: `%${keyword}%` } }
                ]
            },
            order: [['created_at', 'DESC']]
        });
    }

    static async updateNote(noteId, userId, guildId, updates) {
        const note = await this.findOne({
            where: { id: noteId, user_id: userId, guild_id: guildId }
        });

        if (!note) return null;

        if (updates.title) note.title = updates.title;
        if (updates.content) note.content = updates.content;
        if (updates.tags) note.tags = updates.tags;

        note.updated_at = new Date();
        await note.save();

        return note;
    }

    static async getNotesByTag(userId, guildId, tag) {
        const notes = await this.findAll({
            where: { user_id: userId, guild_id: guildId }
        });

        return notes.filter(note => {
            const tags = note.tags || [];
            return tags.some(t => t.toLowerCase() === tag.toLowerCase());
        });
    }

    static async getAllTags(userId, guildId) {
        const notes = await this.findAll({
            where: { user_id: userId, guild_id: guildId },
            attributes: ['tags']
        });

        const allTags = new Set();
        notes.forEach(note => {
            if (note.tags && Array.isArray(note.tags)) {
                note.tags.forEach(tag => allTags.add(tag));
            }
        });

        return Array.from(allTags);
    }
}

module.exports = Note;