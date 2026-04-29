'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { Upload, Save, CheckCircle2, Zap, FileText } from 'lucide-react';

export default function NewQuotationPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState('');
  const [description, setDescription] = useState('');
  const [total, setTotal] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isFastTrack, setIsFastTrack] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/clientes')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setClients(data);
      })
      .catch(err => console.error("Error fetching clients:", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return alert("Por favor selecciona un cliente");
    if (!isFastTrack && !file) return alert("Por favor sube el PDF de la cotización o usa el modo 'Ir directo a OC'");
    
    setLoading(true);

    const formData = new FormData();
    formData.append('clientId', clientId);
    formData.append('description', description);
    formData.append('total', total);
    if (file) formData.append('file', file);
    if (isFastTrack) formData.append('status', 'OC_UPLOADED');

    try {
      const res = await fetch('/api/cotizaciones', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 2000);
      } else {
        const errData = await res.json();
        alert(errData.message || "Error al crear la cotización");
      }
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error de conexión");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--background)' }}>
        <div className="card" style={{ textAlign: 'center', padding: '50px' }}>
          <CheckCircle2 size={80} color="var(--success)" style={{ marginBottom: '20px' }} />
          <h2 style={{ color: 'var(--primary)', marginBottom: '10px' }}>¡Registro Exitoso!</h2>
          <p style={{ color: 'var(--text-muted)' }}>{isFastTrack ? 'Proyecto creado directo para OC.' : 'Cotización guardada.'} Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <h1 style={{ marginBottom: '32px', color: 'var(--primary)' }}>Nueva Cotización / Registro</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px' }}>
          <div className="card">
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Seleccionar Empresa</label>
                <select 
                  value={clientId} 
                  onChange={(e) => setClientId(e.target.value)} 
                  required
                >
                  <option value="">Seleccione una empresa</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.company}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Descripción breve del servicio</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  rows={3}
                  placeholder="Ej: Aplicación de pintura epóxica en bodega..."
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Monto Estimado</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={total} 
                  onChange={(e) => setTotal(e.target.value)} 
                  placeholder="0.00"
                />
              </div>

              {!isFastTrack && (
                <div style={{ marginBottom: '30px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Subir PDF de Cotización</label>
                  <div style={{ border: '2px dashed var(--border)', padding: '30px', borderRadius: 'var(--radius)', textAlign: 'center', background: '#fcfcfc' }}>
                    <input 
                      type="file" 
                      accept=".pdf" 
                      onChange={(e) => setFile(e.target.files?.[0] || null)} 
                      id="file-upload"
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                      <Upload size={40} style={{ color: 'var(--primary)', marginBottom: '10px' }} />
                      <p style={{ fontWeight: '500' }}>{file ? file.name : 'Haz clic para seleccionar el archivo PDF'}</p>
                    </label>
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '15px' }} disabled={loading}>
                {isFastTrack ? <Zap size={22} /> : <Save size={22} />}
                {loading ? 'Procesando...' : (isFastTrack ? 'Registrar Proyecto con OC' : 'Guardar Cotización')}
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className={`card ${isFastTrack ? 'border-primary' : ''}`} style={{ transition: 'all 0.3s ease', cursor: 'pointer', border: isFastTrack ? '2px solid var(--primary)' : '2px solid transparent' }} onClick={() => setIsFastTrack(!isFastTrack)}>
               <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                  <div style={{ background: isFastTrack ? 'var(--primary)' : 'var(--secondary)', color: isFastTrack ? 'white' : 'var(--primary)', padding: '10px', borderRadius: '12px' }}>
                    <Zap size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', marginBottom: '4px' }}>¿Ya tienes la OC?</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Activa esta opción para omitir el PDF de cotización e ir directo a subir la Orden de Compra.</p>
                  </div>
               </div>
               <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <input type="checkbox" checked={isFastTrack} onChange={() => {}} style={{ width: '18px', height: '18px' }} />
                 <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Ir directo a OC</span>
               </div>
            </div>

            <div className="card" style={{ background: 'var(--secondary)', color: 'var(--primary)', fontSize: '0.85rem' }}>
              <p><strong>Info:</strong> El modo normal crea la cotización como "Pendiente". El modo rápido la crea como "Con OC" para que puedas subir la factura de inmediato.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
