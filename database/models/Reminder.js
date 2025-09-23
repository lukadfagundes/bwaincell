const { Model } = require('sequelize');
const schemas = require('../schema');

class Reminder extends Model {
    static init(sequelize) {
        return super.init(schemas.reminder, {
            sequelize,
            modelName: 'Reminder',
            tableName: 'reminders',
            timestamps: false
        });
    }

    static async createReminder(userId, guildId, channelId, message, time, frequency = 'once', dayOfWeek = null) {
        const nextTrigger = this.calculateNextTrigger(time, frequency, dayOfWeek);

        return await this.create({
            user_id: userId,
            guild_id: guildId,
            channel_id: channelId,
            message,
            time,
            frequency,
            day_of_week: dayOfWeek,
            next_trigger: nextTrigger,
            active: true
        });
    }

    static calculateNextTrigger(time, frequency, dayOfWeek) {
        const now = new Date();
        const [hours, minutes] = time.split(':').map(Number);
        let nextTrigger = new Date();

        nextTrigger.setHours(hours, minutes, 0, 0);

        if (frequency === 'once') {
            if (nextTrigger <= now) {
                nextTrigger.setDate(nextTrigger.getDate() + 1);
            }
        } else if (frequency === 'daily') {
            if (nextTrigger <= now) {
                nextTrigger.setDate(nextTrigger.getDate() + 1);
            }
        } else if (frequency === 'weekly' && dayOfWeek !== null) {
            const currentDay = now.getDay();
            let daysUntilNext = (dayOfWeek - currentDay + 7) % 7;

            if (daysUntilNext === 0 && nextTrigger <= now) {
                daysUntilNext = 7;
            }

            nextTrigger.setDate(nextTrigger.getDate() + daysUntilNext);
        }

        return nextTrigger;
    }

    static async getActiveReminders() {
        return await this.findAll({
            where: { active: true },
            order: [['next_trigger', 'ASC']]
        });
    }

    static async getUserReminders(userId, guildId) {
        return await this.findAll({
            where: { user_id: userId, guild_id: guildId, active: true },
            order: [['next_trigger', 'ASC']]
        });
    }

    static async deleteReminder(reminderId, userId, guildId) {
        const result = await this.update(
            { active: false },
            { where: { id: reminderId, user_id: userId, guild_id: guildId } }
        );

        return result[0] > 0;
    }

    static async updateNextTrigger(reminderId) {
        const reminder = await this.findByPk(reminderId);

        if (!reminder || !reminder.active) return null;

        if (reminder.frequency === 'once') {
            reminder.active = false;
        } else {
            reminder.next_trigger = this.calculateNextTrigger(
                reminder.time,
                reminder.frequency,
                reminder.day_of_week
            );
        }

        await reminder.save();
        return reminder;
    }

    static async getTriggeredReminders() {
        const now = new Date();
        return await this.findAll({
            where: {
                active: true,
                next_trigger: { [require('sequelize').Op.lte]: now }
            }
        });
    }
}

module.exports = Reminder;