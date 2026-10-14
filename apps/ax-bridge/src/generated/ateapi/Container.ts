// Original file: proto/ateapi.proto

import type { EnvVar as _ateapi_EnvVar, EnvVar__Output as _ateapi_EnvVar__Output } from '../ateapi/EnvVar';
import type { ContainerReadyz as _ateapi_ContainerReadyz, ContainerReadyz__Output as _ateapi_ContainerReadyz__Output } from '../ateapi/ContainerReadyz';
import type { VolumeMount as _ateapi_VolumeMount, VolumeMount__Output as _ateapi_VolumeMount__Output } from '../ateapi/VolumeMount';
import type { SecurityContext as _ateapi_SecurityContext, SecurityContext__Output as _ateapi_SecurityContext__Output } from '../ateapi/SecurityContext';
import type { Resources as _ateapi_Resources, Resources__Output as _ateapi_Resources__Output } from '../ateapi/Resources';

export interface Container {
  'name'?: (string);
  'image'?: (string);
  'command'?: (string)[];
  'args'?: (string)[];
  'env'?: (_ateapi_EnvVar)[];
  'readyz'?: (_ateapi_ContainerReadyz | null);
  'volumeMounts'?: (_ateapi_VolumeMount)[];
  'securityContext'?: (_ateapi_SecurityContext | null);
  'resources'?: (_ateapi_Resources | null);
}

export interface Container__Output {
  'name': (string);
  'image': (string);
  'command': (string)[];
  'args': (string)[];
  'env': (_ateapi_EnvVar__Output)[];
  'readyz': (_ateapi_ContainerReadyz__Output | null);
  'volumeMounts': (_ateapi_VolumeMount__Output)[];
  'securityContext': (_ateapi_SecurityContext__Output | null);
  'resources': (_ateapi_Resources__Output | null);
}
