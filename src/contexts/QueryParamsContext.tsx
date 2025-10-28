import noop from 'lodash/noop';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

type QueryParamsState = {
  cleanQueryParams: (param: 'view' | 'version' | 'new') => void;
  queryParamNewRecipe: boolean;
  queryParamVersion?: number;
  queryParamViewingMode?: 'app' | 'workflow';
};

const QueryParamsContext = createContext<QueryParamsState>({
  cleanQueryParams: noop,
  queryParamNewRecipe: false,
  queryParamVersion: undefined,
  queryParamViewingMode: undefined,
});

const isViewingMode = (viewingMode: string | null): viewingMode is 'app' | 'workflow' => {
  return viewingMode === 'app' || viewingMode === 'workflow';
};

const isValidNumber = (version: string | null): version is string => {
  return !isNaN(Number(version));
};

export const useQueryParamsContext = () => useContext(QueryParamsContext);

export const QueryParamsProvider = ({ children }) => {
  const [queryParamViewingMode, setQueryParamViewingMode] = useState<'app' | 'workflow'>();
  const [queryParamVersion, setQueryParamVersion] = useState<number>();
  const [queryParamNewRecipe, setQueryParamNewRecipe] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewingMode = params.get('view');
    setQueryParamViewingMode(isViewingMode(viewingMode) ? viewingMode : undefined);
    const version = params.get('version');
    setQueryParamVersion(isValidNumber(version) && version !== null ? Number(version) : undefined);
    const newRecipe = params.get('new');
    setQueryParamNewRecipe(newRecipe === 'true');
    setIsLoaded(true);
  }, []);

  const cleanQueryParams = useCallback(
    (param: 'view' | 'version' | 'new') => {
      const params = new URLSearchParams(window.location.search);
      params.delete(param);
      navigate(`${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`, { replace: true });
    },
    [navigate],
  );

  if (!isLoaded) return null;
  return (
    <QueryParamsContext.Provider
      value={{ queryParamViewingMode, queryParamVersion, queryParamNewRecipe, cleanQueryParams }}
    >
      {children}
    </QueryParamsContext.Provider>
  );
};
