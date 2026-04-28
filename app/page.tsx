import Sidebar from '@/components/Sidebar';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const quotations = await prisma.quotation.findMany({
    include: { client: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Dashboard</h1>
            <p style={{ color: 'var(--text-muted)' }}>Bienvenido, {session.user?.name}</p>
          </div>
          <Link href="/cotizaciones/nueva" className="btn btn-primary">
            <Plus size={20} />
            Nueva Cotización
          </Link>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '20px' }}>Cotizaciones Recientes</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '12px' }}>Folio</th>
                <th style={{ padding: '12px' }}>Fecha</th>
                <th style={{ padding: '12px' }}>Cliente</th>
                <th style={{ padding: '12px' }}>Descripción</th>
                <th style={{ padding: '12px' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No hay cotizaciones registradas.
                  </td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr key={q.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px' }}>
                      <Link href={`/cotizaciones/${q.folio}`} style={{ fontWeight: '600' }}>
                        {q.folio}
                      </Link>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {new Date(q.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px' }}>{q.client.name}</td>
                    <td style={{ padding: '12px' }}>{q.description || '-'}</td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge badge-${q.status.toLowerCase().replace('_', '-')}`}>
                        {q.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
