import type { SvgComponent } from '@/types/SvgComponent';

export const FlipHorizontalIcon: SvgComponent = ({ title, ...props }) => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {title ? <title>{title}</title> : null}
      <path
        d="M8.66504 2.66667L8.66504 13.3333"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.3256 7.68759L13.2918 5.97939C13.5008 5.85966 13.7588 6.01435 13.7588 6.26083L13.7588 9.67724C13.7588 9.92372 13.5008 10.0784 13.2918 9.95868L10.3256 8.25048C10.1115 8.12743 10.1115 7.81064 10.3256 7.68759Z"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.09824 8.2504L4.13203 9.9586C3.92305 10.0783 3.66504 9.92364 3.66504 9.67716L3.66504 6.26075C3.66504 6.01427 3.92305 5.85958 4.13203 5.9793L7.09824 7.68751C7.3123 7.81055 7.3123 8.12735 7.09824 8.2504Z"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
