import { createFileRoute, Link } from '@tanstack/react-router'

import { MathBlock, MathInline } from '../components/math'

export const Route = createFileRoute('/docs/math')({
  component: MathDocs,
})

function MathDocs() {
  return (
    <>
      <h1>Mathematical Formalism</h1>
      <p>
        Underneath its developer-friendly TypeScript API, Looms is grounded in a formal mathematical
        model. This page details the algebraic specifications for runs, thread universes, state
        transitions, projections, and causal ordering.
      </p>

      <h2>1. The Canonical Run Log</h2>
      <p>
        A Run <MathInline math="R" /> is a tuple consisting of a globally unique run identity{' '}
        <MathInline math="r" /> and an ordered, append-only sequence of immutable events{' '}
        <MathInline math="L" />:
      </p>
      <MathBlock math="R = (r, L), \quad L = \langle e_1, e_2, \dots, e_n \rangle" />
      <p>
        Every agent, DAG workflow, child thread, external signal, and observable effect outcome
        participates in this single, canonical event stream.
      </p>

      <h2>2. Thread Universe &amp; Parent Relation</h2>
      <p>
        The units of computation participating in Run <MathInline math="R" /> form a thread universe{' '}
        <MathInline math="X_R" /> with a partial parent relation:
      </p>
      <MathBlock math="X_R = \{ x \mid x \text{ is a Thread belonging to Run } R \}" />
      <MathBlock math="\text{parent} : X_R \rightharpoonup X_R" />
      <p>
        The root thread <MathInline math="x_0" /> has{' '}
        <MathInline math="\text{parent}(x_0) = \bot" />. Every child thread references its parent,
        inducing a strict tree hierarchy over threads within the run.
      </p>

      <h2>3. State Transition Function</h2>
      <p>
        Each thread kind <MathInline math="k" /> (e.g. <code>agent</code>, <code>workflow</code>, or
        a custom module kind) defines a pure, deterministic state transition function:
      </p>
      <MathBlock math="\delta_k : S_k \times E \to S_k \times F^*" />
      <MathBlock math="(s_{t+1}^x, \Phi_t^x) = \delta_k(s_t^x, e_t)" />
      <p>
        Given current state <MathInline math="s_t^x \in S_k" /> and incoming event{' '}
        <MathInline math="e_t \in E" />, the reducer deterministically computes next state{' '}
        <MathInline math="s_{t+1}^x" /> and an ordered sequence of requested effects{' '}
        <MathInline math="\Phi_t^x \in F^*" />.
      </p>

      <h2>4. Projections as Folds</h2>
      <p>
        State and read models are not primary truths—they are pure derivations folded from the event
        log:
      </p>
      <MathBlock math="P(L_{0 \dots n}) = \text{fold}(\text{reduce}, S_0, \langle e_1, \dots, e_n \rangle)" />
      <p>
        With persisted snapshot checkpoints at event sequence <MathInline math="m \le n" />, state
        reconstruction is accelerated:
      </p>
      <MathBlock math="S_n = \text{snapshot}(m) + \text{fold}(\text{reduce}, \langle e_{m+1}, \dots, e_n \rangle)" />

      <h2>5. Causal Ordering vs. Structural Hierarchy</h2>
      <p>
        While events have a linear physical order in the log, causal provenance is explicitly
        decoupled from execution hierarchy:
      </p>
      <MathBlock math="e_i \prec_c e_j \iff \text{causationId}(e_j) = \text{id}(e_i)" />
      <p>
        This decoupling allows concurrent branches within a single Run to record events interleaved
        in physical time while preserving unambiguous causal ancestry.
      </p>

      <h2>6. Replay &amp; Durability Invariant</h2>
      <p>
        Let <MathInline math="\pi_x(L)" /> denote the projection filtering events relevant to thread{' '}
        <MathInline math="x" />. The state at logical step <MathInline math="t" /> is
        unconditionally reproducible:
      </p>
      <MathBlock math="s_t^x = \text{fold}(\delta_k^{\text{state}}, s_0^x, \pi_x(L_{\le t}))" />
      <p>
        During replay or recovery, the effect stream <MathInline math="\Phi" /> is ignored by the
        runtime kernel. Only recorded events produce state transitions, guaranteeing that historical
        analysis and crash recovery never cause duplicate side effects.
      </p>

      <div className="border-line text-body [&_strong]:text-foreground my-8 border-l-2 py-1 pl-5 text-[0.95rem] leading-relaxed [&_strong]:font-semibold">
        <strong>Return to conceptual overview:</strong> See{' '}
        <Link to="/docs/concepts">Concepts</Link> for architectural principles, core vocabulary, and
        the event/effect boundary.
      </div>
    </>
  )
}
