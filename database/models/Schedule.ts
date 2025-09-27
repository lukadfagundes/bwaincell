import { Model, Optional, Sequelize, Op } from 'sequelize';
import schemas from '../schema';

// Define filter types
type ScheduleFilter = 'upcoming' | 'past' | 'all';

// Define attributes interface matching the schema
interface ScheduleAttributes {
    id: number;
    event: string;
    date: string; // DATEONLY type
    time: string; // TIME type
    description?: string | null;
    user_id: string;
    guild_id: string;
    created_at: Date;
}

// Creation attributes (id and created_at are optional during creation)
interface ScheduleCreationAttributes extends Optional<ScheduleAttributes, 'id' | 'created_at' | 'description'> {}

// Interface for countdown result
interface CountdownResult {
    event: Schedule;
    timeLeft: string;
}

const ScheduleBase = Model as any;
class Schedule extends ScheduleBase<ScheduleAttributes, ScheduleCreationAttributes> implements ScheduleAttributes {
    public id!: number;
    public event!: string;
    public date!: string;
    public time!: string;
    public description?: string | null;
    public user_id!: string;
    public guild_id!: string;
    public created_at!: Date;

    static init(sequelize: Sequelize) {
        return Model.init.call(this as any, schemas.schedule, {
            sequelize,
            modelName: 'Schedule',
            tableName: 'schedules',
            timestamps: false
        });
    }

    static async addEvent(
        userId: string,
        guildId: string,
        event: string,
        date: string,
        time: string,
        description: string | null = null
    ): Promise<Schedule> {
        return await (this as any).create({
            user_id: userId,
            guild_id: guildId,
            event,
            date,
            time,
            description
        });
    }

    static async getEvents(userId: string, guildId: string, filter: ScheduleFilter = 'upcoming'): Promise<Schedule[]> {
        const where: any = { user_id: userId, guild_id: guildId };
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        if (filter === 'upcoming') {
            where.date = { [Op.gte]: today };
        } else if (filter === 'past') {
            where.date = { [Op.lt]: today };
        }

        return await (this as any).findAll({
            where,
            order: [['date', filter === 'past' ? 'DESC' : 'ASC'], ['time', 'ASC']]
        });
    }

    static async deleteEvent(eventId: number, userId: string, guildId: string): Promise<boolean> {
        const result = await (this as any).destroy({
            where: { id: eventId, user_id: userId, guild_id: guildId }
        });

        return result > 0;
    }

    static async getCountdown(userId: string, guildId: string, eventName: string): Promise<CountdownResult | null> {
        const event = await (this as any).findOne({
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
        const diff = eventDateTime.getTime() - now.getTime();

        if (diff <= 0) return { event, timeLeft: 'Event has passed' };

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        const parts: string[] = [];
        if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
        if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
        if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);

        return {
            event,
            timeLeft: parts.length > 0 ? parts.join(', ') : 'Less than a minute'
        };
    }

    static async getTodaysEvents(userId: string, guildId: string): Promise<Schedule[]> {
        const today = new Date().toISOString().split('T')[0];

        return await (this as any).findAll({
            where: {
                user_id: userId,
                guild_id: guildId,
                date: today
            },
            order: [['time', 'ASC']]
        });
    }

    static async getUpcomingEvents(userId: string, guildId: string, days: number = 7): Promise<Schedule[]> {
        const now = new Date();
        const future = new Date();
        future.setDate(future.getDate() + days);

        return await (this as any).findAll({
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

export default Schedule;
