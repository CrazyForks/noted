export function createNotesController({
  editor,
  indicator,
  invoke,
  status
}) {
  let notes = [];
  let currentIndex = 0;
  let saveTimeout = null;
  let pendingSave = Promise.resolve();

  async function init() {
    notes = await invoke('list_notes');
    if (notes.length === 0) {
      const note = await invoke('create_note');
      notes = [note];
    }
    currentIndex = 0;
    renderCurrentNote(false);
  }

  function renderCurrentNote(animate) {
    if (animate) return;
    editor.setDocument(getCurrentContent(), getCurrentNoteId());
    updateIndicator();
  }

  function updateIndicator() {
    if (notes.length <= 1) {
      indicator.classList.remove('visible');
      indicator.innerHTML = '';
      return;
    }

    indicator.classList.add('visible');

    if (notes.length <= 12) {
      let html = '';
      for (let i = 0; i < notes.length; i++) {
        html += `<div class="dot${i === currentIndex ? ' active' : ''}"></div>`;
      }
      indicator.innerHTML = html;
    } else {
      indicator.innerHTML = `<span class="note-count">${currentIndex + 1} / ${notes.length}</span>`;
    }
  }

  async function saveCurrentNote() {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }

    const note = notes[currentIndex];
    if (!note) return pendingSave;

    const content = editor.getValue();
    const noteIndex = currentIndex;
    notes[noteIndex].content = content;

    pendingSave = pendingSave
      .catch(() => {})
      .then(() => invoke('save_note', { id: note.id, content }))
      .catch((error) => {
        console.error('Save failed:', error);
        status.show('Save failed');
        throw error;
      });

    return pendingSave;
  }

  function scheduleSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveCurrentNote().catch(() => {});
    }, 300);
  }

  async function flushPendingSave() {
    if (saveTimeout) {
      await saveCurrentNote();
      return;
    }

    await pendingSave;
  }

  async function deleteIfEmpty() {
    const content = editor.getValue().trim();
    if (content === '' && notes.length > 1) {
      await flushPendingSave();
      const note = notes[currentIndex];
      await invoke('delete_note', { id: note.id });
      notes.splice(currentIndex, 1);
      if (currentIndex >= notes.length) currentIndex = notes.length - 1;
      return true;
    }
    return false;
  }

  async function appendNoteAfterSave() {
    await saveCurrentNote();
    const newNote = await invoke('create_note');
    notes.push(newNote);
    currentIndex = notes.length - 1;
    return getCurrentDocument();
  }

  async function moveToNextAfterSave() {
    await saveCurrentNote();
    currentIndex++;
    return getCurrentDocument();
  }

  async function moveToPrevAfterSave() {
    await saveCurrentNote();
    currentIndex--;
    return getCurrentDocument();
  }

  function getCurrentContent() {
    return notes[currentIndex]?.content || '';
  }

  function getCurrentNoteId() {
    return notes[currentIndex]?.id ?? null;
  }

  function getCurrentDocument() {
    return {
      id: getCurrentNoteId(),
      content: getCurrentContent()
    };
  }

  function isAtLastNote() {
    return currentIndex >= notes.length - 1;
  }

  function isAtFirstNote() {
    return currentIndex <= 0;
  }

  return {
    appendNoteAfterSave,
    deleteIfEmpty,
    flushPendingSave,
    getCurrentContent,
    getCurrentDocument,
    getCurrentNoteId,
    init,
    isAtFirstNote,
    isAtLastNote,
    moveToNextAfterSave,
    moveToPrevAfterSave,
    saveCurrentNote,
    scheduleSave,
    updateIndicator
  };
}
