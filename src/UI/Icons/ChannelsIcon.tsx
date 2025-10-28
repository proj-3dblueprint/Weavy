import type { SvgComponent } from '@/types/SvgComponent';

export const ChannelsIcon: SvgComponent = ({ title, ...props }) => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {title ? <title>{title}</title> : null}

      <path
        d="M12 14.25C15.1066 14.25 17.625 11.7316 17.625 8.625C17.625 5.5184 15.1066 3 12 3C8.8934 3 6.375 5.5184 6.375 8.625C6.375 11.7316 8.8934 14.25 12 14.25Z"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.375 20.25C18.4816 20.25 21 17.7316 21 14.625C21 11.5184 18.4816 9 15.375 9C12.2684 9 9.75 11.5184 9.75 14.625C9.75 17.7316 12.2684 20.25 15.375 20.25Z"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.625 20.25C11.7316 20.25 14.25 17.7316 14.25 14.625C14.25 11.5184 11.7316 9 8.625 9C5.5184 9 3 11.5184 3 14.625C3 17.7316 5.5184 20.25 8.625 20.25Z"
        stroke="currentColor"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
