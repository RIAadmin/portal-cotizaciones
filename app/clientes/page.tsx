'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Plus, Trash2, Mail, Phone, Building2, Pencil, X, Save } from 'lucide-react';

export default function ClientesPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clientes');
      if (!res.ok) return console.error("Error fetching clients");
      const data = await res.json();
      if (Array.isArray(data)) setClients(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingId ? `/api/clientes/${editingId}` : '/api/clientes';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, email, phone }),
      });

      if (res.ok) {
        handleCancel();
        fetchClients();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (client: any) => {
    setEditingId(client.id);
    setCompany(client.company);
    setEmail(client.email || '');
    setPhone(client.phone || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setCompany('');
    setEmail('');
    setPhone('');
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar a "${name}"? Se borrarán también todas sus cotizaciones.`)) return;
    
    try {
      const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
      if (res.ok) fetchClients();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <h1 style={{ marginBottom: '32px', color: 'var(--primary)' }}>Gestión de Clientes</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
          {/* Form */}
          <div className="card" style={{ borderTop: editingId ? '4px solid var(--primary)' : 'none' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {editingId ? <Pencil size={20} /> : <Plus size={20} />} 
              {editingId ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Nombre de la Empresa</label>
                <input 
                  type="text" 
                  value={company} 
                  onChange={(e) => setCompany(e.target.value)} 
                  placeholder="Ej: Pinturas Industriales S.A."
                  required 
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Correo Electrónico (Opcional)</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="contacto@empresa.com"
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Teléfono (Opcional)</label>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="33 1234 5678"
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                  {loading ? 'Procesando...' : (editingId ? 'Guardar Cambios' : 'Registrar Cliente')}
                </button>
                {editingId && (
                  <button type="button" onClick={handleCancel} className="btn btn-outline" style={{ flex: 1 }}>
                    <X size={18} />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List */}
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '24px' }}>Directorio de Empresas</h2>
            <table>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Contacto</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No hay clientes registrados.
                    </td>
                  </tr>
                ) : (
                  clients.map((c) => (
                    <tr key={c.id} style={{ background: editingId === c.id ? '#f0f7ff' : 'transparent' }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ background: 'var(--secondary)', padding: '8px', borderRadius: '8px', color: 'var(--primary)' }}>
                            <Building2 size={20} />
                          </div>
                          <span style={{ fontWeight: '700', fontSize: '1.05rem' }}>{c.company}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {c.email && (
                            <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
                              <Mail size={14} /> {c.email}
                            </span>
                          )}
                          {c.phone && (
                            <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
                              <Phone size={14} /> {c.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                          <button 
                            onClick={() => handleEdit(c)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                            title="Editar Cliente"
                          >
                            <Pencil size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(c.id, c.company)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}
                            title="Eliminar Cliente"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
