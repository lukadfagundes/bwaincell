import { google, calendar_v3, drive_v3 } from 'googleapis';
import { logger } from '../shared/utils/logger';

interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export class GoogleServices {
  private oauth2Client: any;
  private calendar: calendar_v3.Calendar | null = null;
  private drive: drive_v3.Drive | null = null;

  constructor(config: GoogleConfig) {
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    ) as any;
  }

  setCredentials(tokens: any): void {
    this.oauth2Client.setCredentials(tokens);
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
  }

  async createEvent(event: calendar_v3.Schema$Event): Promise<calendar_v3.Schema$Event> {
    if (!this.calendar) {
      throw new Error('Calendar not initialized');
    }

    try {
      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });

      logger.info('Event created', { eventId: response.data.id });
      return response.data;
    } catch (error) {
      logger.error('Failed to create event', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async uploadFile(name: string, mimeType: string, content: Buffer): Promise<drive_v3.Schema$File> {
    if (!this.drive) {
      throw new Error('Drive not initialized');
    }

    try {
      const response = await this.drive.files.create({
        requestBody: {
          name,
          mimeType,
        },
        media: {
          mimeType,
          body: content,
        },
      });

      logger.info('File uploaded', { fileId: response.data.id });
      return response.data;
    } catch (error) {
      logger.error('Failed to upload file', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
