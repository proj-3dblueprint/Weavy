import { useInRouterContext, useNavigate } from 'react-router-dom';
import './ErrorSidebar.css';
import { WeavyLogoFilled } from '@/UI/Icons/WeavyLogoFilled';
import { DiscordLogo } from '@/UI/Icons/DiscordLogo';
import { openIntercom } from '@/providers/intercom';
import { InfoIcon } from '@/UI/Icons/InfoIcon';
import { EXTERNAL_LINKS } from '@/consts/externalLinks.consts';

// using direct css since this can be used in a non-router non-material-ui context
export const ErrorSidebar = () => {
  const isInRouter = useInRouterContext();
  return (
    <div className="error-sidebar">
      {isInRouter ? <NavigateButton /> : <LocationButton />}
      <div className="error-sidebar-buttons">
        <IntercomButton />
        <DiscordButton />
      </div>
    </div>
  );
};

const NavigateButton = () => {
  const navigate = useNavigate();
  return (
    <button className="error-sidebar-base-button error-sidebar-logo-button" onClick={() => navigate('/')}>
      <WeavyLogoFilled width={24} height={20} />
    </button>
  );
};

const LocationButton = () => {
  return (
    <a className="error-sidebar-base-button error-sidebar-logo-button" href="/">
      <WeavyLogoFilled width={24} height={20} />
    </a>
  );
};

const IntercomButton = () => {
  return (
    <button className="error-sidebar-base-button error-sidebar-action-button" onClick={openIntercom}>
      <InfoIcon width={20} height={20} />
    </button>
  );
};

const DiscordButton = () => {
  return (
    <a
      className="error-sidebar-base-button error-sidebar-action-button"
      target="_blank"
      href={EXTERNAL_LINKS.discordInvite}
      rel="noreferrer"
    >
      <DiscordLogo width={20} height={20} />
    </a>
  );
};
