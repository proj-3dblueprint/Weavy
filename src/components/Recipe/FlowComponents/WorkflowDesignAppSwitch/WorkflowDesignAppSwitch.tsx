import { Typography } from '@mui/material';
import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { AppPaper, Flex, FlexCenHorVer } from '@/UI/styles';
import { Input } from '@/UI/Input/Input';
import { EllipsisText } from '@/UI/EllipsisText/EllipsisText';
import { useDebugContext } from '@/hooks/useDebugContext';
import { useUserWorkflowRole, useWorkflowStore } from '@/state/workflow.state';

interface WorkflowDesignAppSwitchProps {
  isPaperBg: boolean;
  hideDevLabel?: boolean;
  goToDashboard?: () => void;
}

export const WorkflowDesignAppSwitch = ({
  isPaperBg = true,
  hideDevLabel = false,
  goToDashboard,
}: WorkflowDesignAppSwitchProps) => {
  const [isEditingName, setIsEditingName] = useState(false);

  const recipe = useWorkflowStore((state) => state.recipe);
  const renameRecipe = useWorkflowStore((state) => state.renameRecipe);

  const [newRecipeName, setNewRecipeName] = useState<string>(recipe.name);
  const oldRecipeName = useRef<string>('');
  const nameRef = useRef<HTMLInputElement>(null);

  const role = useUserWorkflowRole();
  const { DEBUG_TOGGLE } = useDebugContext();

  const isShowLogo = role === 'guest';

  useEffect(() => {
    setNewRecipeName(recipe.name);
  }, [recipe.name]);

  useEffect(() => {
    if (isEditingName && nameRef.current) {
      oldRecipeName.current = newRecipeName;
      nameRef.current.focus();
      const input = nameRef.current.querySelector('input');
      if (input) {
        input.select();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditingName]);

  const handleRenameRecipe = useCallback(
    async (newName: string) => {
      if (newName === recipe.name) {
        return;
      }
      await renameRecipe(newName);
    },
    [renameRecipe, recipe.name],
  );

  const handleRecipeNameChange = (e: ChangeEvent<HTMLInputElement>) => setNewRecipeName(e.target.value);

  const handleRecipeNameBlur = () => {
    if (!newRecipeName.trim()) {
      setNewRecipeName(oldRecipeName.current);
    } else {
      void renameRecipe(newRecipeName);
    }
    setIsEditingName(false);
  };

  const handleRecipeNameEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!newRecipeName.trim()) {
        setNewRecipeName(oldRecipeName.current);
      } else {
        void handleRenameRecipe(newRecipeName);
      }
      setIsEditingName(false);
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setNewRecipeName(oldRecipeName.current);
      setIsEditingName(false);
    }
  };

  const Container = isPaperBg ? AppPaper : FlexCenHorVer;

  return (
    <Container
      sx={{
        ...(isPaperBg ? { display: 'flex', alignItems: 'center' } : {}),
        width: '220px',
        height: '40px',
        position: 'relative',
        py: '6px',
        pl: isShowLogo ? 1.5 : 2,
        pr: 1,
      }}
    >
      <img
        src="/icons/logo.svg"
        alt="logo"
        width={24}
        height={24}
        onClick={() => goToDashboard?.()}
        style={{ display: isShowLogo ? 'block' : 'none', cursor: 'pointer', marginRight: '24px' }}
      />

      <Flex sx={{ flex: 1, minWidth: 0 }}>
        {isEditingName ? (
          <Input
            fullWidth
            size="small"
            ref={nameRef}
            value={newRecipeName}
            onBlur={handleRecipeNameBlur}
            onKeyDown={handleRecipeNameEnter}
            onChange={handleRecipeNameChange}
          />
        ) : (
          <EllipsisText
            sx={{ flex: 1 }}
            variant="body-std-md"
            onClick={() => {
              if (role === 'editor') setIsEditingName(true);
            }}
          >
            {newRecipeName}
          </EllipsisText>
        )}
        {/* {shouldShowDesignAppToggle && <Divider orientation="vertical" flexItem sx={{ mx: 1.5 }} />} */}
      </Flex>
      {/* {shouldShowDesignAppToggle && (
        <AppToggleButtons
          value={flowViewingMode}
          options={[
            { value: FlowMode.Workflow, label: t(I18N_KEYS.RECIPE_MAIN.FLOW.WORKFLOW) },
            { value: FlowMode.App, label: t(I18N_KEYS.RECIPE_MAIN.FLOW.DESIGN_APP) },
          ]}
          onChange={handleFlowViewingModeChange}
        />
      )} */}

      {!hideDevLabel && import.meta.env.MODE === 'development' ? (
        <Typography
          onClick={DEBUG_TOGGLE}
          sx={{
            position: 'absolute',
            right: -120,
            cursor: 'pointer',
            color: 'red',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          Development
        </Typography>
      ) : null}
    </Container>
  );
};
