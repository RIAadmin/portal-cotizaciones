import Sidebar from '@/components/Sidebar';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DollarSign, Wallet, ArrowDownCircle } from 'lucide-react';

export default async function CobranzaPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Fetch quotations that have OC and ARE NOT fully paid
  const quotations = await prisma.quotation.findMany({
    where: {
      AND: [
        {
          OR: [
            { status: 'OC_UPLOADED' },
            { status: 'INVOICED' }
          ]
        },
        { isPaid: false }
      ]
    },
    include: { client: true },
    orderBy: { createdAt: 'desc' }
  });

  // Group by client with detailed projects
  const collectionByClient: Record<string, { 
    company: string, 
    totalProjects: number,
    totalAdvances: number,
    totalPending: number, 
    projects: Array<{ folio: string, description: string | null, total: number, advance: number, pending: number }> 
  }> = {};

  quotations.forEach(q => {
    const clientId = q.clientId.toString();
    if (!collectionByClient[clientId]) {
      collectionByClient[clientId] = {
        company: q.client.company,
        totalProjects: 0,
        totalAdvances: 0,
        totalPending: 0,
        projects: []
      };
    }
    
    const totalAmount = Number(q.total || 0);
    const advanceAmount = Number(q.advance || 0);
    const pendingAmount = totalAmount - advanceAmount;

    collectionByClient[clientId].totalProjects += totalAmount;
    collectionByClient[clientId].totalAdvances += advanceAmount;
    collectionByClient[clientId].totalPending += pendingAmount;
    
    collectionByClient[clientId].projects.push({
      folio: q.folio,
      description: q.description,
      total: totalAmount,
      advance: advanceAmount,
      pending: pendingAmount
    });
  });

  const grandTotalPending = Object.values(collectionByClient).reduce((acc, curr) => acc + curr.totalPending, 0);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header style={{ marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '2.2rem', 
            fontWeight: '800', 
            color: 'var(--primary)',
            lineHeight: '1.2',
            letterSpacing: '-0.01em',
          }}>
            Recubrimientos Industriales y Aplicaciones <br/>
            <span style={{ fontSize: '1.4rem', fontWeight: '400', color: 'var(--text-muted)' }}>
              Resumen de Cobranza Pendiente
            </span>
          </h1>
        </header>

        {/* Total General Card */}
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)', 
          color: 'white', 
          marginBottom: '40px', 
          padding: '40px',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(40, 167, 69, 0.3)'
        }}>
          <div>
            <p style={{ opacity: 0.9, fontSize: '1.2rem', marginBottom: '8px', fontWeight: '500' }}>SALDO TOTAL POR COBRAR (Neto)</p>
            <h2 style={{ fontSize: '4rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
              ${grandTotalPending.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </h2>
            <p style={{ fontSize: '1.1rem', marginTop: '10px', opacity: 0.9, fontWeight: '600' }}>Saldo total por cobrar</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '25px', borderRadius: '50%' }}>
            <DollarSign size={80} />
          </div>
        </div>

        <section>
          {Object.keys(collectionByClient).length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>No hay cobranza pendiente en este momento.</p>
            </div>
          ) : (
            Object.values(collectionByClient).map((client, index) => (
              <div key={index} className="card" style={{ marginBottom: '40px', borderTop: '6px solid #28a745' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px', marginBottom: '30px', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
                  <div style={{ gridColumn: 'span 1' }}>
                    <h2 style={{ fontSize: '1.8rem', color: 'var(--primary)', marginBottom: '4px' }}>{client.company}</h2>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Empresa / Cliente</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Monto Total OC</p>
                    <p style={{ fontSize: '1.4rem', fontWeight: '600' }}>${client.totalProjects.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.85rem', color: '#dc3545', marginBottom: '4px' }}>Anticipos (-) </p>
                    <p style={{ fontSize: '1.4rem', fontWeight: '600', color: '#dc3545' }}>${client.totalAdvances.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.85rem', color: '#28a745', marginBottom: '4px', fontWeight: '700' }}>SALDO PENDIENTE</p>
                    <p style={{ fontSize: '2rem', fontWeight: '800', color: '#28a745' }}>
                      ${client.totalPending.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ArrowDownCircle size={16} /> Desglose de Proyectos
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {client.projects.map((project, pIndex) => (
                      <div key={pIndex} style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '120px 1fr 150px 150px 180px', 
                        alignItems: 'center',
                        padding: '16px',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        border: '1px solid #edf2f7'
                      }}>
                        <div style={{ fontWeight: '700', color: 'var(--primary)' }}>{project.folio}</div>
                        <div style={{ color: '#4a5568', fontSize: '0.95rem' }}>{project.description || 'Sin descripción'}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Monto: ${project.total.toLocaleString('es-MX')}</div>
                        <div style={{ fontSize: '0.9rem', color: '#dc3545' }}>Antic: -${project.advance.toLocaleString('es-MX')}</div>
                        <div style={{ textAlign: 'right', fontWeight: '700', fontSize: '1.1rem', color: '#28a745' }}>
                          ${project.pending.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
