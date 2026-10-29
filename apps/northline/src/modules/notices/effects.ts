import { noticesEvents, SendNoticeInput } from './events'
import { noticesScope } from './scope'

/**
 * Records a consignee email in the actor. Delivery is local because the copy is already
 * decided and the send is a fast handoff. A provider call that can take seconds belongs
 * on a worker, the way `recovery.book` does.
 */
export const sendNotice = noticesScope.effect({
  type: 'notices.send',
  placement: 'local',
  input: SendNoticeInput,
  execute: (input, ctx) => {
    const notice = {
      noticeId: ctx.effectId,
      shipmentId: input.shipmentId,
      pro: input.pro,
      channel: 'email' as const,
      to: input.to,
      subject: input.subject,
      body: input.body,
    }

    return [
      noticesEvents.input('notice.queued', notice),
      noticesEvents.input('notice.delivered', notice),
    ]
  },
})
