import type { SvgComponent } from '@/types/SvgComponent';

export const BlurIcon: SvgComponent = ({ title, ...props }) => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {title ? <title>{title}</title> : null}
      <g clipPath="url(#clip0_295_76)">
        <path
          d="M19.5 13.5C19.5 6.75 12 1.5 12 1.5C12 1.5 4.5 6.75 4.5 13.5C4.5 15.4891 5.29018 17.3968 6.6967 18.8033C8.10322 20.2098 10.0109 21 12 21C13.9891 21 15.8968 20.2098 17.3033 18.8033C18.7098 17.3968 19.5 15.4891 19.5 13.5Z"
          stroke="currentColor"
          strokeWidth="1.125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12.75 18C14.625 17.6841 16.1822 16.125 16.5 14.25"
          stroke="currentColor"
          strokeWidth="1.125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_295_76">
          <rect width="24" height="24" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
};
