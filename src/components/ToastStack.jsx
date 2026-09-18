import { useApp } from "../context/AppContext.jsx";

function ToastStack() {
  const { toasts, dismissToast } = useApp();

  if (!toasts.length) return null;

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <button key={toast.id} type="button" className={`toast tone-${toast.tone}`} onClick={() => dismissToast(toast.id)}>
          {toast.message}
        </button>
      ))}
    </div>
  );
}

export default ToastStack;
