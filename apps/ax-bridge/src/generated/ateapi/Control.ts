// Original file: proto/ateapi.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { Actor as _ateapi_Actor, Actor__Output as _ateapi_Actor__Output } from '../ateapi/Actor';
import type { ActorTemplate as _ateapi_ActorTemplate, ActorTemplate__Output as _ateapi_ActorTemplate__Output } from '../ateapi/ActorTemplate';
import type { Atespace as _ateapi_Atespace, Atespace__Output as _ateapi_Atespace__Output } from '../ateapi/Atespace';
import type { CreateActorEgressPolicyRequest as _ateapi_CreateActorEgressPolicyRequest, CreateActorEgressPolicyRequest__Output as _ateapi_CreateActorEgressPolicyRequest__Output } from '../ateapi/CreateActorEgressPolicyRequest';
import type { CreateActorRequest as _ateapi_CreateActorRequest, CreateActorRequest__Output as _ateapi_CreateActorRequest__Output } from '../ateapi/CreateActorRequest';
import type { CreateActorTemplateRequest as _ateapi_CreateActorTemplateRequest, CreateActorTemplateRequest__Output as _ateapi_CreateActorTemplateRequest__Output } from '../ateapi/CreateActorTemplateRequest';
import type { CreateAtespaceRequest as _ateapi_CreateAtespaceRequest, CreateAtespaceRequest__Output as _ateapi_CreateAtespaceRequest__Output } from '../ateapi/CreateAtespaceRequest';
import type { CreateTagRequest as _ateapi_CreateTagRequest, CreateTagRequest__Output as _ateapi_CreateTagRequest__Output } from '../ateapi/CreateTagRequest';
import type { CreateWorkerRequest as _ateapi_CreateWorkerRequest, CreateWorkerRequest__Output as _ateapi_CreateWorkerRequest__Output } from '../ateapi/CreateWorkerRequest';
import type { DeleteActorEgressPolicyRequest as _ateapi_DeleteActorEgressPolicyRequest, DeleteActorEgressPolicyRequest__Output as _ateapi_DeleteActorEgressPolicyRequest__Output } from '../ateapi/DeleteActorEgressPolicyRequest';
import type { DeleteActorRequest as _ateapi_DeleteActorRequest, DeleteActorRequest__Output as _ateapi_DeleteActorRequest__Output } from '../ateapi/DeleteActorRequest';
import type { DeleteActorTemplateRequest as _ateapi_DeleteActorTemplateRequest, DeleteActorTemplateRequest__Output as _ateapi_DeleteActorTemplateRequest__Output } from '../ateapi/DeleteActorTemplateRequest';
import type { DeleteAtespaceRequest as _ateapi_DeleteAtespaceRequest, DeleteAtespaceRequest__Output as _ateapi_DeleteAtespaceRequest__Output } from '../ateapi/DeleteAtespaceRequest';
import type { DeleteTagRequest as _ateapi_DeleteTagRequest, DeleteTagRequest__Output as _ateapi_DeleteTagRequest__Output } from '../ateapi/DeleteTagRequest';
import type { DeleteWorkerRequest as _ateapi_DeleteWorkerRequest, DeleteWorkerRequest__Output as _ateapi_DeleteWorkerRequest__Output } from '../ateapi/DeleteWorkerRequest';
import type { DrainWorkerRequest as _ateapi_DrainWorkerRequest, DrainWorkerRequest__Output as _ateapi_DrainWorkerRequest__Output } from '../ateapi/DrainWorkerRequest';
import type { EgressPolicy as _ateapi_EgressPolicy, EgressPolicy__Output as _ateapi_EgressPolicy__Output } from '../ateapi/EgressPolicy';
import type { GetActorEgressPolicyRequest as _ateapi_GetActorEgressPolicyRequest, GetActorEgressPolicyRequest__Output as _ateapi_GetActorEgressPolicyRequest__Output } from '../ateapi/GetActorEgressPolicyRequest';
import type { GetActorRequest as _ateapi_GetActorRequest, GetActorRequest__Output as _ateapi_GetActorRequest__Output } from '../ateapi/GetActorRequest';
import type { GetActorTemplateRequest as _ateapi_GetActorTemplateRequest, GetActorTemplateRequest__Output as _ateapi_GetActorTemplateRequest__Output } from '../ateapi/GetActorTemplateRequest';
import type { GetAtespaceRequest as _ateapi_GetAtespaceRequest, GetAtespaceRequest__Output as _ateapi_GetAtespaceRequest__Output } from '../ateapi/GetAtespaceRequest';
import type { GetTagRequest as _ateapi_GetTagRequest, GetTagRequest__Output as _ateapi_GetTagRequest__Output } from '../ateapi/GetTagRequest';
import type { GetWorkerRequest as _ateapi_GetWorkerRequest, GetWorkerRequest__Output as _ateapi_GetWorkerRequest__Output } from '../ateapi/GetWorkerRequest';
import type { ListActorTemplatesRequest as _ateapi_ListActorTemplatesRequest, ListActorTemplatesRequest__Output as _ateapi_ListActorTemplatesRequest__Output } from '../ateapi/ListActorTemplatesRequest';
import type { ListActorTemplatesResponse as _ateapi_ListActorTemplatesResponse, ListActorTemplatesResponse__Output as _ateapi_ListActorTemplatesResponse__Output } from '../ateapi/ListActorTemplatesResponse';
import type { ListActorsRequest as _ateapi_ListActorsRequest, ListActorsRequest__Output as _ateapi_ListActorsRequest__Output } from '../ateapi/ListActorsRequest';
import type { ListActorsResponse as _ateapi_ListActorsResponse, ListActorsResponse__Output as _ateapi_ListActorsResponse__Output } from '../ateapi/ListActorsResponse';
import type { ListAtespacesRequest as _ateapi_ListAtespacesRequest, ListAtespacesRequest__Output as _ateapi_ListAtespacesRequest__Output } from '../ateapi/ListAtespacesRequest';
import type { ListAtespacesResponse as _ateapi_ListAtespacesResponse, ListAtespacesResponse__Output as _ateapi_ListAtespacesResponse__Output } from '../ateapi/ListAtespacesResponse';
import type { ListTagsRequest as _ateapi_ListTagsRequest, ListTagsRequest__Output as _ateapi_ListTagsRequest__Output } from '../ateapi/ListTagsRequest';
import type { ListTagsResponse as _ateapi_ListTagsResponse, ListTagsResponse__Output as _ateapi_ListTagsResponse__Output } from '../ateapi/ListTagsResponse';
import type { ListWorkerActorAssignmentsRequest as _ateapi_ListWorkerActorAssignmentsRequest, ListWorkerActorAssignmentsRequest__Output as _ateapi_ListWorkerActorAssignmentsRequest__Output } from '../ateapi/ListWorkerActorAssignmentsRequest';
import type { ListWorkerActorAssignmentsResponse as _ateapi_ListWorkerActorAssignmentsResponse, ListWorkerActorAssignmentsResponse__Output as _ateapi_ListWorkerActorAssignmentsResponse__Output } from '../ateapi/ListWorkerActorAssignmentsResponse';
import type { ListWorkersRequest as _ateapi_ListWorkersRequest, ListWorkersRequest__Output as _ateapi_ListWorkersRequest__Output } from '../ateapi/ListWorkersRequest';
import type { ListWorkersResponse as _ateapi_ListWorkersResponse, ListWorkersResponse__Output as _ateapi_ListWorkersResponse__Output } from '../ateapi/ListWorkersResponse';
import type { MintActorCertificateRequest as _ateapi_MintActorCertificateRequest, MintActorCertificateRequest__Output as _ateapi_MintActorCertificateRequest__Output } from '../ateapi/MintActorCertificateRequest';
import type { MintActorCertificateResponse as _ateapi_MintActorCertificateResponse, MintActorCertificateResponse__Output as _ateapi_MintActorCertificateResponse__Output } from '../ateapi/MintActorCertificateResponse';
import type { MintActorJWTRequest as _ateapi_MintActorJWTRequest, MintActorJWTRequest__Output as _ateapi_MintActorJWTRequest__Output } from '../ateapi/MintActorJWTRequest';
import type { MintActorJWTResponse as _ateapi_MintActorJWTResponse, MintActorJWTResponse__Output as _ateapi_MintActorJWTResponse__Output } from '../ateapi/MintActorJWTResponse';
import type { PauseActorRequest as _ateapi_PauseActorRequest, PauseActorRequest__Output as _ateapi_PauseActorRequest__Output } from '../ateapi/PauseActorRequest';
import type { PauseActorResponse as _ateapi_PauseActorResponse, PauseActorResponse__Output as _ateapi_PauseActorResponse__Output } from '../ateapi/PauseActorResponse';
import type { ResumeActorRequest as _ateapi_ResumeActorRequest, ResumeActorRequest__Output as _ateapi_ResumeActorRequest__Output } from '../ateapi/ResumeActorRequest';
import type { ResumeActorResponse as _ateapi_ResumeActorResponse, ResumeActorResponse__Output as _ateapi_ResumeActorResponse__Output } from '../ateapi/ResumeActorResponse';
import type { SuspendActorRequest as _ateapi_SuspendActorRequest, SuspendActorRequest__Output as _ateapi_SuspendActorRequest__Output } from '../ateapi/SuspendActorRequest';
import type { SuspendActorResponse as _ateapi_SuspendActorResponse, SuspendActorResponse__Output as _ateapi_SuspendActorResponse__Output } from '../ateapi/SuspendActorResponse';
import type { Tag as _ateapi_Tag, Tag__Output as _ateapi_Tag__Output } from '../ateapi/Tag';
import type { UpdateActorEgressPolicyRequest as _ateapi_UpdateActorEgressPolicyRequest, UpdateActorEgressPolicyRequest__Output as _ateapi_UpdateActorEgressPolicyRequest__Output } from '../ateapi/UpdateActorEgressPolicyRequest';
import type { UpdateActorRequest as _ateapi_UpdateActorRequest, UpdateActorRequest__Output as _ateapi_UpdateActorRequest__Output } from '../ateapi/UpdateActorRequest';
import type { UpdateTagRequest as _ateapi_UpdateTagRequest, UpdateTagRequest__Output as _ateapi_UpdateTagRequest__Output } from '../ateapi/UpdateTagRequest';
import type { UpdateWorkerRequest as _ateapi_UpdateWorkerRequest, UpdateWorkerRequest__Output as _ateapi_UpdateWorkerRequest__Output } from '../ateapi/UpdateWorkerRequest';
import type { Worker as _ateapi_Worker, Worker__Output as _ateapi_Worker__Output } from '../ateapi/Worker';

