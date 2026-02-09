// Mock the logger BEFORE importing GeminiService
jest.mock('../../../shared/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock the GoogleGenerativeAI SDK
jest.mock('@google/generative-ai');

import { GeminiService } from '../../../utils/geminiService';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              activity: 'Test Activity',
              description: 'Test description',
              estimatedCost: 'Moderate',
              timeOfDay: 'Evening',
            }),
        },
      });

      const mockGetGenerativeModel = jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      });

      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: mockGetGenerativeModel,
      }));

      const result = await GeminiService.generateDateIdea('90210');

      expect(GoogleGenerativeAI).toHaveBeenCalledWith('test-api-key');
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
      const mockResponse = {
        activity: 'Sunset Beach Walk',
        description: 'Stroll along the beach at golden hour',
        estimatedCost: 'Budget-friendly',
        timeOfDay: 'Evening',
      };

      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse),
        },
      });

      const mockGetGenerativeModel = jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      });

      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: mockGetGenerativeModel,
      }));

      const result = await GeminiService.generateDateIdea('90210');

      expect(result).toEqual(mockResponse);
      expect(mockGetGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-2.5-flash' });
    });

    it('should handle API errors gracefully', async () => {
      const mockGenerateContent = jest.fn().mockRejectedValue(new Error('API Error'));

      const mockGetGenerativeModel = jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      });

      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: mockGetGenerativeModel,
      }));

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
      const mockResponse = {
        activity: 'Museum Visit',
        description: 'Explore local art and history',
        estimatedCost: 'Moderate',
        timeOfDay: 'Afternoon',
      };

      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse),
        },
      });

      const mockGetGenerativeModel = jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      });

      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: mockGetGenerativeModel,
      }));

      const result = await GeminiService.generateDateIdea('90210');

      expect(result).toEqual(mockResponse);
    });

    it('should handle markdown-wrapped JSON', async () => {
      const mockResponse = {
        activity: 'Wine Tasting',
        description: 'Visit a local vineyard',
        estimatedCost: 'Splurge',
        timeOfDay: 'Evening',
      };

      const markdownWrapped = `\`\`\`json
${JSON.stringify(mockResponse)}
\`\`\``;

      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => markdownWrapped,
        },
      });

      const mockGetGenerativeModel = jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      });

      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: mockGetGenerativeModel,
      }));

      const result = await GeminiService.generateDateIdea('90210');

      expect(result).toEqual(mockResponse);
    });

    it('should handle optional fields being undefined', async () => {
      const mockResponse = {
        activity: 'Coffee Shop',
        description: 'Cozy coffee date',
        // estimatedCost and timeOfDay omitted
      };

      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse),
        },
      });

      const mockGetGenerativeModel = jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      });

      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: mockGetGenerativeModel,
      }));

      const result = await GeminiService.generateDateIdea('90210');

      expect(result.activity).toBe('Coffee Shop');
      expect(result.description).toBe('Cozy coffee date');
      expect(result.estimatedCost).toBeUndefined();
      expect(result.timeOfDay).toBeUndefined();
    });

    it('should throw on invalid JSON', async () => {
      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => 'This is not JSON',
        },
      });

      const mockGetGenerativeModel = jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      });

      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: mockGetGenerativeModel,
      }));

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
      const mockResponse = {
        // Missing activity
        description: 'Test description',
      };

      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse),
        },
      });

      const mockGetGenerativeModel = jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      });

      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: mockGetGenerativeModel,
      }));

      await expect(GeminiService.generateDateIdea('90210')).rejects.toThrow(
        'Invalid response format'
      );
    });
  });

  describe('prompt building', () => {
    it('should include ZIP code in prompt', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';

      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              activity: 'Test',
              description: 'Test',
            }),
        },
      });

      const mockGetGenerativeModel = jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      });

      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: mockGetGenerativeModel,
      }));

      await GeminiService.generateDateIdea('90210');

      expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('90210'));
    });
  });
});
