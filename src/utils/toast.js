import { reactive } from 'vue'

const state = reactive({ items: [] })
let counter = 0

export function useToast() {
  function push(message, type = 'default', duration = 3200) {
    const id = ++counter
    state.items.push({ id, message, type })
    setTimeout(() => dismiss(id), duration)
    return id
  }
  function dismiss(id) {
    const idx = state.items.findIndex((t) => t.id === id)
    if (idx !== -1) state.items.splice(idx, 1)
  }
  return {
    toasts: state.items,
    success: (msg, d) => push(msg, 'success', d),
    error: (msg, d) => push(msg, 'error', d),
    info: (msg, d) => push(msg, 'default', d),
    dismiss
  }
}
