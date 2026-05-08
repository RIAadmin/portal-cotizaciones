import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID no válido" }, { status: 400 });
    }

    const body = await request.json();
    const { amount, date, isPaid, paidAt, invoiceId } = body;

    const result = await prisma.$transaction(async (tx) => {
      const currentQuotation = await tx.quotation.findUnique({
        where: { id }
      });

      if (!currentQuotation) {
        throw new Error("Cotización no encontrada");
      }

      const updateData: any = {};

      if (amount !== undefined) {
        // 1. Create a new payment record
        await tx.payment.create({
          data: {
            amount: amount,
            date: date ? new Date(date) : new Date(),
            quotationId: id,
            invoiceId: invoiceId ? parseInt(invoiceId) : undefined
          }
        });

        // 2. Sum all payments to update the advance field
        const payments = await tx.payment.findMany({
          where: { quotationId: id }
        });
        const totalAdvance = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        updateData.advance = totalAdvance;

        // 3. Set status to ANTICIPO if not paid
        if (!currentQuotation.isPaid && !isPaid) {
          updateData.status = 'ANTICIPO';
        }
      }

      if (isPaid !== undefined) {
        updateData.isPaid = isPaid;
        if (paidAt) {
          const paidDate = new Date(paidAt);
          updateData.paidAt = paidDate;
          
          if (isPaid === true) {
            // Calculate remaining balance to create a final payment record
            const totalPayments = await tx.payment.findMany({
              where: { quotationId: id }
            });
            const alreadyPaid = totalPayments.reduce((sum, p) => sum + Number(p.amount), 0);
            const remaining = Number(currentQuotation.total || 0) - alreadyPaid;
            
            if (remaining > 0) {
              await tx.payment.create({
                data: {
                  amount: remaining,
                  date: paidDate,
                  quotationId: id
                }
              });
              updateData.advance = Number(currentQuotation.total || 0);
            }
          }
        }
      }

      return await tx.quotation.update({
        where: { id: id },
        data: updateData
      });
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("CRITICAL PAYMENT ERROR:", error);
    return NextResponse.json({ 
      message: "Error interno del servidor", 
      error: error.message 
    }, { status: 500 });
  }
}