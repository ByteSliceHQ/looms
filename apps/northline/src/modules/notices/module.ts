import { defineModule } from '@swirls/looms/core'

import { sendNotice } from './effects'
import { outbox } from './projections'
import { noticesScope } from './scope'

export const notices = defineModule(noticesScope, () => ({
  effects: { send: sendNotice },
  projections: { outbox },
}))
