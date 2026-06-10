"use client";

// lib/language-context.tsx
// LanguageContext + useT hook for CarinderAI. Implements Requirement 13.
// - Defaults to 'en' (Req 13.4)
// - Hydrates from localStorage['carinderai.lang'] on mount (Req 13.5)
// - Persists changes back to localStorage (Req 13.5)
// - useT returns a translator with English fallback for missing keys (Req 13.3)

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { STRINGS, type Lang, type StringKey } from "./strings";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
});

const STORAGE_KEY = "carinderai.lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Req 13.4: default to English when no prior selection has been made.
  const [lang, setLangState] = useState<Lang>("en");

  // Req 13.5: hydrate the active language from localStorage on mount.
  // Done in an effect (not in useState's initializer) so that SSR and the
  // first client render produce the same markup.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "tl") {
        setLangState(stored);
      }
    } catch {
      // localStorage unavailable (private mode, SSR, etc.) — keep default 'en'.
    }
  }, []);

  const setLang = (next: Lang) => {
    setLangState(next);
    try {
      // Req 13.5: persist the user's selection across sessions.
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore write failures; in-memory state still updates.
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang(): LanguageContextValue {
  return useContext(LanguageContext);
}

export function useT(): (key: StringKey) => string {
  const { lang } = useContext(LanguageContext);
  // Req 13.3: fall back to the English string set if a key is missing in `lang`.
  return (key: StringKey): string => STRINGS[lang][key] ?? STRINGS.en[key];
}
