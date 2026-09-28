// Original file: proto/ax.proto

import type { GitRepo as _ax_v1alpha1_GitRepo, GitRepo__Output as _ax_v1alpha1_GitRepo__Output } from '../../ax/v1alpha1/GitRepo';
import type { MCPConfig as _ax_v1alpha1_MCPConfig, MCPConfig__Output as _ax_v1alpha1_MCPConfig__Output } from '../../ax/v1alpha1/MCPConfig';
import type { SkillsConfig as _ax_v1alpha1_SkillsConfig, SkillsConfig__Output as _ax_v1alpha1_SkillsConfig__Output } from '../../ax/v1alpha1/SkillsConfig';

export interface WorkspaceSpec {
  'git'?: (_ax_v1alpha1_GitRepo)[];
  'mcp'?: (_ax_v1alpha1_MCPConfig | null);
  'skills'?: (_ax_v1alpha1_SkillsConfig | null);
}

export interface WorkspaceSpec__Output {
  'git': (_ax_v1alpha1_GitRepo__Output)[];
  'mcp': (_ax_v1alpha1_MCPConfig__Output | null);
  'skills': (_ax_v1alpha1_SkillsConfig__Output | null);
}
