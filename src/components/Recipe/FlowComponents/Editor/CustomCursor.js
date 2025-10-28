const updateCursorPosition = (customCursorRef, konvaStage) => (e) => {
  const customCursor = customCursorRef.current;
  if (customCursor) {
    const stageRect = konvaStage.content.getBoundingClientRect();
    const x = e.clientX - stageRect.left;
    const y = e.clientY - stageRect.top;

    if (x >= 0 && x <= stageRect.width && y >= 0 && y <= stageRect.height) {
      customCursor.style.display = 'block';
      customCursor.style.left = `${e.clientX}px`;
      customCursor.style.top = `${e.clientY}px`;
    } else {
      customCursor.style.display = 'none';
    }
  }
};

export const enableCustomCursor = (customCursorRef, container, konvaStage, color, diameter) => {
  let customCursor = customCursorRef.current;
  if (!customCursor) {
    customCursor = document.createElement('div');
    customCursor.id = 'custom-cursor';
    customCursor.style.width = `${diameter}px`;
    customCursor.style.height = `${diameter}px`;
    customCursor.style.background = color;
    customCursor.style.border = '2px solid red';
    customCursor.style.borderRadius = '50%';
    customCursor.style.position = 'fixed'; // Change to 'fixed'
    customCursor.style.pointerEvents = 'none';
    customCursor.style.opacity = '0.5';
    customCursor.style.transform = 'translate(-50%, -50%)'; // Center the cursor
    document.body.appendChild(customCursor); // Append to body instead of container
    customCursorRef.current = customCursor;

    konvaStage.content.addEventListener('mousemove', updateCursorPosition(customCursorRef, konvaStage));
  }
};

export const disableCustomCursor = (customCursorRef) => {
  const customCursor = customCursorRef.current;
  if (customCursor) {
    customCursor.parentNode.removeChild(customCursor);
    customCursorRef.current = null;
    // containerElement.removeEventListener('mousemove', updateCursorPosition);
    // stage = null;
  }
};

export const setCursorRadius = (customCursorRef, diameter) => {
  const customCursor = customCursorRef.current;
  if (customCursor) {
    customCursor.style.width = `${diameter}px`;
    customCursor.style.height = `${diameter}px`;
  }
};

export const setCursorColor = (customCursorRef, color) => {
  const customCursor = customCursorRef.current;
  if (customCursor) {
    customCursor.style.background = color;
  }
};

export const hideCustomCursor = (customCursorRef) => {
  const customCursor = customCursorRef.current;
  if (customCursor) {
    customCursor.style.display = 'none';
  }
};

export const showCustomCursor = (customCursorRef) => {
  const customCursor = customCursorRef.current;
  if (customCursor) {
    customCursor.style.display = 'block';
  }
};
