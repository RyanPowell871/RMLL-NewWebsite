import { createContext, useContext, useState, ReactNode, useMemo, useCallback, startTransition } from 'react';

export type Page = 'home' | 'schedule' | 'standings' | 'stats' | 'documents' | 'teams' | 'store' | 'division-info' | 'player' | 'news';

interface NavigationContextType {
  currentPage: Page;
  navigationParams: Record<string, any>;
  navigateTo: (page: Page, params?: Record<string, any>) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [navigationParams, setNavigationParams] = useState<Record<string, any>>({});

  const navigateTo = useCallback((page: Page, params: Record<string, any> = {}) => {
    startTransition(() => {
      setCurrentPage(page);
      setNavigationParams(params);
    });
    // Scroll to top when navigating
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const value = useMemo(() => ({
    currentPage,
    navigationParams,
    navigateTo
  }), [currentPage, navigationParams, navigateTo]);

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}