import { useViewport } from 'reactflow';
import { ActionsBar } from '@/components/ActionsBar/ActionsBar';
import { getPercentageInt } from '@/utils/numbers';
import type { ActionsBarProps } from '@/components/ActionsBar/ActionsBar';

export function FlowActionsBar(props: Omit<ActionsBarProps, 'zoomPercentage'>) {
  const { zoom } = useViewport();
  const zoomPercentage = getPercentageInt(zoom);
  return <ActionsBar {...props} zoomPercentage={zoomPercentage} />;
}
