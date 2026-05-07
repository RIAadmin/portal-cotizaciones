'use client';

export const dynamic = 'force-dynamic';

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
  const [filterType, setFilterType] = useState('TODOS'); // TODOS, COTIZANDO, PROCESO, PENDIENTE_PAGO, PAGADO

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
    const results = quotations.filter(q => {
      const matchesSearch = 
        q.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.description && q.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!matchesSearch) return false;

      if (filterType === 'COTIZANDO') return q.status === 'PENDING' && !q.isPaid;
      if (filterType === 'PROCESO') return (q.status === 'OC_UPLOADED' || q.status === 'ANTICIPO' || q.status === 'INVOICED') && q.progress < 100 && !q.isPaid;
      if (filterType === 'PENDIENTE_PAGO') return q.progress === 100 && !q.isPaid;
      if (filterType === 'PAGADO') return q.isPaid;

      return true;
    });
    setFilteredQuotations(results);
  }, [searchTerm, quotations, filterType]);

  const counts = {
    TODOS: quotations.length,
    COTIZANDO: quotations.filter(q => q.status === 'PENDING' && !q.isPaid).length,
    PROCESO: quotations.filter(q => (q.status === 'OC_UPLOADED' || q.status === 'ANTICIPO' || q.status === 'INVOICED') && q.progress < 100 && !q.isPaid).length,
    PENDIENTE_PAGO: quotations.filter(q => q.progress === 100 && !q.isPaid).length,
    PAGADO: quotations.filter(q => q.isPaid).length,
  };

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
        {/* Header Section with Gradient Background */}
        <div style={{ 
          background: 'linear-gradient(to right, #ffffff 0%, #ffffff 20%, #e6f0ff 100%)', 
          margin: '-40px -40px 40px -40px', 
          padding: '40px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', color: 'var(--primary)', fontWeight: '800', margin: 0, display: 'flex', flexDirection: 'column' }}>
                RECUBRIMIENTOS INDUSTRIALES
                <span style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: '500', marginTop: '5px' }}>Administración de Proyectos</span>
                {userName && (
                  <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginTop: '10px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
                    ¡Bienvenido, {userName}!
                  </div>
                )}
              </h1>
            </div>
            <Link href="/cotizaciones/nueva" className="btn btn-primary" style={{ boxShadow: '0 10px 15px -3px rgba(0, 35, 102, 0.3)', padding: '12px 24px' }}>
              <Plus size={20} />
              Nueva Cotización
            </Link>
          </header>

          {/* Stats Cards inside the gradient section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {[
              { id: 'COTIZANDO', label: 'En Cotización', count: counts.COTIZANDO, icon: <Clock size={28} />, color: '#f59e0b', gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' },
              { id: 'PROCESO', label: 'En Ejecución', count: counts.PROCESO, icon: <ShoppingCart size={28} />, color: '#3b82f6', gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)' },
              { id: 'PENDIENTE_PAGO', label: 'Pend. Pago', count: counts.PENDIENTE_PAGO, icon: <AlertTriangle size={28} />, color: '#ef4444', gradient: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)' },
              { id: 'PAGADO', label: 'Proyectos Pagados', count: counts.PAGADO, icon: <CheckCircle size={28} />, color: '#10b981', gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)' },
            ].map((stat) => (
              <div key={stat.id} className="card stat-card" style={{ 
                padding: '24px', 
                position: 'relative', 
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ 
                    background: stat.gradient, 
                    color: 'white', 
                    padding: '12px', 
                    borderRadius: '16px', 
                    display: 'flex', 
                    boxShadow: `0 8px 16px ${stat.color}44` 
                  }}>
                    {stat.icon}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h3 style={{ fontSize: '2.2rem', fontWeight: '800', margin: 0, color: 'var(--text)' }}>{stat.count}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', overflowX: 'auto', paddingBottom: '10px' }}>
          {[
            { id: 'TODOS', label: 'Todos', color: 'var(--primary)' },
            { id: 'COTIZANDO', label: 'Cotizando', color: '#b7791f' },
            { id: 'PROCESO', label: 'En Proceso', color: '#2b6cb0' },
            { id: 'PENDIENTE_PAGO', label: 'Pendiente Pago', color: '#dc3545' },
            { id: 'PAGADO', label: 'Pagados', color: '#28a745' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilterType(btn.id)}
              style={{
                padding: '10px 20px',
                borderRadius: '30px',
                border: 'none',
                background: filterType === btn.id ? btn.color : '#f1f5f9',
                color: filterType === btn.id ? 'white' : '#64748b',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                boxShadow: filterType === btn.id ? `0 4px 12px ${btn.color}44` : 'none'
              }}
            >
              {btn.label}
              <span style={{ 
                background: filterType === btn.id ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)', 
                padding: '2px 8px', 
                borderRadius: '10px',
                fontSize: '0.75rem'
              }}>
                {(counts as any)[btn.id]}
              </span>
            </button>
          ))}
        </div>

        <section className="card" style={{ padding: '24px' }}>
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
                <th>Avance</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>Cargando cotizaciones...</td></tr>
              ) : filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                    {searchTerm ? `No se encontraron resultados para "${searchTerm}"` : 'No hay cotizaciones registradas aún.'}
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((q) => {
                  let rowBg = 'transparent';
                  let statusText = q.status === 'PENDING' ? 'Pendiente' : q.status === 'OC_UPLOADED' ? 'Con OC' : q.status === 'ANTICIPO' ? 'Anticipo' : 'Facturada';
                  let badgeClass = q.status.toLowerCase().replace('_', '-');
                  const isOld = isOldPending(q);

                  if (q.progress === 100 && !q.isPaid) {
                    statusText = 'PENDIENTE DE PAGO';
                    badgeClass = 'pending-payment';
                    rowBg = '#fff5f5'; // Reddish background
                  } else if (q.isPaid) {
                    rowBg = '#e6fffa';
                    statusText = 'PAGADO';
                    badgeClass = 'finished';
                  } else if (q.status === 'ANTICIPO') {
                    rowBg = '#fffaf0';
                    badgeClass = 'warning';
                  } else if (q.status === 'OC_UPLOADED' || q.status === 'INVOICED') {
                    rowBg = '#f0f7ff';
                  } else if (isOld) {
                    rowBg = '#fff5f5';
                  }

                  return (
                    <tr key={q.id} style={{ background: rowBg }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isOld && <AlertTriangle size={16} color="#e53e3e" />}
                          <Link href={`/cotizaciones/${q.folio}`} style={{ fontWeight: '700', color: 'var(--primary)' }}>
                            {q.folio}
                          </Link>
                        </div>
                      </td>
                      <td>{new Date(q.createdAt).toLocaleDateString('es-MX')}</td>
                      <td style={{ fontWeight: '600' }}>{q.client.company}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{q.description || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', minWidth: '60px' }}>
                            <div style={{ 
                                  width: `${q.progress}%`, 
                                  height: '100%', 
                                  background: q.progress < 50 ? '#dc3545' : q.progress < 100 ? '#ffc107' : '#28a745'
                                }}></div>
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>{q.progress}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${badgeClass}`} style={{ 
                          background: q.isPaid ? '#28a745' : q.status === 'ANTICIPO' ? '#f6ad55' : isOld ? '#feb2b2' : undefined, 
                          color: q.isPaid ? 'white' : q.status === 'ANTICIPO' ? 'white' : isOld ? '#9b2c2c' : undefined 
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
