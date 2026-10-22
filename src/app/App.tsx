import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { useDocumentPreferences } from '../store/preferences';

export function App() {
  useDocumentPreferences();

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
