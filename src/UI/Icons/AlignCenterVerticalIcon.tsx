import type { SvgComponent } from '@/types/SvgComponent';

export const AlignCenterVerticalIcon: SvgComponent = ({ title, ...props }) => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {title ? <title>{title}</title> : null}
      <path d="M21 12H18.75" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.25 12H3" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.5 12H10.5" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M18.75 17.25V6.75C18.75 6.33579 18.4142 6 18 6H14.25C13.8358 6 13.5 6.33579 13.5 6.75V17.25C13.5 17.6642 13.8358 18 14.25 18H18C18.4142 18 18.75 17.6642 18.75 17.25Z"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.75 3.75H6C5.58579 3.75 5.25 4.08579 5.25 4.5V19.5C5.25 19.9142 5.58579 20.25 6 20.25H9.75C10.1642 20.25 10.5 19.9142 10.5 19.5V4.5C10.5 4.08579 10.1642 3.75 9.75 3.75Z"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
