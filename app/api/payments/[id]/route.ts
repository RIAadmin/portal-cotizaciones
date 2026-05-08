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
    const { amount, date } = await req.json();

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { quotation: true }
    });

    if (!payment) return NextResponse.json({ message: "Pago no encontrado" }, { status: 404 });

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        amount: amount !== undefined ? amount : undefined,
        date: date ? new Date(date) : undefined
      }
    });

    // Recalculate advance for quotation
    const allPayments = await prisma.payment.findMany({
      where: { quotationId: payment.quotationId }
    });
    const totalAdvance = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Update quotation advance and possibly paidAt
    const updateData: any = { advance: totalAdvance };
    
    // If we updated the date and this was the liquidation date, update quotation too
    if (date && payment.quotation.isPaid && payment.date.getTime() === payment.quotation.paidAt?.getTime()) {
      updateData.paidAt = new Date(date);
    }

    await prisma.quotation.update({
      where: { id: payment.quotationId },
      data: updateData
    });

    return NextResponse.json(updatedPayment);
  } catch (error) {
    console.error("PATCH PAYMENT ERROR:", error);
    return NextResponse.json({ message: "Error al actualizar pago" }, { status: 500 });
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

    const payment = await prisma.payment.findUnique({
      where: { id }
    });

    if (!payment) return NextResponse.json({ message: "Pago no encontrado" }, { status: 404 });

    const quotationId = payment.quotationId;

    await prisma.payment.delete({
      where: { id }
    });

    // Recalculate advance
    const allPayments = await prisma.payment.findMany({
      where: { quotationId }
    });
    const totalAdvance = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    // If a payment is deleted, the project is likely NOT paid anymore (unless advance still >= total)
    // But to be safe and logical, if they delete a record, we revert isPaid to false if it was true.
    await prisma.quotation.update({
      where: { id: quotationId },
      data: { 
        advance: totalAdvance,
        isPaid: false,
        paidAt: null
      }
    });

    return NextResponse.json({ message: "Pago eliminado" });
  } catch (error) {
    console.error("DELETE PAYMENT ERROR:", error);
    return NextResponse.json({ message: "Error al eliminar pago" }, { status: 500 });
  }
}
