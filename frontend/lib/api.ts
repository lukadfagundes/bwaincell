import { getSession } from "next-auth/react";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * API Client with Bearer Token Authentication
 *
 * Uses NextAuth session to get access token
 * Sends Bearer token in Authorization header
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get Authorization header with Bearer token
   */
  private async getAuthHeader(): Promise<Record<string, string>> {
    try {
      const session = await getSession();

      if (!session?.accessToken) {
        console.warn("[API-CLIENT] No access token in session");
        return {};
      }

      return {
        Authorization: `Bearer ${session.accessToken}`,
      };
    } catch (error) {
      console.error("[API-CLIENT] Failed to get session:", error);
      return {};
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const authHeader = await this.getAuthHeader();
      const headers = {
        "Content-Type": "application/json",
        ...authHeader,
      };

      console.log(`[API] GET ${endpoint}`, {
        hasAuth: !!(authHeader as Record<string, string>)["Authorization"],
      });

      const response = await globalThis.fetch(`${this.baseUrl}${endpoint}`, {
        method: "GET",
        headers,
      });

      console.log(`[API] GET ${endpoint} response:`, {
        status: response.status,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[API] GET ${endpoint} error response:`, errorData);
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`[API] GET ${endpoint} failed:`, error);
      throw error;
    }
  }

  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      const authHeader = await this.getAuthHeader();
      const response = await globalThis.fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`[API] POST ${endpoint} failed:`, error);
      throw error;
    }
  }

  async patch<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      const authHeader = await this.getAuthHeader();
      const response = await globalThis.fetch(`${this.baseUrl}${endpoint}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`[API] PATCH ${endpoint} failed:`, error);
      throw error;
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const authHeader = await this.getAuthHeader();
      const response = await globalThis.fetch(`${this.baseUrl}${endpoint}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`[API] DELETE ${endpoint} failed:`, error);
      throw error;
    }
  }
}

export const api = new ApiClient(
  process.env.NEXT_PUBLIC_API_URL || "https://bwaincell.fly.dev",
);
