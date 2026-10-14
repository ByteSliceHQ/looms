// Original file: proto/ateapi.proto

export const ResumeSource = {
  RESUME_SOURCE_UNSPECIFIED: 'RESUME_SOURCE_UNSPECIFIED',
  RESUME_SOURCE_COLD_BOOT: 'RESUME_SOURCE_COLD_BOOT',
  RESUME_SOURCE_GOLDEN: 'RESUME_SOURCE_GOLDEN',
} as const;

export type ResumeSource =
  | 'RESUME_SOURCE_UNSPECIFIED'
  | 0
  | 'RESUME_SOURCE_COLD_BOOT'
  | 1
  | 'RESUME_SOURCE_GOLDEN'
  | 2

export type ResumeSource__Output = typeof ResumeSource[keyof typeof ResumeSource]
