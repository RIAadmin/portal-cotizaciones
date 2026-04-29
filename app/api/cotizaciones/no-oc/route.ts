import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const { quotationId } = await req.json();

    await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: "OC_UPLOADED" } // Mark as OC step done even if no OC
    });

    return NextResponse.json({ message: "Actualizado" });
  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
