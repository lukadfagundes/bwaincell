/* eslint-disable @typescript-eslint/no-explicit-any */
import * as cron from 'node-cron';
import { Client, TextChannel } from 'discord.js';
import { logger } from '../shared/utils/logger';

interface SchedulerJob {
  id: string;
  task: cron.ScheduledTask;
}

class Scheduler {
  private static instance: Scheduler | null = null;
  private jobs: Map<string, SchedulerJob> = new Map();
  private client: Client;

  private constructor(client: Client) {
    this.client = client;
  }

  static getInstance(client?: Client): Scheduler | null {
    if (!Scheduler.instance && client) {
      Scheduler.instance = new Scheduler(client);
    }
    return Scheduler.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Dynamically import Reminder to avoid initialization issues
      const { Reminder } = await import('../database');

      await this.loadReminders(Reminder);
      logger.info('Scheduler initialized successfully');
    } catch (error) {
      logger.error('Scheduler initialization failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  private async loadReminders(Reminder: any): Promise<void> {
    if (!Reminder || !Reminder.getActiveReminders) {
      logger.warn('Reminder model not properly initialized, skipping scheduler setup');
      return;
    }

    try {
      const reminders = await Reminder.getActiveReminders();
      for (const reminder of reminders) {
        this.scheduleReminder(reminder, Reminder);
      }
    } catch (error) {
      logger.error('Failed to load reminders', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private scheduleReminder(reminder: any, Reminder: any): void {
    // Handle one-time reminders differently
    if (reminder.frequency === 'once') {
      this.scheduleOneTimeReminder(reminder, Reminder);
      return;
    }

    const cronExpression = this.getCronExpression(reminder);
    if (!cronExpression) return;

    const task = cron.schedule(cronExpression, async () => {
      await this.executeReminder(reminder, Reminder);
    });

    this.jobs.set(`reminder_${reminder.id}`, {
      id: `reminder_${reminder.id}`,
      task,
    });

    logger.info('Reminder scheduled', {
      reminderId: reminder.id,
      cronExpression,
      message: reminder.message,
      time: reminder.time,
      frequency: reminder.frequency,
    });
  }

  private scheduleOneTimeReminder(reminder: any, Reminder: any): void {
    if (!reminder.time || !reminder.next_trigger) {
      logger.warn('One-time reminder missing time or next_trigger', { reminderId: reminder.id });
      return;
    }

    const now = new Date();
    const triggerTime = new Date(reminder.next_trigger);
    const delay = triggerTime.getTime() - now.getTime();

    if (delay <= 0) {
      logger.warn('One-time reminder trigger time has already passed', {
        reminderId: reminder.id,
        triggerTime: triggerTime.toISOString(),
        now: now.toISOString(),
      });
      return;
    }

    // Schedule a one-time timeout
    const timeoutId = setTimeout(async () => {
      await this.executeReminder(reminder, Reminder);

      // Delete the reminder after execution since it's one-time
      if (Reminder && Reminder.deleteReminder) {
        await Reminder.deleteReminder(reminder.id, reminder.guild_id);
        logger.info('One-time reminder deleted after execution', {
          reminderId: reminder.id,
          message: reminder.message,
        });
      }

      // Remove from jobs map
      this.jobs.delete(`reminder_${reminder.id}`);
    }, delay);

    // Store the timeout so we can cancel it if needed
    this.jobs.set(`reminder_${reminder.id}`, {
      id: `reminder_${reminder.id}`,
      task: {
        stop: () => clearTimeout(timeoutId),
      } as any,
    });

    logger.info('One-time reminder scheduled', {
      reminderId: reminder.id,
      message: reminder.message,
      triggerTime: triggerTime.toISOString(),
      delayMs: delay,
    });
  }

  // Public method to add a new reminder to the scheduler
  async addReminder(reminderId: number): Promise<void> {
    try {
      const { Reminder } = await import('../database');
      const reminder = await Reminder.findOne({ where: { id: reminderId } });

      if (reminder) {
        this.scheduleReminder(reminder, Reminder);
      }
    } catch (error) {
      logger.error('Failed to add reminder to scheduler', {
        reminderId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private getCronExpression(reminder: any): string | null {
    if (!reminder.time) {
      logger.warn('Reminder has no time set', { reminderId: reminder.id });
      return null;
    }

    const [hours, minutes] = reminder.time.split(':');

    switch (reminder.frequency) {
      case 'daily':
        return `${minutes} ${hours} * * *`;
      case 'weekly':
        return `${minutes} ${hours} * * ${reminder.day_of_week}`;
      case 'once':
        return null; // Handle differently
      default:
        return null;
    }
  }

  private async executeReminder(reminder: any, Reminder: any): Promise<void> {
    try {
      logger.info('Attempting to execute reminder', {
        reminderId: reminder.id,
        channelId: reminder.channel_id,
        userId: reminder.user_id,
        message: reminder.message,
      });

      const channel = await this.client.channels.fetch(reminder.channel_id);

      logger.info('Channel fetched', {
        reminderId: reminder.id,
        channelId: reminder.channel_id,
        channelType: channel?.type,
        isTextChannel: channel instanceof TextChannel,
      });

      if (channel && channel instanceof TextChannel) {
        await channel.send(`<@${reminder.user_id}> ⏰ Reminder: **${reminder.message}**`);
        logger.info('Reminder executed successfully', {
          reminderId: reminder.id,
          userId: reminder.user_id,
          message: reminder.message,
          channelId: reminder.channel_id,
        });
      } else {
        logger.warn('Reminder channel not found or not a text channel', {
          reminderId: reminder.id,
          channelId: reminder.channel_id,
          channelType: channel?.type,
          channelExists: !!channel,
        });
      }

      if (Reminder && Reminder.updateNextTrigger && reminder.frequency !== 'once') {
        await Reminder.updateNextTrigger(reminder.id);
      }
    } catch (error) {
      logger.error('Failed to execute reminder', {
        reminderId: reminder.id,
        channelId: reminder.channel_id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  stop(): void {
    this.jobs.forEach((job) => job.task.stop());
    this.jobs.clear();
  }
}

export function startScheduler(client: Client): void {
  const scheduler = Scheduler.getInstance(client);
  if (scheduler) {
    scheduler.initialize();
  }
}

export function getScheduler(): Scheduler | null {
  return Scheduler.getInstance();
}
