// Original file: proto/ax.proto

import type { ResourceList as _ax_v1alpha1_ResourceList, ResourceList__Output as _ax_v1alpha1_ResourceList__Output } from '../../ax/v1alpha1/ResourceList';

export interface ResourceReqs {
  'requests'?: (_ax_v1alpha1_ResourceList | null);
  'limits'?: (_ax_v1alpha1_ResourceList | null);
}

export interface ResourceReqs__Output {
  'requests': (_ax_v1alpha1_ResourceList__Output | null);
  'limits': (_ax_v1alpha1_ResourceList__Output | null);
}
