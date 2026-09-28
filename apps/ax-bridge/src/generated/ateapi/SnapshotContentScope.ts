// Original file: proto/ateapi.proto

export const SnapshotContentScope = {
  SNAPSHOT_CONTENT_SCOPE_UNSPECIFIED: 'SNAPSHOT_CONTENT_SCOPE_UNSPECIFIED',
  SNAPSHOT_CONTENT_SCOPE_FULL: 'SNAPSHOT_CONTENT_SCOPE_FULL',
  SNAPSHOT_CONTENT_SCOPE_DATA: 'SNAPSHOT_CONTENT_SCOPE_DATA',
} as const;

export type SnapshotContentScope =
  | 'SNAPSHOT_CONTENT_SCOPE_UNSPECIFIED'
  | 0
  | 'SNAPSHOT_CONTENT_SCOPE_FULL'
  | 1
  | 'SNAPSHOT_CONTENT_SCOPE_DATA'
  | 2

export type SnapshotContentScope__Output = typeof SnapshotContentScope[keyof typeof SnapshotContentScope]
