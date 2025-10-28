import { RouterIcon } from '@/UI/Icons/RouterIcon';
import { ImageIcon } from '@/UI/Icons/ImageIcon';
import { TextIcon } from '@/UI/Icons/TextIcon';
import { HandleType } from '@/enums/handle-type.enum';
import { VideoCameraIcon } from '@/UI/Icons/VideoCamera';
import { useFlowView } from '../Recipe/FlowContext';
import { DynamicNode2 } from './DynamicNode/DynamicNode2';
import type { RouterData } from '@/types/node';

function RouterNodeIcon({ handleType }: { handleType?: HandleType | undefined }) {
  switch (handleType) {
    case HandleType.Image:
      return <ImageIcon />;
    case HandleType.Text:
      return <TextIcon />;
    case HandleType.Video:
      return <VideoCameraIcon />;
    default:
      return <RouterIcon />;
  }
}

export function RouterNode({ id, data }: { id: string; data: RouterData }) {
  const flowView = useFlowView();
  const inputType = flowView.nodeInputType(id, 'in');

  return (
    <DynamicNode2
      id={id}
      data={data}
      hideBody={true}
      inputHandleYPos="50%"
      outputHandleYPos="50%"
      className="router"
      icon={<RouterNodeIcon handleType={inputType} />}
      size="small"
    />
  );
}
