import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { colorMap } from '@/colors';
import { useChannelsView } from '@/components/Recipe/FlowContext';
import { ChannelsData } from '@/types/node';
import { Dropdown, type Option } from '@/UI/Dropdown/Dropdown';
import { FlexCol } from '@/UI/styles';
import { I18N_KEYS } from '@/language/keys';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { DynamicNode2 } from '../DynamicNode/DynamicNode2';
import { InputViewer } from '../Shared/FileViewer';
import type { Channel, NodeId } from 'web';

function ChannelsNode({ id, data }: { id: NodeId; data: ChannelsData }) {
  const role = useUserWorkflowRole();
  const channelsView = useChannelsView(id);
  const { t } = useTranslation();
  const { channel, inputNode } = data;
  const editable = data.isLocked !== true && role === 'editor';

  const options = useMemo<Option<Channel>[]>(() => {
    return [
      { id: 'red', label: t(I18N_KEYS.RECIPE_MAIN.NODES.CHANNEL.RED), value: 'red' },
      { id: 'green', label: t(I18N_KEYS.RECIPE_MAIN.NODES.CHANNEL.GREEN), value: 'green' },
      { id: 'blue', label: t(I18N_KEYS.RECIPE_MAIN.NODES.CHANNEL.BLUE), value: 'blue' },
      { id: 'alpha', label: t(I18N_KEYS.RECIPE_MAIN.NODES.CHANNEL.ALPHA), value: 'alpha' },
    ];
  }, [t]);

  const handleChannelChange = useCallback(
    (option: Option<Channel>) => {
      void channelsView.setChannel(option.value);
    },
    [channelsView],
  );

  return (
    <DynamicNode2 id={id} data={data} className="channels" handleColor={colorMap.get(data.color)}>
      <InputViewer id={id} input={inputNode} />
      <FlexCol
        sx={{
          width: '100%',
          pt: 2,
        }}
      >
        <Dropdown size="small" value={channel} onChange={handleChannelChange} disabled={!editable} options={options} />
      </FlexCol>
    </DynamicNode2>
  );
}

export default ChannelsNode;
