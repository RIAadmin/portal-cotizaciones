'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { Plus, CheckCircle, Clock, ShoppingCart, Search, X, AlertTriangle } from 'lucide-react';
import DeleteQuotationButton from '@/components/DeleteQuotationButton';

export default function DashboardPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [filteredQuotations, setFilteredQuotations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  const fetchQuotations = async () => {
    try {
      const res = await fetch('/api/cotizaciones/list');
      const data = await res.json();
      if (Array.isArray(data)) {
        setQuotations(data);
        setFilteredQuotations(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(session => {
        if (session?.user?.name) {
          setUserName(session.user.name);
        }
      })
      .catch(err => console.error("Error fetching session:", err));
  }, []);

  useEffect(() => {
    const results = quotations.filter(q => 
      q.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.description && q.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredQuotations(results);
  }, [searchTerm, quotations]);

  const pendingCount = quotations.filter(q => q.status === 'PENDING' && !q.isPaid).length;
  const ocCount = quotations.filter(q => q.status === 'OC_UPLOADED' && !q.isPaid).length;
  const finishedCount = quotations.filter(q => q.isPaid).length;

  const isOldPending = (q: any) => {
    if (q.status !== 'PENDING' || q.isPaid) return false;
    const createdAt = new Date(q.createdAt);
    const now = new Date();
    const diffDays = Math.ceil((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 10;
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ 
              fontSize: '2.2rem', 
              fontWeight: '800', 
              color: 'var(--primary)',
              lineHeight: '1.2',
              letterSpacing: '-0.01em',
            }}>
              Recubrimientos Industriales y Aplicaciones <br/>
              <span style={{ fontSize: '1.4rem', fontWeight: '400', color: 'var(--text-muted)' }}>
                Portal de Cotizaciones
              </span>
              {userName && (
                <div style={{ fontSize: '1.1rem', fontWeight: '500', color: 'var(--primary)', marginTop: '10px' }}>
                  ¡Bienvenido, {userName}!
                </div>
              )}
            </h1>
          </div>
          <Link href="/cotizaciones/nueva" className="btn btn-primary">
            <Plus size={20} />
            Nueva Cotización
          </Link>
        </header>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
          <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '12px', color: '#856404' }}>
              <Clock size={30} />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>Pendientes</p>
              <h3 style={{ fontSize: '1.8rem' }}>{pendingCount}</h3>
            </div>
          </div>
          <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ background: '#d1ecf1', padding: '15px', borderRadius: '12px', color: '#0c5460' }}>
              <ShoppingCart size={30} />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>Con OC</p>
              <h3 style={{ fontSize: '1.8rem' }}>{ocCount}</h3>
            </div>
          </div>
          <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ background: '#d4edda', padding: '15px', borderRadius: '12px', color: '#155724' }}>
              <CheckCircle size={30} />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>Terminados</p>
              <h3 style={{ fontSize: '1.8rem' }}>{finishedCount}</h3>
            </div>
          </div>
        </div>

        <section className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', gap: '20px' }}>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', whiteSpace: 'nowrap' }}>Cotizaciones Recientes</h2>
            
            <div style={{ position: 'relative', flex: 1, maxWidth: '500px' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
              <input 
                type="text" 
                placeholder="Buscar por folio, cliente o descripción..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '40px', borderRadius: '30px', background: '#f8fafc', border: '1px solid #e2e8f0' }}
              />
              {searchTerm && (
                <X 
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer' }} 
                  size={18} 
                />
              )}
            </div>
          </div>

          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Cargando cotizaciones...</td></tr>
              ) : filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                    {searchTerm ? `No se encontraron resultados para "${searchTerm}"` : 'No hay cotizaciones registradas aún.'}
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((q) => {
                  let rowBg = 'transparent';
                  let statusText = q.status === 'PENDING' ? 'Pendiente' : q.status === 'OC_UPLOADED' ? 'Con OC' : 'Facturada';
                  let badgeClass = q.status.toLowerCase().replace('_', '-');
                  const isOld = isOldPending(q);

                  if (q.isPaid) {
                    rowBg = '#e6fffa';
                    statusText = 'TERMINADO';
                    badgeClass = 'finished';
                  } else if (q.status === 'OC_UPLOADED' || q.status === 'INVOICED') {
                    rowBg = '#f0f7ff';
                  } else if (isOld) {
                    rowBg = '#fffaf0';
                  }

                  return (
                    <tr key={q.id} style={{ background: rowBg }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isOld && <AlertTriangle size={16} color="#dd6b20" />}
                          <Link href={`/cotizaciones/${q.folio}`} style={{ fontWeight: '700', color: 'var(--primary)' }}>
                            {q.folio}
                          </Link>
                        </div>
                      </td>
                      <td>{new Date(q.createdAt).toLocaleDateString('es-MX')}</td>
                      <td style={{ fontWeight: '600' }}>{q.client.company}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{q.description || '-'}</td>
                      <td>
                        <span className={`badge badge-${badgeClass}`} style={{ 
                          background: q.isPaid ? '#28a745' : isOld ? '#feebc8' : undefined, 
                          color: q.isPaid ? 'white' : isOld ? '#9c4221' : undefined 
                        }}>
                          {statusText} {isOld ? '(Vencida)' : ''}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <DeleteQuotationButton id={q.id} folio={q.folio} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
