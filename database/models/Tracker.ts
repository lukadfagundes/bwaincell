import { Model, Optional, Sequelize, Op } from 'sequelize';
import schemas from '../schema';

// Define period types
type TrackerPeriod = 'all' | 'day' | 'week' | 'month' | 'year';

// Define attributes interface matching the schema
interface TrackerAttributes {
    id: number;
    metric: string;
    value: number;
    timestamp: Date;
    user_id: string;
    guild_id: string;
}

// Creation attributes (id and timestamp are optional during creation)
interface TrackerCreationAttributes extends Optional<TrackerAttributes, 'id' | 'timestamp'> {}

// Interface for tracker statistics
interface TrackerStats {
    metric: string;
    period: TrackerPeriod;
    count: number;
    sum: string;
    average: string;
    min: string;
    max: string;
    latest: string;
    data: Tracker[];
}

const TrackerBase = Model as any;
class Tracker extends TrackerBase<TrackerAttributes, TrackerCreationAttributes> implements TrackerAttributes {
    // Sequelize automatically provides getters/setters for these fields
    // Commenting out to prevent shadowing warnings
    // public id!: number;
    // public metric!: string;
    // public value!: number;
    // public timestamp!: Date;
    // public user_id!: string;
    // public guild_id!: string;

    static init(sequelize: Sequelize) {
        return Model.init.call(this as any, schemas.tracker, {
            sequelize,
            modelName: 'Tracker',
            tableName: 'trackers',
            timestamps: false
        });
    }

    // Helper to find actual metric name case-insensitively
    private static async findActualMetric(userId: string, guildId: string, metric: string): Promise<string | null> {
        const metrics = await this.getMetrics(userId, guildId);
        return metrics.find(m => m.toLowerCase() === metric.toLowerCase()) || null;
    }

    static async addDataPoint(userId: string, guildId: string, metric: string, value: number): Promise<Tracker> {
        // Use existing metric case if it exists, otherwise use provided case
        const actualMetric = await this.findActualMetric(userId, guildId, metric) || metric;

        return await (this as any).create({
            user_id: userId,
            guild_id: guildId,
            metric: actualMetric,
            value
        });
    }

    static async getStats(userId: string, guildId: string, metric: string, period: TrackerPeriod = 'all'): Promise<TrackerStats | null> {
        const actualMetric = await this.findActualMetric(userId, guildId, metric);
        if (!actualMetric) return null;

        const where: any = { user_id: userId, guild_id: guildId, metric: actualMetric };

        if (period !== 'all') {
            const now = new Date();
            let startDate: Date | null = null;

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

        const data = await (this as any).findAll({
            where,
            order: [['timestamp', 'ASC']]
        });

        if (data.length === 0) return null;

        const values = data.map((d: any) => d.value);
        const sum = values.reduce((a: number, b: number) => a + b, 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);

        return {
            metric: actualMetric,
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

    static async getMetrics(userId: string, guildId: string): Promise<string[]> {
        const metrics = await (this as any).findAll({
            where: { user_id: userId, guild_id: guildId },
            attributes: ['metric'],
            group: ['metric'],
            raw: true
        }) as { metric: string }[];

        return Array.from(new Set(metrics.map(m => m.metric)));
    }

    static async deleteMetric(userId: string, guildId: string, metric: string): Promise<boolean> {
        const actualMetric = await this.findActualMetric(userId, guildId, metric);
        if (!actualMetric) return false;

        const result = await (this as any).destroy({
            where: { user_id: userId, guild_id: guildId, metric: actualMetric }
        });

        return result > 0;
    }

    static async getRecentData(userId: string, guildId: string, metric: string, limit: number = 10): Promise<Tracker[]> {
        const actualMetric = await this.findActualMetric(userId, guildId, metric);
        if (!actualMetric) return [];

        return await (this as any).findAll({
            where: { user_id: userId, guild_id: guildId, metric: actualMetric },
            order: [['timestamp', 'DESC']],
            limit
        });
    }
}

export default Tracker;
