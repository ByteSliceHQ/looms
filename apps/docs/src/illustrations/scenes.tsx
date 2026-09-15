import { Anchor, Ground, Plate, Register, Rows, Stitch, Thread } from './primitives'

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

export const illustrations = {
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
} as const

export type IllustrationName = keyof typeof illustrations

export const illustrationNames = [
  'log',
  'threads',
  'wait',
  'modules',
  'projections',
] as const satisfies readonly IllustrationName[]
