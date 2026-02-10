// Mock the logger BEFORE importing GeminiService
jest.mock('../../../shared/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock the Google GenAI SDK
const mockGenerateContent = jest.fn();

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  })),
}));

import { GeminiService } from '../../../utils/geminiService';
import { GoogleGenAI } from '@google/genai';
import { logger } from '../../../shared/utils/logger';

describe('GeminiService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...originalEnv };
    // Reset the static genAI property
    (GeminiService as any).genAI = null;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('initialization', () => {
    it('should initialize with valid API key', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';

      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({
          activity: 'Test Activity',
          description: 'Test description',
          estimatedCost: 'Moderate',
          timeOfDay: 'Evening',
        }),
      });

      const result = await GeminiService.generateDateIdea('90210');

      expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
      expect(result.activity).toBe('Test Activity');
    });

    it('should log warning when API key is missing', async () => {
      delete process.env.GEMINI_API_KEY;

      await expect(GeminiService.generateDateIdea('90210')).rejects.toThrow(
        'Gemini API not configured'
      );

      expect(logger.warn).toHaveBeenCalledWith(
        'GEMINI_API_KEY not configured - date suggestions will use fallback'
      );
    });
  });

  describe('generateDateIdea', () => {
    beforeEach(() => {
      process.env.GEMINI_API_KEY = 'test-api-key';
    });

    it('should generate valid DateIdeaResponse with all fields', async () => {
      const expectedResponse = {
        activity: 'Sunset Beach Walk',
        description: 'Stroll along the beach at golden hour',
        estimatedCost: 'Budget-friendly',
        timeOfDay: 'Evening',
      };

      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify(expectedResponse),
      });

      const result = await GeminiService.generateDateIdea('90210');

      expect(result).toEqual(expectedResponse);
    });

    it('should pass googleSearch tool in config', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({
          activity: 'Test',
          description: 'Test',
        }),
      });

      await GeminiService.generateDateIdea('90210');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.5-flash',
          config: expect.objectContaining({
            tools: [{ googleSearch: {} }],
          }),
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('API Error'));

      await expect(GeminiService.generateDateIdea('90210')).rejects.toThrow('API Error');

      expect(logger.error).toHaveBeenCalledWith('Failed to generate date idea from Gemini', {
        zipCode: '90210',
        error: 'API Error',
      });
    });
  });

  describe('parseResponse', () => {
    beforeEach(() => {
      process.env.GEMINI_API_KEY = 'test-api-key';
    });

    it('should parse clean JSON correctly', async () => {
      const expectedResponse = {
        activity: 'Museum Visit',
        description: 'Explore local art and history',
        estimatedCost: 'Moderate',
        timeOfDay: 'Afternoon',
      };

      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify(expectedResponse),
      });

      const result = await GeminiService.generateDateIdea('90210');

      expect(result).toEqual(expectedResponse);
    });

    it('should handle markdown-wrapped JSON', async () => {
      const expectedResponse = {
        activity: 'Wine Tasting',
        description: 'Visit a local vineyard',
        estimatedCost: 'Splurge',
        timeOfDay: 'Evening',
      };

      const markdownWrapped = `\`\`\`json
${JSON.stringify(expectedResponse)}
\`\`\``;

      mockGenerateContent.mockResolvedValueOnce({
        text: markdownWrapped,
      });

      const result = await GeminiService.generateDateIdea('90210');

      expect(result).toEqual(expectedResponse);
    });

    it('should handle optional fields being undefined', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({
          activity: 'Coffee Shop',
          description: 'Cozy coffee date',
          // estimatedCost and timeOfDay omitted
        }),
      });

      const result = await GeminiService.generateDateIdea('90210');

      expect(result.activity).toBe('Coffee Shop');
      expect(result.description).toBe('Cozy coffee date');
      expect(result.estimatedCost).toBeUndefined();
      expect(result.timeOfDay).toBeUndefined();
    });

    it('should throw on invalid JSON', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: 'This is not JSON',
      });

      await expect(GeminiService.generateDateIdea('90210')).rejects.toThrow(
        'Invalid response format'
      );

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to parse Gemini response',
        expect.objectContaining({
          text: expect.any(String),
          error: expect.any(String),
        })
      );
    });

    it('should throw on missing required fields', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({
          // Missing activity
          description: 'Test description',
        }),
      });

      await expect(GeminiService.generateDateIdea('90210')).rejects.toThrow(
        'Invalid response format'
      );
    });
  });

  describe('prompt building', () => {
    it('should include ZIP code in prompt', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';

      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({
          activity: 'Test',
          description: 'Test',
        }),
      });

      await GeminiService.generateDateIdea('90210');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.stringContaining('90210'),
        })
      );
    });
  });
});
