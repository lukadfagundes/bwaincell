import { Model, Optional, Sequelize, Op } from 'sequelize';
import schemas from '../schema';

// Define frequency enum type
type ReminderFrequency = 'once' | 'daily' | 'weekly';

// Define attributes interface matching the schema
interface ReminderAttributes {
    id: number;
    message: string;
    time: string;
    frequency: ReminderFrequency;
    day_of_week?: number | null;
    channel_id: string;
    user_id: string;
    guild_id: string;
    active: boolean;
    next_trigger?: Date | null;
}

// Creation attributes (id is optional during creation)
interface ReminderCreationAttributes extends Optional<ReminderAttributes, 'id' | 'active' | 'next_trigger'> {}

const ReminderBase = Model as any;
class Reminder extends ReminderBase<ReminderAttributes, ReminderCreationAttributes> implements ReminderAttributes {
    // Commenting out public fields to prevent Sequelize warnings
    // public id!: number;
    // public message!: string;
    // public time!: string;
    // public frequency!: ReminderFrequency;
    // public day_of_week?: number | null;
    // public channel_id!: string;
    // public user_id!: string;
    // public guild_id!: string;
    // public active!: boolean;
    // public next_trigger?: Date | null;

    static init(sequelize: Sequelize) {
        return Model.init.call(this as any, schemas.reminder, {
            sequelize,
            modelName: 'Reminder',
            tableName: 'reminders',
            timestamps: false
        });
    }

    static async createReminder(
        userId: string,
        guildId: string,
        channelId: string,
        message: string,
        time: string,
        frequency: ReminderFrequency = 'once',
        dayOfWeek: number | null = null
    ): Promise<Reminder> {
        const nextTrigger = this.calculateNextTrigger(time, frequency, dayOfWeek);

        return await (this as any).create({
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

    static calculateNextTrigger(time: string, frequency: ReminderFrequency, dayOfWeek: number | null): Date {
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

    static async getActiveReminders(): Promise<Reminder[]> {
        return await (this as any).findAll({
            where: { active: true },
            order: [['next_trigger', 'ASC']]
        });
    }

    static async getUserReminders(userId: string, guildId: string): Promise<Reminder[]> {
        return await (this as any).findAll({
            where: { user_id: userId, guild_id: guildId, active: true },
            order: [['next_trigger', 'ASC']]
        });
    }

    static async deleteReminder(reminderId: number, userId: string, guildId: string): Promise<boolean> {
        const result = await (this as any).update(
            { active: false },
            { where: { id: reminderId, user_id: userId, guild_id: guildId } }
        );

        return result[0] > 0;
    }

    static async updateNextTrigger(reminderId: number): Promise<Reminder | null> {
        const reminder = await (this as any).findByPk(reminderId);

        if (!reminder || !reminder.active) return null;

        if (reminder.frequency === 'once') {
            reminder.active = false;
        } else {
            reminder.next_trigger = this.calculateNextTrigger(
                reminder.time,
                reminder.frequency,
                reminder.day_of_week ?? null
            );
        }

        await reminder.save();
        return reminder;
    }

    static async getTriggeredReminders(): Promise<Reminder[]> {
        const now = new Date();
        return await (this as any).findAll({
            where: {
                active: true,
                next_trigger: { [Op.lte]: now }
            }
        });
    }
}

export default Reminder;
