'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, CheckCircle, Calendar, Plus, History, DollarSign } from 'lucide-react';

interface Payment {
  id: number;
  amount: number;
  date: string;
}

interface Props {
  quotationId: number;
  payments: Payment[];
  isPaid: boolean;
  initialPaidAt: string | null;
}

export default function PaymentManagement({ quotationId, payments, isPaid, initialPaidAt }: Props) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  const handleAddPayment = async () => {
    if (!amount || parseFloat(amount) <= 0) return alert("Por favor ingresa un monto válido");
    
    setLoading(true);
    try {
      const res = await fetch(`/api/cotizaciones/${quotationId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: parseFloat(amount),
          date: date + 'T12:00:00'
        }),
      });
      if (res.ok) {
        setAmount('');
        router.refresh();
      } else {
        alert("Error al registrar abono");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!paymentDate) return alert("Por favor selecciona una fecha");
    
    setLoading(true);
    try {
      const dateObj = new Date(paymentDate + 'T12:00:00');
      
      const res = await fetch(`/api/cotizaciones/${quotationId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isPaid: true,
          paidAt: dateObj.toISOString()
        }),
      });

      if (res.ok) {
        alert("¡Pago registrado con éxito!");
        setShowDatePicker(false);
        router.refresh();
      } else {
        const data = await res.json();
        alert(`Error: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginTop: '24px' }}>
      <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <CreditCard size={20} /> Gestión de Pagos
      </h3>
      
      {!isPaid ? (
        <>
          {/* Summary Box */}
          <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '5px' }}>TOTAL ABONADO</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)' }}>${totalPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
          </div>

          <div style={{ marginBottom: '24px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '600' }}>Registrar Nuevo Anticipo / Abono</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <DollarSign size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="number" 
                    step="0.01" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Monto"
                    style={{ paddingLeft: '30px' }}
                    disabled={loading}
                  />
                </div>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  style={{ width: '150px' }}
                  disabled={loading}
                />
              </div>
              <button onClick={handleAddPayment} className="btn btn-outline" style={{ width: '100%', borderColor: 'var(--primary)', color: 'var(--primary)' }} disabled={loading}>
                <Plus size={18} />
                Registrar Abono
              </button>
            </div>
          </div>
          
          {/* History List */}
          {payments.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
                <History size={14} /> Historial de Abonos
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {payments.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: '600' }}>${p.amount.toLocaleString('es-MX')}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{new Date(p.date).toLocaleDateString('es-MX')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {!showDatePicker ? (
            <button 
              onClick={() => setShowDatePicker(true)} 
              className="btn btn-primary" 
              style={{ width: '100%', background: '#28a745' }}
              disabled={loading}
            >
              <CheckCircle size={18} />
              Liquidación Total
            </button>
          ) : (
            <div style={{ background: '#f0fff4', padding: '20px', borderRadius: '12px', border: '1px solid #c6f6d5' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '700', color: '#22543d' }}>
                Fecha de liquidación:
              </label>
              <input 
                type="date" 
                value={paymentDate} 
                onChange={(e) => setPaymentDate(e.target.value)}
                style={{ marginBottom: '16px', width: '100%' }}
                required
                disabled={loading}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={handleMarkAsPaid} 
                  className="btn btn-primary" 
                  style={{ flex: 2, background: '#28a745' }}
                  disabled={loading}
                >
                  Confirmar Liquidación
                </button>
                <button 
                  onClick={() => setShowDatePicker(false)} 
                  className="btn btn-outline" 
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  Volver
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ padding: '20px', textAlign: 'center', background: '#d4edda', color: '#155724', borderRadius: 'var(--radius)', fontWeight: '700' }}>
          <CheckCircle size={32} style={{ marginBottom: '8px' }} />
          <p style={{ fontSize: '1.1rem' }}>LIQUIDADA / PAGADA</p>
          {initialPaidAt && (
            <p style={{ fontSize: '0.9rem', fontWeight: '400', marginTop: '5px', opacity: 0.8 }}>
              {new Date(initialPaidAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          )}
          
          {/* History even when paid */}
          <div style={{ marginTop: '15px', borderTop: '1px solid rgba(21, 87, 36, 0.2)', paddingTop: '15px' }}>
            <p style={{ fontSize: '0.75rem', marginBottom: '8px', opacity: 0.7 }}>HISTORIAL DE PAGOS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {payments.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span>${p.amount.toLocaleString('es-MX')}</span>
                    <span>{new Date(p.date).toLocaleDateString('es-MX')}</span>
                  </div>
                ))}
              </div>
          </div>
        </div>
      )}
    </div>
  );
}
