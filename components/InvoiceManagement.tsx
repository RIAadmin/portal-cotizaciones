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
  const [newInvoiceAmount, setNewInvoiceAmount] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<Record<number, string>>({});
  const [paymentDate, setPaymentDate] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const totalPaidInvoices = invoices.reduce((sum, inv) => {
    return sum + inv.payments.reduce((s, p) => s + Number(p.amount), 0);
  }, 0);
  const totalGeneralPaid = generalPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const grandTotalPaid = totalPaidInvoices + totalGeneralPaid;
  const remainingProject = projectTotal - grandTotalPaid;

  const handleAddInvoice = async () => {
    if (!newInvoiceAmount) return alert("Ingresa el monto de la factura");
    setLoading(true);
    try {
      const res = await fetch(`/api/cotizaciones/${quotationId}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          number: `Factura ${invoices.length + 1}`, 
          amount: parseFloat(newInvoiceAmount),
          date: new Date().toISOString()
        }),
      });
      if (res.ok) {
        setShowAddInvoice(false);
        setNewInvoiceAmount('');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (invoiceId: number) => {
    const amount = paymentAmount[invoiceId];
    const date = paymentDate[invoiceId] || new Date().toISOString().split('T')[0];
    if (!amount) return alert("Ingresa un monto");
    
    setLoading(true);
    try {
      const res = await fetch(`/api/cotizaciones/${quotationId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: parseFloat(amount),
          date: date + 'T12:00:00',
          invoiceId
        }),
      });
      if (res.ok) {
        setPaymentAmount({ ...paymentAmount, [invoiceId]: '' });
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLiquidation = async (invoiceId: number, pendingAmount: number) => {
    if (!confirm(`¿Confirmar liquidación total de esta factura por ${formatCurrency(pendingAmount)}?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cotizaciones/${quotationId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: pendingAmount,
          date: new Date().toISOString().split('T')[0] + 'T12:00:00',
          invoiceId
        }),
      });
      if (res.ok) router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvoice = async (id: number) => {
    if (!confirm("¿Eliminar esta factura y todos sus registros de pago?")) return;
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
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', 
        color: 'white',
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: '20px',
        padding: '24px'
      }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.8, fontWeight: '700' }}>MONTO DEL PROYECTO</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '1.5rem', fontWeight: '800' }}>{formatCurrency(projectTotal)}</p>
        </div>
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '20px' }}>
          <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.8, fontWeight: '700' }}>TOTAL FACTURADO</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '1.5rem', fontWeight: '800', color: '#818cf8' }}>{formatCurrency(totalInvoiced)}</p>
        </div>
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '20px' }}>
          <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.8, fontWeight: '700' }}>TOTAL PAGADO</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '1.5rem', fontWeight: '800', color: '#4ade80' }}>{formatCurrency(grandTotalPaid)}</p>
        </div>
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '20px' }}>
          <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.8, fontWeight: '700' }}>SALDO RESTANTE</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '1.5rem', fontWeight: '800', color: '#f87171' }}>{formatCurrency(remainingProject)}</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={22} color="var(--primary)" /> Facturas del Proyecto
        </h2>
        <button 
          onClick={() => setShowAddInvoice(!showAddInvoice)} 
          className="btn btn-primary"
          style={{ padding: '10px 20px' }}
        >
          <Plus size={18} /> Agregar Nueva Factura
        </button>
      </div>

      {showAddInvoice && (
        <div className="card" style={{ background: '#f1f5f9', border: '2px dashed #cbd5e1' }}>
          <p style={{ margin: '0 0 15px 0', fontWeight: '700', fontSize: '0.9rem' }}>REGISTRAR MONTO DE NUEVA FACTURA</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <DollarSign size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                type="number" 
                value={newInvoiceAmount} 
                onChange={e => setNewInvoiceAmount(e.target.value)} 
                placeholder="Monto de la factura" 
                style={{ paddingLeft: '40px', fontSize: '1.1rem' }}
              />
            </div>
            <button onClick={handleAddInvoice} className="btn btn-primary" disabled={loading} style={{ padding: '0 30px' }}>Crear Factura</button>
            <button onClick={() => setShowAddInvoice(false)} className="btn btn-outline" style={{ background: 'white' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        {invoices.map((inv, index) => {
          const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
          const pending = Number(inv.amount) - paid;
          const isFullyPaid = pending <= 0;

          return (
            <div key={inv.id} className="card" style={{ 
              padding: 0, 
              overflow: 'hidden', 
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' 
            }}>
              {/* Invoice Header */}
              <div style={{ 
                padding: '20px 25px', 
                background: '#f8fafc', 
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    Factura #{index + 1} - {formatCurrency(Number(inv.amount))}
                    {isFullyPaid && <CheckCircle size={18} color="#10b981" />}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Creada el {new Date(inv.createdAt).toLocaleDateString('es-MX')}</span>
                </div>
                <button 
                  onClick={() => handleDeleteInvoice(inv.id)} 
                  style={{ color: '#ef4444', background: '#fee2e2', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: '600' }}
                >
                  <Trash2 size={16} /> Eliminar Factura
                </button>
              </div>

              <div style={{ padding: '25px', display: 'grid', gridTemplateColumns: '300px 1fr', gap: '40px' }}>
                {/* Left: Files and Quick Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>ARCHIVOS ADJUNTOS</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                      {inv.files.find(f => f.type === 'INVOICE_PDF') ? (
                        <div style={{ padding: '10px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>PDF Factura</span>
                          <a href={`/api/files/${inv.files.find(f => f.type === 'INVOICE_PDF')?.id}`} target="_blank" style={{ color: 'var(--primary)' }}><Eye size={20} /></a>
                        </div>
                      ) : (
                        <DocumentUploader quotationId={quotationId} invoiceId={inv.id} type="INVOICE_PDF" label="Subir PDF" />
                      )}
                      {inv.files.find(f => f.type === 'INVOICE_XML') ? (
                        <div style={{ padding: '10px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>XML Factura</span>
                          <a href={`/api/files/${inv.files.find(f => f.type === 'INVOICE_XML')?.id}`} target="_blank" style={{ color: 'var(--primary)' }}><Eye size={20} /></a>
                        </div>
                      ) : (
                        <DocumentUploader quotationId={quotationId} invoiceId={inv.id} type="INVOICE_XML" label="Subir XML" accept=".xml" />
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                    <button 
                      onClick={() => handleLiquidation(inv.id, pending)}
                      className="btn btn-primary" 
                      style={{ width: '100%', background: isFullyPaid ? '#94a3b8' : '#22c55e', border: 'none' }}
                      disabled={isFullyPaid || loading}
                    >
                      <CheckCircle size={18} /> {isFullyPaid ? 'Liquidada' : 'Liquidar Factura'}
                    </button>
                  </div>
                </div>

                {/* Right: Payment Management (Like Normal Mode) */}
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', marginBottom: '25px' }}>
                    <div style={{ position: 'relative' }}>
                      <DollarSign size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input 
                        type="number" 
                        value={paymentAmount[inv.id] || ''} 
                        onChange={e => setPaymentAmount({ ...paymentAmount, [inv.id]: e.target.value })} 
                        placeholder="Monto abono" 
                        style={{ paddingLeft: '35px' }}
                        disabled={isFullyPaid}
                      />
                    </div>
                    <input 
                      type="date" 
                      value={paymentDate[inv.id] || new Date().toISOString().split('T')[0]} 
                      onChange={e => setPaymentDate({ ...paymentDate, [inv.id]: e.target.value })} 
                      disabled={isFullyPaid}
                    />
                    <button 
                      onClick={() => handleAddPayment(inv.id)} 
                      className="btn btn-outline" 
                      style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
                      disabled={isFullyPaid || loading}
                    >
                      Registrar Abono
                    </button>
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>HISTORIAL DE ESTA FACTURA</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>PENDIENTE: <span style={{ color: pending > 0 ? '#ef4444' : '#10b981' }}>{formatCurrency(pending)}</span></span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                      {inv.payments.length === 0 ? (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>Sin pagos aún</p>
                      ) : (
                        inv.payments.map(p => (
                          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '10px 15px', borderRadius: '8px' }}>
                            <span style={{ fontWeight: '700', color: '#059669' }}>{formatCurrency(Number(p.amount))}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(p.date).toLocaleDateString('es-MX')}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {generalPayments.length > 0 && (
        <div className="card" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', fontWeight: '700', color: '#92400e' }}>PAGOS GENERALES (SIN FACTURA ASIGNADA)</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            {generalPayments.map(p => (
              <div key={p.id} style={{ background: 'white', padding: '8px 15px', borderRadius: '8px', border: '1px solid #fef3c7' }}>
                <span style={{ fontWeight: '700' }}>{formatCurrency(Number(p.amount))}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '10px' }}>{new Date(p.date).toLocaleDateString('es-MX')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
