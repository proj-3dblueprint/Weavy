import type { SvgComponent } from '@/types/SvgComponent';

export const AppWindowIcon: SvgComponent = ({ title, ...props }) => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {title ? <title>{title}</title> : null}
      <path
        d="M14.8 12.5L10 9.5V15.5L14.8 12.5Z"
        stroke="currentColor"
        strokeWidth="1.13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.1818 5H3.81818C3.36631 5 3 5.47969 3 6.07143V18.9286C3 19.5203 3.36631 20 3.81818 20H20.1818C20.6337 20 21 19.5203 21 18.9286V6.07143C21 5.47969 20.6337 5 20.1818 5Z"
        stroke="currentColor"
        strokeWidth="1.13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
