import { ModelType } from '@/enums/model-type.enum';
import { ThreeDIcon } from '@/UI/Icons/ThreeDIcon';
import { RelightIcon } from '@/UI/Icons/RelightIcon';
import { VideoSmooterIcon } from '@/UI/Icons/VideoSmooterIcon';
import { VideoUpscaleIcon } from '@/UI/Icons/VideoUpscaleIcon';
import { PromptConcatIcon } from '@/UI/Icons/PromptConcatIcon';
import { VideoDescriberIcon } from '@/UI/Icons/VideoDescriberIcon';
import { VideoMatteIcon } from '@/UI/Icons/VideoMatteIcon';
import { getModelType } from '../Utils';
import type { Model } from '@/types/nodes/model';

export const getNodeIcon = (model?: Partial<Model>, size = '24px') => {
  if (!model || !model.name) {
    return null;
  }
  const modelType = getModelType(model as Required<Model>);
  if (modelType === ModelType.Replicate) {
    return MODEL_ICONS[model.name as keyof typeof MODEL_ICONS]?.(size) || MODEL_ICONS[ModelType.Replicate]?.(size);
  }
  if (modelType === ModelType.FalImported) {
    return MODEL_ICONS[model.name as keyof typeof MODEL_ICONS]?.(size) || MODEL_ICONS[ModelType.FalImported]?.(size);
  }
  return MODEL_ICONS[modelType as keyof typeof MODEL_ICONS]?.(size) || null;
};

const imageIconElement = (src) => {
  const ImageIcon = (size) => <img src={src} width={size} height={size} alt="" />;
  ImageIcon.displayName = `ImageIcon(${src})`;
  return ImageIcon;
};

const iconComponents = {
  ThreeDIcon: (size) => <ThreeDIcon width={size} height={size} />,
  RelightIcon: (size) => <RelightIcon width={size} height={size} />,
  VideoSmooterIcon: (size) => <VideoSmooterIcon width={size} height={size} />,
  VideoUpscaleIcon: (size) => <VideoUpscaleIcon width={size} height={size} />,
  VideoMergeIcon: (size) => <PromptConcatIcon width={size} height={size} />,
  VideoDescribeIcon: (size) => <VideoDescriberIcon width={size} height={size} />,
  VideoMatteIcon: (size) => <VideoMatteIcon width={size} height={size} />,
};

