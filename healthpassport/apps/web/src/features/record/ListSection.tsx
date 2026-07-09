import type { ReactNode } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Button, Card, EmptyState } from '../../ui/primitives';
import './record.css';

export interface ListItem {
  id: string;
  title: string;
  meta?: string;
}

/** A record section: titled card with an add button and a removable item list. */
export function ListSection({
  title,
  addLabel,
  onAdd,
  items,
  onRemove,
  emptyText,
  children,
}: {
  title: string;
  addLabel: string;
  onAdd: () => void;
  items: ListItem[];
  onRemove: (id: string) => void;
  emptyText?: string;
  children?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <Card>
      <div className="hp-section-head">
        <h2 className="hp-section-head__title">{title}</h2>
        <Button variant="ghost" onClick={onAdd}>
          + {addLabel}
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState>{emptyText ?? t('common.none')}</EmptyState>
      ) : (
        <div className="hp-list">
          {items.map((item) => (
            <div className="hp-list__item" key={item.id}>
              <div className="hp-list__main">
                <div className="hp-list__title">{item.title}</div>
                {item.meta && <div className="hp-list__meta">{item.meta}</div>}
              </div>
              <button
                type="button"
                className="hp-list__remove"
                aria-label={`${t('common.delete')}: ${item.title}`}
                onClick={() => {
                  if (window.confirm(t('record.removeConfirm'))) onRemove(item.id);
                }}
              >
                <span aria-hidden="true">🗑</span>
              </button>
            </div>
          ))}
        </div>
      )}
      {children}
    </Card>
  );
}
