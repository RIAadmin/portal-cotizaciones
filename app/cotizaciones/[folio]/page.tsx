export const dynamic = 'force-dynamic';
import Sidebar from '@/components/Sidebar';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { FileText, ShoppingCart, Receipt, Eye, Clock } from 'lucide-react';
import DocumentUploader from '@/components/DocumentUploader';
import PaymentManagement from '@/components/PaymentManagement';
import ProgressTracker from '@/components/ProgressTracker';
import EditableAmount from '@/components/EditableAmount';
import QuotationFilesManager from '@/components/QuotationFilesManager';
import InvoiceManagement from '@/components/InvoiceManagement';

interface PageProps {
  params: Promise<{ folio: string }>;
}

export default async function QuotationDetailPage({ params }: PageProps) {
  const { folio } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const quotation = await prisma.quotation.findUnique({
    where: { folio: folio },
    include: { 
      client: true,
      files: true,
      payments: {
        orderBy: { date: 'desc' }
      },
      updates: {
        include: { user: true },
        orderBy: { createdAt: 'desc' }
      },
      invoices: {
        include: {
          payments: true,
          files: true
        },
        orderBy: { date: 'desc' }
      }
    },
  });

  if (!quotation) {
    notFound();
  }

  const quotationFiles = quotation.files.filter(f => f.type === 'QUOTATION');
  const ocFile = quotation.files.find(f => f.type === 'OC');
  const invoicePdf = quotation.files.find(f => f.type === 'INVOICE_PDF');
  const invoiceXml = quotation.files.find(f => f.type === 'INVOICE_XML');

  const statusMap: any = {
    'PENDING': 'Pendiente',
    'OC_UPLOADED': 'Con OC',
    'ANTICIPO': 'Anticipo',
    'INVOICED': 'Facturada',
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Detalle de Proyecto</h1>
            <p style={{ color: 'var(--text-muted)' }}>Folio: <strong>{quotation.folio}</strong> | Cliente: <strong>{quotation.client.company}</strong></p>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>AVANCE</div>
              <div style={{ width: '100px', height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${quotation.progress}%`, 
                  height: '100%', 
                  background: quotation.progress < 50 ? '#dc3545' : quotation.progress < 100 ? '#ffc107' : '#28a745',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>
            <span className={`badge badge-${quotation.progress === 100 && !quotation.isPaid ? 'pending-payment' : quotation.isPaid ? 'finished' : quotation.status === 'ANTICIPO' ? 'warning' : quotation.status.toLowerCase().replace('_', '-')}`} style={{ 
              fontSize: '1rem', 
              padding: '8px 16px',
              background: quotation.progress === 100 && !quotation.isPaid ? '#dc3545' : quotation.isPaid ? '#28a745' : quotation.status === 'ANTICIPO' ? '#f6ad55' : undefined,
              color: quotation.progress === 100 && !quotation.isPaid || quotation.isPaid || quotation.status === 'ANTICIPO' ? 'white' : undefined
            }}>
              {quotation.progress === 100 && !quotation.isPaid ? 'PENDIENTE DE PAGO' : quotation.isPaid ? 'PAGADO' : statusMap[quotation.status]}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                  <FileText size={24} /> Expediente de Proyecto
                </h2>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>MONTO TOTAL DEL PROYECTO</span>
                  <EditableAmount quotationId={quotation.id} initialTotal={Number(quotation.total || 0)} />
                </div>
              </div>

              <QuotationFilesManager 
                quotationId={quotation.id} 
                files={quotationFiles.map(f => ({
                  id: f.id,
                  filename: f.filename,
                  createdAt: f.createdAt
                }))} 
                isPaid={quotation.isPaid}
              />
            </div>

            <div className="card">
              <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={24} /> Seguimiento de Avance de Obra
              </h2>
              
              <ProgressTracker 
                quotationId={quotation.id} 
                currentProgress={quotation.progress} 
                updates={quotation.updates} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card">
              <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShoppingCart size={20} /> Orden de Compra (OC)
              </h3>
              {ocFile ? (
                <div style={{ padding: '12px', background: 'var(--secondary)', borderRadius: 'var(--radius)', color: 'var(--primary)', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>OC Subida: {ocFile.filename}</span>
                  <a href={`/api/files/${ocFile.id}`} target="_blank" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.5)', padding: '5px 10px', borderRadius: '5px' }}>
                    <Eye size={18} /> Ver
                  </a>
                </div>
              ) : (
                <DocumentUploader 
                  quotationId={quotation.id} 
                  type="OC" 
                  label="Subir PDF de OC"
                  disabled={quotation.isPaid}
                />
              )}
            </div>
            
            <div className="card">
              <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Receipt size={20} /> {(quotation.isProject || quotation.invoices.length > 0) ? 'Factura General (Opcional)' : 'Factura (PDF y XML)'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {invoicePdf ? (
                  <div style={{ padding: '10px', background: 'var(--secondary)', borderRadius: 'var(--radius)', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>PDF Factura: {invoicePdf.filename}</span>
                    <a href={`/api/files/${invoicePdf.id}`} target="_blank" style={{ color: 'var(--primary)' }} title="Ver PDF">
                      <Eye size={18} />
                    </a>
                  </div>
                ) : (
                  <DocumentUploader 
                    quotationId={quotation.id} 
                    type="INVOICE_PDF" 
                    label="Subir PDF Factura"
                    disabled={quotation.isPaid}
                  />
                )}

                {invoiceXml ? (
                  <div style={{ padding: '10px', background: 'var(--secondary)', borderRadius: 'var(--radius)', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>XML Factura: {invoiceXml.filename}</span>
                    <a href={`/api/files/${invoiceXml.id}`} target="_blank" style={{ color: 'var(--primary)' }} title="Ver XML">
                      <Eye size={18} />
                    </a>
                  </div>
                ) : (
                  <DocumentUploader 
                    quotationId={quotation.id} 
                    type="INVOICE_XML" 
                    label="Subir XML Factura"
                    accept=".xml"
                    disabled={quotation.isPaid}
                  />
                )}
              </div>
            </div>

            {(quotation.isProject || quotation.invoices.length > 0) ? (
              <InvoiceManagement 
                quotationId={quotation.id}
                projectTotal={Number(quotation.total || 0)}
                initialInvoices={quotation.invoices.map(inv => ({
                  id: inv.id,
                  number: inv.number,
                  amount: Number(inv.amount),
                  date: inv.date.toISOString(),
                  status: inv.status,
                  payments: inv.payments.map(p => ({
                    id: p.id,
                    amount: Number(p.amount),
                    date: p.date.toISOString(),
                    invoiceId: p.invoiceId
                  })),
                  files: inv.files.map(f => ({
                    id: f.id,
                    type: f.type,
                    filename: f.filename
                  })),
                  createdAt: inv.createdAt.toISOString()
                }))}
                generalPayments={quotation.payments.filter(p => !p.invoiceId).map(p => ({
                  id: p.id,
                  amount: Number(p.amount),
                  date: p.date.toISOString()
                }))}
              />
            ) : (
              <PaymentManagement 
                quotationId={quotation.id} 
                isPaid={quotation.isPaid}
                initialPaidAt={quotation.paidAt ? quotation.paidAt.toISOString() : null}
                payments={quotation.payments.map(p => ({
                  id: p.id,
                  amount: Number(p.amount),
                  date: p.date.toISOString()
                }))} 
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );

}