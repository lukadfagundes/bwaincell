const { Model, Op } = require('sequelize');
const schemas = require('../schema');

class Tracker extends Model {
    static init(sequelize) {
        return super.init(schemas.tracker, {
            sequelize,
            modelName: 'Tracker',
            tableName: 'trackers',
            timestamps: false
        });
    }

    static async addDataPoint(userId, guildId, metric, value) {
        return await this.create({
            user_id: userId,
            guild_id: guildId,
            metric,
            value
        });
    }

    static async getStats(userId, guildId, metric, period = 'all') {
        const where = { user_id: userId, guild_id: guildId, metric };

        if (period !== 'all') {
            const now = new Date();
            let startDate;

            switch (period) {
                case 'day':
                    startDate = new Date(now.setHours(0, 0, 0, 0));
                    break;
                case 'week':
                    startDate = new Date(now.setDate(now.getDate() - 7));
                    break;
                case 'month':
                    startDate = new Date(now.setMonth(now.getMonth() - 1));
                    break;
                case 'year':
                    startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                    break;
                default:
                    startDate = null;
            }

            if (startDate) {
                where.timestamp = { [Op.gte]: startDate };
            }
        }

        const data = await this.findAll({
            where,
            order: [['timestamp', 'ASC']]
        });

        if (data.length === 0) return null;

        const values = data.map(d => d.value);
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);

        return {
            metric,
            period,
            count: data.length,
            sum: sum.toFixed(2),
            average: avg.toFixed(2),
            min: min.toFixed(2),
            max: max.toFixed(2),
            latest: values[values.length - 1].toFixed(2),
            data: data.slice(-10)
        };
    }

    static async getMetrics(userId, guildId) {
        const metrics = await this.findAll({
            where: { user_id: userId, guild_id: guildId },
            attributes: ['metric'],
            group: ['metric'],
            raw: true
        });

        return [...new Set(metrics.map(m => m.metric))];
    }

    static async deleteMetric(userId, guildId, metric) {
        const result = await this.destroy({
            where: { user_id: userId, guild_id: guildId, metric }
        });

        return result > 0;
    }

    static async getRecentData(userId, guildId, metric, limit = 10) {
        return await this.findAll({
            where: { user_id: userId, guild_id: guildId, metric },
            order: [['timestamp', 'DESC']],
            limit
        });
    }
}

module.exports = Tracker;