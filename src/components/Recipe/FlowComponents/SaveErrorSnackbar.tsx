import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { I18N_KEYS } from '@/language/keys';
import { useWorkflowStore } from '@/state/workflow.state';
import ErrorSnackbar from '@/UI/ErrorSnackbar/ErrorSnackbar';
import { useSaveRecipe } from '@/hooks/useSaveRecipe';
import { useWithLoader } from '@/hooks/useWithLoader';

function SaveErrorSnackbar() {
  const { t } = useTranslation();
  const workflowError = useWorkflowStore((s) => s.workflowError);
  const setWorkflowError = useWorkflowStore((s) => s.setWorkflowError);
  const saveRecipe = useSaveRecipe();

  const handleSave = useCallback(async () => {
    try {
      await saveRecipe(undefined, true);
      setWorkflowError(undefined);
    } catch {
      /* empty */
    }
  }, [saveRecipe, setWorkflowError]);

  const { execute: executeSave, isLoading } = useWithLoader(handleSave, { sync: true });

  if (!workflowError) return null;

  const action = {
    label:
      workflowError === 'Conflict'
        ? t(I18N_KEYS.RECIPE_MAIN.ERRORS.SAVE_ERRORS.CONFLICT.ACTION)
        : t(I18N_KEYS.RECIPE_MAIN.ERRORS.SAVE_ERRORS.GENERAL.ACTION),
    onClick: workflowError === 'Conflict' ? () => window.location.reload() : executeSave,
    disabled: isLoading,
    loading: isLoading,
  };
  const errorMessage =
    workflowError === 'Conflict'
      ? t(I18N_KEYS.RECIPE_MAIN.ERRORS.SAVE_ERRORS.CONFLICT.MESSAGE)
      : t(I18N_KEYS.RECIPE_MAIN.ERRORS.SAVE_ERRORS.GENERAL.MESSAGE);

  // In the meanwhile we only show the conflict error snackbar
  return <ErrorSnackbar open={workflowError === 'Conflict'} errorMessage={errorMessage} action={action} />;
}

export default SaveErrorSnackbar;
