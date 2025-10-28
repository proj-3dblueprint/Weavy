export const SAVE_AS_PSD_SCRIPT = `app.activeDocument.saveToOE("psd")`;
export const LAYER_COUNT_SCRIPT = `
  function cnt(d) { var r=0; if (d.layers) { for (var i=0; i<d.layers.length; i++)  r+=cnt(d.layers[i])+1; } return r; }
  app.echoToOE("layerCount=" + (app.documents.length == 0 ? 0 : cnt(app.activeDocument)));
`;
export const CONVERT_TO_SMART_OBJECT_SCRIPT = `
  // TODO - add selection of layer.
  app.activeDocument = app.documents[0];
  app.activeDocument.activeLayer = app.activeDocument.artLayers.getByName("Background");
  executeAction(stringIDToTypeID("placedLayerEditContents")); 
`;
export const CONVERT_BACKGROUND_TO_SMART_OBJECT_SCRIPT = `
  var doc = app.activeDocument;
  // doc.activeLayer.name = "Image Smart Object";
  var idnewPlacedLayer = stringIDToTypeID( 'newPlacedLayer' );
  executeAction(idnewPlacedLayer, undefined, DialogModes.NO);
`;

export const COPY_AND_PASTE_INTO_SMART_OBJECT_SCRIPT = `
  var srcDoc = app.documents[app.documents.length - 1];
  var smartObjectDoc = app.documents[1];
  var psdDoc = app.documents[0];
  // app.activeDocument = srcDoc;
  srcDoc.selection.selectAll();
  srcDoc.selection.copy();
  srcDoc.close(SaveOptions.DONOTSAVECHANGES);
  smartObjectDoc.paste();
  smartObjectDoc.artLayers.getByName("Background").remove();
  smartObjectDoc.activeLayer.name = "Background";
  smartObjectDoc.save();
  smartObjectDoc.close(SaveOptions.DONOTSAVECHANGES);
`;

export const config: {
  files: string[];
} & Record<string, unknown> = {
  files: [],
  resources: [],
  environment: {
    theme: 1,
    lang: 'en',
    vmode: 0,
    intro: false,
    eparams: { guides: true, grid: false, gsize: 8, paths: true, pgrid: false },
    showtools: [
      0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 23, 24, 25, 27, 28, 29, 30, 31, 32, 33,
      34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
    ],
    panels: [0, 2],
    phrases: [[1, 0], 'Open Design', [1, 2], 'Save Design'],
    menus: [0, 1, 1, 1, 1, 1, 1],
  },
  apis: { dezgo: 'd4e5f6' },
};
