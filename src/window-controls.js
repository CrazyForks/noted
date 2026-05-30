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

  function debugLog(message) {
    console.info(`[noted] ${message}`);
    invoke('debug_log', { message }).catch(() => {});
  }

  function bind() {
    minimizeButton?.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      debugLog('minimize button pressed');
      appWindow.minimize();
    });

    maximizeButton?.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      debugLog('maximize button pressed');
      appWindow.toggleMaximize();
    });

    closeButton?.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      debugLog('close button pressed');
      quitAfterSave();
    });

    appWindow.onCloseRequested(async (event) => {
      debugLog('native close requested');
      if (quitting) return;
      event.preventDefault();
      await quitAfterSave();
    });
  }

  async function quitAfterSave() {
    if (quitting) return;
    quitting = true;
    debugLog('flushing save before quit');

    try {
      await flushPendingSave();
      debugLog('save flushed, invoking quit_app');
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
