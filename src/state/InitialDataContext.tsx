import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { AppInitialState, PaginatedArticles, ArticleDetail } from '@shared/types';

type InitialDataContextValue = {
  state: AppInitialState;
  setListData: (data: PaginatedArticles) => void;
  setDetailData: (data: ArticleDetail) => void;
};

const InitialDataContext = createContext<InitialDataContextValue | undefined>(undefined);

interface InitialDataProviderProps {
  value: AppInitialState;
  children: ReactNode;
}

export const InitialDataProvider = ({ value, children }: InitialDataProviderProps) => {
  const [state, setState] = useState<AppInitialState>(value);

  const contextValue = useMemo<InitialDataContextValue>(
    () => ({
      state,
      setListData: (data) =>
        setState((prev) => ({
          ...prev,
          view: 'list',
          listData: data,
          detailData: undefined,
          error: undefined
        })),
      setDetailData: (data) =>
        setState((prev) => ({
          ...prev,
          view: 'detail',
          detailData: data,
          error: undefined
        }))
    }),
    [state]
  );

  return <InitialDataContext.Provider value={contextValue}>{children}</InitialDataContext.Provider>;
};

export const useInitialData = () => {
  const context = useContext(InitialDataContext);
  if (!context) {
    throw new Error('useInitialData must be used within InitialDataProvider');
  }
  return context;
};
