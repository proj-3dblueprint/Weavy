import type { SvgComponent } from '@/types/SvgComponent';

export const ImageDescriberIcon: SvgComponent = ({ title, ...props }) => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {title ? <title>{title}</title> : null}
      <path
        d="M16.5 8.49298V4.5C16.5 4.08579 16.1642 3.75 15.75 3.75H3.75C3.33579 3.75 3 4.08579 3 4.5V16.5C3 16.9142 3.33579 17.25 3.75 17.25H5.5"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 9.75C8.32843 9.75 9 9.07843 9 8.25C9 7.42157 8.32843 6.75 7.5 6.75C6.67157 6.75 6 7.42157 6 8.25C6 9.07843 6.67157 9.75 7.5 9.75Z"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.5203 11.3H22.0203"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.5203 14.3H22.0203"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 17.1819L22 17.1819"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.77026 20.3H22.0203"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
