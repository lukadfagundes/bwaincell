import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/notes
 * Returns all notes for the authenticated user's guild
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { guildId: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const notes = await prisma.note.findMany({
      where: { guildId: user.guildId },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: notes,
    });
  } catch (error) {
    console.error("[API] GET /api/notes error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch notes",
      },
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
