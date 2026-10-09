import { useSyncExternalStore } from 'react'

export interface Store<T> {
  get: () => T
  set: (updater: (state: T) => T) => void
  replace: (state: T) => void
  subscribe: (listener: () => void) => () => void
}

/** Store mínimo e tipado, sem dependências externas. */
export function createStore<T>(initial: T): Store<T> {
  let state = initial
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((l) => l())

  return {
    get: () => state,
    set: (updater) => {
      state = updater(state)
      emit()
    },
    replace: (next) => {
      state = next
      emit()
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

/**
 * Lê uma fatia do store. O seletor deve retornar uma referência estável
 * (um campo do estado), e derivações devem ser feitas com useMemo no componente.
 */
export function useStore<T, S>(store: Store<T>, selector: (state: T) => S): S {
  return useSyncExternalStore(store.subscribe, () => selector(store.get()))
}
