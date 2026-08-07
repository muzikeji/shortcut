import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ConfirmItem {
  id: number;
  message: string;
  resolve: (value: boolean) => void;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  confirm: (message: string) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirms, setConfirms] = useState<ConfirmItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++nextId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const confirm = useCallback((message: string): Promise<boolean> => {
    return new Promise(resolve => {
      const id = ++nextId;
      setConfirms(prev => [...prev, { id, message, resolve }]);
    });
  }, []);

  const dismissConfirm = (id: number, value: boolean) => {
    const item = confirms.find(c => c.id === id);
    if (item) {
      item.resolve(value);
      setConfirms(prev => prev.filter(c => c.id !== id));
    }
  };

  const colors: Record<ToastType, string> = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  };

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`${colors[t.type]} text-white px-4 py-2.5 rounded-lg shadow-lg text-sm pointer-events-auto animate-slide-in`}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Confirm modals */}
      {confirms.map(c => (
        <div key={c.id} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4 w-full">
            <p className="text-gray-700 text-sm mb-5">{c.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => dismissConfirm(c.id, false)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={() => dismissConfirm(c.id, true)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      ))}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
