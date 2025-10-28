import type { SvgComponent } from '@/types/SvgComponent';

export const AlignBottomIcon: SvgComponent = ({ title, ...props }) => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {title ? <title>{title}</title> : null}
      <path
        d="M20.25 20.25H3.75"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 7.5V16.5C13.5 16.9142 13.8358 17.25 14.25 17.25H18C18.4142 17.25 18.75 16.9142 18.75 16.5V7.5C18.75 7.08579 18.4142 6.75 18 6.75H14.25C13.8358 6.75 13.5 7.08579 13.5 7.5Z"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.75 3H6C5.58579 3 5.25 3.33579 5.25 3.75V16.5C5.25 16.9142 5.58579 17.25 6 17.25H9.75C10.1642 17.25 10.5 16.9142 10.5 16.5V3.75C10.5 3.33579 10.1642 3 9.75 3Z"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
