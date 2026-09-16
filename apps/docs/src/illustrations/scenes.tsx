import { Anchor, Ground, Plate, Register, Rows, Stitch, Thread, trace } from './primitives'

function Loom() {
  const warp = [-56, -42, -28, -14, 0, 14, 28, 42, 56]

  return (
    <>
      <Ground />
      <g strokeWidth="1.8">
        <path className="loom-thread-agent" d="M116,12 C68,92 197,12 227,46 S267,50 283.6,93" />
        <path className="loom-thread-workflow" d="M320,12 C384,40 267,42 304,73 Q320,86 320,114" />
        <path className="loom-thread-custom" d="M514,12 C578,102 422,28 451,92 S385,89 356.4,135" />
      </g>
      <g className="loom-labels" fill="var(--text-body)" stroke="none" textAnchor="middle">
        <text x="116" y="-8">
          agents
        </text>
        <text x="320" y="-8">
          workflows
        </text>
        <text x="514" y="-8">
          your code
        </text>
      </g>
      <Plate at={[0, 0, -58]} width={230} depth={92} height={10} />

      <g fill="none" strokeLinecap="round">
        {[-82, 82].map((x) => (
          <g key={x}>
            <path
              d={trace([
                [x, 0, -48],
                [x, 0, 112],
              ])}
              stroke="var(--art-edge)"
              strokeWidth="10"
            />
            <path
              d={trace([
                [x, 0, -48],
                [x, 0, 112],
              ])}
              stroke="var(--art-front)"
              strokeWidth="7"
            />
          </g>
        ))}
      </g>

      <Plate at={[0, 0, 112]} width={198} depth={28} height={12} />
      <Plate at={[0, 0, -8]} width={186} depth={24} height={10} />

      {warp.map((x) => (
        <Thread
          key={x}
          points={[
            [x, 0, 101],
            [x, 0, 0],
          ]}
          accent={x === 0}
        />
      ))}
      <g strokeWidth="1.8">
        {([-42, 0, 42] as const).map((x, index) => (
          <path
            key={x}
            className={['loom-thread-agent', 'loom-thread-workflow', 'loom-thread-custom'][index]}
            d={trace([
              [x, 0, 101],
              [x, 0, 0],
            ])}
          />
        ))}
        {[10, 20, 30, 40, 50, 60].map((z, index) => (
          <path
            key={z}
            className={
              ['loom-thread-agent', 'loom-thread-workflow', 'loom-thread-custom'][index % 3]
            }
            d={trace([
              [-57, 0, z],
              [57, 0, z],
            ])}
          />
        ))}
      </g>
      <g className="loom-shuttle">
        <Plate at={[25, -9, 35]} width={74} depth={13} height={5} active />
      </g>
      <Anchor at={[-82, 0, 112]} />
      <Anchor at={[82, 0, 112]} />
    </>
  )
}

function EventLog() {
  return (
    <>
      <Ground />
      {[-82, 82].flatMap((x) =>
        [-82, 82].map((y) => (
          <Thread
            key={`${x}-${y}`}
            points={[
              [x, y, -48],
              [x, y, 142],
            ]}
            dashed
          />
        )),
      )}
      {[-52, -28, -4, 20, 44].map((z) => (
        <Plate key={z} at={[0, 0, z]} width={182} height={9}>
          <Register x={-65} y={-65} />
          <Rows count={6} width={94} />
        </Plate>
      ))}
      <Plate at={[0, 0, 112]} width={182} height={12} active>
        <Register x={-65} y={-65} />
        <Stitch size={64} />
      </Plate>
      {[0, 1, 2, 3, 4].map((n) => (
        <Thread
          key={n}
          points={[
            [-43 + n * 9, 91, 112],
            [-43 + n * 9, 122, 112],
            [-43 + n * 9, 122, 44],
            [-43 + n * 9, 91, 44],
          ]}
          accent={n === 2}
        />
      ))}
    </>
  )
}

