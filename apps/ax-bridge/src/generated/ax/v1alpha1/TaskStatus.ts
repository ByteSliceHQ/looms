// Original file: proto/ax.proto

import type { PendingApproval as _ax_v1alpha1_PendingApproval, PendingApproval__Output as _ax_v1alpha1_PendingApproval__Output } from '../../ax/v1alpha1/PendingApproval';
import type { UsageStats as _ax_v1alpha1_UsageStats, UsageStats__Output as _ax_v1alpha1_UsageStats__Output } from '../../ax/v1alpha1/UsageStats';
import type { Condition as _ax_v1alpha1_Condition, Condition__Output as _ax_v1alpha1_Condition__Output } from '../../ax/v1alpha1/Condition';

export interface TaskStatus {
  'phase'?: (string);
  'id'?: (string);
  'actor'?: (string);
  'workerIp'?: (string);
  'pendingApproval'?: (_ax_v1alpha1_PendingApproval | null);
  'usage'?: (_ax_v1alpha1_UsageStats | null);
  'conditions'?: (_ax_v1alpha1_Condition)[];
}

export interface TaskStatus__Output {
  'phase': (string);
  'id': (string);
  'actor': (string);
  'workerIp': (string);
  'pendingApproval': (_ax_v1alpha1_PendingApproval__Output | null);
  'usage': (_ax_v1alpha1_UsageStats__Output | null);
  'conditions': (_ax_v1alpha1_Condition__Output)[];
}
