import { StateField } from '@codemirror/state';
import { ViewPlugin } from '@codemirror/view';

const MODES = new Set(['list', 'math', 'code']);

export function detectEditorMode(doc) {
  const firstLine = doc.line(1).text.trim().toLowerCase().replace(/:$/, '');
  return MODES.has(firstLine) ? firstLine : 'text';
}

export const activeEditorModeField = StateField.define({
  create(state) {
    return detectEditorMode(state.doc);
  },
  update(value, transaction) {
    if (!transaction.docChanged) return value;
    return detectEditorMode(transaction.state.doc);
  }
});

export const activeEditorModeDomPlugin = ViewPlugin.fromClass(class {
  constructor(view) {
    this.updateMode(view);
  }

  update(update) {
    if (update.docChanged) this.updateMode(update.view);
  }

  updateMode(view) {
    view.dom.dataset.editorMode = view.state.field(activeEditorModeField);
  }
});