function ThreadTree() {
  return (
    <>
      <Ground />
      <Plate at={[0, 0, -55]} width={292} height={10} />
      <Thread
        points={[
          [-65, -65, 12],
          [-65, -65, -54],
          [65, -65, -54],
          [65, -65, 3],
        ]}
        accent
      />
      <Thread
        points={[
          [-65, -65, -54],
          [-65, 65, -54],
          [-65, 65, 3],
        ]}
        accent
      />
      <Thread
        points={[
          [65, -65, -54],
          [65, 65, -54],
          [65, 65, 3],
        ]}
      />
      <Plate at={[-65, -65, 105]} width={82} height={78} active>
        <Stitch size={32} />
      </Plate>
      <Plate at={[65, -65, 50]} width={82} height={42}>
        <Register x={-26} y={-26} />
        <Rows width={36} count={3} />
      </Plate>
      <Plate at={[-65, 65, 50]} width={82} height={42}>
        <Register x={-26} y={-26} />
        <Rows width={36} count={3} />
      </Plate>
      <Plate at={[65, 65, 15]} width={82} height={30}>
        <path d="m-14,0 10,10 20,-22" stroke="var(--art-accent)" fill="none" />
      </Plate>
      <Anchor at={[0, -65, -54]} active />
      <Anchor at={[-65, 0, -54]} active />
    </>
  )
}

function DurableWait() {
  return (
    <>
      <Ground />
      {[-16, -8, 0, 8, 16].map((y) => (
        <Thread
          key={y}
          points={[
            [-212, y, 6],
            [-62, y, 6],
          ]}
          accent={y === 0}
        />
      ))}
      <Plate at={[0, 0, -45]} width={146} height={12}>
        <Rows count={6} width={85} />
      </Plate>
      <Plate at={[0, 0, -20]} width={146} height={10}>
        <Rows count={6} width={85} />
      </Plate>
      <Plate at={[0, 0, 15]} width={146} height={16} active>
        <Register x={-51} y={-51} />
        <path d="M-12,-21 V21 M12,-21 V21" fill="none" stroke="var(--art-accent)" strokeWidth="4" />
      </Plate>
      <Thread
        points={[
          [0, 0, 39],
          [0, 0, 126],
        ]}
        dashed
        accent
      />
      <Plate at={[0, 0, 148]} width={40} height={7} active>
        <path d="m-9,0 6,6 13,-14" stroke="var(--art-accent)" fill="none" />
      </Plate>
      {[-16, -8, 0, 8, 16].map((y) => (
        <Thread
          key={y}
          points={[
            [74, y, 6],
            [212, y, 6],
          ]}
          accent={y === 0}
          dashed={y !== 0}
        />
      ))}
      <Anchor at={[185, 0, 6]} active />
    </>
  )
}

function Modules() {
  return (
    <>
      <Ground />
      <Plate at={[0, 0, -60]} width={260} height={17}>
        <Stitch size={75} />
      </Plate>
      {[-65, 65].flatMap((x) =>
        [-65, 65].map((y) => (
          <Thread
            key={`${x}-${y}`}
            points={[
              [x, y, -58],
              [x, y, 60],
            ]}
            dashed
          />
        )),
      )}
      <Plate at={[-65, -65, 100]} width={110} height={26}>
        <Register />
        <Stitch size={32} />
      </Plate>
      <Plate at={[65, -65, 70]} width={110} height={26}>
        <Register />
        <Rows count={4} width={48} />
      </Plate>
      <Plate at={[-65, 65, 70]} width={110} height={26}>
        <Register />
        <path d="m-17,0 12,12 24,-28" stroke="var(--art-detail)" fill="none" />
      </Plate>
      <Plate at={[65, 65, 40]} width={110} height={26} active>
        <Register />
        <path d="M-18,0 H18 M0,-18 V18" stroke="var(--art-accent)" fill="none" />
      </Plate>
    </>
  )
}

function Projections() {
  return (
    <>
      <Ground />
      {[-38, -14, 10, 34].map((z) => (
        <Plate key={z} at={[-105, 0, z]} width={92} depth={172} height={9}>
          <Rows count={8} width={48} />
        </Plate>
      ))}
      {[-100, 0, 100].map((y) => (
        <g key={y}>
          <Thread
            points={[
              [-58, 0, 34],
              [-20, 0, 34],
              [-20, y, 34],
              [75, y, 34],
            ]}
            accent={y === 0}
          />
          <Anchor at={[-20, y, 34]} active={y === 0} />
        </g>
      ))}
      <Plate at={[123, -110, 48]} width={106} depth={76} height={8}>
        <path
          d="M-32,-16 H27 V-2 H-18 L-26,6 V-2 H-32 Z M-15,12 H32 V25 H-15 Z"
          stroke="var(--art-detail)"
          fill="none"
        />
      </Plate>
      <Plate at={[123, 0, 48]} width={106} depth={76} height={8} active>
        <path
          d="M-32,-21 H32 M-32,-7 H32 M-32,7 H32 M-32,21 H32 M-8,-21 V21 M17,-21 V21"
          stroke="var(--art-detail)"
          fill="none"
        />
      </Plate>
      <Plate at={[123, 110, 48]} width={106} depth={76} height={8}>
        <path
          d="M-30,23 V-2 H-17 V23 M-6,23 V-20 H7 V23 M18,23 V-11 H31 V23"
          stroke="var(--art-detail)"
          fill="none"
        />
      </Plate>
    </>
  )
}

