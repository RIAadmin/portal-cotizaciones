import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const id = parseInt(idParam);
    const { number, amount, date } = await req.json();

    const invoice = await prisma.invoice.create({
      data: {
        number,
        amount: parseFloat(amount),
        date: new Date(date),
        quotationId: id
      }
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("POST INVOICE ERROR:", error);
    return NextResponse.json({ message: "Error al crear factura" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    const invoices = await prisma.invoice.findMany({
      where: { quotationId: id },
      include: { payments: true },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json(invoices);
  } catch (error) {
    return NextResponse.json({ message: "Error al obtener facturas" }, { status: 500 });
  }
}
