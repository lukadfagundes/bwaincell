const cron = require('node-cron');
const Reminder = require('../database/models/Reminder');
const { EmbedBuilder } = require('discord.js');

class ReminderScheduler {
    constructor() {
        this.client = null;
        this.job = null;
    }

    initialize(client) {
        this.client = client;
        this.startScheduler();
        console.log('Reminder scheduler initialized');
    }

    startScheduler() {
        if (this.job) {
            this.job.stop();
        }

        this.job = cron.schedule('* * * * *', async () => {
            await this.checkReminders();
        });

        console.log('Reminder scheduler started (checking every minute)');
    }

    async checkReminders() {
        try {
            const triggeredReminders = await Reminder.getTriggeredReminders();

            for (const reminder of triggeredReminders) {
                await this.sendReminder(reminder);
                await Reminder.updateNextTrigger(reminder.id);
            }
        } catch (error) {
            console.error('Error checking reminders:', error);
        }
    }

    async sendReminder(reminder) {
        try {
            const channel = await this.client.channels.fetch(reminder.channel_id);

            if (!channel) {
                console.error(`Channel ${reminder.channel_id} not found for reminder ${reminder.id}`);
                return;
            }

            const user = await this.client.users.fetch(reminder.user_id);

            const embed = new EmbedBuilder()
                .setTitle('⏰ Reminder')
                .setDescription(reminder.message)
                .setColor(0xFFD700)
                .setFooter({ text: `Reminder #${reminder.id}` })
                .setTimestamp();

            if (reminder.frequency !== 'once') {
                embed.addFields({
                    name: 'Frequency',
                    value: reminder.frequency === 'daily' ? 'Daily Reminder' : 'Weekly Reminder'
                });
            }

            await channel.send({
                content: `<@${reminder.user_id}>`,
                embeds: [embed]
            });

            console.log(`Reminder #${reminder.id} sent to user ${user.tag}`);
        } catch (error) {
            console.error(`Error sending reminder #${reminder.id}:`, error);
        }
    }

    stop() {
        if (this.job) {
            this.job.stop();
            console.log('Reminder scheduler stopped');
        }
    }

    async refreshSchedule() {
        console.log('Refreshing reminder schedule...');
        await this.checkReminders();
    }
}

module.exports = new ReminderScheduler();