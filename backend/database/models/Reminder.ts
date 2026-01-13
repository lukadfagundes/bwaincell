/* eslint-disable @typescript-eslint/no-explicit-any */
import { Model, Optional, Sequelize, Op } from 'sequelize';
import { DateTime } from 'luxon';
import schemas from '../schema';
import config from '../../config/config';

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
interface ReminderCreationAttributes
  extends Optional<ReminderAttributes, 'id' | 'active' | 'next_trigger'> {}

const ReminderBase = Model as any;
class Reminder
  extends ReminderBase<ReminderAttributes, ReminderCreationAttributes>
  implements ReminderAttributes
{
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
      timestamps: false,
    });
  }

  static async createReminder(
    guildId: string,
    channelId: string,
    message: string,
    time: string,
    frequency: ReminderFrequency = 'once',
    dayOfWeek: number | null = null,
    userId?: string,
    targetDate?: Date | null
  ): Promise<Reminder> {
    const nextTrigger = this.calculateNextTrigger(time, frequency, dayOfWeek, targetDate);

    return await (this as any).create({
      user_id: userId || 'system', // Keep for audit trail (WO-015)
      guild_id: guildId,
      channel_id: channelId,
      message,
      time,
      frequency,
      day_of_week: dayOfWeek,
      next_trigger: nextTrigger,
      active: true,
    });
  }

  /**
   * Calculate the next trigger time for a reminder in the configured timezone.
   *
   * Uses Luxon DateTime to handle timezone-aware date calculations, ensuring
   * reminders fire at the correct local time regardless of server timezone.
   *
   * @param time - Time string in 24-hour format (e.g., "17:00")
   * @param frequency - Reminder frequency: 'once', 'daily', or 'weekly'
   * @param dayOfWeek - Day of week for weekly reminders (0-6, Sun-Sat), null otherwise
   * @param targetDate - Optional specific date for one-time reminders
   * @returns JavaScript Date object representing next trigger time
   */
  static calculateNextTrigger(
    time: string,
    frequency: ReminderFrequency,
    dayOfWeek: number | null,
    targetDate?: Date | null
  ): Date {
    const timezone = config.settings.timezone; // e.g., 'America/Los_Angeles'

    // Get current time in user's timezone
    const now = DateTime.now().setZone(timezone);

    // Parse user's input time (e.g., "17:00")
    const [hours, minutes] = time.split(':').map(Number);

    // Create datetime in user's timezone
    let nextTrigger: DateTime;

    if (targetDate) {
      // Use the specific target date provided
      nextTrigger = DateTime.fromJSDate(targetDate).setZone(timezone).set({
        hour: hours,
        minute: minutes,
        second: 0,
        millisecond: 0,
      });
    } else {
      // Use today's date
      nextTrigger = DateTime.now().setZone(timezone).set({
        hour: hours,
        minute: minutes,
        second: 0,
        millisecond: 0,
      });
    }

    if (frequency === 'once') {
      // If no target date specified and time has already passed today, schedule for tomorrow
      if (!targetDate && nextTrigger < now) {
        nextTrigger = nextTrigger.plus({ days: 1 });
      }
    } else if (frequency === 'daily') {
      if (nextTrigger < now) {
        nextTrigger = nextTrigger.plus({ days: 1 });
      }
    } else if (frequency === 'weekly' && dayOfWeek !== null) {
      // Luxon uses 1-7 (Mon-Sun), JavaScript uses 0-6 (Sun-Sat)
      // Convert dayOfWeek from JS format (0-6) to Luxon weekday (1-7)
      const luxonWeekday = dayOfWeek === 0 ? 7 : dayOfWeek; // Sunday: 0->7
      const currentWeekday = now.weekday;

      let daysUntilNext = (luxonWeekday - currentWeekday + 7) % 7;

      // If it's the same day, check if the time has passed
      if (daysUntilNext === 0) {
        // If time hasn't passed yet today, keep it at 0 days (today)
        // If time has passed, schedule for next week (7 days)
        if (nextTrigger < now) {
          daysUntilNext = 7;
        }
      }

      nextTrigger = nextTrigger.plus({ days: daysUntilNext });
    }

    // Convert to JavaScript Date for Sequelize compatibility
    return nextTrigger.toJSDate();
  }

  static async getActiveReminders(): Promise<Reminder[]> {
    return await (this as any).findAll({
      where: { active: true },
      order: [['next_trigger', 'ASC']],
    });
  }

  // NOTE: Filters by guild_id only for shared household access (WO-015)
  static async getUserReminders(guildId: string): Promise<Reminder[]> {
    return await (this as any).findAll({
      where: { guild_id: guildId, active: true },
      order: [['next_trigger', 'ASC']],
    });
  }

  static async deleteReminder(reminderId: number, guildId: string): Promise<boolean> {
    const result = await (this as any).update(
      { active: false },
      { where: { id: reminderId, guild_id: guildId } }
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
        next_trigger: { [Op.lte]: now },
      },
    });
  }
}

export default Reminder;
