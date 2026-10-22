import { Component, type ReactNode } from 'react';
import { messages } from '../../i18n/messages';
import { usePreferenceStore } from '../../store/preferences';

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { hasError: boolean };

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch() {
    // Deliberately avoid remote logging and personal-data-bearing console payloads.
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const language = usePreferenceStore.getState().language;
    const copy = messages[language];

    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-6 dark:bg-slate-950">
        <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">{copy['error.title']}</h1>
          <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{copy['error.body']}</p>
          <button
            className="mt-6 rounded-xl bg-sky-700 px-5 py-3 font-semibold text-white hover:bg-sky-800"
            type="button"
            onClick={() => window.location.reload()}
          >
            {copy['error.retry']}
          </button>
        </section>
      </main>
    );
  }
}
