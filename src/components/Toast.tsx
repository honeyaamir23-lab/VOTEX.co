import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  text: string;
}

let toastListeners: Array<(msg: ToastMessage) => void> = [];

export const toast = {
  success: (text: string) => {
    const id = Math.random().toString();
    toastListeners.forEach((l) => l({ id, type: "success", text }));
  },
  error: (text: string) => {
    const id = Math.random().toString();
    toastListeners.forEach((l) => l({ id, type: "error", text }));
  },
  info: (text: string) => {
    const id = Math.random().toString();
    toastListeners.forEach((l) => l({ id, type: "info", text }));
  }
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const listener = (newToast: ToastMessage) => {
      setToasts((prev) => [...prev, newToast]);
      // Auto dismiss after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4000);
    };

    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-5 right-5 z-[100] max-w-sm w-full pointer-events-none flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -10 }}
            className={`pointer-events-auto p-4 rounded-2xl border flex items-start gap-3 shadow-2xl ${
              t.type === "success"
                ? "bg-slate-900 border-green-500/30 text-green-400"
                : t.type === "error"
                ? "bg-slate-900 border-red-500/30 text-red-400"
                : "bg-slate-900 border-amber-500/30 text-amber-400"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              ) : t.type === "error" ? (
                <AlertCircle className="w-5 h-5 text-red-400" />
              ) : (
                <Info className="w-5 h-5 text-amber-400" />
              )}
            </div>
            
            <div className="flex-1 text-slate-200 text-xs sm:text-sm pr-2">
              {t.text}
            </div>

            <button
              onClick={() => dismiss(t.id)}
              className="text-slate-400 hover:text-white shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
