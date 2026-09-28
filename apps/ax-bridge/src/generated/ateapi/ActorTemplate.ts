// Original file: proto/ateapi.proto

import type { ResourceMetadata as _ateapi_ResourceMetadata, ResourceMetadata__Output as _ateapi_ResourceMetadata__Output } from '../ateapi/ResourceMetadata';
import type { Selector as _ateapi_Selector, Selector__Output as _ateapi_Selector__Output } from '../ateapi/Selector';
import type { Container as _ateapi_Container, Container__Output as _ateapi_Container__Output } from '../ateapi/Container';
import type { Volume as _ateapi_Volume, Volume__Output as _ateapi_Volume__Output } from '../ateapi/Volume';
import type { SnapshotsConfig as _ateapi_SnapshotsConfig, SnapshotsConfig__Output as _ateapi_SnapshotsConfig__Output } from '../ateapi/SnapshotsConfig';
import type { SandboxConfig as _ateapi_SandboxConfig, SandboxConfig__Output as _ateapi_SandboxConfig__Output } from '../ateapi/SandboxConfig';
import type { Resources as _ateapi_Resources, Resources__Output as _ateapi_Resources__Output } from '../ateapi/Resources';
import type { ActorTemplateStatus as _ateapi_ActorTemplateStatus, ActorTemplateStatus__Output as _ateapi_ActorTemplateStatus__Output } from '../ateapi/ActorTemplateStatus';

export interface ActorTemplate {
  'metadata'?: (_ateapi_ResourceMetadata | null);
  'workerSelector'?: (_ateapi_Selector | null);
  'containers'?: (_ateapi_Container)[];
  'volumes'?: (_ateapi_Volume)[];
  'snapshotsConfig'?: (_ateapi_SnapshotsConfig | null);
  'sandboxConfig'?: (_ateapi_SandboxConfig | null);
  'resources'?: (_ateapi_Resources | null);
  'status'?: (_ateapi_ActorTemplateStatus | null);
}

export interface ActorTemplate__Output {
  'metadata': (_ateapi_ResourceMetadata__Output | null);
  'workerSelector': (_ateapi_Selector__Output | null);
  'containers': (_ateapi_Container__Output)[];
  'volumes': (_ateapi_Volume__Output)[];
  'snapshotsConfig': (_ateapi_SnapshotsConfig__Output | null);
  'sandboxConfig': (_ateapi_SandboxConfig__Output | null);
  'resources': (_ateapi_Resources__Output | null);
  'status': (_ateapi_ActorTemplateStatus__Output | null);
}
