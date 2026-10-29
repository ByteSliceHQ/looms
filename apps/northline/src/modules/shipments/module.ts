import { defineModule } from '@swirls/looms/core'

import { composeDigest, lookupShipment } from './effects'
import { digest, dossier } from './projections'
import { shipmentsScope } from './scope'

export const shipments = defineModule(shipmentsScope, () => ({
  effects: {
    lookup: lookupShipment,
    digest: composeDigest,
  },
  projections: {
    dossier,
    digest,
  },
}))
