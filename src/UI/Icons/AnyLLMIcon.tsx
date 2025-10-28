import type { SvgComponent } from '@/types/SvgComponent';

export const AnyLLMIcon: SvgComponent = ({ title, ...props }) => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {title ? <title>{title}</title> : null}

      <path
        d="M7.90007 16.0994L2.73539 14.1963C2.59298 14.1438 2.4701 14.0488 2.38332 13.9243C2.29653 13.7997 2.25 13.6516 2.25 13.4998C2.25 13.348 2.29653 13.1998 2.38332 13.0753C2.4701 12.9507 2.59298 12.8558 2.73539 12.8032L7.90007 10.9001L9.8032 5.73539C9.85577 5.59298 9.95072 5.4701 10.0753 5.38332C10.1998 5.29653 10.348 5.25 10.4998 5.25C10.6516 5.25 10.7997 5.29653 10.9243 5.38332C11.0488 5.4701 11.1438 5.59298 11.1963 5.73539L13.0994 10.9001L18.2641 12.8032C18.4065 12.8558 18.5294 12.9507 18.6162 13.0753C18.703 13.1998 18.7495 13.348 18.7495 13.4998C18.7495 13.6516 18.703 13.7997 18.6162 13.9243C18.5294 14.0488 18.4065 14.1438 18.2641 14.1963L13.0994 16.0994L11.1963 21.2641C11.1438 21.4065 11.0488 21.5294 10.9243 21.6162C10.7997 21.703 10.6516 21.7495 10.4998 21.7495C10.348 21.7495 10.1998 21.703 10.0753 21.6162C9.95072 21.5294 9.85577 21.4065 9.8032 21.2641L7.90007 16.0994Z"
        stroke="currentColor"
        strokeWidth="1.13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M16.5 1.5V6" stroke="currentColor" strokeWidth="1.13" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 6.75V9.75" stroke="currentColor" strokeWidth="1.13" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M14.25 3.75H18.75"
        stroke="currentColor"
        strokeWidth="1.13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M19.5 8.25H22.5" stroke="currentColor" strokeWidth="1.13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
