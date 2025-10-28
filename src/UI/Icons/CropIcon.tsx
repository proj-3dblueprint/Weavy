import type { SvgComponent } from '@/types/SvgComponent';

export const CropIcon: SvgComponent = ({ title, ...props }) => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {title ? <title>{title}</title> : null}
      <g clipPath="url(#clip0_295_74)">
        <path
          d="M6 2.25V18H21.75"
          stroke="currentColor"
          strokeWidth="1.125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M2.25 6H6" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 6H18V15" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 18V21.75" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <defs>
        <clipPath id="clip0_295_74">
          <rect width="24" height="24" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
};
