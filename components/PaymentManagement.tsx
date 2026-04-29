'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, CheckCircle, Calendar, Loader2 } from 'lucide-react';

interface Props {
  quotationId: number;
  initialAdvance: number;
  isPaid: boolean;
  initialPaidAt: string | null;
}

export default function PaymentManagement({ quotationId, initialAdvance, isPaid, initialPaidAt }: Props) {
  const [advance, setAdvance] = useState(initialAdvance.toString());
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdateAdvance = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cotizaciones/${quotationId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advance: parseFloat(advance) }),
      });
      if (res.ok) router.refresh();
      else alert("Error al actualizar anticipo");
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
      // Convert date string to ISO date at noon to avoid timezone shifts
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
        alert(`Error: ${data.message}${data.error ? ' - ' + data.error : ''}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión al registrar pago");
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
          <div style={{ marginBottom: '24px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '600' }}>Anticipo Recibido ($)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="number" 
                step="0.01" 
                value={advance} 
                onChange={(e) => setAdvance(e.target.value)}
                placeholder="0.00"
                disabled={loading}
              />
              <button onClick={handleUpdateAdvance} className="btn btn-outline" disabled={loading}>
                {loading ? '...' : 'Actualizar'}
              </button>
            </div>
          </div>
          
          {!showDatePicker ? (
            <button 
              onClick={() => setShowDatePicker(true)} 
              className="btn btn-primary" 
              style={{ width: '100%', background: '#28a745' }}
              disabled={loading}
            >
              <CheckCircle size={18} />
              Marcar como Pagada Totalmente
            </button>
          ) : (
            <div style={{ background: '#f0fff4', padding: '20px', borderRadius: '12px', border: '1px solid #c6f6d5' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '700', color: '#22543d' }}>
                <Calendar size={16} style={{ display: 'inline', marginRight: '5px' }} />
                Selecciona la fecha de pago:
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
                  {loading ? 'Registrando...' : 'Confirmar Pago'}
                </button>
                <button 
                  onClick={() => setShowDatePicker(false)} 
                  className="btn btn-outline" 
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ padding: '20px', textAlign: 'center', background: '#d4edda', color: '#155724', borderRadius: 'var(--radius)', fontWeight: '700' }}>
          <CheckCircle size={32} style={{ marginBottom: '8px' }} />
          <p style={{ fontSize: '1.1rem' }}>ESTA COTIZACIÓN YA ESTÁ PAGADA</p>
          {initialPaidAt && (
            <p style={{ fontSize: '0.9rem', fontWeight: '400', marginTop: '5px', opacity: 0.8 }}>
              Liquidada el: {new Date(initialPaidAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
