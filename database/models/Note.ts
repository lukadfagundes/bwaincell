import { Model, Optional, Sequelize, Op } from 'sequelize';
import schemas from '../schema';

// Define attributes interface matching the schema
interface NoteAttributes {
    id: number;
    title: string;
    content: string;
    tags: string[];
    created_at: Date;
    updated_at: Date;
    user_id: string;
    guild_id: string;
}

// Creation attributes (id and timestamps are optional during creation)
interface NoteCreationAttributes extends Optional<NoteAttributes, 'id' | 'created_at' | 'updated_at' | 'tags'> {}

// Update attributes interface
interface NoteUpdateAttributes {
    title?: string;
    content?: string;
    tags?: string[];
}

const NoteBase = Model as any;
class Note extends NoteBase<NoteAttributes, NoteCreationAttributes> implements NoteAttributes {
    public id!: number;
    public title!: string;
    public content!: string;
    public tags!: string[];
    public created_at!: Date;
    public updated_at!: Date;
    public user_id!: string;
    public guild_id!: string;

    static init(sequelize: Sequelize) {
        return Model.init.call(this as any, schemas.note, {
            sequelize,
            modelName: 'Note',
            tableName: 'notes',
            timestamps: false
        });
    }

    static async createNote(userId: string, guildId: string, title: string, content: string, tags: string[] = []): Promise<Note> {
        return await (this as any).create({
            user_id: userId,
            guild_id: guildId,
            title,
            content,
            tags
        });
    }

    static async getNotes(userId: string, guildId: string): Promise<Note[]> {
        return await (this as any).findAll({
            where: { user_id: userId, guild_id: guildId },
            order: [['created_at', 'DESC']]
        });
    }

    static async getNote(noteId: number, userId: string, guildId: string): Promise<Note | null> {
        return await (this as any).findOne({
            where: { id: noteId, user_id: userId, guild_id: guildId }
        });
    }

    static async deleteNote(noteId: number, userId: string, guildId: string): Promise<boolean> {
        const result = await (this as any).destroy({
            where: { id: noteId, user_id: userId, guild_id: guildId }
        });

        return result > 0;
    }

    static async searchNotes(userId: string, guildId: string, keyword: string): Promise<Note[]> {
        return await (this as any).findAll({
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

    static async updateNote(noteId: number, userId: string, guildId: string, updates: NoteUpdateAttributes): Promise<Note | null> {
        const note = await (this as any).findOne({
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

    static async getNotesByTag(userId: string, guildId: string, tag: string): Promise<Note[]> {
        const notes = await (this as any).findAll({
            where: { user_id: userId, guild_id: guildId }
        });

        return notes.filter((note: any) => {
            const tags = note.tags || [];
            return tags.some((t: string) => t.toLowerCase() === tag.toLowerCase());
        });
    }

    static async getAllTags(userId: string, guildId: string): Promise<string[]> {
        const notes = await (this as any).findAll({
            where: { user_id: userId, guild_id: guildId },
            attributes: ['tags']
        });

        const allTags = new Set<string>();
        notes.forEach((note: any) => {
            if (note.tags && Array.isArray(note.tags)) {
                note.tags.forEach((tag: string) => allTags.add(tag));
            }
        });

        return Array.from(allTags);
    }
}

export default Note;