import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Faltan datos obligatorios" }, { status: 400 });
    }

    if (!email.endsWith("@riaindustrial.com.mx")) {
      return NextResponse.json({ message: "No se pudo registrar la cuenta. Contacte al administrador." }, { status: 403 });
    }

    const exists = await prisma.user.findUnique({
      where: { email }
    });

    if (exists) {
      return NextResponse.json({ message: "El usuario ya existe" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ message: "Usuario creado correctamente" }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
