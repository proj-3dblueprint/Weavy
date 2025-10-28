import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useNavigate } from 'react-router-dom';
import { Background, Panel, ReactFlow, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useHotkeyScope } from '@/hooks/useHotkeyScope';
import { useMousePosition } from '@/hooks/useMousePosition';
import { useKeyNavigation } from '@/hooks/useKeyNavigation';
import { log } from '@/logger/logger.ts';
import { isFileTypeAccepted } from '@/utils/fileTypes';
import { FF_TEXT_ITERATOR, FF_IMAGE_ITERATOR, FF_PAINTER_NODE, FF_NODE_GROUPING } from '@/consts/featureFlags';
import { useQueryParamsContext } from '@/contexts/QueryParamsContext';
import { color } from '@/colors';
import { RecipeType } from '@/enums/recipe-type.enum';
import { NodeType } from '@/enums/node-type.enum';
import { FlowMode } from '@/enums/flow-modes.enum';
import { I18N_KEYS } from '@/language/keys';
import { EyeIcon } from '@/UI/Icons/EyeIcon';
import { WarningCircleIcon } from '@/UI/Icons/WarningCircleIcon';
import { AppPaper, Flex } from '@/UI/styles';
import { AppToggleButtons } from '@/UI/AppToggleButtons/AppToggleButtons';
import { useNodeFiltersStore } from '@/state/nodes/nodes.state';
import { parseMenuData } from '@/state/nodes/nodes-parser';
import { useWorkflowStore, useUserWorkflowRole, useResetWorkflowState } from '@/state/workflow.state';
import { useGlobalStore } from '@/state/global.state';
import { useReactFlowCenterPosition } from '@/hooks/useReactFlowCenterPosition';
import { useProximityConnect } from '@/hooks/useProximityConnect';
import { getAxiosInstance } from '@/services/axiosConfig';
import { getShortcut } from '@/utils/shortcuts';
import { useSaveRecipe } from '@/hooks/useSaveRecipe';
import { HandleType } from '@/enums/handle-type.enum';
import { useDeleteEdgeOnSwipe } from '@/hooks/useDeleteEdgeOnSwipe';
import { NumberNode } from '../Nodes';
import StickyNoteNode from '../Nodes/StickyNoteNode';
import MuxNode from '../Nodes/MuxNode';
import { SeedNode } from '../Nodes/SeedNode/SeedNode';
import { ListSelectorNode } from '../Nodes/ListSelectorNode';
import { NumberSelectorNode } from '../Nodes/NumberSelectorNode';
import { ArrayNode } from '../Nodes/ArrayNode';
import ImportNode from '../Nodes/ImportNode/ImportNode';
import { BlurNode } from '../Nodes/Edit/BlurNode';
import ChannelsNode from '../Nodes/Edit/ChannelsNode';
import PhotopeaNode from '../Nodes/Edit/PhotopeaNode';
import PromptNodeV2 from '../Nodes/PromptNodeV2';
import { PromptNodeV3 } from '../Nodes/PromptNodeV3';
import ExportNode from '../Nodes/ExportNode/ExportNode';
import ModelBaseNode from '../Nodes/ModelBaseNode';
import MasksExtractionNode from '../Nodes/MasksExtractionNode';
import PromptConcat from '../Nodes/PromptConcat';
import PaintNodeV2 from '../Nodes/PaintNodeV2';
import { PainterNode } from '../Nodes/PainterNode';
import { StringNode } from '../Nodes/Helpers/StringNode';
import MergeAlphaNode from '../Nodes/Edit/MergeAlphaNode';
import LevelsNode from '../Nodes/Edit/LevelsNode';
import DilationErosionNode from '../Nodes/Edit/DilationErosionNode';
import InvertNode from '../Nodes/Edit/InvertNode';
import { RouterNode } from '../Nodes/RouterNode';
import OutputNode from '../Nodes/OutputNode';
import UploadLoraNode from '../Nodes/UploadLoraNode';
import MultiLoRANode from '../Nodes/MultiLoRANode';
import ExtractVideoFrameNode from '../Nodes/ExtractVideoFrameNode';
import PreviewNodeV2 from '../Nodes/PreviewNode/PreviewNodeV2';
import CompNodeV2 from '../Nodes/CompNodeV2';
import { CompNodeV3 } from '../Nodes/CompNodeV3';
import RenameNodeDialog from '../Nodes/RenameNodeDialog';
import { ToggleNode } from '../Nodes/ToggleNode/ToggleNode';
import { ResizeNode } from '../Nodes/ResizeNode';
import { ShortcutsPanel } from '../ShortcutsPanel/ShortcutsPanel';
import { CropNode } from '../Nodes/CropNode';
import MediaIteratorNode from '../Nodes/MediaIteratorNode/MediaIteratorNode';
import { CustomGroupNode } from '../Nodes/CustomGroupNode';
import { FlowActionsBar } from './FlowComponents/FlowActionsBar';
import LeftToolMenuV2 from './FlowComponents/LeftToolMenuV2';
import PropertiesDrawerV2 from './Drawer/PropertiesDrawerV2';
import { Editor } from './FlowComponents/Editor/Editor';
import ModelMediaGallery from './FlowComponents/ModelMediaGallery';
import FloatMenu from './Menu/FloatMenu';
import { FlowTour } from './FlowComponents/FlowTourElements';
import { useMediaGalleryContext } from './FlowComponents/MediaGalleryContext';
import { CustomEdge } from './CustomEdge';
import CustomTempEdge from './CustomTempEdge';
import DesignApp from './DesignApp/DesignApp';
import { useFlowNavigationTour } from './FlowComponents/FlowTour/useFlowNavigationTour';
import { TargetNode } from './FlowComponents/FlowTour/TargetNode';
import { useGraph } from './useGraph';
import { useSortedNodesForRendering, useEdges, useFlowView, useNodeGroupingView } from './FlowContext';
import { useReactFlowProps } from './hooks/useReactFlowProps';
import { isRecipeInteractionAllowed, createPoster, toReactFlowNode } from './utils';
import { NotificationsPanel } from './FlowComponents/NotificationsPanel';
import { CreditsInfo } from './FlowComponents/CreditsInfo/CreditsInfo';
import { WorkflowDesignAppSwitch } from './FlowComponents/WorkflowDesignAppSwitch/WorkflowDesignAppSwitch';
import { useEditorStore } from './FlowComponents/Editor/editor.state';
import { CREDITS_INFO_WIDTH, PANEL_WIDTH, TOOLBAR_WIDTH_V2 } from './consts/ui';
import { wrapNode } from './NodeWrapper';
import LeftPanelV2 from './FlowComponents/LeftPanelV2';
import { useSuggestionMenu } from './hooks/useSuggestionMenu';
import { SuggestionMenuTooltip } from './FlowComponents/SuggestionMenuTooltip';
import ShareWorkflowModal from './FlowComponents/ShareWorkflowModal';
import { useUserPreferences } from './hooks/useUserPreferences';
import TaskManager from './RunFlow/TaskManager/TaskManager';
import { useBatchesByRecipeId, useBatchesStore } from './RunFlow/batches.store';
import { useFlowRunContext } from './RunFlow/FlowRunContext';
import { isSomeNodesInRunningBatch } from './RunFlow/batch.utils';
import { useAutoSaveRecipe } from './hooks/useAutoSaveRecipe';
import SaveErrorSnackbar from './FlowComponents/SaveErrorSnackbar';
import { useGroupContextMenu } from './hooks/useGroupContextMenu';

