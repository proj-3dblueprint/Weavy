import { useContext, useEffect, useState, type ReactNode } from 'react';
import { initAxiosInterceptors } from '@/services/axiosConfig';
import { AuthContext } from '@/contexts/AuthContext';

interface AxiosConfigurationProps {
  children: ReactNode;
}

export const AxiosConfiguration = ({ children }: AxiosConfigurationProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { authApi } = useContext(AuthContext);

  useEffect(() => {
    if (authApi && !isInitialized) {
      initAxiosInterceptors(authApi);
      setIsInitialized(true);
    }
  }, [authApi]);

  // Don't render children until interceptors are initialized
  if (!isInitialized) {
    return null;
  }

  return <>{children}</>;
};
