import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const clients = await prisma.client.findMany({
      orderBy: { company: 'asc' }
    });
    return NextResponse.json(clients);
  } catch (error) {
    console.error("GET CLIENTS ERROR:", error);
    return NextResponse.json({ message: "Error al obtener clientes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const { company, email, phone } = await req.json();

    if (!company) {
      return NextResponse.json({ message: "El nombre de la empresa es obligatorio" }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: { company, email, phone }
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("POST CLIENTS ERROR:", error);
    return NextResponse.json({ message: "Error al crear cliente" }, { status: 500 });
  }
}
