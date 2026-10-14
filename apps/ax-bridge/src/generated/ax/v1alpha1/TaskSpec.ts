// Original file: proto/ax.proto

import type { EnvVar as _ax_v1alpha1_EnvVar, EnvVar__Output as _ax_v1alpha1_EnvVar__Output } from '../../ax/v1alpha1/EnvVar';
import type { ResourceReqs as _ax_v1alpha1_ResourceReqs, ResourceReqs__Output as _ax_v1alpha1_ResourceReqs__Output } from '../../ax/v1alpha1/ResourceReqs';
import type { WorkspaceRef as _ax_v1alpha1_WorkspaceRef, WorkspaceRef__Output as _ax_v1alpha1_WorkspaceRef__Output } from '../../ax/v1alpha1/WorkspaceRef';
import type { GatewayRef as _ax_v1alpha1_GatewayRef, GatewayRef__Output as _ax_v1alpha1_GatewayRef__Output } from '../../ax/v1alpha1/GatewayRef';

export interface TaskSpec {
  'suspend'?: (boolean);
  'image'?: (string);
  'command'?: (string)[];
  'env'?: (_ax_v1alpha1_EnvVar)[];
  'resources'?: (_ax_v1alpha1_ResourceReqs | null);
  'workspaces'?: (_ax_v1alpha1_WorkspaceRef)[];
  'gateway'?: (_ax_v1alpha1_GatewayRef | null);
  'debug'?: (boolean);
}

export interface TaskSpec__Output {
  'suspend': (boolean);
  'image': (string);
  'command': (string)[];
  'env': (_ax_v1alpha1_EnvVar__Output)[];
  'resources': (_ax_v1alpha1_ResourceReqs__Output | null);
  'workspaces': (_ax_v1alpha1_WorkspaceRef__Output)[];
  'gateway': (_ax_v1alpha1_GatewayRef__Output | null);
  'debug': (boolean);
}
