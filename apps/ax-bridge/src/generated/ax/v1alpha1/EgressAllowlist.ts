// Original file: proto/ax.proto

import type { HostRule as _ax_v1alpha1_HostRule, HostRule__Output as _ax_v1alpha1_HostRule__Output } from '../../ax/v1alpha1/HostRule';

export interface EgressAllowlist {
  'hosts'?: (_ax_v1alpha1_HostRule)[];
}

export interface EgressAllowlist__Output {
  'hosts': (_ax_v1alpha1_HostRule__Output)[];
}
