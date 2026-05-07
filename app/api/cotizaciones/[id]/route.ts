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