function EventEffects() {
  return (
    <>
      <Ground />
      {[-52, -28, -4].map((z) => (
        <Plate key={z} at={[-115, -30, z]} width={108} depth={150} height={9}>
          <Register x={-38} y={-55} />
          <Rows count={6} width={58} />
        </Plate>
      ))}
      <Plate at={[-115, -30, 28]} width={108} depth={150} height={11} active>
        <Register x={-38} y={-55} />
        <Rows count={5} width={54} />
      </Plate>

      <Thread
        points={[
          [-61, -30, 28],
          [-8, -30, 28],
          [-8, 45, 28],
          [42, 45, 28],
        ]}
        accent
      />
      <Anchor at={[-8, -30, 28]} active />

      <Plate at={[82, 45, 28]} width={104} depth={104} height={14} active>
        <Stitch size={38} />
      </Plate>

      <Thread
        points={[
          [134, 45, 28],
          [188, 45, 28],
          [188, 45, 118],
        ]}
        accent
        dashed
      />
      <Plate at={[188, 45, 138]} width={46} height={8} active>
        <path d="M-11,0 H11 M0,-11 V11" stroke="var(--art-accent)" fill="none" />
      </Plate>

      <Thread
        points={[
          [188, 45, 138],
          [188, -95, 138],
          [-115, -95, 138],
          [-115, -95, 62],
        ]}
        accent
        dashed
      />
      <Plate at={[-115, -30, 62]} width={108} depth={150} height={11} active>
        <Register x={-38} y={-55} />
        <path d="m-14,0 10,10 20,-22" stroke="var(--art-accent)" fill="none" />
      </Plate>
    </>
  )
}

/** A solid path ends short of a ghost destination — nothing is woven there. */
function NotFound() {
  return (
    <>
      <Ground />
      <Plate at={[-95, -10, -48]} width={148} depth={118} height={10}>
        <Register x={-48} y={-40} />
        <Rows count={5} width={72} />
      </Plate>
      <Plate at={[-95, -10, -16]} width={148} depth={118} height={10}>
        <Rows count={5} width={72} />
      </Plate>
      <Plate at={[-95, -10, 22]} width={148} depth={118} height={12} active>
        <Register x={-48} y={-40} />
        <Stitch size={34} />
      </Plate>

      <Thread
        points={[
          [-21, -10, 22],
          [48, -10, 22],
        ]}
        accent
      />
      <Anchor at={[48, -10, 22]} active />

      <Thread
        points={[
          [64, -10, 22],
          [118, -10, 22],
          [118, 70, 22],
        ]}
        accent
        dashed
      />

      {/* Ghost plate outline — contour only. */}
      <g fill="none" stroke="var(--art-detail)" strokeWidth="1" strokeDasharray="4 5">
        <path
          d={trace([
            [95, 25, 22],
            [195, 25, 22],
            [195, 125, 22],
            [95, 125, 22],
            [95, 25, 22],
          ])}
        />
        <path
          d={trace([
            [95, 125, 22],
            [95, 125, 10],
            [195, 125, 10],
            [195, 125, 22],
          ])}
        />
        <path
          d={trace([
            [195, 25, 22],
            [195, 25, 10],
            [195, 125, 10],
          ])}
        />
      </g>
      <Anchor at={[145, 75, 22]} />
    </>
  )
}

