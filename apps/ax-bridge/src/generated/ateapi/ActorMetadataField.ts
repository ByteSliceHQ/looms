// Original file: proto/ateapi.proto

export const ActorMetadataField = {
  ACTOR_METADATA_FIELD_UNSPECIFIED: 'ACTOR_METADATA_FIELD_UNSPECIFIED',
  ACTOR_METADATA_FIELD_NAME: 'ACTOR_METADATA_FIELD_NAME',
  ACTOR_METADATA_FIELD_ATESPACE: 'ACTOR_METADATA_FIELD_ATESPACE',
  ACTOR_METADATA_FIELD_UID: 'ACTOR_METADATA_FIELD_UID',
} as const;

export type ActorMetadataField =
  | 'ACTOR_METADATA_FIELD_UNSPECIFIED'
  | 0
  | 'ACTOR_METADATA_FIELD_NAME'
  | 1
  | 'ACTOR_METADATA_FIELD_ATESPACE'
  | 2
  | 'ACTOR_METADATA_FIELD_UID'
  | 3

export type ActorMetadataField__Output = typeof ActorMetadataField[keyof typeof ActorMetadataField]
