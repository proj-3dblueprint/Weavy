import { useTranslation } from 'react-i18next';
import { useRef } from 'react';
import { NodeId } from 'web';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { FlexCenVer } from '@/UI/styles';
import { Input } from '@/UI/Input/Input';
import { useSeedView } from '@/components/Recipe/FlowContext';
import { AppCheckbox } from '@/UI/AppCheckbox/AppCheckbox';
import { useNumberInput } from '@/hooks/useNumberInput';
import { I18N_KEYS } from '@/language/keys';
import { hasEditingPermissions } from '../Utils';
import { DynamicNode2 } from '../DynamicNode/DynamicNode2';
import type { SeedData } from '@/types/node';

interface SeedNodeProps {
  id: NodeId;
  data: SeedData;
}

export const SeedNode = ({ id, data }: SeedNodeProps) => {
  const role = useUserWorkflowRole();
  const { t } = useTranslation();
  const seedView = useSeedView(id);
  const { seed, isRandom } = data;
  const inputRef = useRef<HTMLInputElement>(null);
  const { handleBlur, handleFocus, handleKeyDown, handleChange, displayedValue } = useNumberInput({
    inputRef,
    value: seed,
    onSubmit: (value) => {
      if (value > 0 && value <= Number.MAX_SAFE_INTEGER) {
        void seedView.setSeed(value, false);
      }
    },
    decimals: 0,
  });

  return (
    <DynamicNode2 id={id} data={data} className="mux" size="small" outputHandleYPos="31px">
      <FlexCenVer
        sx={{
          width: '100%',
          pointerEvents: !hasEditingPermissions(role, data) ? 'none' : '',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <AppCheckbox
          label={t(I18N_KEYS.RECIPE_MAIN.NODES.SEED.RANDOM)}
          checked={isRandom ?? false}
          onChange={(e) => void seedView.setIsRandom(e.target.checked, false)}
        />
        <Input
          value={displayedValue}
          fullWidth
          disabled={isRandom}
          size="small"
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDownCapture={handleKeyDown}
          inputRef={inputRef}
          aria-autocomplete="none"
          autoComplete="off"
        />
      </FlexCenVer>
    </DynamicNode2>
  );
};
