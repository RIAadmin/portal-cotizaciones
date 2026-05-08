import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const id = parseInt(idParam);
    const { number, amount, date, status } = await req.json();

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        number,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        date: date ? new Date(date) : undefined,
        status
      }
    });

    return NextResponse.json(invoice);
  } catch (error) {
    return NextResponse.json({ message: "Error al actualizar factura" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const id = parseInt(idParam);

    // Delete associated payments first or let Prisma handle it if configured
    // Since we didn't specify onDelete: Cascade in schema, let's do it manually or assume relation exists
    await prisma.payment.deleteMany({ where: { invoiceId: id } });
    await prisma.invoice.delete({ where: { id } });

    return NextResponse.json({ message: "Factura eliminada" });
  } catch (error) {
    return NextResponse.json({ message: "Error al eliminar factura" }, { status: 500 });
  }
}
