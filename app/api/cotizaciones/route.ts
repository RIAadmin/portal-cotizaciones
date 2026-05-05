import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "No authorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const clientId = parseInt(formData.get("clientId") as string);
    const description = formData.get("description") as string;
    const totalValue = formData.get("total");
    const total = totalValue ? parseFloat(totalValue as string) : null;
    const file = formData.get("file") as File | null;
    const status = (formData.get("status") as string) || "PENDING";

    if (isNaN(clientId)) {
      return NextResponse.json({ message: "Invalid client" }, { status: 400 });
    }

    const lastQuotation = await prisma.quotation.findFirst({
      orderBy: { id: 'desc' }
    });
    
    let nextNumber = 1;
    if (lastQuotation && lastQuotation.folio) {
      const parts = lastQuotation.folio.split('-');
      if (parts.length === 3 && !isNaN(parseInt(parts[2]))) {
        nextNumber = parseInt(parts[2]) + 1;
      } else {
        const count = await prisma.quotation.count();
        nextNumber = count + 1;
      }
    }
    
    const year = new Date().getFullYear();
    const folio = `COT-${year}-${nextNumber.toString().padStart(4, "0")}`;

    const userIdStr = (session.user as any).id;
    const userId = userIdStr ? parseInt(userIdStr) : NaN;

    if (isNaN(userId)) {
      console.error("CREATE QUOTATION ERROR: No valid User ID in session", session.user);
      return NextResponse.json({ message: "Error de sesión: Usuario no identificado" }, { status: 401 });
    }

    const quotation = await prisma.quotation.create({
      data: {
        folio,
        description,
        total,
        clientId,
        userId: userId,
        status: status as any,
        progress: 0,
        isPaid: false
      }
    });

    console.log("QUOTATION CREATED SUCCESSFULLY:", quotation.folio);

    if (file && file.size > 0) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Data = buffer.toString('base64');
        const filename = `${folio}_${Date.now()}.pdf`;

        await prisma.quotationFile.create({
          data: {
            type: "QUOTATION",
            data: base64Data,
            filename,
            quotationId: quotation.id,
          }
        });
      } catch (fileError) {
        console.error("ERROR SAVING FILE:", fileError);
        // We still created the quotation, maybe return a warning?
      }
    }

    return NextResponse.json(quotation, { status: 201 });
  } catch (error: any) {
    console.error("ERROR CREATING QUOTATION:", error);
    return NextResponse.json({ 
      message: "Error interno al crear la cotización", 
      details: error.message 
    }, { status: 500 });
  }
}
