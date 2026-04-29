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

    const count = await prisma.quotation.count();
    const year = new Date().getFullYear();
    const folio = `COT-${year}-${(count + 1).toString().padStart(4, "0")}`;

    const userId = parseInt((session.user as any).id);

    const quotation = await prisma.quotation.create({
      data: {
        folio,
        description,
        total,
        clientId,
        userId: userId,
        status: status as any,
      }
    });

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `${folio}_${Date.now()}.pdf`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "quotations");
      
      await mkdir(uploadDir, { recursive: true });
      
      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);

      await prisma.quotationFile.create({
        data: {
          type: "QUOTATION",
          path: `/uploads/quotations/${filename}`,
          filename,
          quotationId: quotation.id,
        }
      });
    }

    return NextResponse.json(quotation, { status: 201 });
  } catch (error) {
    console.error("ERROR CREATING QUOTATION:", error);
    return NextResponse.json({ message: "Internal error creating quotation" }, { status: 500 });
  }
}
