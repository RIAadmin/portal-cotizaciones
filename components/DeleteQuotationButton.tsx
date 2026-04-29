'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  id: number;
  folio: string;
}

export default function DeleteQuotationButton({ id, folio }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`¿Estás seguro de eliminar permanentemente la cotización ${folio}? Esta acción no se puede deshacer.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/cotizaciones/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert('Error al eliminar la cotización');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={loading}
      style={{ 
        background: 'transparent', 
        border: 'none', 
        color: 'var(--error)', 
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '8px',
        transition: 'background 0.2s'
      }}
      title="Eliminar permanentemente"
      onMouseOver={(e) => e.currentTarget.style.background = '#fff5f5'}
      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <Trash2 size={18} />
    </button>
  );
}
