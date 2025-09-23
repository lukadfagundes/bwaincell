const fs = require('fs').promises;
const path = require('path');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');

const SCOPES = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.appdata'
];

const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

class GoogleServices {
    constructor() {
        this.auth = null;
        this.calendar = null;
        this.drive = null;
    }

    async initialize() {
        try {
            this.auth = await this.authorize();
            this.calendar = google.calendar({ version: 'v3', auth: this.auth });
            this.drive = google.drive({ version: 'v3', auth: this.auth });
            console.log('Google Services initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Google Services:', error);
            return false;
        }
    }

    async loadSavedCredentialsIfExist() {
        try {
            const content = await fs.readFile(TOKEN_PATH);
            const credentials = JSON.parse(content);
            return google.auth.fromJSON(credentials);
        } catch (err) {
            return null;
        }
    }

    async saveCredentials(client) {
        const content = await fs.readFile(CREDENTIALS_PATH);
        const keys = JSON.parse(content);
        const key = keys.installed || keys.web;
        const payload = JSON.stringify({
            type: 'authorized_user',
            client_id: key.client_id,
            client_secret: key.client_secret,
            refresh_token: client.credentials.refresh_token,
        });
        await fs.writeFile(TOKEN_PATH, payload);
    }

    async authorize() {
        let client = await this.loadSavedCredentialsIfExist();
        if (client) {
            return client;
        }

        try {
            await fs.access(CREDENTIALS_PATH);
        } catch (error) {
            console.log('credentials.json not found. Google services will be disabled.');
            console.log('To enable Google services:');
            console.log('1. Go to https://console.cloud.google.com');
            console.log('2. Create credentials and download as credentials.json');
            console.log('3. Place in project root');
            return null;
        }

        client = await authenticate({
            scopes: SCOPES,
            keyfilePath: CREDENTIALS_PATH,
        });

        if (client.credentials) {
            await this.saveCredentials(client);
        }
        return client;
    }

    async createCalendarEvent(summary, description, startTime, endTime, attendees = []) {
        if (!this.calendar) {
            throw new Error('Google Calendar not initialized');
        }

        const event = {
            summary: summary,
            description: description,
            start: {
                dateTime: startTime,
                timeZone: process.env.TIMEZONE || 'America/Los_Angeles',
            },
            end: {
                dateTime: endTime,
                timeZone: process.env.TIMEZONE || 'America/Los_Angeles',
            },
            attendees: attendees,
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'popup', minutes: 10 },
                ],
            },
        };

        try {
            const response = await this.calendar.events.insert({
                calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
                resource: event,
            });

            return response.data;
        } catch (error) {
            console.error('Error creating calendar event:', error);
            throw error;
        }
    }

    async listCalendarEvents(maxResults = 10) {
        if (!this.calendar) {
            throw new Error('Google Calendar not initialized');
        }

        try {
            const response = await this.calendar.events.list({
                calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
                timeMin: new Date().toISOString(),
                maxResults: maxResults,
                singleEvents: true,
                orderBy: 'startTime',
            });

            return response.data.items || [];
        } catch (error) {
            console.error('Error listing calendar events:', error);
            throw error;
        }
    }

    async deleteCalendarEvent(eventId) {
        if (!this.calendar) {
            throw new Error('Google Calendar not initialized');
        }

        try {
            await this.calendar.events.delete({
                calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
                eventId: eventId,
            });
            return true;
        } catch (error) {
            console.error('Error deleting calendar event:', error);
            throw error;
        }
    }

    async uploadToDrive(fileName, fileContent, mimeType = 'text/plain') {
        if (!this.drive) {
            throw new Error('Google Drive not initialized');
        }

        const fileMetadata = {
            name: fileName,
            parents: ['appDataFolder']
        };

        const media = {
            mimeType: mimeType,
            body: fileContent,
        };

        try {
            const response = await this.drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id, name',
            });

            return response.data;
        } catch (error) {
            console.error('Error uploading to Drive:', error);
            throw error;
        }
    }

    async downloadFromDrive(fileId) {
        if (!this.drive) {
            throw new Error('Google Drive not initialized');
        }

        try {
            const response = await this.drive.files.get({
                fileId: fileId,
                alt: 'media',
            });

            return response.data;
        } catch (error) {
            console.error('Error downloading from Drive:', error);
            throw error;
        }
    }

    async listDriveFiles(pageSize = 10) {
        if (!this.drive) {
            throw new Error('Google Drive not initialized');
        }

        try {
            const response = await this.drive.files.list({
                pageSize: pageSize,
                spaces: 'appDataFolder',
                fields: 'nextPageToken, files(id, name, createdTime)',
            });

            return response.data.files || [];
        } catch (error) {
            console.error('Error listing Drive files:', error);
            throw error;
        }
    }

    async deleteDriveFile(fileId) {
        if (!this.drive) {
            throw new Error('Google Drive not initialized');
        }

        try {
            await this.drive.files.delete({
                fileId: fileId,
            });
            return true;
        } catch (error) {
            console.error('Error deleting Drive file:', error);
            throw error;
        }
    }

    async exportDataBackup() {
        const backupData = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
        };

        const fileName = `bwaincell-backup-${Date.now()}.json`;
        const fileContent = JSON.stringify(backupData, null, 2);

        try {
            const file = await this.uploadToDrive(fileName, fileContent, 'application/json');
            console.log(`Backup created: ${file.name} (${file.id})`);
            return file;
        } catch (error) {
            console.error('Error creating backup:', error);
            throw error;
        }
    }

    async syncWithCalendar(scheduleEvents) {
        if (!this.calendar) {
            console.log('Google Calendar not available - skipping sync');
            return [];
        }

        const syncResults = [];

        for (const event of scheduleEvents) {
            try {
                const startDateTime = new Date(`${event.date}T${event.time}`);
                const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

                const calendarEvent = await this.createCalendarEvent(
                    event.event,
                    event.description || '',
                    startDateTime.toISOString(),
                    endDateTime.toISOString()
                );

                syncResults.push({
                    localId: event.id,
                    googleId: calendarEvent.id,
                    status: 'synced'
                });
            } catch (error) {
                syncResults.push({
                    localId: event.id,
                    error: error.message,
                    status: 'failed'
                });
            }
        }

        return syncResults;
    }

    isInitialized() {
        return this.auth !== null;
    }

    getAuthUrl() {
        if (!this.auth) {
            return null;
        }

        const authUrl = this.auth.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });

        return authUrl;
    }
}

module.exports = new GoogleServices();