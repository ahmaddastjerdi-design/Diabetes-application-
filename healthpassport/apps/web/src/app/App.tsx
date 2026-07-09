import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { HomeScreen } from '../features/home/HomeScreen';
import { RecordScreen } from '../features/record/RecordScreen';
import { CareScreen } from '../features/care/CareScreen';
import { LearnScreen } from '../features/learn/LearnScreen';
import { ReportScreen } from '../features/report/ReportScreen';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomeScreen />} />
        <Route path="record" element={<RecordScreen />} />
        <Route path="care" element={<CareScreen />} />
        <Route path="learn" element={<LearnScreen />} />
        <Route path="report" element={<ReportScreen />} />
      </Route>
    </Routes>
  );
}
