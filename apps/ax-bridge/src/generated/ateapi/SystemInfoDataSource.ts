// Original file: proto/ateapi.proto

import type { ActorMetadataDataSource as _ateapi_ActorMetadataDataSource, ActorMetadataDataSource__Output as _ateapi_ActorMetadataDataSource__Output } from '../ateapi/ActorMetadataDataSource';
import type { TrustBundleDataSource as _ateapi_TrustBundleDataSource, TrustBundleDataSource__Output as _ateapi_TrustBundleDataSource__Output } from '../ateapi/TrustBundleDataSource';

export interface SystemInfoDataSource {
  'actorMetadata'?: (_ateapi_ActorMetadataDataSource | null);
  'trustBundle'?: (_ateapi_TrustBundleDataSource | null);
}

export interface SystemInfoDataSource__Output {
  'actorMetadata': (_ateapi_ActorMetadataDataSource__Output | null);
  'trustBundle': (_ateapi_TrustBundleDataSource__Output | null);
}
