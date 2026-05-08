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
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [xmlFile, setXmlFile] = useState<File | null>(null);
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
      // 1. Create Invoice
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
        const invoice = await res.json();
        
        // 2. Upload PDF if exists
        if (pdfFile) {
          const pdfData = new FormData();
          pdfData.append('file', pdfFile);
          pdfData.append('type', 'INVOICE_PDF');
          pdfData.append('invoiceId', invoice.id.toString());
          pdfData.append('quotationId', quotationId.toString()); // FIX: Added quotationId
          await fetch(`/api/cotizaciones/upload`, { method: 'POST', body: pdfData });
        }

        // 3. Upload XML if exists
        if (xmlFile) {
          const xmlData = new FormData();
          xmlData.append('file', xmlFile);
          xmlData.append('type', 'INVOICE_XML');
          xmlData.append('invoiceId', invoice.id.toString());
          xmlData.append('quotationId', quotationId.toString()); // FIX: Added quotationId
          await fetch(`/api/cotizaciones/upload`, { method: 'POST', body: xmlData });
        }

        setShowAddInvoice(false);
        setNewInvoiceAmount('');
        setPdfFile(null);
        setXmlFile(null);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      alert("Error al crear factura");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (invoiceId: number) => {
    const amount = paymentAmount[invoiceId];
    const date = paymentDate[invoiceId] || new Date().toISOString().split('T')[0];
    if (!amount) return alert("Ingresa un monto");

    // CONFIRMATION DIALOG LIKE NORMAL MODE
    if (!confirm(`¿Confirmas que el depósito por ${formatCurrency(parseFloat(amount))} ya se realizó?`)) return;
    
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
        alert("¡Abono registrado correctamente!");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      alert("Error al registrar abono");
    } finally {
      setLoading(false);
    }
  };

  const handleLiquidation = async (invoiceId: number, pendingAmount: number) => {
    const date = paymentDate[invoiceId] || new Date().toISOString().split('T')[0];
    
    if (!confirm(`¿Confirmas que ya se realizó el depósito para la liquidación total por ${formatCurrency(pendingAmount)}?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/cotizaciones/${quotationId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: pendingAmount,
          date: date + 'T12:00:00',
          invoiceId
        }),
      });
      if (res.ok) {
        alert("¡Factura liquidada correctamente!");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      alert("Error al liquidar factura");
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
      {/* 1. Vertical Header Summary */}
      <div className="card" style={{ 
        background: '#0f172a', 
        color: 'white',
        padding: '25px',
        borderRadius: '18px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: '0.85rem', opacity: 0.7, fontWeight: '700' }}>TOTAL PROYECTO</span>
          <span style={{ fontSize: '1.4rem', fontWeight: '900' }}>{formatCurrency(projectTotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: '0.85rem', opacity: 0.7, fontWeight: '700' }}>TOTAL PAGADO</span>
          <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#4ade80' }}>{formatCurrency(grandTotalPaid)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
          <span style={{ fontSize: '0.85rem', opacity: 0.7, fontWeight: '700' }}>SALDO RESTANTE</span>
          <span style={{ fontSize: '1.6rem', fontWeight: '900', color: '#f87171' }}>{formatCurrency(remainingProject)}</span>
        </div>
      </div>

      {/* 2. Add Invoice Button/Form */}
      <div style={{ position: 'relative' }}>
        {!showAddInvoice ? (
          <button 
            onClick={() => setShowAddInvoice(true)} 
            className="btn btn-primary"
            style={{ width: '100%', padding: '20px', fontSize: '1.2rem', borderRadius: '15px' }}
          >
            <Plus size={24} /> AGREGAR NUEVA FACTURA
          </button>
        ) : (
          <div className="card" style={{ border: '2px solid var(--primary)', background: '#f8fafc' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', color: 'var(--primary)' }}>Nueva Factura y Archivos</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.85rem' }}>MONTO DE LA FACTURA</label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input 
                    type="number" 
                    value={newInvoiceAmount} 
                    onChange={e => setNewInvoiceAmount(e.target.value)} 
                    placeholder="0.00" 
                    style={{ paddingLeft: '40px', fontSize: '1.2rem', fontWeight: '700' }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.85rem' }}>SUBIR PDF</label>
                  <input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} style={{ fontSize: '0.8rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.85rem' }}>SUBIR XML</label>
                  <input type="file" accept=".xml" onChange={e => setXmlFile(e.target.files?.[0] || null)} style={{ fontSize: '0.8rem' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button onClick={handleAddInvoice} className="btn btn-primary" style={{ flex: 2, padding: '15px' }} disabled={loading}>
                  {loading ? 'Guardando...' : 'GUARDAR FACTURA Y ARCHIVOS'}
                </button>
                <button onClick={() => setShowAddInvoice(false)} className="btn btn-outline" style={{ flex: 1, background: 'white' }}>CANCELAR</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Invoices List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {invoices.map((inv, index) => {
          const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
          const pending = Number(inv.amount) - paid;
          const isFullyPaid = pending <= 0;

          return (
            <div key={inv.id} className="card" style={{ padding: '0', borderRadius: '20px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <div style={{ padding: '20px 30px', background: isFullyPaid ? '#ecfdf5' : '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Factura #{index + 1}</h3>
                  <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary)' }}>{formatCurrency(Number(inv.amount))}</span>
                  {isFullyPaid && <CheckCircle size={20} color="#10b981" />}
                </div>
                <button onClick={() => handleDeleteInvoice(inv.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}><Trash2 size={20} /></button>
              </div>

              <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {/* PDF/XML Display */}
                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>ARCHIVOS DE FACTURA</h4>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {inv.files.find(f => f.type === 'INVOICE_PDF') ? (
                      <a href={`/api/files/${inv.files.find(f => f.type === 'INVOICE_PDF')?.id}`} target="_blank" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', background: '#f1f5f9' }}>
                        Ver PDF <Eye size={18} style={{ marginLeft: '8px' }} />
                      </a>
                    ) : <div style={{ flex: 1, padding: '10px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', fontSize: '0.75rem', color: '#94a3b8', border: '1px dashed #e2e8f0' }}>Sin PDF</div>}
                    
                    {inv.files.find(f => f.type === 'INVOICE_XML') ? (
                      <a href={`/api/files/${inv.files.find(f => f.type === 'INVOICE_XML')?.id}`} target="_blank" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', background: '#f1f5f9' }}>
                        Ver XML <Eye size={18} style={{ marginLeft: '8px' }} />
                      </a>
                    ) : <div style={{ flex: 1, padding: '10px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', fontSize: '0.75rem', color: '#94a3b8', border: '1px dashed #e2e8f0' }}>Sin XML</div>}
                  </div>
                </div>

                {/* Payment Manager */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                  <h4 style={{ margin: '0 0 15px 0', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>REGISTRAR PAGOS</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '10px' }}>
                      <div style={{ position: 'relative' }}>
                        <DollarSign size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                        <input 
                          type="number" 
                          value={paymentAmount[inv.id] || ''} 
                          onChange={e => setPaymentAmount({ ...paymentAmount, [inv.id]: e.target.value })} 
                          placeholder="Monto del abono" 
                          style={{ paddingLeft: '40px', fontSize: '1.1rem', height: '50px' }}
                          disabled={isFullyPaid}
                        />
                      </div>
                      <input 
                        type="date" 
                        value={paymentDate[inv.id] || new Date().toISOString().split('T')[0]} 
                        onChange={e => setPaymentDate({ ...paymentDate, [inv.id]: e.target.value })} 
                        style={{ height: '50px' }}
                        disabled={isFullyPaid}
                      />
                    </div>
                    
                    <button 
                      onClick={() => handleAddPayment(inv.id)} 
                      className="btn btn-primary" 
                      style={{ width: '100%', padding: '15px', fontSize: '1rem', fontWeight: '700' }}
                      disabled={isFullyPaid || loading}
                    >
                      <Plus size={20} /> REGISTRAR ABONO / ANTICIPO
                    </button>

                    {!isFullyPaid && (
                      <button 
                        onClick={() => handleLiquidation(inv.id, pending)} 
                        className="btn btn-primary" 
                        style={{ width: '100%', background: '#10b981', border: 'none', padding: '15px', fontSize: '1rem', fontWeight: '700' }}
                        disabled={loading}
                      >
                        <CheckCircle size={20} /> LIQUIDACIÓN TOTAL ({formatCurrency(pending)})
                      </button>
                    )}
                  </div>

                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '15px', marginTop: '20px' }}>
                    <p style={{ margin: '0 0 12px 0', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>HISTORIAL DE PAGOS</span>
                      <span style={{ color: pending > 0 ? '#ef4444' : '#10b981' }}>PENDIENTE: {formatCurrency(pending)}</span>
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {inv.payments.length === 0 ? (
                        <p style={{ margin: 0, padding: '10px', textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>No hay pagos registrados aún</p>
                      ) : (
                        inv.payments.map(p => (
                          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'white', padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
                            <span style={{ fontWeight: '800', color: '#059669' }}>{formatCurrency(Number(p.amount))}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{new Date(p.date).toLocaleDateString('es-MX')}</span>
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
    </div>
  );
}
