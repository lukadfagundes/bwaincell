import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

/**
 * Proxy requests to the backend API
 * Adds Google OAuth Bearer token from NextAuth session
 */
async function proxyToBackend(
  request: NextRequest,
  method: string,
  endpoint: string,
  body?: unknown,
) {
  const session = await getServerSession();

  if (!session?.googleAccessToken) {
    return NextResponse.json(
      { success: false, error: "No authentication token" },
      { status: 401 },
    );
  }

  const backendUrl = process.env.BACKEND_API_URL || "http://localhost:3000";
  const url = `${backendUrl}${endpoint}`;

  console.log(`[API-PROXY] ${method} ${url}`);

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.googleAccessToken}`,
      },
    };

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`[API-PROXY] ${method} ${url} error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: "Backend API unavailable",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 503 },
    );
  }
}

/**
 * GET /api/lists
 * Proxies to backend API: GET /api/lists
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession();

  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  return proxyToBackend(request, "GET", "/api/lists");
}

/**
 * POST /api/lists
 * Proxies to backend API: POST /api/lists
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession();

  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = await request.json();
  return proxyToBackend(request, "POST", "/api/lists", body);
}
