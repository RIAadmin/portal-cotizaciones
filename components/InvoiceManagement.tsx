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
  createdAt: string;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Project Financial Overview */}
      <div className="card" style={{ 
        background: '#1e293b', 
        color: 'white',
        padding: '25px',
        borderRadius: '16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '0.9rem', opacity: 0.7, letterSpacing: '1px' }}>RESUMEN FINANCIERO DEL PROYECTO</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.6 }}>MONTO TOTAL</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '1.5rem', fontWeight: '800' }}>{formatCurrency(projectTotal)}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.6 }}>FACTURADO</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '1.5rem', fontWeight: '800', color: '#818cf8' }}>{formatCurrency(totalInvoiced)}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.6 }}>PAGADO</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '1.5rem', fontWeight: '800', color: '#4ade80' }}>{formatCurrency(grandTotalPaid)}</p>
          </div>
          <div style={{ background: 'rgba(248, 113, 113, 0.1)', padding: '10px', borderRadius: '10px' }}>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#fca5a5' }}>RESTANTE</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '1.5rem', fontWeight: '800', color: '#f87171' }}>{formatCurrency(remainingProject)}</p>
          </div>
        </div>
      </div>

      {/* Add Invoice Action */}
      <div style={{ textAlign: 'center' }}>
        {!showAddInvoice ? (
          <button 
            onClick={() => setShowAddInvoice(true)} 
            className="btn btn-primary"
            style={{ padding: '15px 40px', fontSize: '1.1rem', borderRadius: '50px', boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)' }}
          >
            <Plus size={24} /> Agregar Nueva Factura al Proyecto
          </button>
        ) : (
          <div className="card" style={{ background: '#f8fafc', border: '2px solid var(--primary)', textAlign: 'left' }}>
            <h3 style={{ margin: '0 0 15px 0' }}>Nueva Factura</h3>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', fontWeight: '700' }}>MONTO DE LA FACTURA</label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input 
                    type="number" 
                    value={newInvoiceAmount} 
                    onChange={e => setNewInvoiceAmount(e.target.value)} 
                    placeholder="0.00" 
                    style={{ paddingLeft: '40px', fontSize: '1.2rem' }}
                  />
                </div>
              </div>
              <button onClick={handleAddInvoice} className="btn btn-primary" style={{ padding: '12px 30px' }} disabled={loading}>Crear y Continuar</button>
              <button onClick={() => setShowAddInvoice(false)} className="btn btn-outline" style={{ padding: '12px 20px' }}>Cancelar</button>
            </div>
            <p style={{ margin: '15px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>* Una vez creada, podrás subir el PDF/XML y registrar los pagos de esta factura.</p>
          </div>
        )}
      </div>

      {/* Invoice List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {invoices.map((inv, index) => {
          const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
          const pending = Number(inv.amount) - paid;
          const isFullyPaid = pending <= 0;

          return (
            <div key={inv.id} className="card" style={{ 
              padding: 0, 
              overflow: 'hidden', 
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              borderRadius: '16px'
            }}>
              {/* Header */}
              <div style={{ 
                padding: '20px 30px', 
                background: isFullyPaid ? '#f0fdf4' : '#f8fafc', 
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Factura #{index + 1}</h3>
                    {isFullyPaid && <span style={{ background: '#4ade80', color: 'white', padding: '2px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700' }}>PAGADA</span>}
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '1.1rem', color: 'var(--primary)', fontWeight: '700' }}>{formatCurrency(Number(inv.amount))}</p>
                </div>
                <button 
                  onClick={() => handleDeleteInvoice(inv.id)} 
                  style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}
                  title="Eliminar esta factura"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '30px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '40px' }}>
                  {/* Documents Column */}
                  <div>
                    <h4 style={{ margin: '0 0 15px 0', fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>DOCUMENTOS ADJUNTOS</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {inv.files.find(f => f.type === 'INVOICE_PDF') ? (
                        <div style={{ padding: '12px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Archivo PDF</span>
                          <a href={`/api/files/${inv.files.find(f => f.type === 'INVOICE_PDF')?.id}`} target="_blank" style={{ color: 'var(--primary)' }}><Eye size={20} /></a>
                        </div>
                      ) : (
                        <DocumentUploader quotationId={quotationId} invoiceId={inv.id} type="INVOICE_PDF" label="Subir PDF Factura" />
                      )}
                      {inv.files.find(f => f.type === 'INVOICE_XML') ? (
                        <div style={{ padding: '12px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Archivo XML</span>
                          <a href={`/api/files/${inv.files.find(f => f.type === 'INVOICE_XML')?.id}`} target="_blank" style={{ color: 'var(--primary)' }}><Eye size={20} /></a>
                        </div>
                      ) : (
                        <DocumentUploader quotationId={quotationId} invoiceId={inv.id} type="INVOICE_XML" label="Subir XML Factura" accept=".xml" />
                      )}
                    </div>
                  </div>

                  {/* Payments Column */}
                  <div style={{ borderLeft: '1px solid #f1f5f9', paddingLeft: '40px' }}>
                    <h4 style={{ margin: '0 0 15px 0', fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>CONTROL DE PAGOS</h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', marginBottom: '20px' }}>
                      <div style={{ position: 'relative' }}>
                        <DollarSign size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                          type="number" 
                          value={paymentAmount[inv.id] || ''} 
                          onChange={e => setPaymentAmount({ ...paymentAmount, [inv.id]: e.target.value })} 
                          placeholder="Monto abono" 
                          style={{ paddingLeft: '32px' }}
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
                        Abonar
                      </button>
                    </div>

                    {!isFullyPaid && (
                      <button 
                        onClick={() => handleLiquidation(inv.id, pending)}
                        className="btn btn-primary" 
                        style={{ width: '100%', background: '#22c55e', border: 'none', marginBottom: '20px' }}
                        disabled={loading}
                      >
                        <CheckCircle size={18} /> Liquidar Total de esta Factura ({formatCurrency(pending)})
                      </button>
                    )}

                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>HISTORIAL DE PAGOS</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: pending > 0 ? '#ef4444' : '#10b981' }}>
                          {isFullyPaid ? 'LIQUIDADA' : `PENDIENTE: ${formatCurrency(pending)}`}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                        {inv.payments.length === 0 ? (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, padding: '10px', textAlign: 'center' }}>No hay abonos registrados</p>
                        ) : (
                          inv.payments.map(p => (
                            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'white', padding: '8px 12px', borderRadius: '6px', border: '1px solid #edf2f7', fontSize: '0.85rem' }}>
                              <span style={{ fontWeight: '700', color: '#059669' }}>{formatCurrency(Number(p.amount))}</span>
                              <span style={{ color: 'var(--text-muted)' }}>{new Date(p.date).toLocaleDateString('es-MX')}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* General Payments (Old ones) */}
      {generalPayments.length > 0 && (
        <div className="card" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', fontWeight: '700', color: '#92400e' }}>PAGOS GENERALES (SIN FACTURA)</p>
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
