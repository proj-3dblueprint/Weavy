import { useEffect } from 'react';
import { usePostHog } from 'posthog-js/react';
import { Trans } from 'react-i18next';
import './ErrorPage.css';
import { ErrorSidebar } from '@/components/Common/Error/ErrorSidebar';
import { ErrorDisplay } from '@/components/Common/Error/ErrorDisplay';
import { I18N_KEYS } from '@/language/keys';
import { SmileyXEyes } from '@/UI/Icons/SmileyXEyes';
import { openIntercom } from '@/providers/intercom';

export const ErrorPage = () => {
  const posthog = usePostHog();
  useEffect(() => {
    posthog?.capture('error_page_viewed');
  }, [posthog]);

  return (
    <div className="error-page">
      <ErrorSidebar />
      <ErrorDisplay
        icon={<SmileyXEyes />}
        title={<Trans i18nKey={I18N_KEYS.ERROR_PAGE.TITLE}>Oops! Something went wrong</Trans>}
        description={
          <Trans
            i18nKey={I18N_KEYS.ERROR_PAGE.DESCRIPTION}
            components={{
              supportEmail: <button onClick={openIntercom} className="error-page-link-button" />,
            }}
          >
            Try to refresh or contact us at
            <button className="error-page-link-button" onClick={openIntercom}>
              support@weavy.ai
            </button>
          </Trans>
        }
        actions={[]}
      />
    </div>
  );
};
