let counter = 0

export function generateId(): string {
  counter++
  return `${Date.now().toString(36)}_${counter.toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

export function shortId(id: string): string {
  return id.slice(0, 8)
}
