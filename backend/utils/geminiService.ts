import { GoogleGenAI } from '@google/genai';
import { logger } from '../shared/utils/logger';

/**
 * Response structure for AI-generated date ideas
 */
export interface DateIdeaResponse {
  activity: string;
  description: string;
  estimatedCost?: string;
  timeOfDay?: string;
  url?: string;
}

/**
 * Response structure for WNRS-style conversation questions
 */
export interface WNRSQuestionResponse {
  question: string;
  level: number;
  levelName: string;
}

/**
 * Service for generating AI-powered date suggestions using Google Gemini Flash 2.5
 */
export class GeminiService {
  private static genAI: GoogleGenAI | null = null;

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
    this.genAI = new GoogleGenAI({ apiKey });
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
      // Use gemini-2.5-flash with Google Search grounding for real-time local event data
      const prompt = this.buildPrompt(zipCode);
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] },
      });
      const text = response.text ?? '';

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
   * Generate a WNRS-style conversation question
   * @returns Promise resolving to a WNRSQuestionResponse
   * @throws Error if Gemini API is not configured or API call fails
   */
  public static async generateQuestion(): Promise<WNRSQuestionResponse> {
    this.initialize();

    if (!this.genAI) {
      throw new Error('Gemini API not configured');
    }

    try {
      const prompt = this.buildQuestionPrompt();
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] },
      });
      const text = response.text ?? '';

      return this.parseQuestionResponse(text);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to generate question from Gemini', {
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
    return `You are a creative date planner. Search for local events and activities happening tonight or this weekend near zip code ${zipCode}, then generate ONE unique date idea for couples that incorporates what's actually going on locally.

Requirements:
- Search for real local events, shows, markets, festivals, or activities near ${zipCode}
- Build a date idea around a real local event or activity you find
- Include the specific venue name and event details
- Provide a brief description (2-3 sentences)
- Estimate cost range (Budget-friendly, Moderate, Splurge)
- Suggest time of day (Morning, Afternoon, Evening, Night)
- Include a URL link to the event page or venue website

Format your response as JSON:
{
  "activity": "Activity Name",
  "description": "Brief description incorporating the local event",
  "estimatedCost": "Budget-friendly|Moderate|Splurge",
  "timeOfDay": "Morning|Afternoon|Evening|Night",
  "url": "https://example.com/event-page"
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
        url: parsed.url || undefined,
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

  /**
   * Build the prompt for WNRS-style question generation
   * @returns Formatted prompt string
   * @private
   */
  private static buildQuestionPrompt(): string {
    return `You are a conversation question generator inspired by the card game "We're Not Really Strangers" (WNRS). Generate ONE thought-provoking conversation question.

WNRS has 3 progressive levels:
- Level 1: Perception — Light, approachable questions about first impressions and surface-level observations (e.g., "What was your first impression of me?" or "What do you think I'm most passionate about?")
- Level 2: Connection — Deeper questions that build emotional intimacy and vulnerability (e.g., "What's something you're afraid to ask me?" or "When did you last cry and why?")
- Level 3: Reflection — The deepest questions about growth, gratitude, and introspection (e.g., "What's the most important lesson you've learned this year?" or "What do you wish more people knew about you?")

Requirements:
- Randomly pick ONE level (1, 2, or 3)
- Generate an original question that fits the spirit and depth of that level
- The question should be open-ended and encourage meaningful conversation
- Do NOT copy questions directly from the actual game — create original ones in the same style
- Keep the question concise (1-2 sentences max)

Format your response as JSON:
{
  "question": "Your generated question here?",
  "level": 1,
  "levelName": "Perception"
}

The levelName must match the level number: 1="Perception", 2="Connection", 3="Reflection"`;
  }

  /**
   * Parse and validate WNRS question response
   * @param text - Raw text response from Gemini
   * @returns Parsed WNRSQuestionResponse object
   * @throws Error if response format is invalid
   * @private
   */
  private static parseQuestionResponse(text: string): WNRSQuestionResponse {
    try {
      const cleaned = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      const parsed = JSON.parse(cleaned);

      if (!parsed.question || typeof parsed.question !== 'string') {
        throw new Error('Missing or invalid "question" field');
      }

      if (!parsed.level || ![1, 2, 3].includes(parsed.level)) {
        throw new Error('Missing or invalid "level" field (must be 1, 2, or 3)');
      }

      const levelNames: Record<number, string> = {
        1: 'Perception',
        2: 'Connection',
        3: 'Reflection',
      };

      return {
        question: parsed.question,
        level: parsed.level,
        levelName: parsed.levelName || levelNames[parsed.level],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown parse error';
      logger.error('Failed to parse Gemini question response', {
        text: text.substring(0, 200),
        error: errorMessage,
      });
      throw new Error(`Invalid response format: ${errorMessage}`);
    }
  }
}