const MODEL_ICONS = {
  [ModelType.FalImported]: imageIconElement('/menu-images/fal100x100.png'),
  [ModelType.Replicate]: imageIconElement('/menu-images/replicate100x100.png'),
  [ModelType.Civit]: imageIconElement('/menu-images/civit100x100.png'),
  [ModelType.Dalle]: imageIconElement('/menu-images/oa100x100.png'),
  [ModelType.GptImage1]: imageIconElement('/menu-images/oa100x100.png'),
  [ModelType.GptImage1Edit]: imageIconElement('/menu-images/oa100x100.png'),
  [ModelType.SDImageGeneration]: imageIconElement('/menu-images/sd100x100.png'),
  [ModelType.SDInpaint]: imageIconElement('/menu-images/sd100x100.png'),
  [ModelType.SDOutpaint]: imageIconElement('/menu-images/sd100x100.png'),
  [ModelType.SDRemoveBackground]: imageIconElement('/menu-images/sd100x100.png'),
  [ModelType.SDRemoveObject]: imageIconElement('/menu-images/sd100x100.png'),
  [ModelType.SDImg2Img]: imageIconElement('/menu-images/sd100x100.png'),
  [ModelType.SDUpscale]: imageIconElement('/menu-images/sd100x100.png'),
  [ModelType.SDImage2Video]: imageIconElement('/menu-images/sd100x100.png'),
  [ModelType.SDControlnet]: imageIconElement('/menu-images/sd100x100.png'),
  [ModelType.SDImage23D]: imageIconElement('/menu-images/sd100x100.png'),
  [ModelType.BRRemoveObject]: imageIconElement('/menu-images/br100x100.png'),
  [ModelType.BRInpaint]: imageIconElement('/menu-images/br100x100.png'),
  [ModelType.BRPsd]: imageIconElement('/menu-images/br100x100.png'),
  [ModelType.BRTextToImage]: imageIconElement('/menu-images/br100x100.png'),
  [ModelType.BRMasks]: imageIconElement('/menu-images/br100x100.png'),
  [ModelType.BRRemoveBackground]: imageIconElement('/menu-images/br100x100.png'),
  [ModelType.BRReplaceBackground]: imageIconElement('/menu-images/br100x100.png'),
  [ModelType.IdeogramText2Image]: imageIconElement('/menu-images/ig100x100.png'),
  [ModelType.IdeogramV3]: imageIconElement('/menu-images/ig100x100.png'),
  [ModelType.IdeogramV3Character]: imageIconElement('/menu-images/ig100x100.png'),
  [ModelType.IdeogramV3ReplaceBackground]: imageIconElement('/menu-images/ig100x100.png'),
  // [ModelType.IdeogramDescribe]: imageIconElement('/menu-images/ig100x100.png'),
  [ModelType.NimCC]: imageIconElement('/menu-images/nv100x100.png'),
  [ModelType.BRVector]: imageIconElement('/menu-images/br100x100.png'),
  [ModelType.Luma]: imageIconElement('/menu-images/lm100x100.png'),
  [ModelType.LumaVideoModify]: imageIconElement('/menu-images/lm100x100.png'),
  [ModelType.LumaRay2]: imageIconElement('/menu-images/lm100x100.png'),
  [ModelType.LumaRay2Flash]: imageIconElement('/menu-images/lm100x100.png'),
  [ModelType.RunwayVideo]: imageIconElement('/menu-images/rw100x100.png'),
  [ModelType.Runway4Video]: imageIconElement('/menu-images/rw100x100.png'),
  [ModelType.RunwayActTwo]: imageIconElement('/menu-images/rw100x100.png'),
  [ModelType.RunwayAleph]: imageIconElement('/menu-images/rw100x100.png'),
  [ModelType.MehsyImage23D]: imageIconElement('/menu-images/ms100x100.png'),
  [ModelType.MochiV1]: imageIconElement('/menu-images/genmo100x100.png'),
  [ModelType.Kling]: imageIconElement('/menu-images/kl100x100.png'),
  [ModelType.Minimax]: imageIconElement('/menu-images/mm100x100.png'),
  // [ModelType.AnyLLM]: iconComponents.AnyLLMIcon,
  [ModelType.LTXI2V]: imageIconElement('/menu-images/ltx100x100.png'),
  [ModelType.Hyper3dRodin]: imageIconElement('/menu-images/rodin100x100.png'),
  [ModelType.FalFluxMultiLora]: imageIconElement('/menu-images/flux100x100.png'),
  [ModelType.FalFluxKontextLora]: imageIconElement('/menu-images/flux100x100.png'),
  [ModelType.Skyreels]: imageIconElement('/menu-images/sr100x100.png'),
  [ModelType.GoogleVeo2]: imageIconElement('/menu-images/ggl100x100.png'),
  [ModelType.KolorsVTO]: imageIconElement('/menu-images/kl100x100.png'),
  [ModelType.TopazEnhance]: imageIconElement('/menu-images/topaz100x100.png'),
  [ModelType.TopazSharpen]: imageIconElement('/menu-images/topaz100x100.png'),
  [ModelType.TopazUpscaleVideo]: imageIconElement('/menu-images/topaz100x100.png'),
  [ModelType.Trellis3D]: iconComponents.ThreeDIcon,
  [ModelType.HunyuanVideoToVideo]: imageIconElement('/menu-images/tencent100x100.png'),
  [ModelType.GeminiEdit]: imageIconElement('/menu-images/gemini100x100.png'),
  [ModelType.Relight2]: iconComponents.RelightIcon,
  [ModelType.Wan21Vace]: imageIconElement('/menu-images/wan100x100.png'),
  [ModelType.Wan22]: imageIconElement('/menu-images/wan100x100.png'),
  [ModelType.WanVace14bPose]: imageIconElement('/menu-images/wan100x100.png'),
  [ModelType.WanVace14bOutpaint]: imageIconElement('/menu-images/wan100x100.png'),
  [ModelType.WanVace14bReframe]: imageIconElement('/menu-images/wan100x100.png'),
  [ModelType.WanVace14bDepth]: imageIconElement('/menu-images/wan100x100.png'),
  [ModelType.Imagen4]: imageIconElement('/menu-images/ggl100x100.png'),
  [ModelType.FreepikMystic]: imageIconElement('/menu-images/magnific100x100.png'),
  [ModelType.FreepikMagnificUpscale]: imageIconElement('/menu-images/magnific100x100.png'),
  [ModelType.FreepikMagnificUpscalePrecision]: imageIconElement('/menu-images/magnific100x100.png'),
  [ModelType.Vectorizer]: imageIconElement('/menu-images/vectorizer100x100.png'),
  [ModelType.Seedance]: imageIconElement('/menu-images/bytedance100x100.png'),
  [ModelType.MinimaxV2]: imageIconElement('/menu-images/mm100x100.png'),
  [ModelType.GoogleVeo3]: imageIconElement('/menu-images/ggl100x100.png'),
  [ModelType.GoogleVeo3Fast]: imageIconElement('/menu-images/ggl100x100.png'),
  [ModelType.GoogleVeo3T2V]: imageIconElement('/menu-images/ggl100x100.png'),
  [ModelType.GoogleVeo3I2V]: imageIconElement('/menu-images/ggl100x100.png'),
  [ModelType.FluxKontext]: imageIconElement('/menu-images/flux100x100.png'),
  [ModelType.ElevenLabsVoiceChange]: imageIconElement('/menu-images/el100x100.png'),
  [ModelType.Moonvalley]: imageIconElement('/menu-images/mv100x100.png'),
  [ModelType.HiggsfieldI2V]: imageIconElement('/menu-images/hf100x100.png'),
  [ModelType.HiggsfieldT2I]: imageIconElement('/menu-images/hf100x100.png'),
  [ModelType.Reve]: imageIconElement('/menu-images/reve100x100.png'),
  [ModelType.ReveEdit]: imageIconElement('/menu-images/reve100x100.png'),
  [ModelType.Enhancor]: imageIconElement('/menu-images/enhancor100x100.png'),
  [ModelType.Ltx2Video]: imageIconElement('/menu-images/ltx100x100.png'),
  [ModelType.Sora]: imageIconElement('/menu-images/oa100x100.png'),
  'google/imagen-3': imageIconElement('/menu-images/ggl100x100.png'),
  'google/imagen-4': imageIconElement('/menu-images/ggl100x100.png'),
  'google/imagen-3-fast': imageIconElement('/menu-images/ggl100x100.png'),
  'black-forest-labs/flux-1.1-pro-ultra': imageIconElement('/menu-images/flux100x100.png'),
  'black-forest-labs/flux-1.1-pro': imageIconElement('/menu-images/flux100x100.png'),
  'black-forest-labs/flux-schnell': imageIconElement('/menu-images/flux100x100.png'),
  'recraft-ai/recraft-v3': imageIconElement('/menu-images/rc100x100.png'),
  'ideogram-ai/ideogram-v3-quality': imageIconElement('/menu-images/ig100x100.png'),
  'stability-ai/stable-diffusion-3.5-large': imageIconElement('/menu-images/sd100x100.png'),
  'minimax/image-01': imageIconElement('/menu-images/mm100x100.png'),
  'luma/photon': imageIconElement('/menu-images/lm100x100.png'),
  'nvidia/sana': imageIconElement('/menu-images/nv100x100.png'),
  'recraft-ai/recraft-v3-svg': imageIconElement('/menu-images/rc100x100.png'),
  'black-forest-labs/flux-fill-pro': imageIconElement('/menu-images/flux100x100.png'),
  'ideogram-ai/ideogram-v2': imageIconElement('/menu-images/ig100x100.png'),
  'black-forest-labs/flux-redux-dev': imageIconElement('/menu-images/flux100x100.png'),
  'xlabs-ai/flux-dev-controlnet': imageIconElement('/menu-images/flux100x100.png'),
  'rossjillian/controlnet': imageIconElement('/menu-images/sd100x100.png'),
  'recraft-ai/recraft-crisp-upscale': imageIconElement('/menu-images/rc100x100.png'),
  'pixverse/pixverse-v4': imageIconElement('/menu-images/pixverse100x100.png'),
  'haiper-ai/haiper-video-2': imageIconElement('/menu-images/haiper100x100.png'),
  'minimax/video-01-director': imageIconElement('/menu-images/mm100x100.png'),
  'minimax/video-01': imageIconElement('/menu-images/mm100x100.png'),
  'tencent/hunyuan-video': imageIconElement('/menu-images/tencent100x100.png'),
  'tencent/hunyuan3d-2mv': imageIconElement('/menu-images/tencent100x100.png'),
  'wan-video/wan-2.1-1.3b': imageIconElement('/menu-images/wan100x100.png'),
  'pollinations/amt': iconComponents.VideoSmooterIcon,
  'lucataco/real-esrgan-video': iconComponents.VideoUpscaleIcon,
  'luma/reframe-video': imageIconElement('/menu-images/lm100x100.png'),
  'runwayml/gen4-image': imageIconElement('/menu-images/rw100x100.png'),
  'google/veo-3': imageIconElement('/menu-images/ggl100x100.png'),
  'flux-kontext-apps/multi-image-kontext-max': imageIconElement('/menu-images/flux100x100.png'),
  'kwaivgi/kling-v1.6-pro': imageIconElement('/menu-images/kl100x100.png'),
  'pixverse/pixverse-v4.5': imageIconElement('/menu-images/pixverse100x100.png'),
  'fal-ai/wan-22': imageIconElement('/menu-images/wan100x100.png'),
  'bytedance/seededit-3.0': imageIconElement('/menu-images/bytedance100x100.png'),
  'lucataco/video-merge': iconComponents.VideoMergeIcon,
  'fal-ai/nano-banana/edit': imageIconElement('/menu-images/gemini100x100.png'),
  'fal-ai/bytedance/seedream/v4/edit': imageIconElement('/menu-images/bytedance100x100.png'),
  'fal-ai/video-understanding': iconComponents.VideoDescribeIcon,
  'fal-ai/bytedance/omnihuman/v1.5': imageIconElement('/menu-images/bytedance100x100.png'),
  'fal-ai/sync-lipsync/v2/pro': imageIconElement('/menu-images/sync100x100.png'),
  'fal-ai/kling-video/v1/pro/ai-avatar': imageIconElement('/menu-images/kl100x100.png'),
  'arielreplicate/robust_video_matting': iconComponents.VideoMatteIcon,
  'fal-ai/pixverse/lipsync': imageIconElement('/menu-images/pixverse100x100.png'),
  'fal-ai/wan-25-preview/image-to-video': imageIconElement('/menu-images/wan100x100.png'),
  'bria/video/increase-resolution': imageIconElement('/menu-images/br100x100.png'),
  'fal-ai/luma-dream-machine/ray-2/modify': imageIconElement('/menu-images/lm100x100.png'),
  'fal-ai/qwen-image-edit-plus': imageIconElement('/menu-images/wan100x100.png'),
  'fal-ai/hunyuan3d-v21': imageIconElement('/menu-images/tencent100x100.png'),
};
