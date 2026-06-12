import { useState, useEffect } from "react";

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 800; // délai nettoyage DOM après l'animation de fermeture

const actionTypes = {
  ADD_TOAST:     "ADD_TOAST",
  UPDATE_TOAST:  "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST:  "REMOVE_TOAST",
};

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

// ── File d'attente pour supprimer du DOM après fermeture ─────────────────────
const removeTimeouts = new Map();

function scheduleRemove(toastId) {
  if (removeTimeouts.has(toastId)) return;
  const t = setTimeout(() => {
    removeTimeouts.delete(toastId);
    dispatch({ type: actionTypes.REMOVE_TOAST, toastId });
  }, TOAST_REMOVE_DELAY);
  removeTimeouts.set(toastId, t);
}

// ── File d'attente pour l'auto-fermeture après `duration` ms ─────────────────
const autoCloseTimeouts = new Map();

function scheduleAutoClose(toastId, duration) {
  if (autoCloseTimeouts.has(toastId)) return;
  const t = setTimeout(() => {
    autoCloseTimeouts.delete(toastId);
    dispatch({ type: actionTypes.DISMISS_TOAST, toastId });
  }, duration);
  autoCloseTimeouts.set(toastId, t);
}

function cancelAutoClose(toastId) {
  const t = autoCloseTimeouts.get(toastId);
  if (t) { clearTimeout(t); autoCloseTimeouts.delete(toastId); }
}

// ── Reducer ───────────────────────────────────────────────────────────────────
export const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };
    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map(t =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };
    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action;
      if (toastId) {
        scheduleRemove(toastId);
      } else {
        state.toasts.forEach(t => scheduleRemove(t.id));
      }
      return {
        ...state,
        toasts: state.toasts.map(t =>
          t.id === toastId || toastId === undefined
            ? { ...t, open: false }
            : t
        ),
      };
    }
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) return { ...state, toasts: [] };
      return {
        ...state,
        toasts: state.toasts.filter(t => t.id !== action.toastId),
      };
    default:
      return state;
  }
};

// ── Store global ──────────────────────────────────────────────────────────────
const listeners = [];
let memoryState = { toasts: [] };

function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach(l => l(memoryState));
}

// ── API publique ──────────────────────────────────────────────────────────────
function toast({ duration = 5000, ...props }) {
  const id = genId();

  const dismiss = () => {
    cancelAutoClose(id);
    dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });
  };

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => { if (!open) dismiss(); },
    },
  });

  // Auto-fermeture après `duration` ms
  if (duration > 0) {
    scheduleAutoClose(id, duration);
  }

  return { id, dismiss, update: (p) => dispatch({ type: actionTypes.UPDATE_TOAST, toast: { ...p, id } }) };
}

function useToast() {
  const [state, setState] = useState(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const i = listeners.indexOf(setState);
      if (i > -1) listeners.splice(i, 1);
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  };
}

export { useToast, toast };
