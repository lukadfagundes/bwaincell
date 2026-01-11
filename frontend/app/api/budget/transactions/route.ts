import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/budget/transactions
 * Retrieve all budget transactions for the authenticated user's guild
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

    const transactions = await prisma.budget.findMany({
      where: { guildId: user.guildId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error("[API] Error fetching budget transactions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch transactions",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/budget/transactions
 * Create a new budget transaction
 */
export async function POST(request: NextRequest) {
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
      select: { guildId: true, discordId: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { amount, type, category, description, date } = body;

    // Validate required fields
    if (!amount || typeof amount !== "number") {
      return NextResponse.json(
        { success: false, error: "Amount is required and must be a number" },
        { status: 400 },
      );
    }

    if (!type || (type !== "income" && type !== "expense")) {
      return NextResponse.json(
        { success: false, error: "Type must be 'income' or 'expense'" },
        { status: 400 },
      );
    }

    if (!category || typeof category !== "string") {
      return NextResponse.json(
        { success: false, error: "Category is required" },
        { status: 400 },
      );
    }

    const transaction = await prisma.budget.create({
      data: {
        amount,
        type,
        category,
        description: description || null,
        date: date ? new Date(date) : new Date(),
        userId: user.discordId,
        guildId: user.guildId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: transaction,
        message: "Transaction created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[API] Error creating budget transaction:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create transaction",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
