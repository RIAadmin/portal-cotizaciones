import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { percentage, notes } = await request.json();
    const quotationId = parseInt(id);
    const userId = parseInt((session.user as any).id);

    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      return NextResponse.json({ message: "Porcentaje inválido" }, { status: 400 });
    }

    // Use a transaction to ensure both records are created/updated
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the update record
      const update = await tx.quotationUpdate.create({
        data: {
          percentage,
          notes,
          userId,
          quotationId
        }
      });

      // 2. Update the main quotation progress
      await tx.quotation.update({
        where: { id: quotationId },
        data: { progress: percentage }
      });

      return update;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("ERROR UPDATING PROGRESS:", error);
    return NextResponse.json({ message: "Error al actualizar el avance" }, { status: 500 });
  }
}
