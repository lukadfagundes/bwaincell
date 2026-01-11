import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

/**
 * GET /api/budget
 * Returns budget data for the authenticated user
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

    // Return empty budget data structure
    return NextResponse.json({
      success: true,
      data: {
        transactions: [],
        monthlyBudget: 0,
        currentSpending: 0,
      },
    });
  } catch (error) {
    console.error("[API] GET /api/budget error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
