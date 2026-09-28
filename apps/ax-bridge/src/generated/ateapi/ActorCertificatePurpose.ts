// Original file: proto/ateapi.proto

export const ActorCertificatePurpose = {
  ACTOR_CERTIFICATE_PURPOSE_UNSPECIFIED: 'ACTOR_CERTIFICATE_PURPOSE_UNSPECIFIED',
  ACTOR_CERTIFICATE_PURPOSE_ATUNNEL: 'ACTOR_CERTIFICATE_PURPOSE_ATUNNEL',
} as const;

export type ActorCertificatePurpose =
  | 'ACTOR_CERTIFICATE_PURPOSE_UNSPECIFIED'
  | 0
  | 'ACTOR_CERTIFICATE_PURPOSE_ATUNNEL'
  | 1

export type ActorCertificatePurpose__Output = typeof ActorCertificatePurpose[keyof typeof ActorCertificatePurpose]
