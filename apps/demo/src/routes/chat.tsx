import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/chat')({
  component: ChatLayout,
})

function ChatLayout() {
  return <Outlet />
}
