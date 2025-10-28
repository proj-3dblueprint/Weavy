import type { SvgComponent } from '@/types/SvgComponent';

export const AudioIcon: SvgComponent = ({ title, ...props }) => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {title ? <title>{title}</title> : null}
      <g clipPath="url(#clip0_532_333)">
        <path
          d="M7.5 15.75H3C2.80109 15.75 2.61032 15.671 2.46967 15.5303C2.32902 15.3897 2.25 15.1989 2.25 15V9C2.25 8.80109 2.32902 8.61032 2.46967 8.46967C2.61032 8.32902 2.80109 8.25 3 8.25H7.5L14.25 3V21L7.5 15.75Z"
          stroke="currentColor"
          strokeWidth="1.125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.5 8.25V15.75"
          stroke="currentColor"
          strokeWidth="1.125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18 10.0171C18.4825 10.5649 18.7487 11.2699 18.7487 11.9999C18.7487 12.7299 18.4825 13.4349 18 13.9827"
          stroke="currentColor"
          strokeWidth="1.125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20.7815 7.5C21.8884 8.73755 22.5003 10.3397 22.5003 12C22.5003 13.6603 21.8884 15.2624 20.7815 16.5"
          stroke="currentColor"
          strokeWidth="1.125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_532_333">
          <rect width="24" height="24" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
};
