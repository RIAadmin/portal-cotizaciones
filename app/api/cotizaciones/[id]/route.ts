import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "No authorized" }, { status: 401 });
    }

    const { id } = await params;
    const quotationId = parseInt(id);
    const body = await req.json();
    const { total, description } = body;

    const updatedQuotation = await prisma.quotation.update({
      where: { id: quotationId },
      data: {
        total: total !== undefined ? parseFloat(total) : undefined,
        description: description !== undefined ? description : undefined,
      }
    });

    return NextResponse.json(updatedQuotation);
  } catch (error) {
    console.error("ERROR UPDATING QUOTATION:", error);
    return NextResponse.json({ message: "Internal error updating quotation" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const { id } = await params;
    const quotationId = parseInt(id);

    await prisma.$transaction(async (tx) => {
      // 1. Delete all payments associated with this quotation's invoices
      await tx.payment.deleteMany({
        where: {
          OR: [
            { quotationId: quotationId },
            { invoice: { quotationId: quotationId } }
          ]
        }
      });

      // 2. Delete all invoices
      await tx.invoice.deleteMany({
        where: { quotationId: quotationId }
      });

      // 3. Delete all files
      await tx.quotationFile.deleteMany({
        where: { quotationId: quotationId }
      });

      // 4. Delete all progress updates
      await tx.quotationUpdate.deleteMany({
        where: { quotationId: quotationId }
      });

      // 5. Finally delete the quotation
      await tx.quotation.delete({
        where: { id: quotationId }
      });
    });

    return NextResponse.json({ message: "Cotización eliminada correctamente" });
  } catch (error: any) {
    console.error("DELETE QUOTATION ERROR:", error);
    return NextResponse.json({ 
      message: "Error al eliminar la cotización", 
      details: error.message 
    }, { status: 500 });
  }
}
