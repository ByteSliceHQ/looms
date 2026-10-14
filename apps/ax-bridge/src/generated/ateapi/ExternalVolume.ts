// Original file: proto/ateapi.proto


// Original file: proto/ateapi.proto

export const _ateapi_ExternalVolume_Status = {
  STATUS_UNSPECIFIED: 'STATUS_UNSPECIFIED',
  STATUS_PENDING: 'STATUS_PENDING',
  STATUS_CREATED: 'STATUS_CREATED',
  STATUS_DELETING: 'STATUS_DELETING',
} as const;

export type _ateapi_ExternalVolume_Status =
  | 'STATUS_UNSPECIFIED'
  | 0
  | 'STATUS_PENDING'
  | 1
  | 'STATUS_CREATED'
  | 2
  | 'STATUS_DELETING'
  | 3

export type _ateapi_ExternalVolume_Status__Output = typeof _ateapi_ExternalVolume_Status[keyof typeof _ateapi_ExternalVolume_Status]

export interface ExternalVolume {
  'volumeName'?: (string);
  'storageVolumeId'?: (string);
  'volumeType'?: (string);
  'status'?: (_ateapi_ExternalVolume_Status);
  'volumeContext'?: ({[key: string]: string});
}

export interface ExternalVolume__Output {
  'volumeName': (string);
  'storageVolumeId': (string);
  'volumeType': (string);
  'status': (_ateapi_ExternalVolume_Status__Output);
  'volumeContext': ({[key: string]: string});
}
