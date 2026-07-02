import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', durationMs = 3500) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), durationMs);
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error', 5000),
    info: (msg) => addToast(msg, 'info')
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className={`pointer-events-auto max-w-sm rounded-2xl border px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur-sm transition-all animate-[slideIn_0.25s_ease-out] ${
            t.type === 'success' ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-100' :
            t.type === 'error' ? 'border-rose-400/30 bg-rose-500/15 text-rose-100' :
            'border-cyan-400/30 bg-cyan-500/15 text-cyan-100'
          }`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { success: () => {}, error: () => {}, info: () => {} };
  return ctx;
}

export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-[28px] border border-white/10 bg-ink-900 p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/10">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function FormField({ label, children, required }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-slate-300">
        {label} {required && <span className="text-rose-400">*</span>}
      </span>
      {children}
    </label>
  );
}

export function TextInput({ value, onChange, placeholder, type = 'text', required, disabled }) {
  return (
    <input
      className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/50 disabled:opacity-50"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
      required={required}
      disabled={disabled}
    />
  );
}

export function SelectInput({ value, onChange, options, disabled }) {
  return (
    <select
      className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/50 disabled:opacity-50"
      value={value}
      onChange={onChange}
      disabled={disabled}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

export function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/50"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
    />
  );
}

export function SubmitButton({ loading, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? 'Saving...' : children}
    </button>
  );
}
