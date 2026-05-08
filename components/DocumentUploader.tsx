'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Check } from 'lucide-react';

interface Props {
  quotationId: number;
  invoiceId?: number;
  type: 'QUOTATION' | 'OC' | 'INVOICE_PDF' | 'INVOICE_XML';
  label: string;
  accept?: string;
  disabled?: boolean;
}

export default function DocumentUploader({ quotationId, invoiceId, type, label, accept = ".pdf", disabled = false }: Props) {
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  if (disabled) return null;

  const handleUpload = async (file: File) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('quotationId', quotationId.toString());
    if (invoiceId) formData.append('invoiceId', invoiceId.toString());
    formData.append('type', type);

    try {
      const res = await fetch('/api/cotizaciones/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      alert("Error al subir archivo");
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
      {showSuccess && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255,255,255,0.95)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            marginBottom: '15px',
          }}>
            <Check size={50} strokeWidth={3} />
          </div>
          <h3 style={{ color: '#065f46', margin: 0 }}>¡Subido con éxito!</h3>
        </div>
      )}
      <input 
        type="file" 
        accept={accept} 
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        id={`upload-${type}-${invoiceId || 'general'}`}
        style={{ display: 'none' }}
        disabled={loading}
      />
      <label 
        htmlFor={`upload-${type}-${invoiceId || 'general'}`} 
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
