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
    const { advance, isPaid, paidAt } = body;

    const updateData: any = {};
    if (advance !== undefined) updateData.advance = advance;
    if (isPaid !== undefined) updateData.isPaid = isPaid;
    if (paidAt) updateData.paidAt = new Date(paidAt);

    const quotation = await prisma.quotation.update({
      where: { id: id },
      data: updateData
    });

    return NextResponse.json(quotation);
  } catch (error: any) {
    console.error("CRITICAL PAYMENT ERROR:", error);
    return NextResponse.json({ 
      message: "Error interno del servidor", 
      error: error.message 
    }, { status: 500 });
  }
}