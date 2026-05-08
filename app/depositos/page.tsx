'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Landmark, TrendingUp, Download, Calendar, Search, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import * as XLSX from 'xlsx';

export default function DepositosPage() {
  const [data, setData] = useState<{ payments: any[], chartData: any[] }>({ payments: [], chartData: [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/depositos')
      .then(res => res.json())
      .then(d => {
        if (d.payments) setData(d);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  const exportToExcel = () => {
    const reportData = data.payments.map(p => ({
      'Fecha': new Date(p.date).toLocaleDateString('es-MX'),
      'Folio': p.quotation.folio,
      'Cliente': p.quotation.client.company,
      'Concepto': p.note || 'Pago de servicios',
      'Monto': Number(p.amount)
    }));

    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Depositos");
    XLSX.writeFile(wb, `Reporte_Depositos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredPayments = data.payments.filter(p => 
    p.quotation.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.quotation.client.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentMonthTotal = data.payments
    .filter(p => new Date(p.date).getMonth() === new Date().getMonth())
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', color: 'var(--primary)', fontWeight: '800', margin: 0 }}>
              Control de Ingresos
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: '5px 0 0 0' }}>Monitoreo financiero y auditoría de depósitos</p>
          </div>
          <button onClick={exportToExcel} className="btn btn-primary" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Download size={20} />
            Exportar Excel
          </button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', marginBottom: '32px' }}>
          {/* Main Chart */}
          <section className="card" style={{ padding: '24px', minHeight: '350px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                <TrendingUp size={20} color="var(--primary)" />
                Histórico de Depósitos Mensuales
              </h3>
            </div>
            <div style={{ width: '100%', height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [formatCurrency(value), 'Ingreso']}
                  />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                    {data.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === data.chartData.length - 1 ? 'var(--primary)' : '#cbd5e1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Quick Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card" style={{ padding: '24px', background: 'var(--primary)', color: 'white' }}>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', fontWeight: '500' }}>Ingresos este mes</p>
              <h2 style={{ fontSize: '2rem', margin: '10px 0', fontWeight: '800' }}>{formatCurrency(currentMonthTotal)}</h2>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: '70%', height: '100%', background: 'white' }}></div>
              </div>
            </div>
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#e6f0ff', padding: '10px', borderRadius: '10px', color: 'var(--primary)' }}>
                  <Landmark size={24} />
                </div>
                <div>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600' }}>Total Depósitos</p>
                  <p style={{ margin: 0, fontWeight: '700', fontSize: '1.1rem' }}>{data.payments.length} Registros</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <section className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Historial Detallado</h3>
            <div style={{ position: 'relative', width: '300px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text"
                placeholder="Buscar por folio o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '40px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}
              />
            </div>
          </div>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Folio</th>
                <th>Cliente</th>
                <th>Concepto</th>
                <th style={{ textAlign: 'right' }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>Cargando depósitos...</td></tr>
              ) : filteredPayments.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No se encontraron depósitos.</td></tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: '500' }}>{new Date(p.date).toLocaleDateString('es-MX')}</td>
                    <td><span style={{ color: 'var(--primary)', fontWeight: '700' }}>{p.quotation.folio}</span></td>
                    <td style={{ fontWeight: '600' }}>{p.quotation.client.company}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{p.note || 'Pago registrado'}</td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: '#059669' }}>{formatCurrency(Number(p.amount))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
