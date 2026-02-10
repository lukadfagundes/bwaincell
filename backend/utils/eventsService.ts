/**
 * Events Discovery Service
 * AI-powered local events discovery with multiple provider support
 */

import { EmbedBuilder } from 'discord.js';
import { DateTime } from 'luxon';
import { createLogger } from '../shared/utils/logger';
import { GoogleGenAI } from '@google/genai';

const logger = createLogger('EventsService');

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface LocalEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  location: string;
  url?: string;
  source: string;
}

export interface EventDiscoveryProvider {
  discoverEvents(location: string, startDate: Date, endDate: Date): Promise<LocalEvent[]>;
  getName(): string;
}

interface CachedEvents {
  events: LocalEvent[];
  timestamp: number;
}

// ============================================================================
// Event Discovery Providers
// ============================================================================

/**
 * Gemini Event Provider
 * Uses Google Gemini API to discover and structure local events
 */
class GeminiEventProvider implements EventDiscoveryProvider {
  private genAI: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      logger.warn('GEMINI_API_KEY not configured - event discovery will use fallback');
      return;
    }

    try {
      this.genAI = new GoogleGenAI({ apiKey });
      logger.info('Gemini event provider initialized');
    } catch (error) {
      logger.warn('Failed to initialize Gemini client', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  getName(): string {
    return 'Google Gemini';
  }

  async discoverEvents(location: string, startDate: Date, endDate: Date): Promise<LocalEvent[]> {
    if (!this.genAI) {
      logger.error('Gemini client not initialized - cannot discover events');
      throw new Error('Gemini API not configured. Please set GEMINI_API_KEY environment variable.');
    }

    const startStr = DateTime.fromJSDate(startDate).toFormat('MMMM d, yyyy');
    const endStr = DateTime.fromJSDate(endDate).toFormat('MMMM d, yyyy');

    const prompt = `Find local events happening in ${location} from ${startStr} to ${endStr}.

Please provide a list of interesting local events (festivals, concerts, markets, community events, cultural events, etc.) that would be worth attending. Focus on public events that are free or reasonably priced.

For each event, provide:
1. Event title (concise)
2. Brief description (1-2 sentences)
3. Date and time
4. Specific location/venue
5. Website URL if available
6. Source of information

Format your response as a JSON array of events with this structure:
[
  {
    "title": "Event Name",
    "description": "Brief description",
    "date": "YYYY-MM-DD",
    "time": "HH:MM AM/PM",
    "location": "Venue name and address",
    "url": "https://example.com",
    "source": "Source name"
  }
]

Provide 5-10 of the most interesting events. If you cannot find reliable information, return an empty array.`;

    try {
      logger.info('Requesting events from Gemini', {
        location,
        dateRange: `${startStr} to ${endStr}`,
      });

      // Use gemini-2.5-flash with Google Search grounding for real-time event data
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] },
      });
      const responseText = response.text ?? '';

      // Remove markdown code blocks if present (```json ... ```)
      const cleaned = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Parse JSON from response
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/);

      if (!jsonMatch) {
        logger.warn('No JSON array found in Gemini response');
        return [];
      }

      const rawEvents = JSON.parse(jsonMatch[0]);
      const events: LocalEvent[] = [];

      for (const raw of rawEvents) {
        try {
          // Extract start date and time from varied AI formats
          const dateStr = this.extractStartDate(raw.date);
          const timeStr = this.extractStartTime(raw.time);

          // Parse date and time
          const eventDateTime = DateTime.fromFormat(`${dateStr} ${timeStr}`, 'yyyy-MM-dd h:mm a', {
            zone: 'America/Los_Angeles',
          });

          if (!eventDateTime.isValid) {
            logger.warn('Invalid date format in event', { raw });
            continue;
          }

          events.push({
            title: raw.title,
            description: raw.description,
            startDate: eventDateTime.toJSDate(),
            location: raw.location,
            url: raw.url,
            source: raw.source || 'Google Gemini',
          });
        } catch (error) {
          logger.warn('Failed to parse event', {
            error: error instanceof Error ? error.message : 'Unknown error',
            raw,
          });
        }
      }

      logger.info('Events discovered successfully', {
        location,
        eventCount: events.length,
      });

      return events;
    } catch (error) {
      logger.error('Failed to discover events', {
        error: error instanceof Error ? error.message : 'Unknown error',
        location,
      });

      throw error;
    }
  }

  /**
   * Extract start date from varied AI date formats
   * Handles: "2026-02-16", "2026-02-16 to 2026-02-23", etc.
   * Returns first YYYY-MM-DD found, or the original string
   */
  private extractStartDate(dateInput: string): string {
    const match = dateInput.match(/(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : dateInput;
  }

  /**
   * Extract start time from varied AI time formats
   * Handles: "6:00 PM", "6:00 PM - 9:30 PM", "10:00 AM - 2:00 PM", "Time not specified", etc.
   * Falls back to 12:00 PM if no valid time found
   */
  private extractStartTime(timeInput?: string): string {
    if (!timeInput) return '12:00 PM';

    // Match first occurrence of time pattern like "6:00 PM" or "10:00 AM"
    const match = timeInput.match(/(\d{1,2}:\d{2}\s*[AaPp][Mm])/);
    if (match) return match[1].trim();

    return '12:00 PM';
  }
}

/**
 * Mock Event Provider
 * Returns sample events for development/testing
 */
class MockEventProvider implements EventDiscoveryProvider {
  getName(): string {
    return 'Mock Provider (Development)';
  }

  async discoverEvents(location: string, _startDate: Date, _endDate: Date): Promise<LocalEvent[]> {
    logger.info('Using mock event provider', { location });

    const now = DateTime.now();

    return [
      {
        title: 'Weekend Farmers Market',
        description: 'Fresh produce, artisan goods, and local crafts at the downtown plaza.',
        startDate: now.plus({ days: 2 }).set({ hour: 9, minute: 0 }).toJSDate(),
        endDate: now.plus({ days: 2 }).set({ hour: 14, minute: 0 }).toJSDate(),
        location: 'Downtown Plaza, Main Street',
        url: 'https://example.com/farmers-market',
        source: 'Mock Data',
      },
      {
        title: 'Community Art Exhibition',
        description: 'Featuring works by local artists with free admission.',
        startDate: now.plus({ days: 3 }).set({ hour: 18, minute: 0 }).toJSDate(),
        location: 'City Art Gallery, 123 Gallery St',
        url: 'https://example.com/art-exhibition',
        source: 'Mock Data',
      },
      {
        title: 'Live Music in the Park',
        description: 'Free outdoor concert featuring local bands.',
        startDate: now.plus({ days: 5 }).set({ hour: 19, minute: 0 }).toJSDate(),
        location: 'Central Park Amphitheater',
        source: 'Mock Data',
      },
    ];
  }
}

// ============================================================================
// Events Service
// ============================================================================

export class EventsService {
  private provider: EventDiscoveryProvider;
  private cache: Map<string, CachedEvents> = new Map();
  private cacheTTL: number;
  private maxResults: number;

  constructor(providerType?: string) {
    this.cacheTTL = parseInt(process.env.EVENTS_CACHE_TTL || '3600', 10) * 1000; // Convert to ms
    this.maxResults = parseInt(process.env.EVENTS_MAX_RESULTS || '10', 10);

    // Select provider based on configuration
    const provider = providerType || process.env.EVENTS_AI_SERVICE || 'gemini';

    switch (provider.toLowerCase()) {
      case 'gemini':
      case 'google':
        this.provider = new GeminiEventProvider();
        break;
      case 'mock':
      case 'development':
        this.provider = new MockEventProvider();
        break;
      default:
        logger.warn('Unknown provider type, falling back to mock', { provider });
        this.provider = new MockEventProvider();
    }

    logger.info('EventsService initialized', {
      provider: this.provider.getName(),
      cacheTTL: this.cacheTTL / 1000 + 's',
      maxResults: this.maxResults,
    });
  }

  /**
   * Discover local events for a location and date range
   */
  async discoverLocalEvents(
    location: string,
    startDate: Date,
    endDate: Date
  ): Promise<LocalEvent[]> {
    // Generate cache key
    const cacheKey = this.getCacheKey(location, startDate, endDate);

    // Check cache
    const cached = this.getCachedEvents(cacheKey);
    if (cached) {
      logger.info('Returning cached events', {
        location,
        eventCount: cached.length,
        cacheKey,
      });
      return cached;
    }

    // Fetch fresh events from provider
    try {
      const events = await this.provider.discoverEvents(location, startDate, endDate);

      // Limit results
      const limited = events.slice(0, this.maxResults);

      // Cache results
      this.setCachedEvents(cacheKey, limited);

      logger.info('Events fetched and cached', {
        location,
        eventCount: limited.length,
        provider: this.provider.getName(),
      });

      return limited;
    } catch (error) {
      logger.error('Failed to discover events', {
        location,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.provider.getName(),
      });
      throw error;
    }
  }

  /**
   * Format events as Discord embed
   */
  async formatEventsForDiscord(events: LocalEvent[], location: string): Promise<EmbedBuilder> {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2) // Discord blue
      .setTitle(`📅 Local Events in ${location}`)
      .setTimestamp();

    if (events.length === 0) {
      embed.setDescription(
        '🔍 No upcoming events found for this location.\n\nTry checking back later or adjusting your location settings.'
      );
      embed.setColor(0x9ca3af); // Gray
      return embed;
    }

    // Sort events by date
    const sorted = events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    // Add events as fields (max 25 fields per embed)
    const maxFields = Math.min(sorted.length, 25);

    for (let i = 0; i < maxFields; i++) {
      const event = sorted[i];
      const dateTime = DateTime.fromJSDate(event.startDate);

      // Format date and time
      const dateStr = dateTime.toFormat('EEE, MMM d');
      const timeStr = dateTime.toFormat('h:mm a');

      // Build field value
      let value = `📍 ${this.truncate(event.location, 50)}\n`;
      value += `🕐 ${dateStr} at ${timeStr}\n`;
      value += `${this.truncate(event.description, 100)}`;

      if (event.url) {
        value += `\n[More info](${event.url})`;
      }

      embed.addFields({
        name: `${i + 1}. ${this.truncate(event.title, 80)}`,
        value: value,
        inline: false,
      });
    }

    // Add footer
    embed.setFooter({
      text: `Powered by ${this.provider.getName()} • ${events.length} events found`,
    });

    return embed;
  }

  /**
   * Generate cache key for location and date range
   */
  private getCacheKey(location: string, startDate: Date, endDate: Date): string {
    const start = DateTime.fromJSDate(startDate).toISODate();
    const end = DateTime.fromJSDate(endDate).toISODate();
    return `${location}:${start}:${end}`.toLowerCase();
  }

  /**
   * Get cached events if still valid
   */
  private getCachedEvents(key: string): LocalEvent[] | null {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    const age = Date.now() - cached.timestamp;

    if (age > this.cacheTTL) {
      // Cache expired
      this.cache.delete(key);
      logger.debug('Cache expired', { key, age: age / 1000 + 's' });
      return null;
    }

    return cached.events;
  }

  /**
   * Cache events with timestamp
   */
  private setCachedEvents(key: string, events: LocalEvent[]): void {
    this.cache.set(key, {
      events,
      timestamp: Date.now(),
    });

    logger.debug('Events cached', {
      key,
      eventCount: events.length,
      ttl: this.cacheTTL / 1000 + 's',
    });
  }

  /**
   * Truncate string to max length with ellipsis
   */
  private truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) {
      return str;
    }
    return str.substring(0, maxLength - 3) + '...';
  }

  /**
   * Clear all cached events
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Cache cleared');
  }
}

// Export singleton instance
const eventsService = new EventsService();
export default eventsService;
