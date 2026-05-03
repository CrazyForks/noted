const { invoke } = window.__TAURI__.core;

const canvas = document.getElementById('note-canvas');
let saveTimeout = null;

// Load saved note on startup
async function loadNote() {
  try {
    const content = await invoke('load_note');
    canvas.value = content;
  } catch (err) {
    console.error('Failed to load note:', err);
  }
}

// Auto-save with a short debounce
function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      await invoke('save_note', { content: canvas.value });
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  }, 300); // saves 300ms after you stop typing
}

window.addEventListener('DOMContentLoaded', () => {
  loadNote();
  canvas.focus();

  canvas.addEventListener('input', scheduleSave);
});
