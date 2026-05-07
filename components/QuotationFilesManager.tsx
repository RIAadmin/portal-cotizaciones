'use client';

import { useState } from 'react';
import { FileText, Eye, Upload, Calendar } from 'lucide-react';
import DocumentUploader from './DocumentUploader';

interface QuotationFile {
  id: number;
  filename: string;
  createdAt: Date | string;
}

interface Props {
  quotationId: number;
  files: QuotationFile[];
  isPaid: boolean;
}

export default function QuotationFilesManager({ quotationId, files, isPaid }: Props) {
  const [selectedFileId, setSelectedFileId] = useState<number | null>(
    files.length > 0 ? files[files.length - 1].id : null
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* File Selector List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
          Documentos de Cotización / Anexos
        </h3>
        
        {files.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay archivos de cotización subidos.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {files.map((file, index) => (
              <div 
                key={file.id} 
                onClick={() => setSelectedFileId(file.id)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: selectedFileId === file.id ? '#ebf8ff' : '#ffffff',
                  border: `1px solid ${selectedFileId === file.id ? '#3182ce' : '#e2e8f0'}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ color: selectedFileId === file.id ? '#3182ce' : 'var(--text-muted)' }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <p style={{ fontWeight: '600', fontSize: '0.95rem', color: selectedFileId === file.id ? '#2b6cb0' : 'inherit' }}>
                      {file.filename} {index === files.length - 1 && <span style={{ fontSize: '0.7rem', background: '#d4edda', color: '#155724', padding: '2px 6px', borderRadius: '4px', marginLeft: '5px' }}>RECIENTE</span>}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      {new Date(file.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div style={{ color: selectedFileId === file.id ? '#3182ce' : 'var(--text-muted)' }}>
                  <Eye size={18} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '10px' }}>
          <DocumentUploader 
            quotationId={quotationId} 
            type="QUOTATION" 
            label="Subir Anexo / Nueva Cotización" 
            disabled={isPaid}
          />
        </div>
      </div>

      {/* Preview Section */}
      {selectedFileId && (
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
          <iframe 
            src={`/api/files/${selectedFileId}`} 
            style={{ width: '100%', height: '700px', border: 'none', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
            title="Quotation Viewer"
          />
        </div>
      )}
    </div>
  );
}
