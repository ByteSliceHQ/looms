import { createFileRoute } from '@tanstack/react-router'
import { StartPanel } from '../components/start-panel'

export const Route = createFileRoute('/')({
  component: StartPanel,
})
