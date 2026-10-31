const px = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
const qty = new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 })

export function price(value: number): string {
  return px.format(value)
}

export function size(value: number): string {
  return qty.format(value)
}

export function signed(value: number): string {
  const text = px.format(value)
  return value > 0 ? `+${text}` : text
}

export function clock(ms: number): string {
  if (!(ms > 0)) {
    return '—'
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(ms)
}
