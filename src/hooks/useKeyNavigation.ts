import { useCallback, useEffect, useMemo, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useReactFlow } from 'reactflow';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { log } from '@/logger/logger';
import { FF_KEY_NAVIGATION } from '@/consts/featureFlags';
import { isRecipeInteractionAllowed } from '@/components/Recipe/utils';
import { useEditorStore } from '@/components/Recipe/FlowComponents/Editor/editor.state';
import { useMediaGalleryContext } from '@/components/Recipe/FlowComponents/MediaGalleryContext';
import { useUserWorkflowRole, useWorkflowStore } from '@/state/workflow.state';
import { FlowMode } from '@/enums/flow-modes.enum';
import { getShortcut } from '@/utils/shortcuts';
import { getAxiosInstance } from '@/services/axiosConfig';
import { useHotkeyScope } from './useHotkeyScope';

const axiosInstance = getAxiosInstance();

export const useKeyNavigation = (flowViewingMode: FlowMode = FlowMode.Workflow) => {
  const { getNodes, fitView } = useReactFlow();
  const ff_isKeyNavigationEnabled = useFeatureFlagEnabled(FF_KEY_NAVIGATION);
  const isEditorOpen = useEditorStore((s) => s.isEditorOpen);
  const { isGalleryOpen } = useMediaGalleryContext();

  const role = useUserWorkflowRole();
  const recipeId = useWorkflowStore((s) => s.recipe.id);
  const recipe = useWorkflowStore((s) => s.recipe);
  const sections = useWorkflowStore((s) => s.recipe.sections);
  const setRecipe = useWorkflowStore((s) => s.setRecipe);

  const saveMarkedNodes = useCallback(
    async (key: string, selectedNodeIds: string[]) => {
      try {
        const copy = { ...sections };
        copy[key] = selectedNodeIds;
        await axiosInstance.post(`/v1/recipes/${recipeId}/sections`, { sections: copy });
        setRecipe({
          ...recipe,
          sections: copy,
        });
      } catch (error) {
        log.getLogger('useKeyNavigation').error('Failed to save marked nodes:', error);
      }
    },
    [recipe, recipeId, sections, setRecipe],
  );

  const markSelectedNodes = useCallback(
    async (number: string) => {
      const nodes = getNodes();
      const selectedNodes = nodes.filter((node) => node.selected);

      if (selectedNodes.length === 0) return;

      await saveMarkedNodes(
        number,
        selectedNodes.map((node) => node.id),
      );

      log.getLogger('useKeyNavigation').info(`Marked ${selectedNodes.length} nodes with number ${number}`);
    },
    [getNodes, saveMarkedNodes],
  );

  const navigateToMarkedNodes = useCallback(
    (number: string) => {
      if (!sections) return;

      const nodeIds = sections[number];
      if (!nodeIds || nodeIds.length === 0) {
        log.getLogger('useKeyNavigation').info(`No nodes marked with number ${number}`);
        return;
      }

      const nodes = getNodes();
      const targetNodes = nodes.filter((node) => nodeIds.includes(node.id));

      if (targetNodes.length > 0) {
        fitView({
          nodes: targetNodes,
          padding: 0.3,
          maxZoom: 1,
          duration: 500,
        });
        log.getLogger('useKeyNavigation').info(`Navigated to ${targetNodes.length} nodes marked with number ${number}`);
      } else {
        log.getLogger('useKeyNavigation').info(`Marked nodes with number ${number} no longer exist in the flow`);
      }
    },
    [sections, getNodes, fitView],
  );
  const isEnabled = useMemo(
    () => isRecipeInteractionAllowed(isEditorOpen, isGalleryOpen, role, flowViewingMode),
    [isEditorOpen, isGalleryOpen, role, flowViewingMode],
  );
  useHotkeyScope('workflow');

  const markShortcuts = useMemo(() => getShortcut('NAVIGATION_MARK_NODES'), []);
  useHotkeys(
    markShortcuts,
    (event) => {
      event.preventDefault();
      const { code } = event;
      const numberCode = code.replace('Digit', '');
      if (numberCode >= '0' && numberCode <= '9') {
        void markSelectedNodes(numberCode);
      }
    },
    { scopes: 'workflow', enabled: isEnabled && ff_isKeyNavigationEnabled },
  );

  const navigationShortcuts = useMemo(() => getShortcut('NAVIGATION_NAVIGATE_TO_NODES'), []);
  useHotkeys(
    navigationShortcuts,
    (event) => {
      // Only trigger if not in input/textarea and no modifiers are pressed
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey
      ) {
        return;
      }

      event.preventDefault();
      const key = event.key;
      if (key >= '0' && key <= '9') {
        navigateToMarkedNodes(key);
      }
    },
    { scopes: 'workflow', enabled: isEnabled && ff_isKeyNavigationEnabled },
  );

  return {
    markSelectedNodes,
    navigateToMarkedNodes,
  };
};

export const useGetMarkedKeysForNode = (nodeId: string) => {
  const [markedKeys, setMarkedKeys] = useState<string[]>([]);
  const sections = useWorkflowStore((s) => s.recipe.sections);
  useEffect(() => {
    if (!sections) return;

    const markedKeys: string[] = [];

    Object.entries(sections).forEach(([key, nodeIds]) => {
      if (nodeIds.includes(nodeId)) {
        markedKeys.push(key);
      }
    });

    setMarkedKeys(markedKeys);
  }, [nodeId, sections]);

  return markedKeys;
};
