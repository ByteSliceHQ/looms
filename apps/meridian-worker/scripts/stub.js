export class LoomsRun extends DurableObject {}

export class DeskBoard extends DurableObject {}

export default {
  fetch() {
    return new Response('Meridian is offline', { status: 410 })
  },
}
