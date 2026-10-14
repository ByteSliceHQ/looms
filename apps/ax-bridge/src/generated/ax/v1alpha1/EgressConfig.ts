// Original file: proto/ax.proto

import type { EgressAllowlist as _ax_v1alpha1_EgressAllowlist, EgressAllowlist__Output as _ax_v1alpha1_EgressAllowlist__Output } from '../../ax/v1alpha1/EgressAllowlist';

export interface EgressConfig {
  'allowlist'?: (_ax_v1alpha1_EgressAllowlist | null);
}

export interface EgressConfig__Output {
  'allowlist': (_ax_v1alpha1_EgressAllowlist__Output | null);
}
