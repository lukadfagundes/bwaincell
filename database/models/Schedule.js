const { Model, Op } = require('sequelize');
const schemas = require('../schema');

class Schedule extends Model {
    static init(sequelize) {
        return super.init(schemas.schedule, {
            sequelize,
            modelName: 'Schedule',
            tableName: 'schedules',
            timestamps: false
        });
    }

    static async addEvent(userId, guildId, event, date, time, description = null) {
        return await this.create({
            user_id: userId,
            guild_id: guildId,
            event,
            date,
            time,
            description
        });
    }

    static async getEvents(userId, guildId, filter = 'upcoming') {
        const where = { user_id: userId, guild_id: guildId };
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        if (filter === 'upcoming') {
            where.date = { [Op.gte]: today };
        } else if (filter === 'past') {
            where.date = { [Op.lt]: today };
        }

        return await this.findAll({
            where,
            order: [['date', filter === 'past' ? 'DESC' : 'ASC'], ['time', 'ASC']]
        });
    }

    static async deleteEvent(eventId, userId, guildId) {
        const result = await this.destroy({
            where: { id: eventId, user_id: userId, guild_id: guildId }
        });

        return result > 0;
    }

    static async getCountdown(userId, guildId, eventName) {
        const event = await this.findOne({
            where: {
                user_id: userId,
                guild_id: guildId,
                event: { [Op.like]: `%${eventName}%` }
            },
            order: [['date', 'ASC'], ['time', 'ASC']]
        });

        if (!event) return null;

        const eventDateTime = new Date(`${event.date} ${event.time}`);
        const now = new Date();
        const diff = eventDateTime - now;

        if (diff <= 0) return { event, timeLeft: 'Event has passed' };

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        const parts = [];
        if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
        if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
        if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);

        return {
            event,
            timeLeft: parts.length > 0 ? parts.join(', ') : 'Less than a minute'
        };
    }

    static async getTodaysEvents(userId, guildId) {
        const today = new Date().toISOString().split('T')[0];

        return await this.findAll({
            where: {
                user_id: userId,
                guild_id: guildId,
                date: today
            },
            order: [['time', 'ASC']]
        });
    }

    static async getUpcomingEvents(userId, guildId, days = 7) {
        const now = new Date();
        const future = new Date();
        future.setDate(future.getDate() + days);

        return await this.findAll({
            where: {
                user_id: userId,
                guild_id: guildId,
                date: {
                    [Op.between]: [
                        now.toISOString().split('T')[0],
                        future.toISOString().split('T')[0]
                    ]
                }
            },
            order: [['date', 'ASC'], ['time', 'ASC']]
        });
    }
}

module.exports = Schedule;