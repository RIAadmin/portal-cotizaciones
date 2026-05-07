'use client';

import { useState } from 'react';
import { Edit2, Save, X, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  quotationId: number;
  initialTotal: number;
}

export default function EditableAmount({ quotationId, initialTotal }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [total, setTotal] = useState(initialTotal.toString());
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cotizaciones/${quotationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total: parseFloat(total) }),
      });

      if (res.ok) {
        setIsEditing(false);
        router.refresh();
      } else {
        alert("Error al actualizar el monto");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ position: 'relative' }}>
          <DollarSign size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="number" 
            value={total} 
            onChange={(e) => setTotal(e.target.value)}
            style={{ paddingLeft: '30px', width: '150px', height: '38px' }}
            autoFocus
          />
        </div>
        <button onClick={handleSave} className="btn btn-primary" style={{ padding: '8px 12px' }} disabled={loading}>
          <Save size={18} />
        </button>
        <button onClick={() => setIsEditing(false)} className="btn btn-outline" style={{ padding: '8px 12px' }} disabled={loading}>
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)' }}>
        ${initialTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
      </span>
      <button 
        onClick={() => setIsEditing(true)} 
        style={{ 
          background: 'none', 
          border: 'none', 
          color: 'var(--text-muted)', 
          cursor: 'pointer',
          padding: '5px',
          borderRadius: '5px',
          display: 'flex',
          alignItems: 'center'
        }}
        className="hover-bg"
        title="Editar monto"
      >
        <Edit2 size={16} />
      </button>
    </div>
  );
}
