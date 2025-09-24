import * as cron from 'node-cron';
import { Client, TextChannel } from 'discord.js';
import { logger } from '../shared/utils/logger';

interface SchedulerJob {
    id: string;
    task: cron.ScheduledTask;
}

class Scheduler {
    private jobs: Map<string, SchedulerJob> = new Map();
    private client: Client;

    constructor(client: Client) {
        this.client = client;
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
                stack: error instanceof Error ? error.stack : undefined
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
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    private scheduleReminder(reminder: any, Reminder: any): void {
        const cronExpression = this.getCronExpression(reminder);
        if (!cronExpression) return;

        const task = cron.schedule(cronExpression, async () => {
            await this.executeReminder(reminder, Reminder);
        });

        this.jobs.set(`reminder_${reminder.id}`, {
            id: `reminder_${reminder.id}`,
            task
        });
    }

    private getCronExpression(reminder: any): string | null {
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
            const channel = await this.client.channels.fetch(reminder.channel_id);
            if (channel && channel instanceof TextChannel) {
                await channel.send(`⏰ Reminder: ${reminder.message}`);
            }

            if (Reminder && Reminder.updateNextTrigger) {
                await Reminder.updateNextTrigger(reminder.id);
            }
        } catch (error) {
            logger.error('Failed to execute reminder', {
                reminderId: reminder.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    stop(): void {
        this.jobs.forEach(job => job.task.stop());
        this.jobs.clear();
    }
}

export function startScheduler(client: Client): void {
    const scheduler = new Scheduler(client);
    scheduler.initialize();
}