const axiosInstance = getAxiosInstance();
const MIN_ZOOM_LEVEL = 0.01;
const MAX_ZOOM_LEVEL = 3;

const logger = log.getLogger('Flow');

const NAVBAR_HEIGHT = 48;
const READ_ONLY_PANEL_HEIGHT = 40;
const READ_ONLY_PANEL_EDITOR_WIDTH = 400;
const READ_ONLY_PANEL_GUEST_WIDTH = 480;

const DESIGN_APP_TOP_HEIGHT = 56;

const BLUR_AMOUNT = 3;

const ITERATOR_MENU_CATEGORY = {
  id: 'iterators',
  order: 35,
  children: [
    {
      id: 'text_iterator',
      displayName: 'Text Iterator',
      description: 'Iterate over a list of text values',
      icon: 'text-iterator',
      inputTypes: [HandleType.Array],
      outputTypes: [HandleType.Text],
      commercialUse: true,
      isLeaf: true,
      price: 0,
      searchText: 'text-iterator iterator text',
      isTool: true,
    },
  ],
};
const IMAGE_ITERATOR_MENU_ITEM = {
  id: 'image_iterator',
  displayName: 'Image Iterator',
  description: 'Iterate over a list of images',
  icon: 'image-iterator',
  inputTypes: [],
  outputTypes: [HandleType.Image],
  commercialUse: true,
  isLeaf: true,
  price: 0,
  searchText: 'image-iterator iterator image',
  isTool: true,
};

