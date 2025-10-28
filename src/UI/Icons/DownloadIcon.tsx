import type { SvgComponent } from '@/types/SvgComponent';

export const DownloadIcon: SvgComponent = ({ title, ...props }) => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {title ? <title>{title}</title> : null}
      <path d="M12.5 13.5V3" stroke="currentColor" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M20.75 19.5H4.25"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.25 9.75L12.5 13.5L8.75 9.75"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
