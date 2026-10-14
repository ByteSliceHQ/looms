// Original file: proto/ateapi.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { SetWorkerCapacityRequest as _ateapi_SetWorkerCapacityRequest, SetWorkerCapacityRequest__Output as _ateapi_SetWorkerCapacityRequest__Output } from '../ateapi/SetWorkerCapacityRequest';
import type { SetWorkerCapacityResponse as _ateapi_SetWorkerCapacityResponse, SetWorkerCapacityResponse__Output as _ateapi_SetWorkerCapacityResponse__Output } from '../ateapi/SetWorkerCapacityResponse';

export interface WorkerServiceClient extends grpc.Client {
  SetWorkerCapacity(argument: _ateapi_SetWorkerCapacityRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_SetWorkerCapacityResponse__Output>): grpc.ClientUnaryCall;
  SetWorkerCapacity(argument: _ateapi_SetWorkerCapacityRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_SetWorkerCapacityResponse__Output>): grpc.ClientUnaryCall;
  SetWorkerCapacity(argument: _ateapi_SetWorkerCapacityRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_SetWorkerCapacityResponse__Output>): grpc.ClientUnaryCall;
  SetWorkerCapacity(argument: _ateapi_SetWorkerCapacityRequest, callback: grpc.requestCallback<_ateapi_SetWorkerCapacityResponse__Output>): grpc.ClientUnaryCall;
  setWorkerCapacity(argument: _ateapi_SetWorkerCapacityRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_SetWorkerCapacityResponse__Output>): grpc.ClientUnaryCall;
  setWorkerCapacity(argument: _ateapi_SetWorkerCapacityRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_SetWorkerCapacityResponse__Output>): grpc.ClientUnaryCall;
  setWorkerCapacity(argument: _ateapi_SetWorkerCapacityRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_SetWorkerCapacityResponse__Output>): grpc.ClientUnaryCall;
  setWorkerCapacity(argument: _ateapi_SetWorkerCapacityRequest, callback: grpc.requestCallback<_ateapi_SetWorkerCapacityResponse__Output>): grpc.ClientUnaryCall;
  
}

export interface WorkerServiceHandlers extends grpc.UntypedServiceImplementation {
  SetWorkerCapacity: grpc.handleUnaryCall<_ateapi_SetWorkerCapacityRequest__Output, _ateapi_SetWorkerCapacityResponse>;
  
}

export interface WorkerServiceDefinition extends grpc.ServiceDefinition {
  SetWorkerCapacity: MethodDefinition<_ateapi_SetWorkerCapacityRequest, _ateapi_SetWorkerCapacityResponse, _ateapi_SetWorkerCapacityRequest__Output, _ateapi_SetWorkerCapacityResponse__Output>
}
