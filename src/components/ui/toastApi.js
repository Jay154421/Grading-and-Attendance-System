let items = [];
let seq = 0;
const listeners = new Set();

function emit() {
  const snapshot = [...items];
  listeners.forEach((listener) => listener(snapshot));
}

function push(type, message) {
  const id = ++seq;
  items = [...items, { id, type, message }];
  emit();
  setTimeout(() => {
    items = items.filter((item) => item.id !== id);
    emit();
  }, 5000);
}

export const toast = {
  success: (message) => push("success", message),
  error: (message) => push("error", message),
  warning: (message) => push("warning", message),
  info: (message) => push("info", message),
};

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function dismissToast(id) {
  items = items.filter((item) => item.id !== id);
  emit();
}

export function getToasts() {
  return [...items];
}
