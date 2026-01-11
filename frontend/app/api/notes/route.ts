import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

/**
 * GET /api/notes
 * Returns all notes for the authenticated user
 *
 * TODO: Implement backend integration
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      data: [],
    });
  } catch (error) {
    console.error("[API] GET /api/notes error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/notes
 * Creates a new note
 *
 * TODO: Implement backend integration
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    console.log("[API] POST /api/notes - creating note:", body);

    return NextResponse.json({
      success: true,
      message: "Note creation not yet implemented",
    });
  } catch (error) {
    console.error("[API] POST /api/notes error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
