import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withRetry } from "@/lib/db-error-handler";

// DELETE /api/date-aliases/[date] - Delete a date alias
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;

    // Validate date format - accept both YYYY-MM-DD and copy-YYYYMMDD-timestamp formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const copyIdRegex = /^copy-\d{8}-\d+$/;

    if (!dateRegex.test(date) && !copyIdRegex.test(date)) {
      return NextResponse.json(
        {
          error:
            "Invalid date format. Use YYYY-MM-DD or copy-YYYYMMDD-timestamp",
        },
        { status: 400 }
      );
    }

    await withRetry(async () => {
      return await prisma.dateAlias.delete({
        where: { date },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Record not found")) {
      return NextResponse.json(
        { error: "Date alias not found" },
        { status: 404 }
      );
    }

    console.error("Error deleting date alias:", error);
    return NextResponse.json(
      { error: "Failed to delete date alias" },
      { status: 500 }
    );
  }
}
