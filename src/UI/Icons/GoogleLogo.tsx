import type { SvgComponent } from '../../types/SvgComponent';

const GoogleLogo: SvgComponent = ({ title, ...props }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28.608" {...props}>
      {title ? <title>{title}</title> : null}
      <path
        d="M-1.058 51.945a16.572 16.572 0 0 0-.226-2.706h-13.47v5.376h7.712A6.641 6.641 0 0 1-9.9 58.882v3.576h4.6a13.986 13.986 0 0 0 4.242-10.513z"
        transform="translate(29.058 -37.319)"
        style={{ fill: '#4285f4' }}
      />
      <path
        d="M-12.7 65.1a13.625 13.625 0 0 0 9.453-3.469l-4.6-3.576a8.629 8.629 0 0 1-4.853 1.386 8.543 8.543 0 0 1-8.022-5.912h-4.744v3.683A14.283 14.283 0 0 0-12.7 65.1z"
        transform="translate(27.002 -36.495)"
        style={{ fill: '#34a853' }}
      />
      <path
        d="M-20.472 55a8.3 8.3 0 0 1-.453-2.73 8.623 8.623 0 0 1 .453-2.73v-3.681h-4.744a14.138 14.138 0 0 0-1.538 6.413 14.138 14.138 0 0 0 1.538 6.413z"
        transform="translate(26.754 -37.968)"
        style={{ fill: '#fbbc05' }}
      />
      <path
        d="M-12.7 44.9a7.761 7.761 0 0 1 5.483 2.146l4.077-4.077a13.676 13.676 0 0 0-9.56-3.731 14.283 14.283 0 0 0-12.764 7.892l4.744 3.683A8.543 8.543 0 0 1-12.7 44.9z"
        transform="translate(27.002 -39.239)"
        style={{ fill: '#ea4335' }}
      />
    </svg>
  );
};

export default GoogleLogo;
