import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge, type HealthStatus } from '@/components/health/status-badge';
import { DeleteRecordButton } from './delete-record-button';

export interface RecordRow {
  id: string;
  title: string;
  meta?: string;
  badge?: { status: HealthStatus; label: string };
}

/** Renders a list of records with delete controls, plus an add-form card. */
export function RecordSection({
  items,
  model,
  addTitle,
  addForm,
  emptyText,
}: {
  items: RecordRow[];
  model: 'condition' | 'medication' | 'allergy' | 'encounter';
  addTitle: string;
  addForm: React.ReactNode;
  emptyText: string;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground">{emptyText}</p>
          ) : (
            <ul className="divide-y">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{item.title}</span>
                      {item.badge && (
                        <StatusBadge status={item.badge.status}>
                          {item.badge.label}
                        </StatusBadge>
                      )}
                    </div>
                    {item.meta && (
                      <p className="text-sm text-muted-foreground">{item.meta}</p>
                    )}
                  </div>
                  <DeleteRecordButton model={model} id={item.id} label={item.title} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{addTitle}</CardTitle>
        </CardHeader>
        <CardContent>{addForm}</CardContent>
      </Card>
    </div>
  );
}
