/**
 * Resets a file input element's value to allow re-selection of the same file.
 * This is needed because onChange won't fire if the same file is selected again.
 * @param event - The file input change event
 */
export const resetFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
  event.target.value = '';
};

/**
 * Handles file selection and automatically resets the input for re-selection.
 * @param event - The file input change event
 * @param onFileSelected - Callback when a file is selected
 */
export const handleFileInputChange = (
  event: React.ChangeEvent<HTMLInputElement>,
  onFileSelected: (file: File) => void,
) => {
  const file = event.target.files?.[0];
  if (file) {
    onFileSelected(file);
    resetFileInput(event);
  }
};
