import { Link, createFileRoute, notFound } from '@tanstack/react-router'

import { DeskRequestError, fetchCase } from '../api'
import { CaseRun } from '../components/case-run'

export const Route = createFileRoute('/cases/$caseId')({
  loader: ({ params }) =>
    fetchCase(params.caseId).then(
      (body) => body.case,
      (cause) => {
        if (cause instanceof DeskRequestError && cause.status === 404) {
          throw notFound()
        }

        throw cause
      },
    ),
  component: CasePage,
  errorComponent: ({ error }) => <p className="banner">{error.message}</p>,
  notFoundComponent: () => (
    <>
      <h1 className="page-title">That case is not on the board.</h1>
      <Link to="/" className="back">
        Back to the board
      </Link>
    </>
  ),
})

function CasePage() {
  const record = Route.useLoaderData()

  return (
    <>
      <Link to="/" className="back">
        Back to the board
      </Link>
      <CaseRun record={record} />
    </>
  )
}
