import { LogOut } from 'lucide-react';
import { auth } from '@/auth';
import { signOutAction } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';

/** Shows the signed-in user and a sign-out control. */
export async function UserMenu() {
  const session = await auth();
  if (!session?.user) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-[180px] truncate text-sm text-muted-foreground sm:inline">
        {session.user.email}
      </span>
      <form action={signOutAction}>
        <Button type="submit" variant="ghost" size="icon" aria-label="Sign out">
          <LogOut aria-hidden />
        </Button>
      </form>
    </div>
  );
}
