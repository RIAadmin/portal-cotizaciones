'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, User, MessageSquare, Send, Trash2 } from 'lucide-react';

interface Props {
  quotationId: number;
  currentProgress: number;
  updates: any[];
}

export default function ProgressTracker({ quotationId, currentProgress, updates }: Props) {
  const [percentage, setPercentage] = useState(currentProgress);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/cotizaciones/${quotationId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percentage: Number(percentage), notes }),
      });

      if (res.ok) {
        setNotes('');
        router.refresh();
      } else {
        alert("Error al actualizar el avance");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (updateId: number) => {
    if (!confirm("¿Estás seguro de eliminar esta actualización? El porcentaje de avance del proyecto se ajustará al estado anterior.")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/progress/${updateId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("Error al eliminar la actualización");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Update Form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '32px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr auto', gap: '20px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '600' }}>% de Avance</label>
            <input 
              type="number" 
              min="0" 
              max="100" 
              value={percentage} 
              onChange={(e) => setPercentage(Number(e.target.value))} 
              required
              disabled={loading}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '600' }}>Notas de avance</label>
            <input 
              type="text" 
              placeholder="Ej. Se terminó la aplicación de la primera capa..." 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Send size={18} />
            {loading ? '...' : 'Actualizar'}
          </button>
        </div>
      </form>

      {/* History Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {updates.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No hay actualizaciones de avance todavía.</p>
        ) : (
          updates.map((update, idx) => (
            <div key={update.id} style={{ 
              display: 'flex', 
              gap: '15px', 
              position: 'relative',
              paddingLeft: '20px'
            }}>
              {/* Timeline line */}
              {idx !== updates.length - 1 && (
                <div style={{ 
                  position: 'absolute', 
                  left: '6px', 
                  top: '25px', 
                  bottom: '-25px', 
                  width: '2px', 
                  background: '#e2e8f0' 
                }}></div>
              )}
              
              {/* Timeline Dot */}
              <div style={{ 
                width: '14px', 
                height: '14px', 
                borderRadius: '50%', 
                background: update.percentage < 50 ? '#dc3545' : update.percentage < 100 ? '#ffc107' : '#28a745', 
                marginTop: '6px',
                flexShrink: 0,
                zIndex: 1
              }}></div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ 
                    fontWeight: '700', 
                    fontSize: '1.1rem', 
                    color: update.percentage < 50 ? '#dc3545' : update.percentage < 100 ? '#d97706' : '#28a745' 
                  }}>{update.percentage}% Avance</span>
                  <div style={{ display: 'flex', gap: '15px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} />
                      {new Date(update.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={14} />
                      {update.user?.name || 'Usuario'}
                    </span>
                    <button 
                      onClick={() => handleDelete(update.id)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#dc3545', 
                        cursor: 'pointer', 
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        opacity: loading ? 0.5 : 1
                      }}
                      title="Eliminar avance"
                      disabled={loading}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {update.notes && (
                  <div style={{ background: '#f1f5f9', padding: '12px 16px', borderRadius: '8px', fontSize: '0.95rem' }}>
                    <MessageSquare size={14} style={{ display: 'inline', marginRight: '8px', opacity: 0.5 }} />
                    {update.notes}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
