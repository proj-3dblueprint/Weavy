import { isMobile } from 'react-device-detect';
import { useLocation } from 'react-router-dom';
import { MobileUnsupportedPage } from './MobileUnsupportedPage/MobileUnsupportedPage';

type WithMobileCheckProps = {
  children: JSX.Element;
  excludedPaths?: string[];
};

export const MobileCheck = ({ children, excludedPaths = [] }: WithMobileCheckProps): JSX.Element => {
  const location = useLocation();

  const isExcluded = excludedPaths.includes(location.pathname);

  if (!isExcluded && isMobile) {
    return <MobileUnsupportedPage />;
  }

  return children;
};
