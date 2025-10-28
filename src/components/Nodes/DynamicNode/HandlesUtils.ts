import { HandleType } from '@/enums/handle-type.enum';
import { color } from '@/colors';

export const getHandleName = (handleId: string | null | undefined): string => {
  if (!handleId) return '';
  if (handleId.includes('-output-')) return handleId.split('-output-')[1];
  if (handleId.includes('-input-')) return handleId.split('-input-')[1];
  return '';
};

export const getHandleType = (handleId: string | null | undefined, node: any) => {
  if (!node || !node.data || !handleId) return HandleType.Any;
  let handleKey = '';
  let isOutput = false;

  if (handleId.includes('-output-')) {
    handleKey = handleId.split('-output-')[1];
    isOutput = true;
  } else if (handleId.includes('-input-')) {
    handleKey = handleId.split('-input-')[1];
    isOutput = false;
  }

  const { version, handles } = node.data;
  let handleType = HandleType.Any;

  if (handles && handleKey) {
    if (isOutput && handles.output && version === 3) {
      handleType = handles.output[handleKey]?.type;
    } else if (!isOutput && handles.input) {
      handleType = handles.input[handleKey]?.type;
    }
  }

  return handleType;
};
export const getHandleColor = (type: HandleType | undefined) => {
  switch (type) {
    case HandleType.Image:
      return color.DataType_Image;
    case HandleType.Video:
      return color.DataType_Video;
    case HandleType.Audio:
      return color.DataType_Audio;
    case HandleType.ThreeDee:
      return color.DataType_3D;
    case HandleType.Text:
      return color.DataType_Text;
    case HandleType.Mask:
      return color.DataType_Mask;
    case HandleType.Lora:
      return color.DataType_Lora;
    case HandleType.Seed:
      return color.DataType_Seed;
    case HandleType.Number:
      return color.DataType_Number;
    case HandleType.Boolean:
      return color.DataType_Boolean;
    case HandleType.Array:
      return color.DataType_Array;
    default:
      return color.DataType_Any;
  }
};
