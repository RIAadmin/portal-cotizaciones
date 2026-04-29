'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';

interface Props {
  quotationId: number;
  type: 'OC' | 'INVOICE_PDF' | 'INVOICE_XML';
  label: string;
  accept?: string;
  disabled?: boolean;
}

export default function DocumentUploader({ quotationId, type, label, accept = ".pdf", disabled = false }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (disabled) return null;

  const handleUpload = async (file: File) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('quotationId', quotationId.toString());
    formData.append('type', type);

    try {
      const res = await fetch('/api/cotizaciones/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNoOC = async () => {
    if (!confirm('¿Confirmar que no se generó Orden de Compra para esta cotización?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/cotizaciones/no-oc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotationId }),
      });
      if (res.ok) router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept={accept} 
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        id={`upload-${type}`}
        style={{ display: 'none' }}
        disabled={loading}
      />
      <label 
        htmlFor={`upload-${type}`} 
        className="btn btn-outline" 
        style={{ width: '100%', marginBottom: type === 'OC' ? '8px' : '0' }}
      >
        <Upload size={18} />
        {loading ? 'Subiendo...' : label}
      </label>
      
      {type === 'OC' && (
        <button 
          onClick={handleNoOC}
          className="btn" 
          style={{ width: '100%', fontSize: '0.75rem', color: 'var(--text-muted)' }}
          disabled={loading}
        >
          No generó OC
        </button>
      )}
    </div>
  );
}
