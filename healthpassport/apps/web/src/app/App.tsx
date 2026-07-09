import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { HomeScreen } from '../features/home/HomeScreen';
import { RecordScreen } from '../features/record/RecordScreen';
import { CareScreen } from '../features/care/CareScreen';
import { LearnScreen } from '../features/learn/LearnScreen';
import { ReportScreen } from '../features/report/ReportScreen';
import { useSession } from '../state/SessionProvider';
import { RecordsProvider } from '../state/RecordsProvider';
import { OnboardingFlow } from '../features/onboarding/OnboardingFlow';
import { UnlockScreen } from '../features/session/UnlockScreen';
import { useI18n } from '../i18n/I18nProvider';

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="hp-auth" role="status" aria-live="polite">
      <p className="hp-card__subtitle">{message}</p>
    </div>
  );
}

function UnlockedApp() {
  return (
    <RecordsProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomeScreen />} />
          <Route path="record" element={<RecordScreen />} />
          <Route path="care" element={<CareScreen />} />
          <Route path="learn" element={<LearnScreen />} />
          <Route path="report" element={<ReportScreen />} />
        </Route>
      </Routes>
    </RecordsProvider>
  );
}

export function App() {
  const { status } = useSession();
  const { t } = useI18n();

  switch (status) {
    case 'loading':
      return <LoadingScreen message={t('common.loading')} />;
    case 'error':
      return (
        <LoadingScreen message="Secure storage is unavailable in this browser. Try a different browser or disable private mode." />
      );
    case 'uninitialized':
      return <OnboardingFlow />;
    case 'locked':
      return <UnlockScreen />;
    case 'unlocked':
      return <UnlockedApp />;
  }
}
