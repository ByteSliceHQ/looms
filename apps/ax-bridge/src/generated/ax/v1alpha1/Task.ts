// Original file: proto/ax.proto

import type { ObjectMeta as _ax_v1alpha1_ObjectMeta, ObjectMeta__Output as _ax_v1alpha1_ObjectMeta__Output } from '../../ax/v1alpha1/ObjectMeta';
import type { TaskSpec as _ax_v1alpha1_TaskSpec, TaskSpec__Output as _ax_v1alpha1_TaskSpec__Output } from '../../ax/v1alpha1/TaskSpec';
import type { TaskStatus as _ax_v1alpha1_TaskStatus, TaskStatus__Output as _ax_v1alpha1_TaskStatus__Output } from '../../ax/v1alpha1/TaskStatus';

export interface Task {
  'apiVersion'?: (string);
  'kind'?: (string);
  'metadata'?: (_ax_v1alpha1_ObjectMeta | null);
  'spec'?: (_ax_v1alpha1_TaskSpec | null);
  'status'?: (_ax_v1alpha1_TaskStatus | null);
}

export interface Task__Output {
  'apiVersion': (string);
  'kind': (string);
  'metadata': (_ax_v1alpha1_ObjectMeta__Output | null);
  'spec': (_ax_v1alpha1_TaskSpec__Output | null);
  'status': (_ax_v1alpha1_TaskStatus__Output | null);
}
