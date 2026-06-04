export function createWindowControls({
  appWindow,
  closeButton,
  maximizeButton,
  minimizeButton,
  flushPendingSave,
  invoke,
  status
}) {
  let quitting = false;

  function bind() {
    minimizeButton?.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      appWindow.minimize();
    });

    maximizeButton?.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      appWindow.toggleMaximize();
    });

    closeButton?.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      quitAfterSave();
    });

    appWindow.onCloseRequested(async (event) => {
      if (quitting) return;
      event.preventDefault();
      await quitAfterSave();
    });
  }

  async function quitAfterSave() {
    if (quitting) return;
    quitting = true;

    try {
      await flushPendingSave();
      await invoke('quit_app');
    } catch (error) {
      console.error('Close failed:', error);
      status.show('Close failed');
      quitting = false;
    }
  }

  return {
    bind
  };
}
