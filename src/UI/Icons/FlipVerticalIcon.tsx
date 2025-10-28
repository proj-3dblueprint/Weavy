import type { SvgComponent } from '@/types/SvgComponent';

export const FlipVerticalIcon: SvgComponent = ({ title, ...props }) => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {title ? <title>{title}</title> : null}
      <path
        d="M2.66146 8L13.3281 8"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.68271 6.33945L5.9745 3.37324C5.85478 3.16426 6.00947 2.90625 6.25595 2.90625L9.67236 2.90625C9.91884 2.90625 10.0735 3.16426 9.9538 3.37324L8.2456 6.33945C8.12255 6.55352 7.80575 6.55352 7.68271 6.33945Z"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.246 9.5668L9.95421 12.533C10.0739 12.742 9.91925 13 9.67276 13L6.25635 13C6.00987 13 5.85518 12.742 5.97491 12.533L7.68311 9.5668C7.80616 9.35273 8.12296 9.35273 8.246 9.5668Z"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
