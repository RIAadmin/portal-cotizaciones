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
          await fetch(`/api/cotizaciones/upload`, { method: 'POST', body: pdfData });
        }

        // 3. Upload XML if exists
        if (xmlFile) {
          const xmlData = new FormData();
          xmlData.append('file', xmlFile);
          xmlData.append('type', 'INVOICE_XML');
          xmlData.append('invoiceId', invoice.id.toString());
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
      {/* 1. Header Summary */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)', 
        color: 'white',
        padding: '30px',
        borderRadius: '20px',
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr 1fr', 
        gap: '20px',
        textAlign: 'center'
      }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7, fontWeight: '700' }}>TOTAL PROYECTO</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '1.8rem', fontWeight: '900' }}>{formatCurrency(projectTotal)}</p>
        </div>
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7, fontWeight: '700' }}>TOTAL PAGADO</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '1.8rem', fontWeight: '900', color: '#4ade80' }}>{formatCurrency(grandTotalPaid)}</p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7, fontWeight: '700' }}>RESTANTE</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '1.8rem', fontWeight: '900', color: '#f87171' }}>{formatCurrency(remainingProject)}</p>
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

              <div style={{ padding: '30px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
                {/* PDF/XML Display */}
                <div>
                  <h4 style={{ margin: '0 0 15px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>ARCHIVOS</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {inv.files.find(f => f.type === 'INVOICE_PDF') ? (
                      <a href={`/api/files/${inv.files.find(f => f.type === 'INVOICE_PDF')?.id}`} target="_blank" className="btn btn-outline" style={{ justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        Ver PDF <Eye size={18} />
                      </a>
                    ) : <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Sin PDF</p>}
                    
                    {inv.files.find(f => f.type === 'INVOICE_XML') ? (
                      <a href={`/api/files/${inv.files.find(f => f.type === 'INVOICE_XML')?.id}`} target="_blank" className="btn btn-outline" style={{ justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        Ver XML <Eye size={18} />
                      </a>
                    ) : <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Sin XML</p>}
                  </div>
                </div>

                {/* Payment Manager */}
                <div>
                  <h4 style={{ margin: '0 0 15px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>GESTIÓN DE PAGOS</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', marginBottom: '15px' }}>
                    <div style={{ position: 'relative' }}>
                      <DollarSign size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input 
                        type="number" 
                        value={paymentAmount[inv.id] || ''} 
                        onChange={e => setPaymentAmount({ ...paymentAmount, [inv.id]: e.target.value })} 
                        placeholder="Monto" 
                        style={{ paddingLeft: '32px' }}
                      />
                    </div>
                    <input type="date" value={paymentDate[inv.id] || new Date().toISOString().split('T')[0]} onChange={e => setPaymentDate({ ...paymentDate, [inv.id]: e.target.value })} />
                    <button onClick={() => handleAddPayment(inv.id)} className="btn btn-primary" style={{ background: 'var(--primary)' }}>Abonar</button>
                  </div>
                  
                  {!isFullyPaid && (
                    <button onClick={() => handleLiquidation(inv.id, pending)} className="btn btn-primary" style={{ width: '100%', background: '#10b981', border: 'none', marginBottom: '20px' }}>
                      Liquidar Total: {formatCurrency(pending)}
                    </button>
                  )}

                  <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '15px' }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>HISTORIAL</span>
                      <span style={{ color: pending > 0 ? '#ef4444' : '#10b981' }}>PENDIENTE: {formatCurrency(pending)}</span>
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {inv.payments.map(p => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: '800', color: '#059669' }}>{formatCurrency(Number(p.amount))}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{new Date(p.date).toLocaleDateString('es-MX')}</span>
                        </div>
                      ))}
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
});
}
