import DynamicFields from '../Nodes/ModelComponents/DynamicFields';
import MultiLoRACoreProperties from '../Nodes/MultiLoRACoreProperties';

const nodeTypesMap = {
  any_llm: DynamicFields,
  br_text2image: DynamicFields,
  br_vector: DynamicFields,
  custommodel: DynamicFields,
  custommodelV2: DynamicFields,
  /**
   * TODO: Export - a separate component should display properties of this node in the properties drawer.
   * Specifically, a select option to select the file type to export (it was handled inside the node itself which we don't want).
   * Because this doesn't work well with DynamicFieldsWrapper and the params of this node (the exported file type
   * is not a param), need to think of a better way to handle this.
   * Currently, drawer is disabled for this node. See Flow.jsx and the list of nodes we display
   * drawer for.
   */
  // export: ExportCoreProperties,
  flux_fast: DynamicFields,
  flux_lora: DynamicFields,
  flux_pro: DynamicFields,
  ig_text2image: DynamicFields,
  image2image: DynamicFields,
  kling: DynamicFields,
  luma_video: DynamicFields,
  masks: DynamicFields,
  meshy_image23d: DynamicFields,
  mochiv1: DynamicFields,
  multilora: MultiLoRACoreProperties, // X - shows in properties drawer
  muxv2: DynamicFields,
  number_selector: DynamicFields,
  nim_cc: DynamicFields,
  prompt_enhance: DynamicFields,
  rw_video: DynamicFields,
  sd_image23d: DynamicFields,
  sd_img2video: DynamicFields,
  sd_inpaint: DynamicFields,
  sd_outpaint: DynamicFields,
  sd_sketch: DynamicFields,
  sd_text2image: DynamicFields,
  sd_upscale: DynamicFields,
  wildcardV2: DynamicFields,
} as const;

export default nodeTypesMap;
