import { messages, type TranslationKey } from './messages';
import { usePreferenceStore } from '../store/preferences';

export function useTranslation() {
  const language = usePreferenceStore((state) => state.language);

  return {
    language,
    t: (key: TranslationKey) => messages[language][key],
  };
}
