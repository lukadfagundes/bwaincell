import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

/**
 * GET /api/lists
 * Returns all lists for the authenticated user
 *
 * TODO: Implement backend integration
 * This is a stub that returns empty data until backend integration is complete
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // TODO: Call Discord bot backend API or database
    // For now, return empty array
    return NextResponse.json({
      success: true,
      data: [],
    });
  } catch (error) {
    console.error("[API] GET /api/lists error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/lists
 * Creates a new list
 *
 * TODO: Implement backend integration
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();

    // TODO: Call Discord bot backend API or database to create list
    console.log("[API] POST /api/lists - creating list:", body);

    return NextResponse.json({
      success: true,
      message: "List creation not yet implemented",
    });
  } catch (error) {
    console.error("[API] POST /api/lists error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
