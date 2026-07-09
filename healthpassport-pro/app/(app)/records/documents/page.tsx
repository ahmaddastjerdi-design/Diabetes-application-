import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { requireUser } from '@/lib/auth/session';
import { listDocuments } from '@/lib/data/documents';
import { formatBytes, formatDate } from '@/lib/utils/format';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentUpload } from '@/components/documents/document-upload';
import { DocumentDeleteButton } from '@/components/documents/document-delete-button';

export const metadata: Metadata = { title: 'Documents' };

const TYPE_LABEL: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'image/webp': 'WEBP',
};

export default async function DocumentsPage() {
  const user = await requireUser();
  const documents = await listDocuments(user.id);

  return (
    <>
      <PageHeader title="Documents" description="Store and access your medical documents securely." />
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Your documents</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {documents.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground">
                No documents yet. Upload one below.
              </p>
            ) : (
              <ul className="divide-y">
                {documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 p-4">
                    <Link
                      href={`/api/documents/${d.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-w-0 items-center gap-3 hover:underline"
                    >
                      <FileText aria-hidden className="size-5 shrink-0 text-primary" />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{d.title}</span>
                        <span className="block text-sm text-muted-foreground">
                          {TYPE_LABEL[d.mimeType] ?? d.mimeType} · {formatBytes(d.sizeBytes)} ·{' '}
                          {formatDate(d.createdAt)}
                        </span>
                      </span>
                    </Link>
                    <DocumentDeleteButton id={d.id} label={d.title} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload a document</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentUpload />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
