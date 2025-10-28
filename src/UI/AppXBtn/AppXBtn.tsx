import { AppIconButton, AppIconButtonProps } from '../Buttons/AppIconButton';
import { XIcon } from '../Icons/XIcon';

/**
 * Calculates the appropriate icon and button sizes based on the provided size value.
 * @param size - The base size in pixels
 * @returns Object containing calculated icon and button sizes
 */
const getSizes = (size: number): { icon: number; button: number } => {
  switch (size) {
    case 12:
      return { icon: 12, button: 16 };
    case 16:
      return { icon: 16, button: 20 };
    case 20:
      return { icon: 20, button: 28 };
    case 24:
      return { icon: 24, button: 32 };
    default:
      return { icon: size, button: size * 1.25 };
  }
};

/**
 * A specialized close/delete button component that renders an X icon within an icon button.
 *
 * This component is built on top of `AppIconButton` and automatically handles sizing
 * calculations to ensure proper proportions between the button and icon. The button
 * includes hover effects and follows the app's design system.
 *
 * @example
 * ```tsx
 * // Basic usage with default size (24px)
 * <AppXBtn onClick={() => handleClose()} />
 *
 * // Custom size
 * <AppXBtn size={16} onClick={() => handleDelete()} />
 *
 * // With additional props
 * <AppXBtn
 *   size={20}
 *   onClick={() => handleClose()}
 *   mode="on-light"
 *   disabled={isLoading}
 * />
 * ```
 *
 * @param props - Component props
 * @param props.size - The size of the icon in pixels. Defaults to 24.
 *   Common sizes: 12, 16, 20, 24. Custom sizes are also supported.
 * @param props.onClick - Click handler function for the button
 * @param props.mode - Visual mode for the button. Options: 'on-light' | 'on-dark'. Defaults to 'on-dark'.
 * @param props.disabled - Whether the button is disabled
 * @param props.sx - Additional Material-UI sx props for custom styling
 * @param props - All other props from AppIconButton (except children, width, height, size)
 *
 * @returns A styled button component with an X icon
 */
export const AppXBtn = ({
  size = 24,
  onClick,
  ...props
}: { size?: number } & Omit<AppIconButtonProps, 'children' | 'width' | 'height' | 'size'>) => {
  const sizes = getSizes(size);
  return (
    <AppIconButton onClick={onClick} {...props} height={sizes.button} width={sizes.button}>
      <XIcon width={sizes.icon} height={sizes.icon} />
    </AppIconButton>
  );
};
