import type { SvgComponent } from '@/types/SvgComponent';

export const AlignCenterHorizontalIcon: SvgComponent = ({ title, ...props }) => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {title ? <title>{title}</title> : null}
      <path d="M12 3V5.25" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 18.75V21" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 10.5V13.5" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M17.25 5.25H6.75C6.33579 5.25 6 5.58579 6 6V9.75C6 10.1642 6.33579 10.5 6.75 10.5H17.25C17.6642 10.5 18 10.1642 18 9.75V6C18 5.58579 17.6642 5.25 17.25 5.25Z"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.5 13.5H4.5C4.08579 13.5 3.75 13.8358 3.75 14.25V18C3.75 18.4142 4.08579 18.75 4.5 18.75H19.5C19.9142 18.75 20.25 18.4142 20.25 18V14.25C20.25 13.8358 19.9142 13.5 19.5 13.5Z"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
