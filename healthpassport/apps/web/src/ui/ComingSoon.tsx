import { EmptyState, PageHeader, Stack } from './primitives';

/** Honest placeholder used by sections whose full UI lands in a later phase. */
export function ComingSoon({ title, note }: { title: string; note: string }) {
  return (
    <Stack>
      <PageHeader title={title} />
      <EmptyState>
        <p>{note}</p>
      </EmptyState>
    </Stack>
  );
}
