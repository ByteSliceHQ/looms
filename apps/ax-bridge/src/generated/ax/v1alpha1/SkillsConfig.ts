// Original file: proto/ax.proto

import type { SkillRegistry as _ax_v1alpha1_SkillRegistry, SkillRegistry__Output as _ax_v1alpha1_SkillRegistry__Output } from '../../ax/v1alpha1/SkillRegistry';

export interface SkillsConfig {
  'registries'?: (_ax_v1alpha1_SkillRegistry)[];
  'path'?: (string);
}

export interface SkillsConfig__Output {
  'registries': (_ax_v1alpha1_SkillRegistry__Output)[];
  'path': (string);
}
