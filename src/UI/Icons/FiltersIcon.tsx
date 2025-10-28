import type { SvgComponent } from '@/types/SvgComponent';

export const FiltersIcon: SvgComponent = ({ title, ...props }) => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {title ? <title>{title}</title> : null}
      <path
        d="M9.75 14.25C9.75 13.0074 8.74264 12 7.5 12C6.25736 12 5.25 13.0074 5.25 14.25C5.25 15.4926 6.25736 16.5 7.5 16.5C8.74264 16.5 9.75 15.4926 9.75 14.25Z"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.75 8.25C18.75 7.00736 17.7426 6 16.5 6C15.2574 6 14.25 7.00736 14.25 8.25C14.25 9.49264 15.2574 10.5 16.5 10.5C17.7426 10.5 18.75 9.49264 18.75 8.25Z"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 12L7.5 3.75"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 20.25L7.5 16.5"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 6L16.5 3.75"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 20.25L16.5 10.5"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
