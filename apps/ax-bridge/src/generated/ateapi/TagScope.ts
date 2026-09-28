// Original file: proto/ateapi.proto

export const TagScope = {
  TAG_SCOPE_UNSPECIFIED: 'TAG_SCOPE_UNSPECIFIED',
  TAG_SCOPE_ATESPACE: 'TAG_SCOPE_ATESPACE',
  TAG_SCOPE_PUBLISHED: 'TAG_SCOPE_PUBLISHED',
} as const;

export type TagScope =
  | 'TAG_SCOPE_UNSPECIFIED'
  | 0
  | 'TAG_SCOPE_ATESPACE'
  | 1
  | 'TAG_SCOPE_PUBLISHED'
  | 2

export type TagScope__Output = typeof TagScope[keyof typeof TagScope]
