import zlib from 'zlib'

type GraphNode = {
  id: string
  type?: string
  position?: { x?: number; y?: number }
  parentNode?: string
  width?: number
  height?: number
  style?: { width?: number; height?: number }
  data?: {
    label?: string
    width?: number
    height?: number
    laneId?: string
    backgroundColor?: string
    borderColor?: string
  }
}

type GraphEdge = {
  id?: string
  source: string
  target: string
  label?: string
}

export type RenderableGraph = {
  nodes?: GraphNode[]
  edges?: GraphEdge[]
}

type PlacedNode = {
  id: string
  type: string
  label: string
  x: number
  y: number
  w: number
  h: number
  fill: string
  stroke: string
}

const TYPE_COLORS: Record<string, { fill: string; stroke: string }> = {
  lane: { fill: '#e0f2fe', stroke: '#0284c7' },
  event: { fill: '#dcfce7', stroke: '#16a34a' },
  processTask: { fill: '#dbeafe', stroke: '#2563eb' },
  gateway: { fill: '#fef9c3', stroke: '#ca8a04' },
  dataset: { fill: '#f3e8ff', stroke: '#9333ea' },
  db: { fill: '#f3f4f6', stroke: '#4b5563' },
  api: { fill: '#ccfbf1', stroke: '#0f766e' },
  service: { fill: '#e0e7ff', stroke: '#4338ca' },
  report: { fill: '#fee2e2', stroke: '#dc2626' },
  widget: { fill: '#fae8ff', stroke: '#a21caf' },
  flowStart: { fill: '#bbf7d0', stroke: '#15803d' },
  flowAction: { fill: '#bfdbfe', stroke: '#1d4ed8' },
  flowDecision: { fill: '#fde68a', stroke: '#b45309' },
  flowEnd: { fill: '#fecaca', stroke: '#b91c1c' },
}

