'use client';

import { useState } from 'react';
import { FileText, Plus, DollarSign, Calendar, ChevronDown, ChevronUp, Trash2, CheckCircle, Clock, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DocumentUploader from './DocumentUploader';

interface Payment {
  id: number;
  amount: number;
  date: string;
  invoiceId?: number | null;
}

interface Invoice {
  id: number;
  number: string;
  amount: number;
  date: string;
  status: string;
  payments: Payment[];
  files: Array<{ id: number, type: string, filename: string }>;
}

interface Props {
  quotationId: number;
  projectTotal: number;
  initialInvoices: Invoice[];
  generalPayments: Payment[];
}

export default function InvoiceManagement({ quotationId, projectTotal, initialInvoices, generalPayments }: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ number: '', amount: '', date: new Date().toISOString().split('T')[0] });
  const [expandedInvoice, setExpandedInvoice] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const totalPaidInvoices = invoices.reduce((sum, inv) => {
    const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
    return sum + paid;
  }, 0);
  const totalGeneralPaid = generalPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const grandTotalPaid = totalPaidInvoices + totalGeneralPaid;

  const handleAddInvoice = async () => {
    if (!newInvoice.number || !newInvoice.amount) return alert("Completa los datos de la factura");
    setLoading(true);
    try {
      const res = await fetch(`/api/cotizaciones/${quotationId}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvoice),
      });
      if (res.ok) {
        setShowAddInvoice(false);
        setNewInvoice({ number: '', amount: '', date: new Date().toISOString().split('T')[0] });
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (invoiceId: number) => {
    if (!paymentAmount) return alert("Ingresa un monto");
    setLoading(true);
    try {
      const res = await fetch(`/api/cotizaciones/${quotationId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: parseFloat(paymentAmount),
          date: paymentDate + 'T12:00:00',
          invoiceId
        }),
      });
      if (res.ok) {
        setPaymentAmount('');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvoice = async (id: number) => {
    if (!confirm("¿Eliminar factura y sus pagos?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      if (res.ok) router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Project Summary Card */}
      <div className="card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>TOTAL PROYECTO</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary)' }}>{formatCurrency(projectTotal)}</p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>TOTAL FACTURADO</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '1.4rem', fontWeight: '800', color: '#6366f1' }}>{formatCurrency(totalInvoiced)}</p>
          <p style={{ margin: 0, fontSize: '0.7rem', color: totalInvoiced > projectTotal ? '#ef4444' : '#10b981' }}>
            {totalInvoiced > projectTotal ? 'Excede presupuesto' : `${formatCurrency(projectTotal - totalInvoiced)} por facturar`}
          </p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>TOTAL PAGADO</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '1.4rem', fontWeight: '800', color: '#10b981' }}>{formatCurrency(grandTotalPaid)}</p>
          <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>Saldo Pendiente: {formatCurrency(projectTotal - grandTotalPaid)}</p>
        </div>
      </div>

      {/* Invoices List */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <FileText size={20} color="var(--primary)" /> Control de Facturación
          </h3>
          <button onClick={() => setShowAddInvoice(!showAddInvoice)} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            <Plus size={16} /> Nueva Factura
          </button>
        </div>

        {showAddInvoice && (
          <div style={{ background: '#f1f5f9', padding: '20px', borderRadius: '12px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '5px' }}>NÚMERO DE FACTURA</label>
              <input type="text" value={newInvoice.number} onChange={e => setNewInvoice({...newInvoice, number: e.target.value})} placeholder="Ej. F-123" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '5px' }}>MONTO TOTAL</label>
              <input type="number" value={newInvoice.amount} onChange={e => setNewInvoice({...newInvoice, amount: e.target.value})} placeholder="0.00" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '5px' }}>FECHA</label>
              <input type="date" value={newInvoice.date} onChange={e => setNewInvoice({...newInvoice, date: e.target.value})} />
            </div>
            <button onClick={handleAddInvoice} className="btn btn-primary" disabled={loading}>Guardar</button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {invoices.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No hay facturas registradas en este proyecto.</p>
          ) : (
            invoices.map(inv => {
              const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
              const pending = Number(inv.amount) - paid;
              const isFullyPaid = pending <= 0;

              return (
                <div key={inv.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ 
                    padding: '16px', 
                    background: expandedInvoice === inv.id ? '#f8fafc' : 'white',
                    display: 'grid', 
                    gridTemplateColumns: '1fr 150px 150px 150px auto', 
                    alignItems: 'center', 
                    gap: '20px' 
                  }}>
                    <div>
                      <span style={{ fontWeight: '800', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Factura {inv.number}
                        {isFullyPaid ? <CheckCircle size={16} color="#10b981" /> : <Clock size={16} color="#f59e0b" />}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Emitida el {new Date(inv.date).toLocaleDateString('es-MX')}</span>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>MONTO</p>
                      <p style={{ margin: 0, fontWeight: '700' }}>{formatCurrency(Number(inv.amount))}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>PAGADO</p>
                      <p style={{ margin: 0, fontWeight: '700', color: '#10b981' }}>{formatCurrency(paid)}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>PENDIENTE</p>
                      <p style={{ margin: 0, fontWeight: '800', color: pending > 0 ? '#ef4444' : '#10b981' }}>{formatCurrency(pending)}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => setExpandedInvoice(expandedInvoice === inv.id ? null : inv.id)}
                        className="btn btn-outline" 
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      >
                        {expandedInvoice === inv.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        {expandedInvoice === inv.id ? 'Cerrar' : 'Pagos'}
                      </button>
                      <button onClick={() => handleDeleteInvoice(inv.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {expandedInvoice === inv.id && (
                    <div style={{ padding: '20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                      {/* Files Section */}
                      <div style={{ marginBottom: '24px' }}>
                        <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>DOCUMENTOS DE ESTA FACTURA</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                          <div>
                            {inv.files.find(f => f.type === 'INVOICE_PDF') ? (
                              <div style={{ padding: '10px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.85rem' }}>PDF: {inv.files.find(f => f.type === 'INVOICE_PDF')?.filename}</span>
                                <a href={`/api/files/${inv.files.find(f => f.type === 'INVOICE_PDF')?.id}`} target="_blank" style={{ color: 'var(--primary)' }}><Eye size={18} /></a>
                              </div>
                            ) : (
                              <DocumentUploader quotationId={quotationId} invoiceId={inv.id} type="INVOICE_PDF" label="Subir PDF Factura" />
                            )}
                          </div>
                          <div>
                            {inv.files.find(f => f.type === 'INVOICE_XML') ? (
                              <div style={{ padding: '10px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.85rem' }}>XML: {inv.files.find(f => f.type === 'INVOICE_XML')?.filename}</span>
                                <a href={`/api/files/${inv.files.find(f => f.type === 'INVOICE_XML')?.id}`} target="_blank" style={{ color: 'var(--primary)' }}><Eye size={18} /></a>
                              </div>
                            ) : (
                              <DocumentUploader quotationId={quotationId} invoiceId={inv.id} type="INVOICE_XML" label="Subir XML Factura" accept=".xml" />
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ position: 'relative' }}>
                          <DollarSign size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                          <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="Monto del abono" style={{ paddingLeft: '35px' }} />
                        </div>
                        <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                        <button onClick={() => handleAddPayment(inv.id)} className="btn btn-primary" disabled={loading}>Registrar Pago</button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>HISTORIAL DE PAGOS DE ESTA FACTURA</p>
                        {inv.payments.length === 0 ? (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sin pagos registrados.</p>
                        ) : (
                          inv.payments.map(p => (
                            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'white', padding: '10px 15px', borderRadius: '8px', border: '1px solid #edf2f7' }}>
                              <span style={{ fontWeight: '700', color: '#059669' }}>{formatCurrency(Number(p.amount))}</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(p.date).toLocaleDateString('es-MX')}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* General Payments (Legacy or Non-Invoice) */}
      {generalPayments.length > 0 && (
        <div className="card" style={{ opacity: 0.8 }}>
          <h4 style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Pagos Generales (Sin Factura)</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {generalPayments.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span>{formatCurrency(Number(p.amount))}</span>
                <span style={{ color: 'var(--text-muted)' }}>{new Date(p.date).toLocaleDateString('es-MX')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