function Flow({ user, recipeId, viewingVersionMode }) {
  const recipe = useWorkflowStore((state) => state.recipe);
  const resetWorkflowState = useResetWorkflowState();

  const isNodeGroupingEnabled = useFeatureFlagEnabled(FF_NODE_GROUPING);

  const isDesignApp = recipe?.type === RecipeType.DesignApp; // temp
  const modelPricesMaps = useWorkflowStore((state) => state.modelPricesMaps);
  const flowView = useFlowView();
  const nodeGroupingView = useNodeGroupingView();
  const nodes = useSortedNodesForRendering();
  const edges = useEdges();

  const saveRecipe = useSaveRecipe();
  useAutoSaveRecipe();

  const selectedNodes = useMemo(() => nodes.filter((n) => n.selected), [nodes]);
  const isPropertiesDrawerOpen = useMemo(
    () =>
      selectedNodes.length > 0 &&
      selectedNodes.some((n) =>
        [
          'wildcardV2',
          'custommodelV2',
          'sd_inpaint',
          'sd_outpaint',
          'sd_sketch',
          'sd_text2image',
          'sd_upscale',
          'sd_img2video',
          'image2image',
          'br_text2image',
          'br_vector',
          'masks',
          'flux_pro',
          'flux_fast',
          'flux_lora',
          'ig_text2image',
          'sd_image23d',
          'nim_cc',
          'luma_video',
          'rw_video',
          'mochiv1',
          'kling',
          'meshy_image23d',
          'any_llm',
          'prompt_enhance',
          'multilora',
          'number_selector',
          'muxv2',
        ].includes(n.type),
      ),
    [selectedNodes],
  );

  const isIteratorsEnabled = useFeatureFlagEnabled(FF_TEXT_ITERATOR);
  const isImageIteratorEnabled = useFeatureFlagEnabled(FF_IMAGE_ITERATOR);
  const isPainterNodeEnabled = useFeatureFlagEnabled(FF_PAINTER_NODE);

  const { queryParamViewingMode } = useQueryParamsContext();

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { t } = useTranslation();
  // preferences
  const {
    userPrefOnScroll,
    userPrefShowFloatMenuOnRightClick,
    userPrefRequireAltKeyForSuggestions,
    handlePanOnScrollChange,
    handleShowFloatMenuOnRightClickChange,
    handleRequireAltKeyForSuggestionsChange,
  } = useUserPreferences();
  // end of preferences

  const navigate = useNavigate();
  const role = useUserWorkflowRole();

  const [selectOnDrag, setSelectOnDrag] = useState(true);
  const [reactFlowInitialized, setReactFlowInitialized] = useState(false);

  const [notificationData, setNotificationData] = useState({
    isOpen: false,
  });

  // Container size tracking
  const flowRef = useRef(null);
  const setReactFlowContainerRect = useWorkflowStore((s) => s.setReactFlowContainerRect);
  useEffect(() => {
    const updateContainerSize = () => {
      const reactFlowContainer = flowRef.current;
      if (reactFlowContainer) {
        const rect = reactFlowContainer.getBoundingClientRect();
        setReactFlowContainerRect(rect);
      }
    };
    // Initial size measurement
    updateContainerSize();

    // Set up ResizeObserver
    const reactFlowContainer = flowRef.current;
    if (reactFlowContainer) {
      const observer = new ResizeObserver(updateContainerSize);
      observer.observe(reactFlowContainer);
      return () => observer.disconnect();
    }
  }, [setReactFlowContainerRect]);

  const reactFlowInstanceRef = useRef(null);

  const onInit = useCallback((instance) => {
    reactFlowInstanceRef.current = instance;
    setReactFlowInitialized(true);
  }, []);

  /// UI ELEMENTS -
  /// FLOAT MENU
  const [floatMenu, setFloatMenu] = useState({
    mouseX: null,
    mouseY: null,
    isOpen: false,
    connection: null,
  });

  /// GROUP CONTEXT MENU
  const { openGroupContextMenu, groupContextMenuComponent } = useGroupContextMenu();

  // Track mouse position for keyboard shortcuts
  const mousePosition = useMousePosition();

  /// GALLERY
  const { isGalleryOpen } = useMediaGalleryContext();
  /// EDITOR
  const isEditorOpen = useEditorStore((selector) => selector.isEditorOpen);
  const clearEditor = useEditorStore((selector) => selector.clearNodeId);
  const openEditor = useEditorStore((selector) => selector.openEditor);

  const [viewport, setViewport] = useState(null);
  const handleOpenEditor = useCallback(
    (nodeId) => {
      setViewport(reactFlowInstanceRef.current.getViewport());
      openEditor(nodeId);
    },
    [openEditor],
  );

  /// main toolbar
  const [selectedMenu, setSelectedMenu] = useState();

  /// DIALOG
  const dialogData = useGlobalStore((s) => s.dialogData);
  const showDialog = !!dialogData;
  const closeOverlayDialog = useGlobalStore((s) => s.closeDialog);

  const DEFAULT_ZOOM_LEVEL = nodes.length > 1 ? 0.05 : 0.5;
  const { getNodes, fitView } = useReactFlow();

  /// FLOW VIEWING MODE
  const shouldShowDesignAppToggle = useMemo(() => {
    if (!nodes?.some((node) => node.type === NodeType.WorkflowOutput)) return false;
    if (role === 'editor') return true;
    return !!recipe.latestPublishedVersion;
  }, [nodes, role, recipe.latestPublishedVersion]);

  const [flowViewingMode, setFlowViewingMode] = useState(() => {
    const viewParam = queryParamViewingMode;

    if (role === 'editor' && viewParam === FlowMode.App && shouldShowDesignAppToggle) {
      return FlowMode.App;
    }

    if (role !== 'editor' && !recipe.latestPublishedVersion) {
      // prevent from guest to see the app mode if no published version
      return FlowMode.Workflow;
    }

    if (viewParam) {
      if (viewParam === FlowMode.App && !shouldShowDesignAppToggle) {
        return FlowMode.Workflow;
      }
      return viewParam;
    }
    return role === 'editor' || !shouldShowDesignAppToggle ? FlowMode.Workflow : FlowMode.App;
  });
  /**
   * @deprecated
   */
  const updateNodeData = useCallback((id, data) => flowView.updateNodeData(id, data), [flowView]);
  const { getCenterPosition } = useReactFlowCenterPosition();
  const duplicateNodes = useCallback(() => {
    if (role !== 'editor') return;

    flowView.duplicateNodes(flowView.selectedNodes, getCenterPosition());
  }, [flowView, getCenterPosition, role]);
  const deleteNode = useCallback((id) => flowView.deleteNodes([id]), [flowView]);
  const deselectAllNodes = useCallback(() => (flowView.selectedNodes = []), [flowView]);
  const deleteSelected = useCallback(() => flowView.deleteSelected(), [flowView]);
  const {
    addNewNode: graphAddNewNode,
    copyNodesToClipboard,
    pasteNodesOrImageFromClipboard: graphPasteNodesOrImageFromClipboard,
  } = useGraph();
  const addNewNode = useCallback(
    (nodeOptions) => {
      if (role !== 'editor') return; //todo: centralize the permissions

      graphAddNewNode(nodeOptions);
      void saveRecipe();
    },
    [graphAddNewNode, role, saveRecipe],
  );
  const pasteNodesOrImageFromClipboard = useCallback(
    (event) => {
      graphPasteNodesOrImageFromClipboard(event);
      void saveRecipe();
    },
    [graphPasteNodesOrImageFromClipboard, saveRecipe],
  );
  const openToolboxDrawer = useCallback(() => {
    setSelectedMenu('image');
  }, []);

  const closeToolboxDrawer = useCallback(() => {
    setSelectedMenu(null);
  }, []);

  const { activeTour } = useFlowNavigationTour({
    addNewNode,
    closeToolboxDrawer,
    deleteNode,
    openToolboxDrawer,
    reactFlowInitialized,
    recipeId,
    updateNodeData,
  });

  const { setMenuData, setIsMenuDataLoaded } = useNodeFiltersStore();

  // Hook for deleting edges on Cmd/Ctrl drag
  const { getDragState } = useDeleteEdgeOnSwipe();

  const fetchMenuItems = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/v1/node-definitions/menu`);
      if (isIteratorsEnabled) {
        res.data.menu.tools.push(ITERATOR_MENU_CATEGORY);
        if (isImageIteratorEnabled) {
          ITERATOR_MENU_CATEGORY.children.push(IMAGE_ITERATOR_MENU_ITEM);
        }
      }
      const parsedMenuData = parseMenuData(res.data);

      setMenuData(parsedMenuData);
    } catch (e) {
      logger.error('Error fetching menu items', e);
    } finally {
      setIsMenuDataLoaded(true);
    }
  }, [isIteratorsEnabled, setMenuData, setIsMenuDataLoaded]);

  useEffect(() => {
    if (role !== 'editor') return;

    fetchMenuItems();
  }, [fetchMenuItems, role]);

  // PAINT CANVAS RELATED (Prevent from painter interaction the bubbles to React flow)
  const handleCanvasInteraction = useCallback(() => {
    deselectAllNodes();
  }, [deselectAllNodes]);

  /// SUGGESTION MENU
  const {
    setAltModifier,
    anchorEl,
    isTooltipOpen,
    onConnectStart,
    onConnectEnd,
    onConnect: onSuggestionConnect,
    onEdgeUpdateStart: onSuggestionEdgeUpdateStart,
  } = useSuggestionMenu({
    setFloatMenu,
  });

  //// FLOAT MENU
  const handleFloatMenu = useCallback(
    (event) => {
      if (event.target.classList.contains('react-flow__pane')) {
        event.preventDefault();
        setFloatMenu({
          mouseX: event.clientX - 2,
          mouseY: event.clientY - 4,
          isOpen: true,
        });
        setAltModifier(false);
      }
    },
    [setAltModifier],
  );
  const handleFloatMenuClose = useCallback(() => {
    setFloatMenu((current) => ({ ...current, isOpen: false }));
    setAltModifier(false);
  }, [setAltModifier]);

  const handleNodeContextMenu = useCallback(
    (event, node) => {
      handleFloatMenuClose();
      if (node.type === NodeType.CustomGroup) {
        event.preventDefault();
        openGroupContextMenu(event.clientX, event.clientY, node.id);
      }
    },
    [handleFloatMenuClose, openGroupContextMenu],
  );
  /// END OF FLOAT MENU
  //// RUNNING MODELS

  const isTaskManagerOpen = useBatchesStore((s) => s.isTaskManagerOpen);
  const batches = useBatchesByRecipeId(recipeId);

  const BaseNode = wrapNode((nodeData) => (
    <ModelBaseNode {...nodeData} modelPricesMaps={modelPricesMaps} updateNodeData={updateNodeData} />
  ));

  const staticNodeTypesComponent = React.useMemo(
    () => ({
      any_llm: BaseNode,
      array: wrapNode((nodeData) => <ArrayNode {...nodeData} />),
      blur: wrapNode((nodeData) => <BlurNode {...nodeData} />),
      boolean: wrapNode((nodeData) => <ToggleNode {...nodeData} />),
      br_text2image: BaseNode,
      br_vector: BaseNode,
      channels: wrapNode((nodeData) => <ChannelsNode {...nodeData} />),
      compv2: wrapNode((nodeData) => (
        <CompNodeV2 {...nodeData} updateNodeData={updateNodeData} openEditWindow={handleOpenEditor} />
      )),
      compv3: wrapNode((nodeData) => <CompNodeV3 {...nodeData} openEditWindow={handleOpenEditor} />),
      crop: wrapNode((nodeData) => <CropNode {...nodeData} />),
      [NodeType.CustomGroup]: wrapNode((nodeData) => <CustomGroupNode {...nodeData} />),
      custommodel: wrapNode((nodeData) => (
        <ModelBaseNode
          editable={false}
          modelPricesMaps={modelPricesMaps}
          updateNodeData={updateNodeData}
          {...nodeData}
        />
      )),
      custommodelV2: wrapNode((nodeData) => (
        <ModelBaseNode
          editable={false}
          modelPricesMaps={modelPricesMaps}
          updateNodeData={updateNodeData}
          {...nodeData}
        />
      )),
      dalle3: BaseNode,
      edit: wrapNode((nodeData) => (
        <PhotopeaNode {...nodeData} updateNodeData={updateNodeData} openEditWindow={handleOpenEditor} />
      )),
      export: wrapNode((nodeData) => <ExportNode {...nodeData} />),
      extract_video_frame: wrapNode((nodeData) => <ExtractVideoFrameNode {...nodeData} />),
      flux_fast: BaseNode,
      flux_lora: BaseNode,
      flux_pro: BaseNode,
      ig_describe: BaseNode,
      ig_text2image: BaseNode,
      image2image: BaseNode,
      import: wrapNode((nodeData) => <ImportNode {...nodeData} updateNodeData={updateNodeData} />),
      media_iterator: wrapNode((nodeData) => <MediaIteratorNode {...nodeData} />),
      ImportLoRA: wrapNode((nodeData) => <UploadLoraNode {...nodeData} updateNodeData={updateNodeData} />),
      integer: wrapNode((nodeData) => <NumberNode {...nodeData} />),
      invert: wrapNode((nodeData) => <InvertNode {...nodeData} />),
      kling: BaseNode,
      levels: wrapNode((nodeData) => <LevelsNode {...nodeData} />),
      dilation_erosion: wrapNode((nodeData) => <DilationErosionNode {...nodeData} />),
      luma_video: BaseNode,
      masks: wrapNode((nodeData) => (
        <MasksExtractionNode
          recipeVersion={recipe.version}
          recipeId={recipeId}
          {...nodeData}
          updateNodeData={updateNodeData}
        />
      )),
      merge_alpha: wrapNode((nodeData) => <MergeAlphaNode {...nodeData} />),
      meshy_image23d: BaseNode,
      minimax: BaseNode,
      minimax_i2v: BaseNode,
      mochiv1: BaseNode,
      multilora: wrapNode((nodeData) => <MultiLoRANode {...nodeData} updateNodeData={updateNodeData} />),
      mux: wrapNode((nodeData) => <MuxNode {...nodeData} updateNodeData={updateNodeData} />),
      muxv2: wrapNode((nodeData) => <ListSelectorNode {...nodeData} />),
      number_selector: wrapNode((nodeData) => <NumberSelectorNode {...nodeData} />),
      nim_cc: BaseNode,
      objectremove: BaseNode,
      painterV2: wrapNode((nodeData) =>
        isPainterNodeEnabled ? (
          <PainterNode {...nodeData} />
        ) : (
          <PaintNodeV2 {...nodeData} updateNodeData={updateNodeData} onCanvasInteraction={handleCanvasInteraction} />
        ),
      ),
      preview: wrapNode((nodeData) => <PreviewNodeV2 {...nodeData} />),
      promptV2: wrapNode((nodeData) => <PromptNodeV2 {...nodeData} updateNodeData={updateNodeData} />),
      promptV3: wrapNode((nodeData) => <PromptNodeV3 {...nodeData} />),
      prompt_concat: wrapNode((nodeData) => <PromptConcat {...nodeData} />),
      prompt_enhance: BaseNode,
      resize: wrapNode((nodeData) => <ResizeNode {...nodeData} />),
      router: wrapNode((nodeData) => <RouterNode {...nodeData} />),
      rw_video: BaseNode,
      sd_bgrmv: BaseNode,
      sd_img2video: BaseNode,
      sd_inpaint: BaseNode,
      sd_outpaint: BaseNode,
      sd_sketch: BaseNode,
      sd_text2image: BaseNode,
      sd_upscale: BaseNode,
      seed: wrapNode((nodeData) => <SeedNode {...nodeData} />),
      stickynote: wrapNode((nodeData) => <StickyNoteNode {...nodeData} updateNodeData={updateNodeData} />),
      string: wrapNode((nodeData) => <StringNode {...nodeData} />),
      target: wrapNode((nodeData) => <TargetNode {...nodeData} />),
      wildcardV2: wrapNode((nodeData) => (
        <ModelBaseNode
          {...nodeData}
          updateNodeData={updateNodeData}
          editable={true}
          modelPricesMaps={modelPricesMaps}
        />
      )),
      workflow_output: wrapNode((nodeData) => <OutputNode {...nodeData} />),
    }),
    [handleCanvasInteraction, updateNodeData],
  );

  const edgeTypes = React.useMemo(
    () => ({
      custom: (edgeData) => <CustomEdge {...edgeData} getDragState={getDragState} />,
    }),
    [getDragState],
  );

  useEffect(() => {
    const handleBackButton = async () => {
      if (role === 'editor') await saveRecipe();
    };

    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [saveRecipe, role]);

  const handleGoToDashboard = useCallback(() => {
    navigate('/');

    const f = async () => {
      let posterImageUrl = recipe.poster;
      if (!posterImageUrl) {
        posterImageUrl = await createPoster({ getNodes });
      }
      void saveRecipe({ poster: posterImageUrl });
      resetWorkflowState();
    };
    void f();
  }, [recipe.poster, saveRecipe, navigate, getNodes, resetWorkflowState]);

  const createPromptNode = useCallback(() => {
    const newPromptTemplate = {
      id: 'jzXJ8QEfxQm2sZfvzu7q',
      displayName: 'Prompt',
    };
    addNewNode({ action: newPromptTemplate });
  }, [addNewNode]);

  /// KEYBOARD SHORTCUTS ACTIONS
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        event.target.tagName === 'INPUT' ||
        event.target.tagName === 'TEXTAREA' ||
        isEditorOpen ||
        isGalleryOpen ||
        flowViewingMode !== FlowMode.Workflow ||
        !(event instanceof KeyboardEvent)
      ) {
        return; // Skip handling the event if it's on an input or textarea or in editing mode or not a keyboard event
      }

      const isCtrl = event.metaKey || event.ctrlKey;
      const isShift = event.shiftKey;

      if (isCtrl && event.key === 'z') {
        event.preventDefault();
        if (event.getModifierState('Shift')) {
          flowView.redo();
        } else {
          flowView.undo();
        }
      }

      if (isCtrl && event.key === 'd') {
        event.preventDefault();
        duplicateNodes();
      }
      if (isCtrl && event.key === 'c') {
        if (!window.getSelection().toString()?.length) {
          // copy node only if no text selection
          event.preventDefault();
          copyNodesToClipboard();
        }
      }
      // if (isCtrl && event.key === 'v') {
      //   event.preventDefault();
      //   pasteNodesFromClipboard(event);
      // }
      if (isCtrl && event.key === 's') {
        event.preventDefault();
        saveRecipe();
      }
      if (isCtrl && event.key === 'p') {
        event.preventDefault();
        createPromptNode();
      }
      if (isCtrl && (event.key === '+' || event.key === '=')) {
        event.preventDefault();
        reactFlowInstanceRef.current?.zoomIn();
      }
      if (isCtrl && event.key === '-') {
        event.preventDefault();
        reactFlowInstanceRef.current?.zoomOut();
      }
      if (isCtrl && !isShift && event.key === '0') {
        event.preventDefault();
        reactFlowInstanceRef.current?.zoomTo(1);
      }
      if (isCtrl && !isShift && event.key === '1') {
        event.preventDefault();
        fitView();
      }

      // '/' and Cmd/Ctrl+K shortcut for FloatMenu (only for editors)
      const isKShortcut =
        (event.key === 'k' || event.key === 'K') && (event.metaKey || event.ctrlKey) && !event.altKey && !isShift;
      const isSlashShortcut = event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !isShift;
      const isTabShortcut = event.key === 'Tab' && !event.ctrlKey && !event.metaKey && !event.altKey && !isShift;

      // Skip number keys (0-9) as they're handled by useKeyNavigation
      const isNumberKey =
        event.key >= '0' && event.key <= '9' && !event.ctrlKey && !event.metaKey && !event.altKey && !isShift;

      if (role === 'editor' && !floatMenu.isOpen && (isSlashShortcut || isKShortcut || isTabShortcut) && !isNumberKey) {
        event.preventDefault();

        let menuX, menuY;

        if (isKShortcut || !mousePosition.current) {
          // fallback to center if no mouse position or is K shortcut
          const width = window.innerWidth;
          const height = window.innerHeight;
          menuX = Math.round(width / 2 - 100);
          menuY = Math.round(height / 2 - 100);
        } else {
          // Use mouse position for Tab and '/' keys
          menuX = mousePosition.current.x - 2;
          menuY = mousePosition.current.y - 4;
        }

        setFloatMenu({
          mouseX: menuX,
          mouseY: menuY,
          isOpen: true,
        });
      }
      // if (event.key === 'Escape') {
      //   event.preventDefault();
      //   setShowGallery(false);
      // }
    };

    const handlePaste = (event) => {
      // event.preventDefault();
      pasteNodesOrImageFromClipboard(event);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('paste', handlePaste);
    };
  }, [
    selectedNodes,
    nodes,
    duplicateNodes,
    copyNodesToClipboard,
    saveRecipe,
    createPromptNode,
    pasteNodesOrImageFromClipboard,
    isEditorOpen,
    isGalleryOpen,
    fitView,
    role,
    floatMenu.isOpen,
    flowView,
    flowViewingMode,
    mousePosition,
  ]);

  const moveNodes = useCallback(
    (evt) => {
      if (floatMenu.isOpen) {
        return;
      }

      let delta = { x: 0, y: 0 };
      if (evt.key === 'ArrowUp') {
        delta.y = -1;
      } else if (evt.key === 'ArrowDown') {
        delta.y = 1;
      } else if (evt.key === 'ArrowLeft') {
        delta.x = -1;
      } else if (evt.key === 'ArrowRight') {
        delta.x = 1;
      }
      const scale = evt.shiftKey ? 100 : 10;
      delta.x *= scale;
      delta.y *= scale;

      flowView.moveNodesBy(flowView.selectedNodes, delta);
    },
    [floatMenu.isOpen, flowView],
  );

  const createGroupFromSelectedNodes = useCallback(
    (event) => {
      event.preventDefault();
      nodeGroupingView.createGroupFromSelectedNodes();
    },
    [nodeGroupingView],
  );

  // FIXME useHotkeys scope?
  useHotkeys(
    ['Delete', 'Backspace'],
    () => {
      if (
        isSomeNodesInRunningBatch(
          selectedNodes.map((node) => node.id),
          batches,
        )
      ) {
        return;
      }
      deleteSelected();
    },
    {
      enabled: isRecipeInteractionAllowed(isEditorOpen, isGalleryOpen, role, flowViewingMode),
    },
  );
  useHotkeys(['up', 'down', 'left', 'right', 'shift+up', 'shift+down', 'shift+left', 'shift+right'], moveNodes, {
    enabled: isRecipeInteractionAllowed(isEditorOpen, isGalleryOpen, role, flowViewingMode),
  });

  useHotkeys(['meta+g', 'ctrl+g'], createGroupFromSelectedNodes, {
    enabled: isNodeGroupingEnabled && isRecipeInteractionAllowed(isEditorOpen, isGalleryOpen, role, flowViewingMode),
  });

  useHotkeyScope('workflow');
  const { runNextConnectedNodes } = useFlowRunContext();
  useKeyNavigation(flowViewingMode);

  const runNextConnectedNodesShortcut = useCallback(() => {
    try {
      runNextConnectedNodes();
    } catch (error) {
      logger.error('Could not run next connected nodes', error);
    }
  }, [runNextConnectedNodes]);

  useHotkeys(getShortcut('RUN_MODEL'), runNextConnectedNodesShortcut, {
    scopes: 'workflow',
    enableOnContentEditable: true,
    enableOnFormTags: true,
    enabled: isRecipeInteractionAllowed(isEditorOpen, isGalleryOpen, role, flowViewingMode),
  });

  const handleUndoRedo = useCallback(
    (undoRedo) => {
      if (undoRedo === 'undo') {
        flowView.undo();
      } else {
        flowView.redo();
      }
    },
    [flowView],
  );

  //// END OF RUNNING MODELS

  //// DRAG EVENTS
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      // If the event was already handled by a child component, don't process it
      if (event.defaultPrevented) {
        return;
      }

      if (role !== 'editor') return;
      event.preventDefault();

      const itemString = event.dataTransfer.getData('menuItem');
      if (itemString) {
        let item;
        try {
          item = JSON.parse(itemString);
        } catch (_e) {
          return;
        }

        // check if the dropped element is valid
        if (typeof item === 'undefined' || !item) {
          return;
        }

        // handle drop on menu (probably user wants to cancel)
        if (item && event.clientX >= 240) {
          addNewNode({ action: item, dropX: event.clientX, dropY: event.clientY });
        }

        return;
      }
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          // Check if file type is accepted
          const isAccepted = isFileTypeAccepted(file);

          if (!isAccepted) {
            logger.warn(`File type not supported: ${file.name} (${file.type})`);
            continue; // Skip this file
          }

          const item = {
            type: 'import',
            pastedData: { imageFile: file },
            id: 'wkKkBSd0yrZGwbStnU6rClone',
          };
          addNewNode({ action: item, dropX: event.clientX + i * 100, dropY: event.clientY + i * 100 });
        }
      }
    },
    [role, addNewNode],
  );

  const duplicateRecipe = useCallback(async () => {
    try {
      const response = await axiosInstance.post(`/v1/recipes/${recipeId}/duplicate`);
      window.open(`${window.location.origin}/flow/${response.data.id}`, '_blank');
    } catch (error) {
      logger.error('error duplicating recipe: ', error);
    }
  }, [recipeId]);

  const handleDuplicateRecipe = useCallback(async () => {
    try {
      await duplicateRecipe();
    } catch (error) {
      logger.error('Could not duplicate recipe', error);
    }
  }, [duplicateRecipe]);

  useEffect(() => {
    if (flowViewingMode === FlowMode.App) {
      setNotificationData({ isOpen: false });
    } else if (flowViewingMode === FlowMode.Workflow && (viewingVersionMode || role !== 'editor')) {
      let text, actionCtaText, onClick;
      if (!user) {
        text = t(I18N_KEYS.RECIPE_MAIN.FLOW.GENERAL.READ_ONLY_PANEL.TITLE_READER);
        actionCtaText = t(I18N_KEYS.RECIPE_MAIN.FLOW.GENERAL.READ_ONLY_PANEL.CTA_GUEST);
        onClick = () => navigate('/signin', { state: { from: window.location.pathname } });
      } else if (viewingVersionMode) {
        text = t(I18N_KEYS.RECIPE_MAIN.FLOW.GENERAL.READ_ONLY_PANEL.TITLE_EDITOR);
        actionCtaText = t(I18N_KEYS.RECIPE_MAIN.FLOW.GENERAL.READ_ONLY_PANEL.CTA_EDITOR);
        onClick = () => (window.location.href = window.location.pathname);
      } else {
        text = t(I18N_KEYS.RECIPE_MAIN.FLOW.GENERAL.READ_ONLY_PANEL.TITLE_READER);
        actionCtaText = t(I18N_KEYS.RECIPE_MAIN.FLOW.GENERAL.READ_ONLY_PANEL.CTA_READER);
        onClick = handleDuplicateRecipe;
      }

      setNotificationData({
        text,
        isOpen: true,
        icon: viewingVersionMode ? <WarningCircleIcon width={20} height={20} /> : <EyeIcon width={20} height={20} />,
        action: {
          text: actionCtaText,
          onClick,
        },
      });
    } else if (flowViewingMode === FlowMode.Workflow && role === 'editor' && notificationData.isOpen) {
      setNotificationData({
        isOpen: false,
      });
    }
  }, [flowViewingMode, viewingVersionMode, handleDuplicateRecipe, t, role, user, navigate, notificationData.isOpen]);

  const {
    onConnect: onReactFlowConnect,
    onEdgeUpdateStart,
    onEdgeUpdateEnd,
    onEdgeUpdate,
    onEdgesChange,
    onNodesChange,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
    onSelectionDragStart,
    onSelectionDrag,
    onSelectionDragStop,
    isValidConnection,
  } = useReactFlowProps();

  // Proximity connect hook for shift+drag connections (feature flagged)
  useProximityConnect();

  // Combined onConnect handler that calls both the original and suggestion menu handlers
  const onConnect = useCallback(
    (connection) => {
      onReactFlowConnect(connection);
      onSuggestionConnect(connection);
    },
    [onReactFlowConnect, onSuggestionConnect],
  );

  // Combined onEdgeUpdate handler that calls both the original and suggestion menu handlers
  const onEdgeUpdateCombined = useCallback(
    (oldEdge, newConnection) => {
      onEdgeUpdate(oldEdge, newConnection);
      onSuggestionConnect(newConnection);
    },
    [onEdgeUpdate, onSuggestionConnect],
  );

  const onEdgeUpdateStartCombined = useCallback(
    (event, edge, handleType) => {
      onEdgeUpdateStart(event, edge, handleType);
      onSuggestionEdgeUpdateStart(event, edge, handleType);
    },
    [onEdgeUpdateStart, onSuggestionEdgeUpdateStart],
  );

  // Ref to track user-triggered menu selection
  const lastMenuChangeByUser = useRef(false);
  // Ref to prevent scroll jump after scroll-triggered menu change
  const justScrolledRef = useRef(false);
  // User-triggered setter
  const setSelectedMenuUser = useCallback((item) => {
    lastMenuChangeByUser.current = true;
    setSelectedMenu(item);
  }, []);

  const highlightedGroupId = useWorkflowStore((state) => state.highlightedGroupId);
  const reactFlowNodes = useMemo(
    () => nodes.map((node) => toReactFlowNode(node, highlightedGroupId)),
    [nodes, highlightedGroupId],
  );
  return (
    <>
      <AnimatePresence onExitComplete={clearEditor}>
        {isEditorOpen && (
          <motion.div
            style={{
              backgroundColor: color.Black64_T,
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 101,
              height: '100%',
              width: '100%',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Editor />
          </motion.div>
        )}
      </AnimatePresence>

      <Box id="react-flow-container" sx={{ width: '100%', height: '100%' }} ref={flowRef}>
        {!isEditorOpen && (
          <ReactFlow
            defaultViewport={viewport ?? { x: 0, y: 0, zoom: DEFAULT_ZOOM_LEVEL }}
            edgeTypes={edgeTypes}
            edges={edges}
            fitView={!viewport && nodes.length > 1 && !activeTour}
            fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
            minZoom={MIN_ZOOM_LEVEL}
            maxZoom={MAX_ZOOM_LEVEL}
            nodeTypes={staticNodeTypesComponent}
            nodes={reactFlowNodes}
            onConnect={onConnect}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            onContextMenu={
              userPrefShowFloatMenuOnRightClick !== undefined
                ? userPrefShowFloatMenuOnRightClick
                  ? handleFloatMenu
                  : undefined
                : handleFloatMenu
            }
            onDragOver={onDragOver}
            onDrop={onDrop}
            onEdgeUpdateStart={onEdgeUpdateStartCombined}
            onEdgeUpdate={onEdgeUpdateCombined}
            onEdgeUpdateEnd={onEdgeUpdateEnd}
            onInit={onInit}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStart={onNodeDragStart}
            onNodeDrag={onNodeDrag}
            onNodeDragStop={onNodeDragStop}
            onNodeContextMenu={handleNodeContextMenu}
            onSelectionDragStart={onSelectionDragStart}
            onSelectionDrag={onSelectionDrag}
            onSelectionDragStop={onSelectionDragStop}
            panOnDrag={selectOnDrag ? [1, 2] : [0, 1]}
            panOnScroll={userPrefOnScroll !== undefined ? userPrefOnScroll : true}
            panOnScrollSpeed={1.5}
            selectionMode="partial"
            selectionOnDrag={selectOnDrag}
            snapGrid={[10, 10]}
            snapToGrid
            style={{ background: color.Black100 }}
            zoomOnDoubleClick={false}
            connectionRadius={70}
            connectionLineType="bezier"
            connectionLineComponent={CustomTempEdge}
            isValidConnection={isValidConnection}
            /// PERMISSIONS
            nodesDraggable={role !== 'guest'}
            nodesConnectable={role !== 'guest'}
            edgesUpdatable={role !== 'guest'}
            deleteKeyCode={null}
            disableKeyboardA11y={true}
            proOptions={{ hideAttribution: true }}
          >
            <Background color={color.Yambo_Black_Stroke} variant="dots" id="react-flow-background" />
            <Panel position="top-left" style={{ left: role === 'guest' ? 0 : TOOLBAR_WIDTH_V2 }}>
              <WorkflowDesignAppSwitch
                flowViewingMode={flowViewingMode}
                setFlowViewingMode={setFlowViewingMode}
                goToDashboard={handleGoToDashboard}
                shouldShowDesignAppToggle={shouldShowDesignAppToggle}
              />
            </Panel>
            <Panel position="top-right" style={{ right: 0, top: 100 }}>
              <ShortcutsPanel />
            </Panel>
            {shouldShowDesignAppToggle && (
              <Panel position="top-center">
                <AppPaper sx={{ height: '40px', alignItems: 'center', display: 'flex', px: 1 }}>
                  <AppToggleButtons
                    value={flowViewingMode}
                    btnW={60}
                    options={[
                      { value: FlowMode.Workflow, label: t(I18N_KEYS.RECIPE_MAIN.FLOW.WORKFLOW) },
                      { value: FlowMode.App, label: t(I18N_KEYS.RECIPE_MAIN.FLOW.DESIGN_APP) },
                    ]}
                    onChange={setFlowViewingMode}
                  />
                </AppPaper>
              </Panel>
            )}
            {!viewingVersionMode && role === 'editor' && (
              <>
                <Panel position="top-right">
                  <CreditsInfo />
                </Panel>
                {isTaskManagerOpen && (
                  <Panel position="top-right" style={{ right: CREDITS_INFO_WIDTH + 8 }}>
                    <TaskManager />
                  </Panel>
                )}
              </>
            )}

            <Panel position="bottom-center" style={{ margin: 0, marginBottom: '16px' }}>
              <Flex sx={{ gap: 1 }}>
                <FlowActionsBar
                  zoomLimitsPercentage={{ min: 1, max: 300 }}
                  onZoomIn={() => reactFlowInstanceRef.current?.zoomIn()}
                  onZoomOut={() => reactFlowInstanceRef.current?.zoomOut()}
                  onZoomToHundred={() => reactFlowInstanceRef.current?.zoomTo(1)}
                  onZoomToFit={() => fitView()}
                  setSelectOnDrag={setSelectOnDrag}
                  isEditMode={!viewingVersionMode && role === 'editor'}
                  onUndoRedo={handleUndoRedo}
                  canUndo={flowView.hasUndo()}
                  canRedo={flowView.hasRedo()}
                />
              </Flex>
            </Panel>
            {/* All panels for editor (not guest) */}
            {!isDesignApp && role === 'editor' && (
              <>
                <Panel
                  data-testid="left-panel-panel"
                  position="left"
                  style={{
                    height: '100%',
                    width: `${PANEL_WIDTH}px`,
                    top: '0px',
                    left: `${TOOLBAR_WIDTH_V2}px`,
                    margin: 0,
                    opacity: selectedMenu ? 1 : 0,
                    transition: 'width 0.1s, opacity 0.2s ease-in-out',
                  }}
                  className={!isEditorOpen && selectedMenu ? 'slide-left-enter' : 'slide-left-exit'}
                >
                  <LeftPanelV2
                    selectedMenu={selectedMenu}
                    setSelectedItem={setSelectedMenuUser}
                    lastMenuChangeByUser={lastMenuChangeByUser}
                    justScrolledRef={justScrolledRef}
                    shouldHidePanel={isEditorOpen}
                  />
                </Panel>

                <Panel
                  data-testid="left_tool_menu"
                  position="left"
                  style={{
                    height: '100%',
                    width: `${TOOLBAR_WIDTH_V2}px`,
                    left: '0px',
                    top: '0px',
                    margin: 0,
                  }}
                >
                  <LeftToolMenuV2
                    selectedItem={selectedMenu}
                    setSelectedItem={setSelectedMenuUser}
                    goToDashboard={handleGoToDashboard}
                    onDuplicateRecipe={handleDuplicateRecipe}
                    panOnScrollEnabled={userPrefOnScroll}
                    onPanOnScrollChange={handlePanOnScrollChange}
                    showFloatMenuOnRightClickEnabled={userPrefShowFloatMenuOnRightClick}
                    onShowFloatMenuOnRightClickChange={handleShowFloatMenuOnRightClickChange}
                    requireAltKeyForSuggestionsEnabled={userPrefRequireAltKeyForSuggestions}
                    onRequireAltKeyForSuggestionsChange={handleRequireAltKeyForSuggestionsChange}
                    onShareWorkflow={() => setIsShareModalOpen(true)}
                  />
                </Panel>

                {role === 'editor' && (
                  <Panel>
                    {floatMenu.isOpen && (
                      <FloatMenu
                        positionX={floatMenu.mouseX}
                        positionY={floatMenu.mouseY}
                        isOpen={floatMenu.isOpen}
                        onClose={handleFloatMenuClose}
                        addNewNode={addNewNode}
                        connection={floatMenu.connection}
                      />
                    )}
                    {groupContextMenuComponent}
                  </Panel>
                )}
                {isPropertiesDrawerOpen && (
                  <Panel
                    position="right"
                    style={{
                      height: '100%',
                      width: `${PANEL_WIDTH}px`,
                      top: '0px',
                      right: '0px',
                      margin: 0,
                      zIndex: 100,
                    }}
                    className={selectedNodes.length > 0 ? 'slide-right-enter' : 'slide-right-exit'}
                  >
                    <PropertiesDrawerV2 updateNodeData={updateNodeData} />
                  </Panel>
                )}
              </>
            )}
            {isGalleryOpen && (
              <Panel
                data-testid="media-gallery-panel"
                style={{
                  width: '100%',
                  height: '100%',
                  background: `${color.Black92_T}`,
                  top: 0,
                  margin: 0,
                  zIndex: 1002,
                }}
                className="fade-in"
              >
                <ModelMediaGallery />
              </Panel>
            )}
            {showDialog && (
              <Panel
                id="dialog-panel"
                style={{
                  width: '100%',
                  height: '100%',
                  top: 0,
                  margin: 0,
                  zIndex: 1002,
                }}
                className="fade-in"
              >
                <RenameNodeDialog
                  dialogData={dialogData}
                  updateNodeData={updateNodeData}
                  closeOverlayDialog={closeOverlayDialog}
                />
              </Panel>
            )}
            {flowViewingMode === FlowMode.App && (
              <Panel
                id="design-app-panel"
                style={{
                  width: '100%',
                  height: `calc(100% - ${DESIGN_APP_TOP_HEIGHT}px)`,
                  background: `${color.Black64_T}`,
                  backdropFilter: `blur(${BLUR_AMOUNT}px)`,
                  WebkitBackdropFilter: `blur(${BLUR_AMOUNT}px)`,
                  top: `${DESIGN_APP_TOP_HEIGHT}px`,
                  margin: 0,
                  zIndex: 9999,
                }}
                className="fade-in"
              >
                <DesignApp
                  isGuest={!user}
                  recipeId={recipeId}
                  nodes={nodes}
                  edges={edges}
                  readOnly={viewingVersionMode}
                  updateNodeData={updateNodeData}
                />
              </Panel>
            )}
            <Panel position="top-center" style={shouldShowDesignAppToggle ? { top: `${NAVBAR_HEIGHT}px` } : {}}>
              {notificationData.isOpen && (
                <NotificationsPanel
                  width={viewingVersionMode ? READ_ONLY_PANEL_EDITOR_WIDTH : READ_ONLY_PANEL_GUEST_WIDTH}
                  height={READ_ONLY_PANEL_HEIGHT}
                  content={notificationData}
                />
              )}
            </Panel>
            {/* end of panels for editor (not guest) */}
            <SuggestionMenuTooltip isOpen={isTooltipOpen} anchorEl={anchorEl} />
          </ReactFlow>
        )}
        <SaveErrorSnackbar />
      </Box>
      <ShareWorkflowModal open={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />
      <FlowTour />
    </>
  );
}

export default Flow;
