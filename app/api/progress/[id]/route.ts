import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "No authorized" }, { status: 401 });
    }

    const { id } = await params;
    const updateId = parseInt(id);

    // Find the update to know which quotation it belongs to
    const update = await prisma.quotationUpdate.findUnique({
      where: { id: updateId }
    });

    if (!update) {
      return NextResponse.json({ message: "Update not found" }, { status: 404 });
    }

    const quotationId = update.quotationId;

    // Delete the update
    await prisma.quotationUpdate.delete({
      where: { id: updateId }
    });

    // Find the most recent update remaining for this quotation to sync the main percentage
    const lastUpdate = await prisma.quotationUpdate.findFirst({
      where: { quotationId },
      orderBy: { createdAt: 'desc' }
    });

    // Update the main quotation progress
    await prisma.quotation.update({
      where: { id: quotationId },
      data: { progress: lastUpdate ? lastUpdate.percentage : 0 }
    });

    return NextResponse.json({ message: "Update deleted" });
  } catch (error) {
    console.error("ERROR DELETING PROGRESS UPDATE:", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
