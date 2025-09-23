const { Model } = require('sequelize');
const schemas = require('../schema');

class Task extends Model {
    static init(sequelize) {
        return super.init(schemas.task, {
            sequelize,
            modelName: 'Task',
            tableName: 'tasks',
            timestamps: false
        });
    }

    static async createTask(userId, guildId, description, dueDate = null) {
        return await this.create({
            user_id: userId,
            guild_id: guildId,
            description,
            due_date: dueDate
        });
    }

    static async getUserTasks(userId, guildId, filter = 'all') {
        const where = { user_id: userId, guild_id: guildId };

        if (filter === 'pending') {
            where.completed = false;
        } else if (filter === 'completed') {
            where.completed = true;
        }

        return await this.findAll({ where, order: [['created_at', 'DESC']] });
    }

    static async completeTask(taskId, userId, guildId) {
        const task = await this.findOne({
            where: { id: taskId, user_id: userId, guild_id: guildId }
        });

        if (!task) return null;

        task.completed = true;
        task.completed_at = new Date();
        await task.save();

        return task;
    }

    static async deleteTask(taskId, userId, guildId) {
        const result = await this.destroy({
            where: { id: taskId, user_id: userId, guild_id: guildId }
        });

        return result > 0;
    }

    static async editTask(taskId, userId, guildId, newDescription) {
        const task = await this.findOne({
            where: { id: taskId, user_id: userId, guild_id: guildId }
        });

        if (!task) return null;

        task.description = newDescription;
        await task.save();

        return task;
    }
}

module.exports = Task;