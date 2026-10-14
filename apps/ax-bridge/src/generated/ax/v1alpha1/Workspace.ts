// Original file: proto/ax.proto

import type { ObjectMeta as _ax_v1alpha1_ObjectMeta, ObjectMeta__Output as _ax_v1alpha1_ObjectMeta__Output } from '../../ax/v1alpha1/ObjectMeta';
import type { WorkspaceSpec as _ax_v1alpha1_WorkspaceSpec, WorkspaceSpec__Output as _ax_v1alpha1_WorkspaceSpec__Output } from '../../ax/v1alpha1/WorkspaceSpec';

export interface Workspace {
  'apiVersion'?: (string);
  'kind'?: (string);
  'metadata'?: (_ax_v1alpha1_ObjectMeta | null);
  'spec'?: (_ax_v1alpha1_WorkspaceSpec | null);
}

export interface Workspace__Output {
  'apiVersion': (string);
  'kind': (string);
  'metadata': (_ax_v1alpha1_ObjectMeta__Output | null);
  'spec': (_ax_v1alpha1_WorkspaceSpec__Output | null);
}