function asNumber(value: unknown, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function pdfEscape(value: string): string {
  return value.replace(/[^\x20-\x7e]/g, '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '')
  const full = cleaned.length === 3
    ? cleaned.split('').map((c) => c + c).join('')
    : cleaned
  const n = Number.parseInt(full, 16)
  if (!Number.isFinite(n) || full.length !== 6) return [219, 234, 254]
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function placeNodes(graph: RenderableGraph): { nodes: PlacedNode[]; edges: GraphEdge[]; width: number; height: number } {
  const raw = graph.nodes || []
  const byId = new Map(raw.map((node) => [node.id, node]))

  const placed: PlacedNode[] = raw.map((node) => {
    const type = node.type || 'processTask'
    const isLane = type === 'lane'
    let x = asNumber(node.position?.x, 0)
    let y = asNumber(node.position?.y, 0)
    const parentId = node.parentNode || node.data?.laneId
    if (!isLane && parentId && byId.has(parentId)) {
      const parent = byId.get(parentId)!
      x += asNumber(parent.position?.x, 0)
      y += asNumber(parent.position?.y, 0)
    }
    const colors = TYPE_COLORS[type] || { fill: '#f8fafc', stroke: '#64748b' }
    return {
      id: node.id,
      type,
      label: String(node.data?.label || node.id),
      x,
      y,
      w: asNumber(node.data?.width ?? node.width ?? node.style?.width, isLane ? 900 : 140),
      h: asNumber(node.data?.height ?? node.height ?? node.style?.height, isLane ? 180 : 64),
      fill: node.data?.backgroundColor || colors.fill,
      stroke: node.data?.borderColor || colors.stroke,
    }
  })

  const lanes = placed.filter((node) => node.type === 'lane')
  const others = placed.filter((node) => node.type !== 'lane')
  const ordered = [...lanes, ...others]
  const maxX = ordered.reduce((max, node) => Math.max(max, node.x + node.w), 200)
  const maxY = ordered.reduce((max, node) => Math.max(max, node.y + node.h), 120)

  return {
    nodes: ordered,
    edges: graph.edges || [],
    width: Math.ceil(maxX + 80),
    height: Math.ceil(maxY + 80),
  }
}

export function renderDiagramSvg(graph: RenderableGraph, title: string): string {
  const scene = placeNodes(graph)
  const byId = new Map(scene.nodes.map((node) => [node.id, node]))
  const lines = scene.edges.map((edge) => {
    const source = byId.get(edge.source)
    const target = byId.get(edge.target)
    if (!source || !target) return ''
    const x1 = source.x + source.w / 2
    const y1 = source.y + source.h / 2
    const x2 = target.x + target.w / 2
    const y2 = target.y + target.h / 2
    const label = edge.label
      ? `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 6}" text-anchor="middle" font-size="11" fill="#334155">${escapeXml(String(edge.label))}</text>`
      : ''
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#64748b" stroke-width="2"/>${label}`
  }).join('')

  const shapes = scene.nodes.map((node) => {
    const radius = node.type === 'event' ? Math.min(node.w, node.h) / 2 : 8
    return `<rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="${radius}" fill="${node.fill}" stroke="${node.stroke}" stroke-width="2"/>
      <text x="${node.x + node.w / 2}" y="${node.y + node.h / 2}" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="13" fill="#0f172a">${escapeXml(node.label)}</text>`
  }).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${scene.width}" height="${scene.height}" viewBox="0 0 ${scene.width} ${scene.height}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="16" y="24" font-family="Arial, sans-serif" font-size="16" fill="#0f172a">${escapeXml(title)}</text>
  ${lines}
  ${shapes}
</svg>`
}

const GLYPHS: Record<string, string[]> = {
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  'A': ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  'B': ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  'C': ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  'D': ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  'E': ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  'F': ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  'G': ['01111', '10000', '10000', '10111', '10001', '10001', '01111'],
  'H': ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  'I': ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  'J': ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  'K': ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  'L': ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  'M': ['10001', '11011', '10101', '10001', '10001', '10001', '10001'],
  'N': ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  'O': ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  'P': ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  'Q': ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  'R': ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  'S': ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  'T': ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  'U': ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  'V': ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  'W': ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  'X': ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  'Y': ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  'Z': ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['01110', '10000', '11110', '10001', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '?': ['01110', '10001', '00010', '00100', '00100', '00000', '00100'],
}

function drawGlyph(pixels: Uint8Array, width: number, height: number, ch: string, x: number, y: number, scale: number, color: [number, number, number]) {
  const glyph = GLYPHS[ch] || GLYPHS['?']
  for (let row = 0; row < glyph.length; row++) {
    for (let col = 0; col < glyph[row].length; col++) {
      if (glyph[row][col] !== '1') continue
      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const px = x + col * scale + sx
          const py = y + row * scale + sy
          if (px < 0 || py < 0 || px >= width || py >= height) continue
          const i = (py * width + px) * 4
          pixels[i] = color[0]
          pixels[i + 1] = color[1]
          pixels[i + 2] = color[2]
          pixels[i + 3] = 255
        }
      }
    }
  }
}

function drawText(pixels: Uint8Array, width: number, height: number, text: string, x: number, y: number, color: [number, number, number]) {
  const scale = 2
  const chars = text.toUpperCase().slice(0, 16)
  chars.split('').forEach((ch, index) => {
    drawGlyph(pixels, width, height, ch, x + index * 6 * scale, y, scale, color)
  })
}

function fillRect(pixels: Uint8Array, width: number, height: number, x: number, y: number, w: number, h: number, color: [number, number, number]) {
  const x0 = Math.max(0, Math.floor(x))
  const y0 = Math.max(0, Math.floor(y))
  const x1 = Math.min(width, Math.ceil(x + w))
  const y1 = Math.min(height, Math.ceil(y + h))
  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      const i = (py * width + px) * 4
      pixels[i] = color[0]
      pixels[i + 1] = color[1]
      pixels[i + 2] = color[2]
      pixels[i + 3] = 255
    }
  }
}

function drawLine(pixels: Uint8Array, width: number, height: number, x0: number, y0: number, x1: number, y1: number, color: [number, number, number]) {
  let x = Math.round(x0)
  let y = Math.round(y0)
  const tx = Math.round(x1)
  const ty = Math.round(y1)
  const dx = Math.abs(tx - x)
  const dy = Math.abs(ty - y)
  const sx = x < tx ? 1 : -1
  const sy = y < ty ? 1 : -1
  let err = dx - dy
  for (let step = 0; step < 5000; step++) {
    if (x >= 0 && y >= 0 && x < width && y < height) {
      const i = (y * width + x) * 4
      pixels[i] = color[0]
      pixels[i + 1] = color[1]
      pixels[i + 2] = color[2]
      pixels[i + 3] = 255
    }
    if (x === tx && y === ty) break
    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x += sx
    }
    if (e2 < dx) {
      err += dx
      y += sy
    }
  }
}

function crc32(buf: Buffer): number {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
    }
  }
  return ~c >>> 0
}

function pngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([length, typeBuf, data, crc])
}

export function renderDiagramPng(graph: RenderableGraph): Buffer {
  const scene = placeNodes(graph)
  const scale = Math.min(1, 1800 / scene.width, 1200 / scene.height)
  const width = Math.max(1, Math.ceil(scene.width * scale))
  const height = Math.max(1, Math.ceil(scene.height * scale))
  const pixels = new Uint8Array(width * height * 4)
  pixels.fill(255)

  const byId = new Map(scene.nodes.map((node) => [node.id, node]))
  const ink: [number, number, number] = [71, 85, 105]
  for (const edge of scene.edges) {
    const source = byId.get(edge.source)
    const target = byId.get(edge.target)
    if (!source || !target) continue
    drawLine(
      pixels, width, height,
      (source.x + source.w / 2) * scale,
      (source.y + source.h / 2) * scale,
      (target.x + target.w / 2) * scale,
      (target.y + target.h / 2) * scale,
      ink
    )
  }

  for (const node of scene.nodes) {
    fillRect(pixels, width, height, node.x * scale, node.y * scale, node.w * scale, node.h * scale, hexToRgb(node.fill))
    drawText(pixels, width, height, node.label, node.x * scale + 8, node.y * scale + 10, [15, 23, 42])
  }

  const raw = Buffer.alloc(height * (width * 4 + 1))
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1)
    raw[rowStart] = 0
    raw.set(pixels.subarray(y * width * 4, (y + 1) * width * 4), rowStart + 1)
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

export function renderDiagramPdf(graph: RenderableGraph, title: string): Buffer {
  const scene = placeNodes(graph)
  const pageW = Math.max(612, scene.width + 40)
  const pageH = Math.max(400, scene.height + 40)
  const commands: string[] = ['0.97 0.98 0.99 rg', `0 0 ${pageW} ${pageH} re f`]
  const byId = new Map(scene.nodes.map((node) => [node.id, node]))

  const pdfY = (y: number) => pageH - y

  for (const edge of scene.edges) {
    const source = byId.get(edge.source)
    const target = byId.get(edge.target)
    if (!source || !target) continue
    commands.push('0.39 0.45 0.55 RG', '1.5 w')
    commands.push(`${source.x + source.w / 2} ${pdfY(source.y + source.h / 2)} m ${target.x + target.w / 2} ${pdfY(target.y + target.h / 2)} l S`)
  }

  for (const node of scene.nodes) {
    const [r, g, b] = hexToRgb(node.fill).map((n) => (n / 255).toFixed(3))
    const [sr, sg, sb] = hexToRgb(node.stroke).map((n) => (n / 255).toFixed(3))
    const y = pdfY(node.y + node.h)
    commands.push(`${r} ${g} ${b} rg`, `${sr} ${sg} ${sb} RG`, '1.5 w')
    commands.push(`${node.x} ${y} ${node.w} ${node.h} re B`)
    commands.push('BT', '/F1 11 Tf', '0 0 0 rg', `${node.x + 8} ${y + node.h / 2 - 3} Td`, `(${pdfEscape(node.label)}) Tj`, 'ET')
  }

  commands.push('BT', '/F1 14 Tf', `16 ${pageH - 24} Td`, `(${pdfEscape(title)}) Tj`, 'ET')
  return buildPdf(commands.join('\n'), pageW, pageH)
}

function buildPdf(commands: string, width: number, height: number): Buffer {
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`,
    `4 0 obj\n<< /Length ${Buffer.byteLength(commands)} >>\nstream\n${commands}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ]
  let body = '%PDF-1.4\n'
  const offsets = [0]
  for (const object of objects) {
    offsets.push(Buffer.byteLength(body))
    body += object
  }
  const xrefAt = Buffer.byteLength(body)
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let i = 1; i < offsets.length; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  body += xref
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`
  return Buffer.from(body)
}

export function renderDiagram(format: 'svg' | 'png' | 'pdf', graph: RenderableGraph, title: string): Buffer {
  if (format === 'png') return renderDiagramPng(graph)
  if (format === 'pdf') return renderDiagramPdf(graph, title)
  return Buffer.from(renderDiagramSvg(graph, title), 'utf-8')
}
