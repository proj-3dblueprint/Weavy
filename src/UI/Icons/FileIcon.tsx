import type { SvgComponent } from '@/types/SvgComponent';

export const FileIcon: SvgComponent = ({ title, ...props }) => {
  return (
    <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {title ? <title>{title}</title> : null}
      <g clipPath="url(#clip0_1107_421)">
        <path
          d="M18.75 21.7778H5.25C5.05109 21.7778 4.86032 21.6988 4.71967 21.5582C4.57902 21.4175 4.5 21.2267 4.5 21.0278V4.52783C4.5 4.32892 4.57902 4.13815 4.71967 3.9975C4.86032 3.85685 5.05109 3.77783 5.25 3.77783H14.25L19.5 9.02783V21.0278C19.5 21.2267 19.421 21.4175 19.2803 21.5582C19.1397 21.6988 18.9489 21.7778 18.75 21.7778Z"
          stroke="currentColor"
          strokeWidth="1.125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14.25 3.77783V9.02783H19.5"
          stroke="currentColor"
          strokeWidth="1.125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_1107_421">
          <rect width="24" height="24" fill="currentColor" transform="translate(0 0.777832)" />
        </clipPath>
      </defs>
    </svg>
  );
};
