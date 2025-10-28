import type { SvgComponent } from '@/types/SvgComponent';

export const AlignTopIcon: SvgComponent = ({ title, ...props }) => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {title ? <title>{title}</title> : null}
      <path
        d="M20.25 3.75H3.75"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.75 16.5V7.5C18.75 7.08579 18.4142 6.75 18 6.75H14.25C13.8358 6.75 13.5 7.08579 13.5 7.5V16.5C13.5 16.9142 13.8358 17.25 14.25 17.25H18C18.4142 17.25 18.75 16.9142 18.75 16.5Z"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.75 6.75H6C5.58579 6.75 5.25 7.08579 5.25 7.5V20.25C5.25 20.6642 5.58579 21 6 21H9.75C10.1642 21 10.5 20.6642 10.5 20.25V7.5C10.5 7.08579 10.1642 6.75 9.75 6.75Z"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
