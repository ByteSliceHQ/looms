// Original file: proto/ateapi.proto

export const SandboxClass = {
  SANDBOX_CLASS_UNSPECIFIED: 'SANDBOX_CLASS_UNSPECIFIED',
  SANDBOX_CLASS_GVISOR: 'SANDBOX_CLASS_GVISOR',
  SANDBOX_CLASS_MICROVM: 'SANDBOX_CLASS_MICROVM',
} as const;

export type SandboxClass =
  | 'SANDBOX_CLASS_UNSPECIFIED'
  | 0
  | 'SANDBOX_CLASS_GVISOR'
  | 1
  | 'SANDBOX_CLASS_MICROVM'
  | 2

export type SandboxClass__Output = typeof SandboxClass[keyof typeof SandboxClass]
