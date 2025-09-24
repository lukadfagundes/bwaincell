import { Model, Optional, Sequelize } from 'sequelize';
import schemas from '../schema';

// Define interface for list items
interface ListItem {
    text: string;
    completed: boolean;
    added_at: Date;
}

// Define attributes interface matching the schema
interface ListAttributes {
    id: number;
    name: string;
    items: ListItem[];
    user_id: string;
    guild_id: string;
    created_at: Date;
}

// Creation attributes (id and created_at are optional during creation)
interface ListCreationAttributes extends Optional<ListAttributes, 'id' | 'created_at' | 'items'> {}

const ListBase = Model as any;
class List extends ListBase<ListAttributes, ListCreationAttributes> implements ListAttributes {
    public id!: number;
    public name!: string;
    public items!: ListItem[];
    public user_id!: string;
    public guild_id!: string;
    public created_at!: Date;

    static init(sequelize: Sequelize) {
        return Model.init.call(this as any, schemas.list, {
            sequelize,
            modelName: 'List',
            tableName: 'lists',
            timestamps: false
        });
    }

    static async createList(userId: string, guildId: string, name: string): Promise<List | null> {
        const existing = await (this as any).findOne({
            where: { user_id: userId, guild_id: guildId, name }
        });

        if (existing) return null;

        return await (this as any).create({
            user_id: userId,
            guild_id: guildId,
            name,
            items: []
        });
    }

    static async addItem(userId: string, guildId: string, listName: string, item: string): Promise<List | null> {
        const list = await (this as any).findOne({
            where: { user_id: userId, guild_id: guildId, name: listName }
        });

        if (!list) return null;

        const items = list.items || [];
        items.push({
            text: item,
            completed: false,
            added_at: new Date()
        });

        list.items = items;
        await list.save();

        return list;
    }

    static async removeItem(userId: string, guildId: string, listName: string, itemText: string): Promise<List | null> {
        const list = await (this as any).findOne({
            where: { user_id: userId, guild_id: guildId, name: listName }
        });

        if (!list) return null;

        const items = list.items || [];
        const index = items.findIndex((item: any) => item.text.toLowerCase() === itemText.toLowerCase());

        if (index === -1) return null;

        items.splice(index, 1);
        list.items = items;
        await list.save();

        return list;
    }

    static async getList(userId: string, guildId: string, listName: string): Promise<List | null> {
        return await (this as any).findOne({
            where: { user_id: userId, guild_id: guildId, name: listName }
        });
    }

    static async getUserLists(userId: string, guildId: string): Promise<List[]> {
        return await (this as any).findAll({
            where: { user_id: userId, guild_id: guildId },
            order: [['created_at', 'DESC']]
        });
    }

    static async clearCompleted(userId: string, guildId: string, listName: string): Promise<List | null> {
        const list = await (this as any).findOne({
            where: { user_id: userId, guild_id: guildId, name: listName }
        });

        if (!list) return null;

        const items = list.items || [];
        list.items = items.filter((item: any) => !item.completed);
        await list.save();

        return list;
    }

    static async deleteList(userId: string, guildId: string, listName: string): Promise<boolean> {
        const result = await (this as any).destroy({
            where: { user_id: userId, guild_id: guildId, name: listName }
        });

        return result > 0;
    }

    static async toggleItem(userId: string, guildId: string, listName: string, itemText: string): Promise<List | null> {
        const list = await (this as any).findOne({
            where: { user_id: userId, guild_id: guildId, name: listName }
        });

        if (!list) return null;

        const items = list.items || [];
        const item = items.find((item: any) => item.text.toLowerCase() === itemText.toLowerCase());

        if (!item) return null;

        item.completed = !item.completed;
        list.items = items;
        await list.save();

        return list;
    }
}

export default List;