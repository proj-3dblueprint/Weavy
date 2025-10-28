export const MODEL_INPUT_LIMITS: Record<string, { maxInputs: number; inputPrefix: string }> = {
  'kwaivgi/kling-v1.6-pro': { maxInputs: 4, inputPrefix: 'reference_image' },
  hyper_3d_rodin: { maxInputs: 5, inputPrefix: 'image' },
  'fal-ai/nano-banana/edit': { maxInputs: 10, inputPrefix: 'image' },
  reve: { maxInputs: 4, inputPrefix: 'reference_image' },
  // Add more models here as needed:
  // 'another-model-name': { maxInputs: 6, inputPrefix: 'some_prefix' },
};
