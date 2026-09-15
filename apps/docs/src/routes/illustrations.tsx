import { createFileRoute, Link } from '@tanstack/react-router'

import { Illustration } from '../illustrations/illustration'
import { illustrationNames, illustrations } from '../illustrations/scenes'

export const Route = createFileRoute('/illustrations')({ component: IllustrationGallery })

function IllustrationGallery() {
  return (
    <main className="illustration-gallery mx-auto max-w-[68rem] px-5 py-16 md:px-8 md:py-24">
      <div className="mb-14 max-w-[43rem]">
        <p className="text-muted mb-5 font-mono text-xs tracking-widest uppercase">
          Looms / Visual language / 001
        </p>
        <h1 className="text-foreground mb-5 text-4xl leading-tight font-medium tracking-tight md:text-5xl">
          The shape of durable work.
        </h1>
        <p className="text-body max-w-[35rem] text-lg leading-relaxed">
          A field guide to the invisible parts of Looms. Recorded in layers. Connected by threads.
          Built to continue.
        </p>
      </div>
      <div className="illustration-grid">
        {illustrationNames.map((name) => {
          const item = illustrations[name]

          return (
            <article key={name} className="illustration-card">
              <p className="text-muted m-0 font-mono text-[11px] tracking-widest uppercase">
                FIG. {item.number} / {item.label}
              </p>
              <Illustration name={name} className="illustration-gallery-art" />
              <h2 className="text-foreground mt-0 mb-3 text-xl font-medium tracking-tight">
                {item.title}
              </h2>
              <p className="text-muted m-0 max-w-[26rem] text-sm leading-relaxed">
                {item.description}
              </p>
              <div className="mt-5 flex gap-5 font-mono text-[11px]">
                <a href={`/illustrations/${name}-light.svg`} download>
                  SVG / Light ↗
                </a>
                <a href={`/illustrations/${name}-dark.svg`} download>
                  SVG / Dark ↗
                </a>
              </div>
            </article>
          )
        })}
        <aside className="illustration-card flex flex-col justify-center">
          <p className="text-muted mb-5 font-mono text-[11px] tracking-widest uppercase">
            A system, made to grow
          </p>
          <h2 className="text-foreground mb-4 text-2xl font-medium tracking-tight">
            Same language.
            <br />
            New ideas.
          </h2>
          <p className="text-muted max-w-[24rem] text-sm leading-relaxed">
            One perspective, a restrained palette, and a small family of forms. Every illustration
            begins with one concept and ends with a crisp, editable vector.
          </p>
          <Link to="/docs/concepts" className="mt-6 text-sm">
            Explore the execution model →
          </Link>
        </aside>
      </div>
    </main>
  )
}
