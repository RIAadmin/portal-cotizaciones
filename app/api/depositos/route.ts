import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    // Fetch all payments with client and quotation info
    const payments = await prisma.payment.findMany({
      include: {
        quotation: {
          include: {
            client: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Process data for charts (group by month)
    const monthlyData: Record<string, number> = {};
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    payments.forEach(payment => {
      const date = new Date(payment.date);
      const monthYear = `${months[date.getMonth()]} ${date.getFullYear()}`;
      monthlyData[monthYear] = (monthlyData[monthYear] || 0) + Number(payment.amount);
    });

    // Convert to array format for Recharts
    const chartData = Object.keys(monthlyData).map(key => ({
      name: key,
      total: monthlyData[key]
    })).reverse(); // Oldest to newest

    return NextResponse.json({
      payments,
      chartData
    });
  } catch (error) {
    console.error("DEPOSITOS API ERROR:", error);
    return NextResponse.json({ message: "Error al obtener depósitos" }, { status: 500 });
  }
}
