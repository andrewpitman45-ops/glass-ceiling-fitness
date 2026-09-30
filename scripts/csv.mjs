export function parseRow(line) {
  const fields = []; let value = ''; let quoted = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (quoted && line[i + 1] === '"') { value += '"'; i++ }
      else quoted = !quoted
    } else if (c === ',' && !quoted) { fields.push(value); value = '' }
    else value += c
  }
  if (quoted) return null
  fields.push(value)
  return fields
}