/** A recorded stack remains, but the active thread snaps mid-run. */
function ServerError() {
  return (
    <>
      <Ground />
      {[-52, -28, -4].map((z) => (
        <Plate key={z} at={[-70, 0, z]} width={156} depth={128} height={9}>
          <Register x={-52} y={-44} />
          <Rows count={6} width={82} />
        </Plate>
      ))}
      <Plate at={[-70, 0, 28]} width={156} depth={128} height={11}>
        <Register x={-52} y={-44} />
        <Rows count={5} width={78} />
      </Plate>

      <Thread
        points={[
          [8, 0, 28],
          [58, 0, 28],
        ]}
        accent
      />
      <Anchor at={[58, 0, 28]} active />

      {/* Visible snap gap. */}
      <Thread
        points={[
          [86, 0, 28],
          [118, 0, 28],
        ]}
        accent
        dashed
      />
      <Anchor at={[86, 0, 28]} />

      <Plate at={[155, 0, 28]} width={96} depth={96} height={12} active>
        <path
          d="M-16,-16 L16,16 M16,-16 L-16,16"
          stroke="var(--art-accent)"
          strokeWidth="1.4"
          fill="none"
        />
      </Plate>

      <Thread
        points={[
          [203, 0, 28],
          [230, 0, 28],
          [230, 0, 110],
        ]}
        dashed
      />
      <Plate at={[230, 0, 128]} width={36} height={7}>
        <Rows count={2} width={16} />
      </Plate>
    </>
  )
}

export const illustrations = {
  loom: {
    number: '00',
    title: 'Work, woven together.',
    label: 'Loom',
    description:
      'A small frame holds durable threads in tension while a shuttle composes them into one fabric.',
    alt: 'An isometric loom weaving three colored strands labeled agents, workflows, and your code into one fabric.',
    component: Loom,
  },
  log: {
    number: '01',
    title: 'Progress lives in the log.',
    label: 'Event log & replay',
    description:
      'Immutable events form a durable history. Pure reducers reconstruct current state from that history; replay does not dispatch external effects.',
    alt: 'A lifted state layer connects to a stack of recorded events through five fine threads.',
    component: EventLog,
  },
  threads: {
    number: '02',
    title: 'Many threads. One run.',
    label: 'Thread hierarchy',
    description:
      'A parent agent spawns child workflows and agents. Different thread kinds share one run and its canonical event stream.',
    alt: 'A parent block branches into child blocks on one shared platform, representing a single run.',
    component: ThreadTree,
  },
  wait: {
    number: '03',
    title: 'Pause without holding a worker.',
    label: 'Durable waits',
    description:
      'A thread parks with its progress preserved in the log. A matching approval, webhook, or timer wakes it to continue.',
    alt: 'A continuous thread pauses over recorded layers. A matching signal descends from above and the thread continues.',
    component: DurableWait,
  },
  modules: {
    number: '04',
    title: 'Compose the capabilities you need.',
    label: 'Runtime modules',
    description:
      'Agents, workflows, approvals, and your own domain modules contribute capabilities to the same runtime.',
    alt: 'Four distinct capability tiles align over a common runtime base. A plus sign marks a custom module.',
    component: Modules,
  },
  projections: {
    number: '05',
    title: 'One history. Many useful views.',
    label: 'Projections',
    description:
      'The same events fold into chat, ledgers, and analytics. Each view is derived from the log and can be rebuilt from it.',
    alt: 'One event stack fans out into three surfaces: a conversation, a ledger, and an analytical chart.',
    component: Projections,
  },
  effects: {
    number: '06',
    title: 'Facts go in. Intent goes out.',
    label: 'Events & effects',
    description:
      'A pure reducer reads immutable events, requests effects against the world, and only appends new facts when those effects return.',
    alt: 'An event stack feeds a reducer plate. Dashed threads reach a world marker and return as a new checked event on the log.',
    component: EventEffects,
  },
  'not-found': {
    number: '07',
    title: 'This path was never woven.',
    label: 'Not found',
    description:
      'A durable thread reaches the edge of known work and finds only a dashed outline where a destination should be.',
    alt: 'An active plate sends a thread toward a ghost outline of a missing plate that was never recorded.',
    component: NotFound,
  },
  error: {
    number: '08',
    title: 'The weave broke mid-run.',
    label: 'Server error',
    description:
      'Recorded layers remain intact, but the active thread snaps. Recovery starts from the log, not from the failed step.',
    alt: 'An event stack sits intact while an offset active plate shows a break mark and a snapped accent thread.',
    component: ServerError,
  },
} as const

export type IllustrationName = keyof typeof illustrations

export const illustrationNames = [
  'log',
  'threads',
  'wait',
  'modules',
  'projections',
  'effects',
  'not-found',
  'error',
] as const satisfies readonly IllustrationName[]
