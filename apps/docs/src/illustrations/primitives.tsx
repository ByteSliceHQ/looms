import type { ReactNode } from 'react'

export type Point = readonly [number, number, number]

// One orthographic camera for every object in the collection.
export function project([x, y, z]: Point): readonly [number, number] {
  return [320 + ((x - y) * Math.sqrt(3)) / 2, 215 + (x + y) / 2 - z]
}

export function trace(points: readonly Point[]) {
  return points.map((point, i) => `${i === 0 ? 'M' : 'L'}${project(point).join(',')}`).join(' ')
}

function rounded(points: readonly Point[], radius = 4) {
  const corners = points.map(project)
  return (
    corners
      .map((p, i) => {
        const prev = corners[(i + corners.length - 1) % corners.length]!
        const next = corners[(i + 1) % corners.length]!
        const before = Math.min(radius / Math.hypot(prev[0] - p[0], prev[1] - p[1]), 0.45)
        const after = Math.min(radius / Math.hypot(next[0] - p[0], next[1] - p[1]), 0.45)
        const a = [p[0] + (prev[0] - p[0]) * before, p[1] + (prev[1] - p[1]) * before]
        const b = [p[0] + (next[0] - p[0]) * after, p[1] + (next[1] - p[1]) * after]
        return `${i === 0 ? 'M' : 'L'}${a.join(',')} Q${p.join(',')} ${b.join(',')}`
      })
      .join(' ') + ' Z'
  )
}

export function Thread({
  points,
  accent = false,
  dashed = false,
}: {
  points: readonly Point[]
  accent?: boolean
  dashed?: boolean
}) {
  return (
    <path
      d={trace(points)}
      fill="none"
      stroke={accent ? 'var(--art-accent)' : 'var(--art-edge)'}
      strokeWidth={accent ? 1.4 : 1}
      strokeDasharray={dashed ? '3 5' : undefined}
    />
  )
}

export function Plate({
  at,
  width = 132,
  depth = width,
  height = 12,
  active = false,
  children,
}: {
  at: Point
  width?: number
  depth?: number
  height?: number
  active?: boolean
  children?: ReactNode
}) {
  const [x, y, z] = at
  const a: Point = [x - width / 2, y - depth / 2, z]
  const b: Point = [x + width / 2, y - depth / 2, z]
  const c: Point = [x + width / 2, y + depth / 2, z]
  const d: Point = [x - width / 2, y + depth / 2, z]
  const lower = ([px, py, pz]: Point): Point => [px, py, pz - height]
  const [cx, cy] = project(at)

  return (
    <g>
      <path
        d={rounded([d, c, lower(c), lower(d)])}
        fill="var(--art-side)"
        stroke="var(--art-edge)"
      />
      <path
        d={rounded([b, c, lower(c), lower(b)])}
        fill="var(--art-front)"
        stroke="var(--art-edge)"
      />
      <path
        d={rounded([a, b, c, d])}
        fill="var(--art-face)"
        stroke={active ? 'var(--art-accent)' : 'var(--art-edge)'}
      />
      <g transform={`matrix(0.8660254 0.5 -0.8660254 0.5 ${cx} ${cy})`}>{children}</g>
    </g>
  )
}

export function Stitch({ size = 42 }: { size?: number }) {
  return (
    <g fill="none" stroke="var(--art-accent)" strokeWidth="1.3">
      {[-12, -6, 0, 6, 12].map((offset) => (
        <path
          key={offset}
          d={`M${-size / 2},${offset} H${size / 2} M${offset},${-size / 2} V${size / 2}`}
        />
      ))}
    </g>
  )
}

export function Register({ x = -43, y = -43 }: { x?: number; y?: number }) {
  return (
    <g fill="var(--art-detail)">
      {[0, 1, 2, 3].flatMap((row) =>
        [0, 1, 2, 3].map((col) => (
          <circle key={`${row}-${col}`} cx={x + col * 4} cy={y + row * 4} r="0.7" />
        )),
      )}
    </g>
  )
}

export function Rows({ count = 5, width = 62 }: { count?: number; width?: number }) {
  return (
    <g fill="none" stroke="var(--art-detail)" strokeWidth="1">
      {Array.from({ length: count }, (_, i) => (
        <path key={i} d={`M${-width / 2},${i * 8 - (count - 1) * 4} H${width / 2 - (i % 3) * 9}`} />
      ))}
    </g>
  )
}

export function Anchor({ at, active = false }: { at: Point; active?: boolean }) {
  const [cx, cy] = project(at)
  return (
    <circle
      cx={cx}
      cy={cy}
      r={active ? 3 : 2}
      fill="var(--art-face)"
      stroke={active ? 'var(--art-accent)' : 'var(--art-edge)'}
    />
  )
}

export function Ground() {
  return (
    <g stroke="var(--art-grid)" fill="none" strokeWidth="0.7">
      {[-180, -120, -60, 0, 60, 120, 180].map((n) => (
        <g key={n}>
          <path
            d={trace([
              [n, -200, -85],
              [n, 200, -85],
            ])}
          />
          <path
            d={trace([
              [-200, n, -85],
              [200, n, -85],
            ])}
          />
        </g>
      ))}
    </g>
  )
}
