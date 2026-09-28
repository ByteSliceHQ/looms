// Original file: proto/ax.proto

import type { ObjectMeta as _ax_v1alpha1_ObjectMeta, ObjectMeta__Output as _ax_v1alpha1_ObjectMeta__Output } from '../../ax/v1alpha1/ObjectMeta';
import type { GatewaySpec as _ax_v1alpha1_GatewaySpec, GatewaySpec__Output as _ax_v1alpha1_GatewaySpec__Output } from '../../ax/v1alpha1/GatewaySpec';

export interface Gateway {
  'apiVersion'?: (string);
  'kind'?: (string);
  'metadata'?: (_ax_v1alpha1_ObjectMeta | null);
  'spec'?: (_ax_v1alpha1_GatewaySpec | null);
}

export interface Gateway__Output {
  'apiVersion': (string);
  'kind': (string);
  'metadata': (_ax_v1alpha1_ObjectMeta__Output | null);
  'spec': (_ax_v1alpha1_GatewaySpec__Output | null);
}
