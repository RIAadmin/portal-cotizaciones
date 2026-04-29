import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const formData = await req.formData();
    const quotationId = parseInt(formData.get("quotationId") as string);
    const type = formData.get("type") as any;
    const file = formData.get("file") as File;

    const quotation = await prisma.quotation.findUnique({ where: { id: quotationId } });
    if (!quotation) return NextResponse.json({ message: "No encontrado" }, { status: 404 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const folder = type === 'OC' ? 'oc' : 'invoices';
    const ext = path.extname(file.name);
    const filename = `${quotation.folio}_${type}_${Date.now()}${ext}`;
    const filePath = path.join(process.cwd(), "public", "uploads", folder, filename);
    
    await writeFile(filePath, buffer);

    await prisma.quotationFile.create({
      data: {
        type,
        path: `/uploads/${folder}/${filename}`,
        filename,
        quotationId,
      }
    });

    // Update Status
    let newStatus = quotation.status;
    if (type === 'OC') newStatus = 'OC_UPLOADED';
    if (type === 'INVOICE_PDF' || type === 'INVOICE_XML') {
      const otherType = type === 'INVOICE_PDF' ? 'INVOICE_XML' : 'INVOICE_PDF';
      const hasOther = await prisma.quotationFile.findFirst({
        where: { quotationId, type: otherType }
      });
      if (hasOther) newStatus = 'INVOICED';
    }

    await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: newStatus }
    });

    return NextResponse.json({ message: "Subido correctamente" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