export interface ControlClient extends grpc.Client {
  CreateActor(argument: _ateapi_CreateActorRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  CreateActor(argument: _ateapi_CreateActorRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  CreateActor(argument: _ateapi_CreateActorRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  CreateActor(argument: _ateapi_CreateActorRequest, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  createActor(argument: _ateapi_CreateActorRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  createActor(argument: _ateapi_CreateActorRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  createActor(argument: _ateapi_CreateActorRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  createActor(argument: _ateapi_CreateActorRequest, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  
  CreateActorEgressPolicy(argument: _ateapi_CreateActorEgressPolicyRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  CreateActorEgressPolicy(argument: _ateapi_CreateActorEgressPolicyRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  CreateActorEgressPolicy(argument: _ateapi_CreateActorEgressPolicyRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  CreateActorEgressPolicy(argument: _ateapi_CreateActorEgressPolicyRequest, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  createActorEgressPolicy(argument: _ateapi_CreateActorEgressPolicyRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  createActorEgressPolicy(argument: _ateapi_CreateActorEgressPolicyRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  createActorEgressPolicy(argument: _ateapi_CreateActorEgressPolicyRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  createActorEgressPolicy(argument: _ateapi_CreateActorEgressPolicyRequest, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  
  CreateActorTemplate(argument: _ateapi_CreateActorTemplateRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ActorTemplate__Output>): grpc.ClientUnaryCall;
  CreateActorTemplate(argument: _ateapi_CreateActorTemplateRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_ActorTemplate__Output>): grpc.ClientUnaryCall;
  CreateActorTemplate(argument: _ateapi_CreateActorTemplateRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ActorTemplate__Output>): grpc.ClientUnaryCall;
  CreateActorTemplate(argument: _ateapi_CreateActorTemplateRequest, callback: grpc.requestCallback<_ateapi_ActorTemplate__Output>): grpc.ClientUnaryCall;
  createActorTemplate(argument: _ateapi_CreateActorTemplateRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ActorTemplate__Output>): grpc.ClientUnaryCall;
  createActorTemplate(argument: _ateapi_CreateActorTemplateRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_ActorTemplate__Output>): grpc.ClientUnaryCall;
  createActorTemplate(argument: _ateapi_CreateActorTemplateRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ActorTemplate__Output>): grpc.ClientUnaryCall;
  createActorTemplate(argument: _ateapi_CreateActorTemplateRequest, callback: grpc.requestCallback<_ateapi_ActorTemplate__Output>): grpc.ClientUnaryCall;
  
  CreateAtespace(argument: _ateapi_CreateAtespaceRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Atespace__Output>): grpc.ClientUnaryCall;
  CreateAtespace(argument: _ateapi_CreateAtespaceRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Atespace__Output>): grpc.ClientUnaryCall;
  CreateAtespace(argument: _ateapi_CreateAtespaceRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Atespace__Output>): grpc.ClientUnaryCall;
  CreateAtespace(argument: _ateapi_CreateAtespaceRequest, callback: grpc.requestCallback<_ateapi_Atespace__Output>): grpc.ClientUnaryCall;
  createAtespace(argument: _ateapi_CreateAtespaceRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Atespace__Output>): grpc.ClientUnaryCall;
  createAtespace(argument: _ateapi_CreateAtespaceRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Atespace__Output>): grpc.ClientUnaryCall;
  createAtespace(argument: _ateapi_CreateAtespaceRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Atespace__Output>): grpc.ClientUnaryCall;
  createAtespace(argument: _ateapi_CreateAtespaceRequest, callback: grpc.requestCallback<_ateapi_Atespace__Output>): grpc.ClientUnaryCall;
  
  CreateTag(argument: _ateapi_CreateTagRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  CreateTag(argument: _ateapi_CreateTagRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  CreateTag(argument: _ateapi_CreateTagRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  CreateTag(argument: _ateapi_CreateTagRequest, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  createTag(argument: _ateapi_CreateTagRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  createTag(argument: _ateapi_CreateTagRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  createTag(argument: _ateapi_CreateTagRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  createTag(argument: _ateapi_CreateTagRequest, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  
  CreateWorker(argument: _ateapi_CreateWorkerRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  CreateWorker(argument: _ateapi_CreateWorkerRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  CreateWorker(argument: _ateapi_CreateWorkerRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  CreateWorker(argument: _ateapi_CreateWorkerRequest, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  createWorker(argument: _ateapi_CreateWorkerRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  createWorker(argument: _ateapi_CreateWorkerRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  createWorker(argument: _ateapi_CreateWorkerRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  createWorker(argument: _ateapi_CreateWorkerRequest, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  
  DeleteActor(argument: _ateapi_DeleteActorRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  DeleteActor(argument: _ateapi_DeleteActorRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  DeleteActor(argument: _ateapi_DeleteActorRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  DeleteActor(argument: _ateapi_DeleteActorRequest, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  deleteActor(argument: _ateapi_DeleteActorRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  deleteActor(argument: _ateapi_DeleteActorRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  deleteActor(argument: _ateapi_DeleteActorRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  deleteActor(argument: _ateapi_DeleteActorRequest, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  
  DeleteActorEgressPolicy(argument: _ateapi_DeleteActorEgressPolicyRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  DeleteActorEgressPolicy(argument: _ateapi_DeleteActorEgressPolicyRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  DeleteActorEgressPolicy(argument: _ateapi_DeleteActorEgressPolicyRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  DeleteActorEgressPolicy(argument: _ateapi_DeleteActorEgressPolicyRequest, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  deleteActorEgressPolicy(argument: _ateapi_DeleteActorEgressPolicyRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  deleteActorEgressPolicy(argument: _ateapi_DeleteActorEgressPolicyRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  deleteActorEgressPolicy(argument: _ateapi_DeleteActorEgressPolicyRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  deleteActorEgressPolicy(argument: _ateapi_DeleteActorEgressPolicyRequest, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  
  DeleteActorTemplate(argument: _ateapi_DeleteActorTemplateRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ActorTemplate__Output>): grpc.ClientUnaryCall;
  DeleteActorTemplate(argument: _ateapi_DeleteActorTemplateRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_ActorTemplate__Output>): grpc.ClientUnaryCall;
  DeleteActorTemplate(argument: _ateapi_DeleteActorTemplateRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ActorTemplate__Output>): grpc.ClientUnaryCall;
  DeleteActorTemplate(argument: _ateapi_DeleteActorTemplateRequest, callback: grpc.requestCallback<_ateapi_ActorTemplate__Output>): grpc.ClientUnaryCall;
  deleteActorTemplate(argument: _ateapi_DeleteActorTemplateRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ActorTemplate__Output>): grpc.ClientUnaryCall;
  deleteActorTemplate(argument: _ateapi_DeleteActorTemplateRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_ActorTemplate__Output>): grpc.ClientUnaryCall;
  deleteActorTemplate(argument: _ateapi_DeleteActorTemplateRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ActorTemplate__Output>): grpc.ClientUnaryCall;
  deleteActorTemplate(argument: _ateapi_DeleteActorTemplateRequest, callback: grpc.requestCallback<_ateapi_ActorTemplate__Output>): grpc.ClientUnaryCall;
  
  DeleteAtespace(argument: _ateapi_DeleteAtespaceRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Atespace__Output>): grpc.ClientUnaryCall;
  DeleteAtespace(argument: _ateapi_DeleteAtespaceRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Atespace__Output>): grpc.ClientUnaryCall;
  DeleteAtespace(argument: _ateapi_DeleteAtespaceRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Atespace__Output>): grpc.ClientUnaryCall;
  DeleteAtespace(argument: _ateapi_DeleteAtespaceRequest, callback: grpc.requestCallback<_ateapi_Atespace__Output>): grpc.ClientUnaryCall;
  deleteAtespace(argument: _ateapi_DeleteAtespaceRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Atespace__Output>): grpc.ClientUnaryCall;
  deleteAtespace(argument: _ateapi_DeleteAtespaceRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Atespace__Output>): grpc.ClientUnaryCall;
  deleteAtespace(argument: _ateapi_DeleteAtespaceRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Atespace__Output>): grpc.ClientUnaryCall;
  deleteAtespace(argument: _ateapi_DeleteAtespaceRequest, callback: grpc.requestCallback<_ateapi_Atespace__Output>): grpc.ClientUnaryCall;
  
  DeleteTag(argument: _ateapi_DeleteTagRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  DeleteTag(argument: _ateapi_DeleteTagRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  DeleteTag(argument: _ateapi_DeleteTagRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  DeleteTag(argument: _ateapi_DeleteTagRequest, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  deleteTag(argument: _ateapi_DeleteTagRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  deleteTag(argument: _ateapi_DeleteTagRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  deleteTag(argument: _ateapi_DeleteTagRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  deleteTag(argument: _ateapi_DeleteTagRequest, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  
  DeleteWorker(argument: _ateapi_DeleteWorkerRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  DeleteWorker(argument: _ateapi_DeleteWorkerRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  DeleteWorker(argument: _ateapi_DeleteWorkerRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  DeleteWorker(argument: _ateapi_DeleteWorkerRequest, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  deleteWorker(argument: _ateapi_DeleteWorkerRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  deleteWorker(argument: _ateapi_DeleteWorkerRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  deleteWorker(argument: _ateapi_DeleteWorkerRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  deleteWorker(argument: _ateapi_DeleteWorkerRequest, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  
  DrainWorker(argument: _ateapi_DrainWorkerRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  DrainWorker(argument: _ateapi_DrainWorkerRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  DrainWorker(argument: _ateapi_DrainWorkerRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  DrainWorker(argument: _ateapi_DrainWorkerRequest, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  drainWorker(argument: _ateapi_DrainWorkerRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  drainWorker(argument: _ateapi_DrainWorkerRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  drainWorker(argument: _ateapi_DrainWorkerRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  drainWorker(argument: _ateapi_DrainWorkerRequest, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  
  GetActor(argument: _ateapi_GetActorRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  GetActor(argument: _ateapi_GetActorRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  GetActor(argument: _ateapi_GetActorRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  GetActor(argument: _ateapi_GetActorRequest, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  getActor(argument: _ateapi_GetActorRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  getActor(argument: _ateapi_GetActorRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  getActor(argument: _ateapi_GetActorRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  getActor(argument: _ateapi_GetActorRequest, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  
  GetActorEgressPolicy(argument: _ateapi_GetActorEgressPolicyRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  GetActorEgressPolicy(argument: _ateapi_GetActorEgressPolicyRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  GetActorEgressPolicy(argument: _ateapi_GetActorEgressPolicyRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  GetActorEgressPolicy(argument: _ateapi_GetActorEgressPolicyRequest, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  getActorEgressPolicy(argument: _ateapi_GetActorEgressPolicyRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  getActorEgressPolicy(argument: _ateapi_GetActorEgressPolicyRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  getActorEgressPolicy(argument: _ateapi_GetActorEgressPolicyRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  getActorEgressPolicy(argument: _ateapi_GetActorEgressPolicyRequest, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  
  GetActorTemplate(argument: _ateapi_GetActorTemplateRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ActorTemplate__Output>): grpc.ClientUnaryCall;
  GetActorTemplate(argument: _ateapi_GetActorTemplateRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_ActorTemplate__Output>): grpc.ClientUnaryCall;
  GetActorTemplate(argument: _ateapi_GetActorTemplateRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ActorTemplate__Output>): grpc.ClientUnaryCall;
  GetActorTemplate(argument: _ateapi_GetActorTemplateRequest, callback: grpc.requestCallback<_ateapi_ActorTemplate__Output>): grpc.ClientUnaryCall;
  getActorTemplate(argument: _ateapi_GetActorTemplateRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ActorTemplate__Output>): grpc.ClientUnaryCall;
  getActorTemplate(argument: _ateapi_GetActorTemplateRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_ActorTemplate__Output>): grpc.ClientUnaryCall;
  getActorTemplate(argument: _ateapi_GetActorTemplateRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ActorTemplate__Output>): grpc.ClientUnaryCall;
  getActorTemplate(argument: _ateapi_GetActorTemplateRequest, callback: grpc.requestCallback<_ateapi_ActorTemplate__Output>): grpc.ClientUnaryCall;
  
  GetAtespace(argument: _ateapi_GetAtespaceRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Atespace__Output>): grpc.ClientUnaryCall;
  GetAtespace(argument: _ateapi_GetAtespaceRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Atespace__Output>): grpc.ClientUnaryCall;
  GetAtespace(argument: _ateapi_GetAtespaceRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Atespace__Output>): grpc.ClientUnaryCall;
  GetAtespace(argument: _ateapi_GetAtespaceRequest, callback: grpc.requestCallback<_ateapi_Atespace__Output>): grpc.ClientUnaryCall;
  getAtespace(argument: _ateapi_GetAtespaceRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Atespace__Output>): grpc.ClientUnaryCall;
  getAtespace(argument: _ateapi_GetAtespaceRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Atespace__Output>): grpc.ClientUnaryCall;
  getAtespace(argument: _ateapi_GetAtespaceRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Atespace__Output>): grpc.ClientUnaryCall;
  getAtespace(argument: _ateapi_GetAtespaceRequest, callback: grpc.requestCallback<_ateapi_Atespace__Output>): grpc.ClientUnaryCall;
  
  GetTag(argument: _ateapi_GetTagRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  GetTag(argument: _ateapi_GetTagRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  GetTag(argument: _ateapi_GetTagRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  GetTag(argument: _ateapi_GetTagRequest, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  getTag(argument: _ateapi_GetTagRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  getTag(argument: _ateapi_GetTagRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  getTag(argument: _ateapi_GetTagRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  getTag(argument: _ateapi_GetTagRequest, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  
  GetWorker(argument: _ateapi_GetWorkerRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  GetWorker(argument: _ateapi_GetWorkerRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  GetWorker(argument: _ateapi_GetWorkerRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  GetWorker(argument: _ateapi_GetWorkerRequest, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  getWorker(argument: _ateapi_GetWorkerRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  getWorker(argument: _ateapi_GetWorkerRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  getWorker(argument: _ateapi_GetWorkerRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  getWorker(argument: _ateapi_GetWorkerRequest, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  
  ListActorTemplates(argument: _ateapi_ListActorTemplatesRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ListActorTemplatesResponse__Output>): grpc.ClientUnaryCall;
  ListActorTemplates(argument: _ateapi_ListActorTemplatesRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_ListActorTemplatesResponse__Output>): grpc.ClientUnaryCall;
  ListActorTemplates(argument: _ateapi_ListActorTemplatesRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ListActorTemplatesResponse__Output>): grpc.ClientUnaryCall;
  ListActorTemplates(argument: _ateapi_ListActorTemplatesRequest, callback: grpc.requestCallback<_ateapi_ListActorTemplatesResponse__Output>): grpc.ClientUnaryCall;
  listActorTemplates(argument: _ateapi_ListActorTemplatesRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ListActorTemplatesResponse__Output>): grpc.ClientUnaryCall;
  listActorTemplates(argument: _ateapi_ListActorTemplatesRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_ListActorTemplatesResponse__Output>): grpc.ClientUnaryCall;
  listActorTemplates(argument: _ateapi_ListActorTemplatesRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ListActorTemplatesResponse__Output>): grpc.ClientUnaryCall;
  listActorTemplates(argument: _ateapi_ListActorTemplatesRequest, callback: grpc.requestCallback<_ateapi_ListActorTemplatesResponse__Output>): grpc.ClientUnaryCall;
  
  ListActors(argument: _ateapi_ListActorsRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ListActorsResponse__Output>): grpc.ClientUnaryCall;
  ListActors(argument: _ateapi_ListActorsRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_ListActorsResponse__Output>): grpc.ClientUnaryCall;
  ListActors(argument: _ateapi_ListActorsRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ListActorsResponse__Output>): grpc.ClientUnaryCall;
  ListActors(argument: _ateapi_ListActorsRequest, callback: grpc.requestCallback<_ateapi_ListActorsResponse__Output>): grpc.ClientUnaryCall;
  listActors(argument: _ateapi_ListActorsRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ListActorsResponse__Output>): grpc.ClientUnaryCall;
  listActors(argument: _ateapi_ListActorsRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_ListActorsResponse__Output>): grpc.ClientUnaryCall;
  listActors(argument: _ateapi_ListActorsRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ListActorsResponse__Output>): grpc.ClientUnaryCall;
  listActors(argument: _ateapi_ListActorsRequest, callback: grpc.requestCallback<_ateapi_ListActorsResponse__Output>): grpc.ClientUnaryCall;
  
  ListAtespaces(argument: _ateapi_ListAtespacesRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ListAtespacesResponse__Output>): grpc.ClientUnaryCall;
  ListAtespaces(argument: _ateapi_ListAtespacesRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_ListAtespacesResponse__Output>): grpc.ClientUnaryCall;
  ListAtespaces(argument: _ateapi_ListAtespacesRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ListAtespacesResponse__Output>): grpc.ClientUnaryCall;
  ListAtespaces(argument: _ateapi_ListAtespacesRequest, callback: grpc.requestCallback<_ateapi_ListAtespacesResponse__Output>): grpc.ClientUnaryCall;
  listAtespaces(argument: _ateapi_ListAtespacesRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ListAtespacesResponse__Output>): grpc.ClientUnaryCall;
  listAtespaces(argument: _ateapi_ListAtespacesRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_ListAtespacesResponse__Output>): grpc.ClientUnaryCall;
  listAtespaces(argument: _ateapi_ListAtespacesRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ListAtespacesResponse__Output>): grpc.ClientUnaryCall;
  listAtespaces(argument: _ateapi_ListAtespacesRequest, callback: grpc.requestCallback<_ateapi_ListAtespacesResponse__Output>): grpc.ClientUnaryCall;
  
  ListTags(argument: _ateapi_ListTagsRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ListTagsResponse__Output>): grpc.ClientUnaryCall;
  ListTags(argument: _ateapi_ListTagsRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_ListTagsResponse__Output>): grpc.ClientUnaryCall;
  ListTags(argument: _ateapi_ListTagsRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ListTagsResponse__Output>): grpc.ClientUnaryCall;
  ListTags(argument: _ateapi_ListTagsRequest, callback: grpc.requestCallback<_ateapi_ListTagsResponse__Output>): grpc.ClientUnaryCall;
  listTags(argument: _ateapi_ListTagsRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ListTagsResponse__Output>): grpc.ClientUnaryCall;
  listTags(argument: _ateapi_ListTagsRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_ListTagsResponse__Output>): grpc.ClientUnaryCall;
  listTags(argument: _ateapi_ListTagsRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ListTagsResponse__Output>): grpc.ClientUnaryCall;
  listTags(argument: _ateapi_ListTagsRequest, callback: grpc.requestCallback<_ateapi_ListTagsResponse__Output>): grpc.ClientUnaryCall;
  
  ListWorkerActorAssignments(argument: _ateapi_ListWorkerActorAssignmentsRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ListWorkerActorAssignmentsResponse__Output>): grpc.ClientUnaryCall;
  ListWorkerActorAssignments(argument: _ateapi_ListWorkerActorAssignmentsRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_ListWorkerActorAssignmentsResponse__Output>): grpc.ClientUnaryCall;
  ListWorkerActorAssignments(argument: _ateapi_ListWorkerActorAssignmentsRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ListWorkerActorAssignmentsResponse__Output>): grpc.ClientUnaryCall;
  ListWorkerActorAssignments(argument: _ateapi_ListWorkerActorAssignmentsRequest, callback: grpc.requestCallback<_ateapi_ListWorkerActorAssignmentsResponse__Output>): grpc.ClientUnaryCall;
  listWorkerActorAssignments(argument: _ateapi_ListWorkerActorAssignmentsRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ListWorkerActorAssignmentsResponse__Output>): grpc.ClientUnaryCall;
  listWorkerActorAssignments(argument: _ateapi_ListWorkerActorAssignmentsRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_ListWorkerActorAssignmentsResponse__Output>): grpc.ClientUnaryCall;
  listWorkerActorAssignments(argument: _ateapi_ListWorkerActorAssignmentsRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ListWorkerActorAssignmentsResponse__Output>): grpc.ClientUnaryCall;
  listWorkerActorAssignments(argument: _ateapi_ListWorkerActorAssignmentsRequest, callback: grpc.requestCallback<_ateapi_ListWorkerActorAssignmentsResponse__Output>): grpc.ClientUnaryCall;
  
  ListWorkers(argument: _ateapi_ListWorkersRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ListWorkersResponse__Output>): grpc.ClientUnaryCall;
  ListWorkers(argument: _ateapi_ListWorkersRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_ListWorkersResponse__Output>): grpc.ClientUnaryCall;
  ListWorkers(argument: _ateapi_ListWorkersRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ListWorkersResponse__Output>): grpc.ClientUnaryCall;
  ListWorkers(argument: _ateapi_ListWorkersRequest, callback: grpc.requestCallback<_ateapi_ListWorkersResponse__Output>): grpc.ClientUnaryCall;
  listWorkers(argument: _ateapi_ListWorkersRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ListWorkersResponse__Output>): grpc.ClientUnaryCall;
  listWorkers(argument: _ateapi_ListWorkersRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_ListWorkersResponse__Output>): grpc.ClientUnaryCall;
  listWorkers(argument: _ateapi_ListWorkersRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ListWorkersResponse__Output>): grpc.ClientUnaryCall;
  listWorkers(argument: _ateapi_ListWorkersRequest, callback: grpc.requestCallback<_ateapi_ListWorkersResponse__Output>): grpc.ClientUnaryCall;
  
  MintActorCertificate(argument: _ateapi_MintActorCertificateRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_MintActorCertificateResponse__Output>): grpc.ClientUnaryCall;
  MintActorCertificate(argument: _ateapi_MintActorCertificateRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_MintActorCertificateResponse__Output>): grpc.ClientUnaryCall;
  MintActorCertificate(argument: _ateapi_MintActorCertificateRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_MintActorCertificateResponse__Output>): grpc.ClientUnaryCall;
  MintActorCertificate(argument: _ateapi_MintActorCertificateRequest, callback: grpc.requestCallback<_ateapi_MintActorCertificateResponse__Output>): grpc.ClientUnaryCall;
  mintActorCertificate(argument: _ateapi_MintActorCertificateRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_MintActorCertificateResponse__Output>): grpc.ClientUnaryCall;
  mintActorCertificate(argument: _ateapi_MintActorCertificateRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_MintActorCertificateResponse__Output>): grpc.ClientUnaryCall;
  mintActorCertificate(argument: _ateapi_MintActorCertificateRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_MintActorCertificateResponse__Output>): grpc.ClientUnaryCall;
  mintActorCertificate(argument: _ateapi_MintActorCertificateRequest, callback: grpc.requestCallback<_ateapi_MintActorCertificateResponse__Output>): grpc.ClientUnaryCall;
  
  MintActorJWT(argument: _ateapi_MintActorJWTRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_MintActorJWTResponse__Output>): grpc.ClientUnaryCall;
  MintActorJWT(argument: _ateapi_MintActorJWTRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_MintActorJWTResponse__Output>): grpc.ClientUnaryCall;
  MintActorJWT(argument: _ateapi_MintActorJWTRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_MintActorJWTResponse__Output>): grpc.ClientUnaryCall;
  MintActorJWT(argument: _ateapi_MintActorJWTRequest, callback: grpc.requestCallback<_ateapi_MintActorJWTResponse__Output>): grpc.ClientUnaryCall;
  mintActorJwt(argument: _ateapi_MintActorJWTRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_MintActorJWTResponse__Output>): grpc.ClientUnaryCall;
  mintActorJwt(argument: _ateapi_MintActorJWTRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_MintActorJWTResponse__Output>): grpc.ClientUnaryCall;
  mintActorJwt(argument: _ateapi_MintActorJWTRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_MintActorJWTResponse__Output>): grpc.ClientUnaryCall;
  mintActorJwt(argument: _ateapi_MintActorJWTRequest, callback: grpc.requestCallback<_ateapi_MintActorJWTResponse__Output>): grpc.ClientUnaryCall;
  
  PauseActor(argument: _ateapi_PauseActorRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_PauseActorResponse__Output>): grpc.ClientUnaryCall;
  PauseActor(argument: _ateapi_PauseActorRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_PauseActorResponse__Output>): grpc.ClientUnaryCall;
  PauseActor(argument: _ateapi_PauseActorRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_PauseActorResponse__Output>): grpc.ClientUnaryCall;
  PauseActor(argument: _ateapi_PauseActorRequest, callback: grpc.requestCallback<_ateapi_PauseActorResponse__Output>): grpc.ClientUnaryCall;
  pauseActor(argument: _ateapi_PauseActorRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_PauseActorResponse__Output>): grpc.ClientUnaryCall;
  pauseActor(argument: _ateapi_PauseActorRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_PauseActorResponse__Output>): grpc.ClientUnaryCall;
  pauseActor(argument: _ateapi_PauseActorRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_PauseActorResponse__Output>): grpc.ClientUnaryCall;
  pauseActor(argument: _ateapi_PauseActorRequest, callback: grpc.requestCallback<_ateapi_PauseActorResponse__Output>): grpc.ClientUnaryCall;
  
  ResumeActor(argument: _ateapi_ResumeActorRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ResumeActorResponse__Output>): grpc.ClientUnaryCall;
  ResumeActor(argument: _ateapi_ResumeActorRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_ResumeActorResponse__Output>): grpc.ClientUnaryCall;
  ResumeActor(argument: _ateapi_ResumeActorRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ResumeActorResponse__Output>): grpc.ClientUnaryCall;
  ResumeActor(argument: _ateapi_ResumeActorRequest, callback: grpc.requestCallback<_ateapi_ResumeActorResponse__Output>): grpc.ClientUnaryCall;
  resumeActor(argument: _ateapi_ResumeActorRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ResumeActorResponse__Output>): grpc.ClientUnaryCall;
  resumeActor(argument: _ateapi_ResumeActorRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_ResumeActorResponse__Output>): grpc.ClientUnaryCall;
  resumeActor(argument: _ateapi_ResumeActorRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_ResumeActorResponse__Output>): grpc.ClientUnaryCall;
  resumeActor(argument: _ateapi_ResumeActorRequest, callback: grpc.requestCallback<_ateapi_ResumeActorResponse__Output>): grpc.ClientUnaryCall;
  
  SuspendActor(argument: _ateapi_SuspendActorRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_SuspendActorResponse__Output>): grpc.ClientUnaryCall;
  SuspendActor(argument: _ateapi_SuspendActorRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_SuspendActorResponse__Output>): grpc.ClientUnaryCall;
  SuspendActor(argument: _ateapi_SuspendActorRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_SuspendActorResponse__Output>): grpc.ClientUnaryCall;
  SuspendActor(argument: _ateapi_SuspendActorRequest, callback: grpc.requestCallback<_ateapi_SuspendActorResponse__Output>): grpc.ClientUnaryCall;
  suspendActor(argument: _ateapi_SuspendActorRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_SuspendActorResponse__Output>): grpc.ClientUnaryCall;
  suspendActor(argument: _ateapi_SuspendActorRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_SuspendActorResponse__Output>): grpc.ClientUnaryCall;
  suspendActor(argument: _ateapi_SuspendActorRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_SuspendActorResponse__Output>): grpc.ClientUnaryCall;
  suspendActor(argument: _ateapi_SuspendActorRequest, callback: grpc.requestCallback<_ateapi_SuspendActorResponse__Output>): grpc.ClientUnaryCall;
  
  UpdateActor(argument: _ateapi_UpdateActorRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  UpdateActor(argument: _ateapi_UpdateActorRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  UpdateActor(argument: _ateapi_UpdateActorRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  UpdateActor(argument: _ateapi_UpdateActorRequest, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  updateActor(argument: _ateapi_UpdateActorRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  updateActor(argument: _ateapi_UpdateActorRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  updateActor(argument: _ateapi_UpdateActorRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  updateActor(argument: _ateapi_UpdateActorRequest, callback: grpc.requestCallback<_ateapi_Actor__Output>): grpc.ClientUnaryCall;
  
  UpdateActorEgressPolicy(argument: _ateapi_UpdateActorEgressPolicyRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  UpdateActorEgressPolicy(argument: _ateapi_UpdateActorEgressPolicyRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  UpdateActorEgressPolicy(argument: _ateapi_UpdateActorEgressPolicyRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  UpdateActorEgressPolicy(argument: _ateapi_UpdateActorEgressPolicyRequest, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  updateActorEgressPolicy(argument: _ateapi_UpdateActorEgressPolicyRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  updateActorEgressPolicy(argument: _ateapi_UpdateActorEgressPolicyRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  updateActorEgressPolicy(argument: _ateapi_UpdateActorEgressPolicyRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  updateActorEgressPolicy(argument: _ateapi_UpdateActorEgressPolicyRequest, callback: grpc.requestCallback<_ateapi_EgressPolicy__Output>): grpc.ClientUnaryCall;
  
  UpdateTag(argument: _ateapi_UpdateTagRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  UpdateTag(argument: _ateapi_UpdateTagRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  UpdateTag(argument: _ateapi_UpdateTagRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  UpdateTag(argument: _ateapi_UpdateTagRequest, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  updateTag(argument: _ateapi_UpdateTagRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  updateTag(argument: _ateapi_UpdateTagRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  updateTag(argument: _ateapi_UpdateTagRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  updateTag(argument: _ateapi_UpdateTagRequest, callback: grpc.requestCallback<_ateapi_Tag__Output>): grpc.ClientUnaryCall;
  
  UpdateWorker(argument: _ateapi_UpdateWorkerRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  UpdateWorker(argument: _ateapi_UpdateWorkerRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  UpdateWorker(argument: _ateapi_UpdateWorkerRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  UpdateWorker(argument: _ateapi_UpdateWorkerRequest, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  updateWorker(argument: _ateapi_UpdateWorkerRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  updateWorker(argument: _ateapi_UpdateWorkerRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  updateWorker(argument: _ateapi_UpdateWorkerRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  updateWorker(argument: _ateapi_UpdateWorkerRequest, callback: grpc.requestCallback<_ateapi_Worker__Output>): grpc.ClientUnaryCall;
  
}

export interface ControlHandlers extends grpc.UntypedServiceImplementation {
  CreateActor: grpc.handleUnaryCall<_ateapi_CreateActorRequest__Output, _ateapi_Actor>;
  
  CreateActorEgressPolicy: grpc.handleUnaryCall<_ateapi_CreateActorEgressPolicyRequest__Output, _ateapi_EgressPolicy>;
  
  CreateActorTemplate: grpc.handleUnaryCall<_ateapi_CreateActorTemplateRequest__Output, _ateapi_ActorTemplate>;
  
  CreateAtespace: grpc.handleUnaryCall<_ateapi_CreateAtespaceRequest__Output, _ateapi_Atespace>;
  
  CreateTag: grpc.handleUnaryCall<_ateapi_CreateTagRequest__Output, _ateapi_Tag>;
  
  CreateWorker: grpc.handleUnaryCall<_ateapi_CreateWorkerRequest__Output, _ateapi_Worker>;
  
  DeleteActor: grpc.handleUnaryCall<_ateapi_DeleteActorRequest__Output, _ateapi_Actor>;
  
  DeleteActorEgressPolicy: grpc.handleUnaryCall<_ateapi_DeleteActorEgressPolicyRequest__Output, _ateapi_EgressPolicy>;
  
  DeleteActorTemplate: grpc.handleUnaryCall<_ateapi_DeleteActorTemplateRequest__Output, _ateapi_ActorTemplate>;
  
  DeleteAtespace: grpc.handleUnaryCall<_ateapi_DeleteAtespaceRequest__Output, _ateapi_Atespace>;
  
  DeleteTag: grpc.handleUnaryCall<_ateapi_DeleteTagRequest__Output, _ateapi_Tag>;
  
  DeleteWorker: grpc.handleUnaryCall<_ateapi_DeleteWorkerRequest__Output, _ateapi_Worker>;
  
  DrainWorker: grpc.handleUnaryCall<_ateapi_DrainWorkerRequest__Output, _ateapi_Worker>;
  
  GetActor: grpc.handleUnaryCall<_ateapi_GetActorRequest__Output, _ateapi_Actor>;
  
  GetActorEgressPolicy: grpc.handleUnaryCall<_ateapi_GetActorEgressPolicyRequest__Output, _ateapi_EgressPolicy>;
  
  GetActorTemplate: grpc.handleUnaryCall<_ateapi_GetActorTemplateRequest__Output, _ateapi_ActorTemplate>;
  
  GetAtespace: grpc.handleUnaryCall<_ateapi_GetAtespaceRequest__Output, _ateapi_Atespace>;
  
  GetTag: grpc.handleUnaryCall<_ateapi_GetTagRequest__Output, _ateapi_Tag>;
  
  GetWorker: grpc.handleUnaryCall<_ateapi_GetWorkerRequest__Output, _ateapi_Worker>;
  
  ListActorTemplates: grpc.handleUnaryCall<_ateapi_ListActorTemplatesRequest__Output, _ateapi_ListActorTemplatesResponse>;
  
  ListActors: grpc.handleUnaryCall<_ateapi_ListActorsRequest__Output, _ateapi_ListActorsResponse>;
  
  ListAtespaces: grpc.handleUnaryCall<_ateapi_ListAtespacesRequest__Output, _ateapi_ListAtespacesResponse>;
  
  ListTags: grpc.handleUnaryCall<_ateapi_ListTagsRequest__Output, _ateapi_ListTagsResponse>;
  
  ListWorkerActorAssignments: grpc.handleUnaryCall<_ateapi_ListWorkerActorAssignmentsRequest__Output, _ateapi_ListWorkerActorAssignmentsResponse>;
  
  ListWorkers: grpc.handleUnaryCall<_ateapi_ListWorkersRequest__Output, _ateapi_ListWorkersResponse>;
  
  MintActorCertificate: grpc.handleUnaryCall<_ateapi_MintActorCertificateRequest__Output, _ateapi_MintActorCertificateResponse>;
  
  MintActorJWT: grpc.handleUnaryCall<_ateapi_MintActorJWTRequest__Output, _ateapi_MintActorJWTResponse>;
  
  PauseActor: grpc.handleUnaryCall<_ateapi_PauseActorRequest__Output, _ateapi_PauseActorResponse>;
  
  ResumeActor: grpc.handleUnaryCall<_ateapi_ResumeActorRequest__Output, _ateapi_ResumeActorResponse>;
  
  SuspendActor: grpc.handleUnaryCall<_ateapi_SuspendActorRequest__Output, _ateapi_SuspendActorResponse>;
  
  UpdateActor: grpc.handleUnaryCall<_ateapi_UpdateActorRequest__Output, _ateapi_Actor>;
  
  UpdateActorEgressPolicy: grpc.handleUnaryCall<_ateapi_UpdateActorEgressPolicyRequest__Output, _ateapi_EgressPolicy>;
  
  UpdateTag: grpc.handleUnaryCall<_ateapi_UpdateTagRequest__Output, _ateapi_Tag>;
  
  UpdateWorker: grpc.handleUnaryCall<_ateapi_UpdateWorkerRequest__Output, _ateapi_Worker>;
  
}

export interface ControlDefinition extends grpc.ServiceDefinition {
  CreateActor: MethodDefinition<_ateapi_CreateActorRequest, _ateapi_Actor, _ateapi_CreateActorRequest__Output, _ateapi_Actor__Output>
  CreateActorEgressPolicy: MethodDefinition<_ateapi_CreateActorEgressPolicyRequest, _ateapi_EgressPolicy, _ateapi_CreateActorEgressPolicyRequest__Output, _ateapi_EgressPolicy__Output>
  CreateActorTemplate: MethodDefinition<_ateapi_CreateActorTemplateRequest, _ateapi_ActorTemplate, _ateapi_CreateActorTemplateRequest__Output, _ateapi_ActorTemplate__Output>
  CreateAtespace: MethodDefinition<_ateapi_CreateAtespaceRequest, _ateapi_Atespace, _ateapi_CreateAtespaceRequest__Output, _ateapi_Atespace__Output>
  CreateTag: MethodDefinition<_ateapi_CreateTagRequest, _ateapi_Tag, _ateapi_CreateTagRequest__Output, _ateapi_Tag__Output>
  CreateWorker: MethodDefinition<_ateapi_CreateWorkerRequest, _ateapi_Worker, _ateapi_CreateWorkerRequest__Output, _ateapi_Worker__Output>
  DeleteActor: MethodDefinition<_ateapi_DeleteActorRequest, _ateapi_Actor, _ateapi_DeleteActorRequest__Output, _ateapi_Actor__Output>
  DeleteActorEgressPolicy: MethodDefinition<_ateapi_DeleteActorEgressPolicyRequest, _ateapi_EgressPolicy, _ateapi_DeleteActorEgressPolicyRequest__Output, _ateapi_EgressPolicy__Output>
  DeleteActorTemplate: MethodDefinition<_ateapi_DeleteActorTemplateRequest, _ateapi_ActorTemplate, _ateapi_DeleteActorTemplateRequest__Output, _ateapi_ActorTemplate__Output>
  DeleteAtespace: MethodDefinition<_ateapi_DeleteAtespaceRequest, _ateapi_Atespace, _ateapi_DeleteAtespaceRequest__Output, _ateapi_Atespace__Output>
  DeleteTag: MethodDefinition<_ateapi_DeleteTagRequest, _ateapi_Tag, _ateapi_DeleteTagRequest__Output, _ateapi_Tag__Output>
  DeleteWorker: MethodDefinition<_ateapi_DeleteWorkerRequest, _ateapi_Worker, _ateapi_DeleteWorkerRequest__Output, _ateapi_Worker__Output>
  DrainWorker: MethodDefinition<_ateapi_DrainWorkerRequest, _ateapi_Worker, _ateapi_DrainWorkerRequest__Output, _ateapi_Worker__Output>
  GetActor: MethodDefinition<_ateapi_GetActorRequest, _ateapi_Actor, _ateapi_GetActorRequest__Output, _ateapi_Actor__Output>
  GetActorEgressPolicy: MethodDefinition<_ateapi_GetActorEgressPolicyRequest, _ateapi_EgressPolicy, _ateapi_GetActorEgressPolicyRequest__Output, _ateapi_EgressPolicy__Output>
  GetActorTemplate: MethodDefinition<_ateapi_GetActorTemplateRequest, _ateapi_ActorTemplate, _ateapi_GetActorTemplateRequest__Output, _ateapi_ActorTemplate__Output>
  GetAtespace: MethodDefinition<_ateapi_GetAtespaceRequest, _ateapi_Atespace, _ateapi_GetAtespaceRequest__Output, _ateapi_Atespace__Output>
  GetTag: MethodDefinition<_ateapi_GetTagRequest, _ateapi_Tag, _ateapi_GetTagRequest__Output, _ateapi_Tag__Output>
  GetWorker: MethodDefinition<_ateapi_GetWorkerRequest, _ateapi_Worker, _ateapi_GetWorkerRequest__Output, _ateapi_Worker__Output>
  ListActorTemplates: MethodDefinition<_ateapi_ListActorTemplatesRequest, _ateapi_ListActorTemplatesResponse, _ateapi_ListActorTemplatesRequest__Output, _ateapi_ListActorTemplatesResponse__Output>
  ListActors: MethodDefinition<_ateapi_ListActorsRequest, _ateapi_ListActorsResponse, _ateapi_ListActorsRequest__Output, _ateapi_ListActorsResponse__Output>
  ListAtespaces: MethodDefinition<_ateapi_ListAtespacesRequest, _ateapi_ListAtespacesResponse, _ateapi_ListAtespacesRequest__Output, _ateapi_ListAtespacesResponse__Output>
  ListTags: MethodDefinition<_ateapi_ListTagsRequest, _ateapi_ListTagsResponse, _ateapi_ListTagsRequest__Output, _ateapi_ListTagsResponse__Output>
  ListWorkerActorAssignments: MethodDefinition<_ateapi_ListWorkerActorAssignmentsRequest, _ateapi_ListWorkerActorAssignmentsResponse, _ateapi_ListWorkerActorAssignmentsRequest__Output, _ateapi_ListWorkerActorAssignmentsResponse__Output>
  ListWorkers: MethodDefinition<_ateapi_ListWorkersRequest, _ateapi_ListWorkersResponse, _ateapi_ListWorkersRequest__Output, _ateapi_ListWorkersResponse__Output>
  MintActorCertificate: MethodDefinition<_ateapi_MintActorCertificateRequest, _ateapi_MintActorCertificateResponse, _ateapi_MintActorCertificateRequest__Output, _ateapi_MintActorCertificateResponse__Output>
  MintActorJWT: MethodDefinition<_ateapi_MintActorJWTRequest, _ateapi_MintActorJWTResponse, _ateapi_MintActorJWTRequest__Output, _ateapi_MintActorJWTResponse__Output>
  PauseActor: MethodDefinition<_ateapi_PauseActorRequest, _ateapi_PauseActorResponse, _ateapi_PauseActorRequest__Output, _ateapi_PauseActorResponse__Output>
  ResumeActor: MethodDefinition<_ateapi_ResumeActorRequest, _ateapi_ResumeActorResponse, _ateapi_ResumeActorRequest__Output, _ateapi_ResumeActorResponse__Output>
  SuspendActor: MethodDefinition<_ateapi_SuspendActorRequest, _ateapi_SuspendActorResponse, _ateapi_SuspendActorRequest__Output, _ateapi_SuspendActorResponse__Output>
  UpdateActor: MethodDefinition<_ateapi_UpdateActorRequest, _ateapi_Actor, _ateapi_UpdateActorRequest__Output, _ateapi_Actor__Output>
  UpdateActorEgressPolicy: MethodDefinition<_ateapi_UpdateActorEgressPolicyRequest, _ateapi_EgressPolicy, _ateapi_UpdateActorEgressPolicyRequest__Output, _ateapi_EgressPolicy__Output>
  UpdateTag: MethodDefinition<_ateapi_UpdateTagRequest, _ateapi_Tag, _ateapi_UpdateTagRequest__Output, _ateapi_Tag__Output>
  UpdateWorker: MethodDefinition<_ateapi_UpdateWorkerRequest, _ateapi_Worker, _ateapi_UpdateWorkerRequest__Output, _ateapi_Worker__Output>
}
