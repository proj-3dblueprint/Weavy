import axios from 'axios';
import axiosRetry from 'axios-retry';
import { log } from '@/logger/logger.ts';
import { AuthUser } from '@/types/auth.types';
import { getAppVersion, isVersionGreater as isMajorVersionChanged } from '@/utils/general';
import { useGlobalStore } from '@/state/global.state';
import { INCOMING_HEADER_NAMES, OUTGOING_HEADER_NAMES } from '@/consts/headers';
import { getRecipeIdFromPath } from '@/utils/urls';
import server_url from '../globals';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

interface AuthApi {
  getCurrentUser: () => AuthUser | null;
}

// Extend the config interface to include the _retry property
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let interceptorsInitialized = false;
const axiosInstance = axios.create({
  baseURL: server_url,
});
axiosRetry(axiosInstance, { retries: 3 });

export const getAxiosInstance = () => {
  return axiosInstance;
};

export const initAxiosInterceptors = (auth: AuthApi) => {
  const logger = log.getLogger('Axios');
  if (interceptorsInitialized) {
    return;
  }
  interceptorsInitialized = true;

  const refreshToken = async () => {
    try {
      const currentUser = auth.getCurrentUser();
      if (currentUser) {
        const token = await currentUser.getIdToken(true);
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;
        axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
        return token;
      }
    } catch (error) {
      logger.error('Error refreshing token:', error);
      throw error;
    }
  };

  // Add a request interceptor
  axiosInstance.interceptors.request.use(
    async (config) => {
      const isRetry = config.headers['x-from-retry'] === 'true';
      // Don't override Authorization header if it's already set by retry interceptor
      if (!isRetry) {
        const currentUser = auth.getCurrentUser();
        if (currentUser) {
          const token = await currentUser.getIdToken();
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      const recipeId = getRecipeIdFromPath(window.location.pathname);
      if (recipeId) {
        config.headers[OUTGOING_HEADER_NAMES.APP_RECIPE_ID] = recipeId;
      }

      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    },
  );

  axiosInstance.interceptors.response.use(
    (response) => {
      // Check for app version updates
      const supportedAppVersion = response.headers[INCOMING_HEADER_NAMES.SUPPORTED_APP_VERSION] as string;
      const currentVersion = getAppVersion();
      if (supportedAppVersion && currentVersion) {
        if (isMajorVersionChanged(supportedAppVersion, currentVersion)) {
          logger.info(`New app version detected: ${supportedAppVersion} > ${currentVersion}. Setting refresh alert...`);
          useGlobalStore.getState().setIsShowRefreshAlert(true);
        }
      }
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as ExtendedAxiosRequestConfig | undefined;
      if (error.response && error.response.status === 401 && originalRequest && !originalRequest._retry) {
        logger.warn('401 Unauthorized error detected. Attempting to refresh token...');

        originalRequest._retry = true;
        try {
          const newToken = await refreshToken();
          const retryConfig = {
            ...originalRequest,
            headers: {
              ...originalRequest.headers,
              'x-from-retry': 'true',
              Authorization: `Bearer ${newToken}`,
            },
          };

          return axiosInstance(retryConfig);
        } catch (tokenRefreshError) {
          logger.error('Token refresh error', tokenRefreshError);
        }
      } else if (!error.response) {
        logger.debug('Network or CORS error');
      }

      return Promise.reject(error);
    },
  );

  return axiosInstance;
};
