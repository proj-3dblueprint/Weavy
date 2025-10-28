import type { SvgComponent } from '@/types/SvgComponent';

export const CheckMarkOutlineIcon: SvgComponent = ({ title, ...props }) => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {title ? <title>{title}</title> : null}
      <g clipPath="url(#clip0_102_574)">
        <path
          d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
          stroke="currentColor"
          strokeWidth="1.125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.25 12.75L10.5 15L15.75 9.75"
          stroke="currentColor"
          strokeWidth="1.125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_102_574">
          <rect width="24" height="24" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
};
