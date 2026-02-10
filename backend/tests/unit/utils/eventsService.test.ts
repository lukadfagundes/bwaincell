/**
 * Unit Tests: EventsService
 *
 * Tests AI-powered event discovery with mocked external dependencies
 * Coverage target: 85%
 */

// Mock logger BEFORE imports
jest.mock('../../../shared/utils/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

// Mock Google GenAI SDK
const mockGenerateContent = jest.fn();

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  })),
}));

import { EventsService } from '../../../utils/eventsService';

describe('EventsService', () => {
  let service: EventsService;
  const mockStartDate = new Date('2026-02-17T12:00:00Z');
  const mockEndDate = new Date('2026-02-24T11:59:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-api-key';
    process.env.EVENTS_AI_SERVICE = 'gemini';
    process.env.EVENTS_MAX_RESULTS = '10';
    process.env.EVENTS_CACHE_TTL = '3600';
    service = new EventsService();
  });

  afterEach(() => {
    service.clearCache();
  });

  describe('AI Event Discovery', () => {
    test('should discover events with valid location and date range', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify([
          {
            title: 'Weekend Farmers Market',
            description: 'Fresh produce and artisan goods',
            date: '2026-02-21',
            time: '9:00 AM',
            location: 'Downtown Plaza',
            url: 'https://example.com/market',
            source: 'City Events',
          },
        ]),
      });

      const events = await service.discoverLocalEvents(
        'Los Angeles, CA',
        mockStartDate,
        mockEndDate
      );

      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('Weekend Farmers Market');
      expect(events[0].description).toBe('Fresh produce and artisan goods');
      expect(events[0].location).toBe('Downtown Plaza');
      expect(events[0].url).toBe('https://example.com/market');
      expect(events[0].source).toBe('City Events');
    });

    test('should pass googleSearch tool in config', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify([]),
      });

      await service.discoverLocalEvents('Los Angeles, CA', mockStartDate, mockEndDate);

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.5-flash',
          config: expect.objectContaining({
            tools: [{ googleSearch: {} }],
          }),
        })
      );
    });

    test('should handle empty results from AI', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify([]),
      });

      const events = await service.discoverLocalEvents('Remote Island', mockStartDate, mockEndDate);

      expect(events).toHaveLength(0);
    });

    test('should parse AI response with markdown code blocks', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: '```json\n[{"title":"Test Event","description":"Test","date":"2026-02-21","time":"10:00 AM","location":"Test Location"}]\n```',
      });

      const events = await service.discoverLocalEvents(
        'Los Angeles, CA',
        mockStartDate,
        mockEndDate
      );

      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('Test Event');
    });

    test('should validate event data structure', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify([
          {
            title: 'Valid Event',
            description: 'Valid description',
            date: '2026-02-21',
            time: '10:00 AM',
            location: 'Valid Location',
          },
        ]),
      });

      const events = await service.discoverLocalEvents(
        'Los Angeles, CA',
        mockStartDate,
        mockEndDate
      );

      expect(events).toHaveLength(1);
      expect(events[0]).toHaveProperty('title');
      expect(events[0]).toHaveProperty('description');
      expect(events[0]).toHaveProperty('startDate');
      expect(events[0]).toHaveProperty('location');
    });

    test('should limit results to max events (10)', async () => {
      const mockEvents = Array.from({ length: 20 }, (_, i) => ({
        title: `Event ${i + 1}`,
        description: 'Description',
        date: '2026-02-21',
        time: '10:00 AM',
        location: 'Location',
      }));

      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify(mockEvents),
      });

      const events = await service.discoverLocalEvents(
        'Los Angeles, CA',
        mockStartDate,
        mockEndDate
      );

      expect(events.length).toBeLessThanOrEqual(10);
    });

    test('should handle malformed AI responses', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: 'This is not valid JSON',
      });

      const events = await service.discoverLocalEvents(
        'Los Angeles, CA',
        mockStartDate,
        mockEndDate
      );

      expect(events).toHaveLength(0);
    });

    test('should skip events with invalid date formats', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify([
          {
            title: 'Valid Event',
            description: 'Valid',
            date: '2026-02-21',
            time: '10:00 AM',
            location: 'Location',
          },
          {
            title: 'Invalid Event',
            description: 'Invalid date',
            date: 'invalid-date',
            time: 'invalid-time',
            location: 'Location',
          },
        ]),
      });

      const events = await service.discoverLocalEvents(
        'Los Angeles, CA',
        mockStartDate,
        mockEndDate
      );

      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('Valid Event');
    });

    test('should extract start time from time range format', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify([
          {
            title: 'Range Time Event',
            description: 'Has a time range',
            date: '2026-02-21',
            time: '6:00 PM - 9:30 PM',
            location: 'Location',
          },
        ]),
      });

      const events = await service.discoverLocalEvents(
        'Los Angeles, CA',
        mockStartDate,
        mockEndDate
      );

      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('Range Time Event');
    });

    test('should extract start date from date range format', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify([
          {
            title: 'Multi-Day Event',
            description: 'Spans multiple days',
            date: '2026-02-16 to 2026-02-23',
            time: '10:00 AM',
            location: 'Location',
          },
        ]),
      });

      const events = await service.discoverLocalEvents(
        'Los Angeles, CA',
        mockStartDate,
        mockEndDate
      );

      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('Multi-Day Event');
    });

    test('should handle non-parseable time with default', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify([
          {
            title: 'Vague Time Event',
            description: 'No real time',
            date: '2026-02-21',
            time: 'Time not specified, recurring weekly on Tuesday',
            location: 'Location',
          },
        ]),
      });

      const events = await service.discoverLocalEvents(
        'Los Angeles, CA',
        mockStartDate,
        mockEndDate
      );

      expect(events).toHaveLength(1);
      expect(events[0].startDate).toBeInstanceOf(Date);
    });

    test('should set default time if not provided', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify([
          {
            title: 'Event Without Time',
            description: 'No time specified',
            date: '2026-02-21',
            location: 'Location',
          },
        ]),
      });

      const events = await service.discoverLocalEvents(
        'Los Angeles, CA',
        mockStartDate,
        mockEndDate
      );

      expect(events).toHaveLength(1);
      expect(events[0].startDate).toBeInstanceOf(Date);
    });
  });

  describe('API Error Handling', () => {
    test('should handle rate limit errors (429)', async () => {
      const error = new Error('Rate limit exceeded');
      (error as any).status = 429;
      mockGenerateContent.mockRejectedValueOnce(error);

      await expect(
        service.discoverLocalEvents('Los Angeles, CA', mockStartDate, mockEndDate)
      ).rejects.toThrow('Rate limit exceeded');
    });

    test('should handle authentication errors (401)', async () => {
      const error = new Error('Unauthorized');
      (error as any).status = 401;
      mockGenerateContent.mockRejectedValueOnce(error);

      await expect(
        service.discoverLocalEvents('Los Angeles, CA', mockStartDate, mockEndDate)
      ).rejects.toThrow('Unauthorized');
    });

    test('should handle timeout errors', async () => {
      const error = new Error('Request timeout');
      mockGenerateContent.mockRejectedValueOnce(error);

      await expect(
        service.discoverLocalEvents('Los Angeles, CA', mockStartDate, mockEndDate)
      ).rejects.toThrow('Request timeout');
    });

    test('should handle network errors', async () => {
      const error = new Error('Network error');
      mockGenerateContent.mockRejectedValueOnce(error);

      await expect(
        service.discoverLocalEvents('Los Angeles, CA', mockStartDate, mockEndDate)
      ).rejects.toThrow('Network error');
    });

    test('should throw error when Gemini API key not configured', async () => {
      delete process.env.GEMINI_API_KEY;
      const serviceWithoutKey = new EventsService();

      await expect(
        serviceWithoutKey.discoverLocalEvents('Los Angeles, CA', mockStartDate, mockEndDate)
      ).rejects.toThrow('Gemini API not configured');
    });
  });

  describe('Caching', () => {
    test('should cache successful API responses', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify([
          {
            title: 'Cached Event',
            description: 'This will be cached',
            date: '2026-02-21',
            time: '10:00 AM',
            location: 'Location',
          },
        ]),
      });

      // First call - should hit API
      await service.discoverLocalEvents('Los Angeles, CA', mockStartDate, mockEndDate);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await service.discoverLocalEvents('Los Angeles, CA', mockStartDate, mockEndDate);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    test('should return cached results within TTL', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify([
          {
            title: 'Cached Event',
            description: 'Cached',
            date: '2026-02-21',
            time: '10:00 AM',
            location: 'Location',
          },
        ]),
      });

      const events1 = await service.discoverLocalEvents(
        'Los Angeles, CA',
        mockStartDate,
        mockEndDate
      );
      const events2 = await service.discoverLocalEvents(
        'Los Angeles, CA',
        mockStartDate,
        mockEndDate
      );

      expect(events1).toEqual(events2);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    test('should not cache error responses', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('API Error')).mockResolvedValueOnce({
        text: JSON.stringify([
          { title: 'Event', date: '2026-02-21', time: '10:00 AM', location: 'Location' },
        ]),
      });

      // First call fails
      await expect(
        service.discoverLocalEvents('Los Angeles, CA', mockStartDate, mockEndDate)
      ).rejects.toThrow('API Error');

      // Second call should try again (not cached)
      const events = await service.discoverLocalEvents(
        'Los Angeles, CA',
        mockStartDate,
        mockEndDate
      );
      expect(events).toHaveLength(1);
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });

    test('should generate correct cache keys for different locations', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify([
          { title: 'Event', date: '2026-02-21', time: '10:00 AM', location: 'Location' },
        ]),
      });

      await service.discoverLocalEvents('Los Angeles, CA', mockStartDate, mockEndDate);
      await service.discoverLocalEvents('New York, NY', mockStartDate, mockEndDate);

      // Different locations should generate different cache keys
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });

    test('should clear cache on demand', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify([
          { title: 'Event', date: '2026-02-21', time: '10:00 AM', location: 'Location' },
        ]),
      });

      await service.discoverLocalEvents('Los Angeles, CA', mockStartDate, mockEndDate);
      service.clearCache();

      // After clearing cache, should hit API again
      await service.discoverLocalEvents('Los Angeles, CA', mockStartDate, mockEndDate);
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });
  });

  describe('Discord Formatting', () => {
    test('should format events into Discord embed', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify([
          {
            title: 'Test Event',
            description: 'Test Description',
            date: '2026-02-21',
            time: '10:00 AM',
            location: 'Test Location',
            url: 'https://example.com/event',
          },
        ]),
      });

      const events = await service.discoverLocalEvents(
        'Los Angeles, CA',
        mockStartDate,
        mockEndDate
      );
      const embed = await service.formatEventsForDiscord(events, 'Los Angeles, CA');

      expect(embed).toBeDefined();
      expect(embed.data.title).toContain('Los Angeles, CA');
    });

    test('should handle long event descriptions (truncate)', async () => {
      const longDescription = 'A'.repeat(200);
      const events = [
        {
          title: 'Event',
          description: longDescription,
          startDate: new Date('2026-02-21T10:00:00Z'),
          location: 'Location',
          source: 'Test',
        },
      ];

      const embed = await service.formatEventsForDiscord(events, 'Los Angeles, CA');

      expect(embed).toBeDefined();
      // Description should be truncated to 100 characters + "..."
      const fieldValue = embed.data.fields?.[0]?.value || '';
      expect(fieldValue.length).toBeLessThan(200);
    });

    test('should include event URL if available', async () => {
      const events = [
        {
          title: 'Event With URL',
          description: 'Description',
          startDate: new Date('2026-02-21T10:00:00Z'),
          location: 'Location',
          url: 'https://example.com/event',
          source: 'Test',
        },
      ];

      const embed = await service.formatEventsForDiscord(events, 'Los Angeles, CA');

      expect(embed).toBeDefined();
      const fieldValue = embed.data.fields?.[0]?.value || '';
      expect(fieldValue).toContain('https://example.com/event');
    });

    test('should handle events with no URL', async () => {
      const events = [
        {
          title: 'Event Without URL',
          description: 'Description',
          startDate: new Date('2026-02-21T10:00:00Z'),
          location: 'Location',
          source: 'Test',
        },
      ];

      const embed = await service.formatEventsForDiscord(events, 'Los Angeles, CA');

      expect(embed).toBeDefined();
      const fieldValue = embed.data.fields?.[0]?.value || '';
      expect(fieldValue).not.toContain('http');
    });

    test('should create "No events found" embed', async () => {
      const embed = await service.formatEventsForDiscord([], 'Remote Island');

      expect(embed).toBeDefined();
      expect(embed.data.description).toContain('No upcoming events found');
    });

    test('should handle maximum field limit (25)', async () => {
      const manyEvents = Array.from({ length: 30 }, (_, i) => ({
        title: `Event ${i + 1}`,
        description: 'Description',
        startDate: new Date('2026-02-21T10:00:00Z'),
        location: 'Location',
        source: 'Test',
      }));

      const embed = await service.formatEventsForDiscord(manyEvents, 'Los Angeles, CA');

      expect(embed).toBeDefined();
      expect(embed.data.fields?.length).toBeLessThanOrEqual(25);
    });
  });

  describe('Mock Provider', () => {
    test('should use mock provider when configured', async () => {
      process.env.EVENTS_AI_SERVICE = 'mock';
      const mockService = new EventsService();

      const events = await mockService.discoverLocalEvents(
        'Any Location',
        mockStartDate,
        mockEndDate
      );

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].source).toBe('Mock Data');
    });

    test('should return sample events from mock provider', async () => {
      process.env.EVENTS_AI_SERVICE = 'mock';
      const mockService = new EventsService();

      const events = await mockService.discoverLocalEvents(
        'Any Location',
        mockStartDate,
        mockEndDate
      );

      expect(events).toBeDefined();
      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toHaveProperty('title');
      expect(events[0]).toHaveProperty('description');
      expect(events[0]).toHaveProperty('startDate');
    });
  });
});
