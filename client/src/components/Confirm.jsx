import React, { createContext, useCallback, useContext, useState } from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null); // { title, text, resolve }

  const confirm = useCallback((title, text) => {
    return new Promise((resolve) => {
      setState({ title, text, resolve });
    });
  }, []);

  const handle = (result) => {
    state?.resolve(result);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="modal-backdrop">
          <div className="modal-box max-w-sm">
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold mb-2 text-slate-800 dark:text-slate-100">{state.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">{state.text}</p>
            <div className="flex gap-3">
              <button className="btn btn-light flex-1" onClick={() => handle(false)}><X className="w-4 h-4" /> ຍົກເລີກ</button>
              <button className="btn btn-danger flex-1" onClick={() => handle(true)}><Trash2 className="w-4 h-4" /> ຢືນຢັນ</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm ຕ້ອງໃຊ້ພາຍໃນ <ConfirmProvider>');
  return ctx;
}
