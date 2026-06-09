let installed = false;

installKeyboardLockGuard();

function installKeyboardLockGuard(): void {
  if (installed) {
    return;
  }

  installed = true;
  const keyboard = (navigator as unknown as {
    keyboard?: {
      lock?: (keys?: string[]) => Promise<void>;
    };
  }).keyboard;

  if (keyboard?.lock) {
    keyboard.lock = async (keys?: string[]) => {
      void keys;
    };
  }

  window.addEventListener("unhandledrejection", (event) => {
    if (isKeyboardLockRegistrationError(event.reason)) {
      event.preventDefault();
    }
  });
}

function isKeyboardLockRegistrationError(reason: unknown): boolean {
  const message =
    typeof reason === "string"
      ? reason
      : reason && typeof reason === "object" && "message" in reason
        ? String(reason.message)
        : "";

  return message.includes("lock() request could not be registered");
}
