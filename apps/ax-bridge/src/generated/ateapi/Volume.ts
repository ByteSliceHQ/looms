// Original file: proto/ateapi.proto

import type { DurableDirVolumeSource as _ateapi_DurableDirVolumeSource, DurableDirVolumeSource__Output as _ateapi_DurableDirVolumeSource__Output } from '../ateapi/DurableDirVolumeSource';
import type { ExternalVolumeTemplate as _ateapi_ExternalVolumeTemplate, ExternalVolumeTemplate__Output as _ateapi_ExternalVolumeTemplate__Output } from '../ateapi/ExternalVolumeTemplate';
import type { SystemInfoVolumeSource as _ateapi_SystemInfoVolumeSource, SystemInfoVolumeSource__Output as _ateapi_SystemInfoVolumeSource__Output } from '../ateapi/SystemInfoVolumeSource';
import type { ImageVolumeSource as _ateapi_ImageVolumeSource, ImageVolumeSource__Output as _ateapi_ImageVolumeSource__Output } from '../ateapi/ImageVolumeSource';

export interface Volume {
  'name'?: (string);
  'durableDir'?: (_ateapi_DurableDirVolumeSource | null);
  'externalVolumeTemplate'?: (_ateapi_ExternalVolumeTemplate | null);
  'systemInfo'?: (_ateapi_SystemInfoVolumeSource | null);
  'image'?: (_ateapi_ImageVolumeSource | null);
}

export interface Volume__Output {
  'name': (string);
  'durableDir': (_ateapi_DurableDirVolumeSource__Output | null);
  'externalVolumeTemplate': (_ateapi_ExternalVolumeTemplate__Output | null);
  'systemInfo': (_ateapi_SystemInfoVolumeSource__Output | null);
  'image': (_ateapi_ImageVolumeSource__Output | null);
}
