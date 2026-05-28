const SWIPE_THRESHOLD = 80;
const GESTURE_TIMEOUT = 200;

export function createNavigation({
  editor,
  container,
  notes
}) {
  let animating = false;
  let accumulatedX = 0;
  let gestureTimer = null;
  let gestureLocked = false;

  async function slideToNext() {
    if (animating) return;

    const deleted = await notes.deleteIfEmpty();

    if (deleted) {
      await animateSwap('slide-left-out', 'slide-left-in', notes.getCurrentDocument());
      notes.updateIndicator();
      return;
    }

    const newDocument = notes.isAtLastNote()
      ? await notes.appendNoteAfterSave()
      : await notes.moveToNextAfterSave();

    await animateSwap('slide-left-out', 'slide-left-in', newDocument);
    notes.updateIndicator();
  }

  async function slideToPrev() {
    if (animating || notes.isAtFirstNote()) return;

    const deleted = await notes.deleteIfEmpty();

    if (deleted) {
      await animateSwap('slide-right-out', 'slide-right-in', notes.getCurrentDocument());
      notes.updateIndicator();
      return;
    }

    const newDocument = await notes.moveToPrevAfterSave();
    await animateSwap('slide-right-out', 'slide-right-in', newDocument);
    notes.updateIndicator();
  }

  function bindWheel() {
    container.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;

      e.preventDefault();

      if (gestureLocked || animating) return;

      accumulatedX += e.deltaX;

      if (gestureTimer) clearTimeout(gestureTimer);
      gestureTimer = setTimeout(() => {
        accumulatedX = 0;
        gestureLocked = false;
      }, GESTURE_TIMEOUT);

      if (Math.abs(accumulatedX) >= SWIPE_THRESHOLD) {
        gestureLocked = true;
        if (accumulatedX > 0) {
          slideToNext();
        } else {
          slideToPrev();
        }
        accumulatedX = 0;

        setTimeout(() => {
          gestureLocked = false;
        }, 400);
      }
    }, { passive: false });
  }

  function animateSwap(outClass, inClass, newDocument) {
    return new Promise((resolve) => {
      animating = true;

      editor.applyTransition(outClass, true);

      setTimeout(() => {
        editor.setDocument(newDocument.content, newDocument.id);
        editor.scrollToTop();

        editor.applyTransition(outClass, false);
        editor.applyTransition(inClass, true);

        editor.getRootElement().offsetHeight;

        editor.applyTransition(inClass, false);

        setTimeout(() => {
          animating = false;
          editor.focus();
          resolve();
        }, 200);
      }, 150);
    });
  }

  return {
    bindWheel,
    slideToNext,
    slideToPrev
  };
}
