import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const id = parseInt(idParam);

    const files = await prisma.quotationFile.findMany({
      where: { quotationId: id }
    });

    // Archivos ahora están en la BD, no necesitamos borrarlos del disco físico

    await prisma.quotationFile.deleteMany({
      where: { quotationId: id }
    });

    await prisma.quotation.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Eliminado correctamente" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error al eliminar" }, { status: 500 });
  }
}
