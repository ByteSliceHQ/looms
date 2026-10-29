import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { fetchCases, fetchShipments, openCase } from '../api'
import { StatusPill } from '../components/marks'
import { PageHeader } from '../components/shell'
import { kindLabel, money, openedLabel } from '../format'

export const Route = createFileRoute('/')({
  loader: () =>
    Promise.all([fetchShipments(), fetchCases()]).then(([shipments, cases]) => ({
      shipments: shipments.shipments,
      cases: cases.cases,
    })),
  component: BoardPage,
  errorComponent: ({ error }) => <p className="banner">{error.message}</p>,
})

function BoardPage() {
  const data = Route.useLoaderData()
  const navigate = useNavigate()
  const [name, setName] = useState('A. Okonkwo')
  const [pending, setPending] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)
  const openedBy = name.trim()

  function open(shipmentId: string) {
    if (!openedBy || pending) {
      return
    }

    setPending(shipmentId)
    setError(undefined)

    void openCase({ shipmentId, openedBy }).then(
      (record) => {
        void navigate({ to: '/cases/$caseId', params: { caseId: record.id } })
      },
      (cause) => {
        setPending(undefined)
        setError(cause instanceof Error ? cause.message : 'Could not open that case')
      },
    )
  }

  return (
    <>
      <PageHeader
        kicker="Today's board"
        title="Exceptions still on the dock"
        copy="Open a recovery and Northline looks the shipment up, classifies it, and books linehaul when it can."
      />
      {error ? <p className="banner">{error}</p> : null}
      <div className="board">
        <section className="panel" aria-labelledby="shipments-heading">
          <div className="panel-head">
            <h2 id="shipments-heading" className="panel-title">
              Shipments
            </h2>
            <label className="name-field">
              <span className="field-label">Your name</span>
              <input
                className="text-input"
                value={name}
                maxLength={80}
                autoComplete="name"
                onChange={(event) => setName(event.target.value)}
              />
            </label>
          </div>
          <ul className="stack">
            {data.shipments.map((shipment) => {
              const delivered = shipment.status === 'delivered'
              return (
                <li key={shipment.shipmentId} className="shipment">
                  <div>
                    <h3 className="shipment-name">{shipment.consignee}</h3>
                    <p className="shipment-meta">
                      PRO {shipment.pro} · {shipment.destination} · {kindLabel(shipment.kind)} ·{' '}
                      {money(shipment.valueUsd)}
                      {shipment.hoursLate > 0 ? ` · ${shipment.hoursLate}h late` : ''}
                    </p>
                    <p className="shipment-note">{shipment.note}</p>
                  </div>
                  <button
                    type="button"
                    className="button"
                    disabled={delivered || !openedBy || pending !== undefined}
                    onClick={() => open(shipment.shipmentId)}
                  >
                    {delivered
                      ? 'Delivered'
                      : pending === shipment.shipmentId
                        ? 'Opening…'
                        : 'Open recovery'}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
        <section className="panel" aria-labelledby="cases-heading">
          <h2 id="cases-heading" className="panel-title">
            Cases
          </h2>
          {data.cases.length === 0 ? (
            <p className="empty">
              No cases yet. Open a recovery from a shipment that is still out.
            </p>
          ) : (
            <ul className="stack">
              {data.cases.map((item) => {
                const when = openedLabel(item.openedAt)
                return (
                  <li key={item.id}>
                    <Link to="/cases/$caseId" params={{ caseId: item.id }} className="case-link">
                      <span className="case-pro">PRO {item.pro}</span>
                      <span className="shipment-name">{item.consignee}</span>
                      <span className="shipment-meta">
                        {item.destination}
                        {when ? ` · ${when}` : ''} · {item.openedBy}
                      </span>
                      <StatusPill status={item.status} />
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
