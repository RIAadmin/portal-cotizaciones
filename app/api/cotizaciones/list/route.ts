import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const quotations = await prisma.quotation.findMany({
      include: { client: true },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(quotations);
  } catch (error) {
    console.error("LIST QUOTATIONS ERROR:", error);
    return NextResponse.json({ message: "Error al obtener cotizaciones" }, { status: 500 });
  }
}
