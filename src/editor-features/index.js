import {
  activeEditorModeDomPlugin,
  activeEditorModeField
} from './mode-detector.js';

export { activeEditorModeField, detectEditorMode } from './mode-detector.js';

export function createEditorFeatureExtensions() {
  return [
    activeEditorModeField,
    activeEditorModeDomPlugin
  ];
}
