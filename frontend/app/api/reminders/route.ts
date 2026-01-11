import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

/**
 * GET /api/reminders
 * Returns all reminders for the authenticated user
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
    console.error("[API] GET /api/reminders error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/reminders
 * Creates a new reminder
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
    console.log("[API] POST /api/reminders - creating reminder:", body);

    return NextResponse.json({
      success: true,
      message: "Reminder creation not yet implemented",
    });
  } catch (error) {
    console.error("[API] POST /api/reminders error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
