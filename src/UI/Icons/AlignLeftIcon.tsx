import type { SvgComponent } from '@/types/SvgComponent';

export const AlignLeftIcon: SvgComponent = ({ title, ...props }) => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {title ? <title>{title}</title> : null}
      <path
        d="M3.75 3.75V20.25"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 5.25H7.5C7.08579 5.25 6.75 5.58579 6.75 6V9.75C6.75 10.1642 7.08579 10.5 7.5 10.5H16.5C16.9142 10.5 17.25 10.1642 17.25 9.75V6C17.25 5.58579 16.9142 5.25 16.5 5.25Z"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.25 13.5H7.5C7.08579 13.5 6.75 13.8358 6.75 14.25V18C6.75 18.4142 7.08579 18.75 7.5 18.75H20.25C20.6642 18.75 21 18.4142 21 18V14.25C21 13.8358 20.6642 13.5 20.25 13.5Z"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
