import type { SvgComponent } from '@/types/SvgComponent';

export const CompositorIcon: SvgComponent = ({ title, ...props }) => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {title ? <title>{title}</title> : null}
      <g clipPath="url(#clip0_280_203)">
        <path
          d="M19.5 3.75H7.5C7.08579 3.75 6.75 4.08579 6.75 4.5V16.5C6.75 16.9142 7.08579 17.25 7.5 17.25H19.5C19.9142 17.25 20.25 16.9142 20.25 16.5V4.5C20.25 4.08579 19.9142 3.75 19.5 3.75Z"
          stroke="currentColor"
          strokeWidth="1.125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11.25 9.75C12.0784 9.75 12.75 9.07843 12.75 8.25C12.75 7.42157 12.0784 6.75 11.25 6.75C10.4216 6.75 9.75 7.42157 9.75 8.25C9.75 9.07843 10.4216 9.75 11.25 9.75Z"
          stroke="currentColor"
          strokeWidth="1.125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17.25 17.25V19.5C17.25 19.6989 17.171 19.8897 17.0303 20.0303C16.8897 20.171 16.6989 20.25 16.5 20.25H4.5C4.30109 20.25 4.11032 20.171 3.96967 20.0303C3.82902 19.8897 3.75 19.6989 3.75 19.5V7.5C3.75 7.30109 3.82902 7.11032 3.96967 6.96967C4.11032 6.82902 4.30109 6.75 4.5 6.75H6.75"
          stroke="currentColor"
          strokeWidth="1.125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.06445 17.2501L16.3441 9.96948C16.4138 9.89974 16.4965 9.84443 16.5876 9.80668C16.6786 9.76894 16.7762 9.74951 16.8748 9.74951C16.9733 9.74951 17.0709 9.76894 17.162 9.80668C17.253 9.84443 17.3357 9.89974 17.4054 9.96948L20.2498 12.8148"
          stroke="currentColor"
          strokeWidth="1.125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_280_203">
          <rect width="24" height="24" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
};
