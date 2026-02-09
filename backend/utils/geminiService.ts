import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../shared/utils/logger';

/**
 * Response structure for AI-generated date ideas
 */
export interface DateIdeaResponse {
  activity: string;
  description: string;
  estimatedCost?: string;
  timeOfDay?: string;
}

/**
 * Service for generating AI-powered date suggestions using Google Gemini Flash 2.5
 */
export class GeminiService {
  private static genAI: GoogleGenerativeAI | null = null;

  /**
   * Initialize the Gemini API client with API key from environment
   * @private
   */
  private static initialize(): void {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.warn('GEMINI_API_KEY not configured - date suggestions will use fallback');
      return;
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Generate a creative date idea based on location
   * @param zipCode - ZIP code for location-aware suggestions
   * @returns Promise resolving to a DateIdeaResponse
   * @throws Error if Gemini API is not configured or API call fails
   */
  public static async generateDateIdea(zipCode: string): Promise<DateIdeaResponse> {
    this.initialize();

    if (!this.genAI) {
      throw new Error('Gemini API not configured');
    }

    try {
      // Use gemini-2.5-flash (current stable model as of 2026)
      // Note: Gemini 1.5 retired, Gemini 2.0 retiring March 31, 2026
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = this.buildPrompt(zipCode);
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      return this.parseResponse(text);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to generate date idea from Gemini', {
        zipCode,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Build the prompt for Gemini API
   * @param zipCode - ZIP code for location context
   * @returns Formatted prompt string
   * @private
   */
  private static buildPrompt(zipCode: string): string {
    return `You are a creative date planner. Generate ONE unique date idea for couples in the ${zipCode} area.

Requirements:
- Include specific local venues, restaurants, or activities when possible
- Provide a brief description (2-3 sentences)
- Estimate cost range (Budget-friendly, Moderate, Splurge)
- Suggest time of day (Morning, Afternoon, Evening, Night)
- Be creative and avoid generic suggestions

Format your response as JSON:
{
  "activity": "Activity Name",
  "description": "Brief description",
  "estimatedCost": "Budget-friendly|Moderate|Splurge",
  "timeOfDay": "Morning|Afternoon|Evening|Night"
}`;
  }

  /**
   * Parse and validate Gemini API response
   * @param text - Raw text response from Gemini
   * @returns Parsed DateIdeaResponse object
   * @throws Error if response format is invalid
   * @private
   */
  private static parseResponse(text: string): DateIdeaResponse {
    try {
      // Remove markdown code blocks if present (```json ... ```)
      const cleaned = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      const parsed = JSON.parse(cleaned);

      // Validate required fields
      if (!parsed.activity || typeof parsed.activity !== 'string') {
        throw new Error('Missing or invalid "activity" field');
      }

      if (!parsed.description || typeof parsed.description !== 'string') {
        throw new Error('Missing or invalid "description" field');
      }

      return {
        activity: parsed.activity,
        description: parsed.description,
        estimatedCost: parsed.estimatedCost || undefined,
        timeOfDay: parsed.timeOfDay || undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown parse error';
      logger.error('Failed to parse Gemini response', {
        text: text.substring(0, 200), // Log first 200 chars only
        error: errorMessage,
      });
      throw new Error(`Invalid response format: ${errorMessage}`);
    }
  }
}
