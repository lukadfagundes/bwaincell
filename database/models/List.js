const { Model } = require('sequelize');
const schemas = require('../schema');

class List extends Model {
    static init(sequelize) {
        return super.init(schemas.list, {
            sequelize,
            modelName: 'List',
            tableName: 'lists',
            timestamps: false
        });
    }

    static async createList(userId, guildId, name) {
        const existing = await this.findOne({
            where: { user_id: userId, guild_id: guildId, name }
        });

        if (existing) return null;

        return await this.create({
            user_id: userId,
            guild_id: guildId,
            name,
            items: []
        });
    }

    static async addItem(userId, guildId, listName, item) {
        const list = await this.findOne({
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

    static async removeItem(userId, guildId, listName, itemText) {
        const list = await this.findOne({
            where: { user_id: userId, guild_id: guildId, name: listName }
        });

        if (!list) return null;

        const items = list.items || [];
        const index = items.findIndex(item => item.text.toLowerCase() === itemText.toLowerCase());

        if (index === -1) return null;

        items.splice(index, 1);
        list.items = items;
        await list.save();

        return list;
    }

    static async getList(userId, guildId, listName) {
        return await this.findOne({
            where: { user_id: userId, guild_id: guildId, name: listName }
        });
    }

    static async getUserLists(userId, guildId) {
        return await this.findAll({
            where: { user_id: userId, guild_id: guildId },
            order: [['created_at', 'DESC']]
        });
    }

    static async clearCompleted(userId, guildId, listName) {
        const list = await this.findOne({
            where: { user_id: userId, guild_id: guildId, name: listName }
        });

        if (!list) return null;

        const items = list.items || [];
        list.items = items.filter(item => !item.completed);
        await list.save();

        return list;
    }

    static async deleteList(userId, guildId, listName) {
        const result = await this.destroy({
            where: { user_id: userId, guild_id: guildId, name: listName }
        });

        return result > 0;
    }

    static async toggleItem(userId, guildId, listName, itemText) {
        const list = await this.findOne({
            where: { user_id: userId, guild_id: guildId, name: listName }
        });

        if (!list) return null;

        const items = list.items || [];
        const item = items.find(item => item.text.toLowerCase() === itemText.toLowerCase());

        if (!item) return null;

        item.completed = !item.completed;
        list.items = items;
        await list.save();

        return list;
    }
}

module.exports = List;