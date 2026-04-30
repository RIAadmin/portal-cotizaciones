import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const { id } = await params;
    const fileId = parseInt(id);

    if (isNaN(fileId)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
    }

    const file = await prisma.quotationFile.findUnique({
      where: { id: fileId }
    });

    if (!file || !file.data) {
      return NextResponse.json({ message: "Archivo no encontrado" }, { status: 404 });
    }

    // Determine content type
    let contentType = "application/pdf";
    if (file.filename.endsWith(".xml")) contentType = "text/xml";
    if (file.filename.endsWith(".png")) contentType = "image/png";
    if (file.filename.endsWith(".jpg") || file.filename.endsWith(".jpeg")) contentType = "image/jpeg";

    const buffer = Buffer.from(file.data, 'base64');

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${file.filename}"`
      }
    });

  } catch (error) {
    console.error("Error serving file:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
