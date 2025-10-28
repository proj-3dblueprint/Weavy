import type { SvgComponent } from '@/types/SvgComponent';

export const AlignRightIcon: SvgComponent = ({ title, ...props }) => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {title ? <title>{title}</title> : null}
      <path
        d="M20.25 3.75V20.25"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 10.5L16.5 10.5C16.9142 10.5 17.25 10.1642 17.25 9.75V6C17.25 5.58579 16.9142 5.25 16.5 5.25L7.5 5.25C7.08579 5.25 6.75 5.58579 6.75 6V9.75C6.75 10.1642 7.08579 10.5 7.5 10.5Z"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 13.5H3.75C3.33579 13.5 3 13.8358 3 14.25V18C3 18.4142 3.33579 18.75 3.75 18.75H16.5C16.9142 18.75 17.25 18.4142 17.25 18V14.25C17.25 13.8358 16.9142 13.5 16.5 13.5Z"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
