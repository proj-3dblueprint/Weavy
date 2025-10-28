import { Fragment, useCallback, type ReactNode } from 'react';
import { type BaseMultiSelectProps, BaseSelect, type Option } from '../BaseSelect/BaseSelect';
import { isOptionLike, type TriggerOptions } from '../BaseSelect/selectUtils';
import { FlexCenVer } from '../styles';

interface MultiSelectProps<T, Opt extends Option<T>>
  extends Omit<BaseMultiSelectProps<T, Opt>, 'renderTrigger' | 'onChange'> {
  renderLabel?: (options: TriggerOptions) => ReactNode;
  onChange: (newValue: T[]) => void;
}

const mapToValue = <T,>(value: T[] | Option<T>[]): T[] => {
  return value.map((v: T | Option<T>) => (isOptionLike(v) ? v.value : v));
};

export const MultiSelect = <T, Opt extends Option<T>>({
  value,
  onChange,
  options,
  renderLabel,
  ...selectProps
}: MultiSelectProps<T, Opt>) => {
  const onSelectChange = useCallback(
    (option: Option<T>) => {
      if (value.length === 0) {
        onChange([option.value]);
      } else {
        const mappedValue = mapToValue<T>(value);
        if (mappedValue.includes(option.value)) {
          onChange(mappedValue.filter((v) => v !== option.value));
        } else {
          onChange([...mappedValue, option.value]);
        }
      }
    },
    [value, onChange],
  );

  const getKey = useCallback(
    (option: Option<T>) => (typeof option.id === 'string' ? option.id : option.id(option.value)),
    [],
  );

  const renderTrigger = useCallback(
    (triggerOptions: TriggerOptions) => {
      if (renderLabel) {
        return renderLabel(triggerOptions);
      }
      const mappedValue = mapToValue<T>(value);
      const selectedOptions = options.filter((option) => mappedValue.includes(option.value));
      return (
        <FlexCenVer sx={{ gap: 0.5 }}>
          {selectedOptions.map((option) => (
            <Fragment key={getKey(option)}>{option.label}</Fragment>
          ))}
        </FlexCenVer>
      );
    },
    [renderLabel, value, options, getKey],
  );

  return (
    <BaseSelect
      {...selectProps}
      noCloseOnSelect
      value={value}
      options={options}
      onChange={onSelectChange}
      renderTrigger={renderTrigger}
    />
  );
};
