import { useCallback } from 'react';
import { Trans } from 'react-i18next';
import { Dropdown, type Option } from '@/UI/Dropdown/Dropdown';
import { openIntercom } from '@/providers/intercom';

interface SelectInputProps<T extends string> {
  disabled: boolean;
  value: T;
  helperText?: string;
  noOptionsText?: string;
  onReset: () => void;
  onSubmit: (value: T, ongoing: boolean) => void;
  options: Option<T>[];
  search?: boolean;
  size?: 'small' | 'large';
}
export function SelectInput<T extends string>({
  disabled,
  value,
  helperText,
  noOptionsText,
  onReset,
  onSubmit,
  options,
  search = false,
  size = 'small',
}: SelectInputProps<T>) {
  const handleClose = useCallback(() => {
    onReset();
  }, [onReset]);
  const handleChange = useCallback(
    (option: Option<T>) => {
      onSubmit(option.value, false);
    },
    [onSubmit],
  );
  const handleOngoingChange = useCallback(
    (option: Option<T> | null) => {
      if (option?.value) {
        onSubmit(option.value, true);
      } else {
        onReset();
      }
    },
    [onSubmit, onReset],
  );

  return (
    <Dropdown
      disabled={disabled}
      helperText={
        helperText ? (
          <Trans
            i18nKey={helperText}
            components={{
              supportEmail: <a onClick={openIntercom} style={{ color: 'inherit', textDecoration: 'underline' }} />,
            }}
          />
        ) : undefined
      }
      noOptionsText={noOptionsText ? <Trans i18nKey={noOptionsText} /> : undefined}
      onChange={handleChange}
      onClose={handleClose}
      onHighlightedOptionChange={handleOngoingChange}
      options={options}
      placement="auto"
      search={search}
      value={value}
      width={size === 'small' ? '88px' : '180px'}
    />
  );
}
