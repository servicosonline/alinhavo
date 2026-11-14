"use client";

import { useCallback, useState } from "react";

type History<T> = { past: T[]; present: T; future: T[] };

const LIMIT = 200;

/**
 * Histórico para desfazer e refazer.
 * - `apply(next)`: uma ação normal (um passo de desfazer).
 * - `preview(next)`: estado intermediário de um arrasto (não entra no histórico).
 * - `commit(before)`: fecha o arrasto; `before` é o estado de quando ele começou.
 */
export function useHistory<T>(initial: T) {
  const [h, setH] = useState<History<T>>({ past: [], present: initial, future: [] });

  const apply = useCallback((next: T) => {
    setH((s) => (next === s.present ? s : { past: [...s.past, s.present].slice(-LIMIT), present: next, future: [] }));
  }, []);

  const preview = useCallback((next: T) => {
    setH((s) => (next === s.present ? s : { ...s, present: next }));
  }, []);

  const commit = useCallback((before: T) => {
    setH((s) => (before === s.present ? s : { past: [...s.past, before].slice(-LIMIT), present: s.present, future: [] }));
  }, []);

  const undo = useCallback(() => {
    setH((s) => {
      const prev = s.past.at(-1);
      return prev === undefined ? s : { past: s.past.slice(0, -1), present: prev, future: [s.present, ...s.future] };
    });
  }, []);

  const redo = useCallback(() => {
    setH((s) => {
      const [next, ...rest] = s.future;
      return next === undefined ? s : { past: [...s.past, s.present], present: next, future: rest };
    });
  }, []);

  /** Troca tudo (ex.: depois de recarregar do servidor), limpando o histórico. */
  const reset = useCallback((value: T) => setH({ past: [], present: value, future: [] }), []);

  return {
    value: h.present,
    apply,
    preview,
    commit,
    undo,
    redo,
    reset,
    canUndo: h.past.length > 0,
    canRedo: h.future.length > 0,
  };
}
