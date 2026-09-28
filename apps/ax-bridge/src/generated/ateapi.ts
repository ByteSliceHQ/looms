import type * as grpc from '@grpc/grpc-js';
import type { EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';

import type { Actor as _ateapi_Actor, Actor__Output as _ateapi_Actor__Output } from './ateapi/Actor';
import type { ActorAssignment as _ateapi_ActorAssignment, ActorAssignment__Output as _ateapi_ActorAssignment__Output } from './ateapi/ActorAssignment';
import type { ActorMetadataDataSource as _ateapi_ActorMetadataDataSource, ActorMetadataDataSource__Output as _ateapi_ActorMetadataDataSource__Output } from './ateapi/ActorMetadataDataSource';
import type { ActorMetadataItem as _ateapi_ActorMetadataItem, ActorMetadataItem__Output as _ateapi_ActorMetadataItem__Output } from './ateapi/ActorMetadataItem';
import type { ActorStatus as _ateapi_ActorStatus, ActorStatus__Output as _ateapi_ActorStatus__Output } from './ateapi/ActorStatus';
import type { ActorTemplate as _ateapi_ActorTemplate, ActorTemplate__Output as _ateapi_ActorTemplate__Output } from './ateapi/ActorTemplate';
import type { ActorTemplateStatus as _ateapi_ActorTemplateStatus, ActorTemplateStatus__Output as _ateapi_ActorTemplateStatus__Output } from './ateapi/ActorTemplateStatus';
import type { Atespace as _ateapi_Atespace, Atespace__Output as _ateapi_Atespace__Output } from './ateapi/Atespace';
import type { CIDRRule as _ateapi_CIDRRule, CIDRRule__Output as _ateapi_CIDRRule__Output } from './ateapi/CIDRRule';
import type { Capabilities as _ateapi_Capabilities, Capabilities__Output as _ateapi_Capabilities__Output } from './ateapi/Capabilities';
import type { Container as _ateapi_Container, Container__Output as _ateapi_Container__Output } from './ateapi/Container';
import type { ContainerReadyz as _ateapi_ContainerReadyz, ContainerReadyz__Output as _ateapi_ContainerReadyz__Output } from './ateapi/ContainerReadyz';
import type { ControlClient as _ateapi_ControlClient, ControlDefinition as _ateapi_ControlDefinition } from './ateapi/Control';
import type { CreateActorEgressPolicyRequest as _ateapi_CreateActorEgressPolicyRequest, CreateActorEgressPolicyRequest__Output as _ateapi_CreateActorEgressPolicyRequest__Output } from './ateapi/CreateActorEgressPolicyRequest';
import type { CreateActorRequest as _ateapi_CreateActorRequest, CreateActorRequest__Output as _ateapi_CreateActorRequest__Output } from './ateapi/CreateActorRequest';
import type { CreateActorTemplateRequest as _ateapi_CreateActorTemplateRequest, CreateActorTemplateRequest__Output as _ateapi_CreateActorTemplateRequest__Output } from './ateapi/CreateActorTemplateRequest';
import type { CreateAtespaceRequest as _ateapi_CreateAtespaceRequest, CreateAtespaceRequest__Output as _ateapi_CreateAtespaceRequest__Output } from './ateapi/CreateAtespaceRequest';
import type { CreateTagRequest as _ateapi_CreateTagRequest, CreateTagRequest__Output as _ateapi_CreateTagRequest__Output } from './ateapi/CreateTagRequest';
import type { CreateWorkerRequest as _ateapi_CreateWorkerRequest, CreateWorkerRequest__Output as _ateapi_CreateWorkerRequest__Output } from './ateapi/CreateWorkerRequest';
import type { CredentialHeaderInjection as _ateapi_CredentialHeaderInjection, CredentialHeaderInjection__Output as _ateapi_CredentialHeaderInjection__Output } from './ateapi/CredentialHeaderInjection';
import type { DeleteActorEgressPolicyRequest as _ateapi_DeleteActorEgressPolicyRequest, DeleteActorEgressPolicyRequest__Output as _ateapi_DeleteActorEgressPolicyRequest__Output } from './ateapi/DeleteActorEgressPolicyRequest';
import type { DeleteActorRequest as _ateapi_DeleteActorRequest, DeleteActorRequest__Output as _ateapi_DeleteActorRequest__Output } from './ateapi/DeleteActorRequest';
import type { DeleteActorTemplateRequest as _ateapi_DeleteActorTemplateRequest, DeleteActorTemplateRequest__Output as _ateapi_DeleteActorTemplateRequest__Output } from './ateapi/DeleteActorTemplateRequest';
import type { DeleteAtespaceRequest as _ateapi_DeleteAtespaceRequest, DeleteAtespaceRequest__Output as _ateapi_DeleteAtespaceRequest__Output } from './ateapi/DeleteAtespaceRequest';
import type { DeleteOptions as _ateapi_DeleteOptions, DeleteOptions__Output as _ateapi_DeleteOptions__Output } from './ateapi/DeleteOptions';
import type { DeleteTagRequest as _ateapi_DeleteTagRequest, DeleteTagRequest__Output as _ateapi_DeleteTagRequest__Output } from './ateapi/DeleteTagRequest';
import type { DeleteWorkerRequest as _ateapi_DeleteWorkerRequest, DeleteWorkerRequest__Output as _ateapi_DeleteWorkerRequest__Output } from './ateapi/DeleteWorkerRequest';
import type { DrainWorkerRequest as _ateapi_DrainWorkerRequest, DrainWorkerRequest__Output as _ateapi_DrainWorkerRequest__Output } from './ateapi/DrainWorkerRequest';
import type { DurableDirVolumeSource as _ateapi_DurableDirVolumeSource, DurableDirVolumeSource__Output as _ateapi_DurableDirVolumeSource__Output } from './ateapi/DurableDirVolumeSource';
import type { EgressPolicy as _ateapi_EgressPolicy, EgressPolicy__Output as _ateapi_EgressPolicy__Output } from './ateapi/EgressPolicy';
import type { EgressRule as _ateapi_EgressRule, EgressRule__Output as _ateapi_EgressRule__Output } from './ateapi/EgressRule';
import type { EgressRuleEffects as _ateapi_EgressRuleEffects, EgressRuleEffects__Output as _ateapi_EgressRuleEffects__Output } from './ateapi/EgressRuleEffects';
import type { EnvVar as _ateapi_EnvVar, EnvVar__Output as _ateapi_EnvVar__Output } from './ateapi/EnvVar';
import type { ExternalSnapshot as _ateapi_ExternalSnapshot, ExternalSnapshot__Output as _ateapi_ExternalSnapshot__Output } from './ateapi/ExternalSnapshot';
import type { ExternalVolume as _ateapi_ExternalVolume, ExternalVolume__Output as _ateapi_ExternalVolume__Output } from './ateapi/ExternalVolume';
import type { ExternalVolumeTemplate as _ateapi_ExternalVolumeTemplate, ExternalVolumeTemplate__Output as _ateapi_ExternalVolumeTemplate__Output } from './ateapi/ExternalVolumeTemplate';
import type { GetActorEgressPolicyRequest as _ateapi_GetActorEgressPolicyRequest, GetActorEgressPolicyRequest__Output as _ateapi_GetActorEgressPolicyRequest__Output } from './ateapi/GetActorEgressPolicyRequest';
import type { GetActorRequest as _ateapi_GetActorRequest, GetActorRequest__Output as _ateapi_GetActorRequest__Output } from './ateapi/GetActorRequest';
import type { GetActorSnapshotRequest as _ateapi_GetActorSnapshotRequest, GetActorSnapshotRequest__Output as _ateapi_GetActorSnapshotRequest__Output } from './ateapi/GetActorSnapshotRequest';
import type { GetActorSnapshotTagRequest as _ateapi_GetActorSnapshotTagRequest, GetActorSnapshotTagRequest__Output as _ateapi_GetActorSnapshotTagRequest__Output } from './ateapi/GetActorSnapshotTagRequest';
import type { GetActorTemplateRequest as _ateapi_GetActorTemplateRequest, GetActorTemplateRequest__Output as _ateapi_GetActorTemplateRequest__Output } from './ateapi/GetActorTemplateRequest';
import type { GetAtespaceRequest as _ateapi_GetAtespaceRequest, GetAtespaceRequest__Output as _ateapi_GetAtespaceRequest__Output } from './ateapi/GetAtespaceRequest';
import type { GetTagRequest as _ateapi_GetTagRequest, GetTagRequest__Output as _ateapi_GetTagRequest__Output } from './ateapi/GetTagRequest';
import type { GetWorkerRequest as _ateapi_GetWorkerRequest, GetWorkerRequest__Output as _ateapi_GetWorkerRequest__Output } from './ateapi/GetWorkerRequest';
import type { GoldenSnapshotStatus as _ateapi_GoldenSnapshotStatus, GoldenSnapshotStatus__Output as _ateapi_GoldenSnapshotStatus__Output } from './ateapi/GoldenSnapshotStatus';
import type { HTTPGetAction as _ateapi_HTTPGetAction, HTTPGetAction__Output as _ateapi_HTTPGetAction__Output } from './ateapi/HTTPGetAction';
import type { HostnameRule as _ateapi_HostnameRule, HostnameRule__Output as _ateapi_HostnameRule__Output } from './ateapi/HostnameRule';
import type { ImageVolumeSource as _ateapi_ImageVolumeSource, ImageVolumeSource__Output as _ateapi_ImageVolumeSource__Output } from './ateapi/ImageVolumeSource';
import type { Limits as _ateapi_Limits, Limits__Output as _ateapi_Limits__Output } from './ateapi/Limits';
import type { ListActorTemplatesRequest as _ateapi_ListActorTemplatesRequest, ListActorTemplatesRequest__Output as _ateapi_ListActorTemplatesRequest__Output } from './ateapi/ListActorTemplatesRequest';
import type { ListActorTemplatesResponse as _ateapi_ListActorTemplatesResponse, ListActorTemplatesResponse__Output as _ateapi_ListActorTemplatesResponse__Output } from './ateapi/ListActorTemplatesResponse';
import type { ListActorsRequest as _ateapi_ListActorsRequest, ListActorsRequest__Output as _ateapi_ListActorsRequest__Output } from './ateapi/ListActorsRequest';
import type { ListActorsResponse as _ateapi_ListActorsResponse, ListActorsResponse__Output as _ateapi_ListActorsResponse__Output } from './ateapi/ListActorsResponse';
import type { ListAtespacesRequest as _ateapi_ListAtespacesRequest, ListAtespacesRequest__Output as _ateapi_ListAtespacesRequest__Output } from './ateapi/ListAtespacesRequest';
import type { ListAtespacesResponse as _ateapi_ListAtespacesResponse, ListAtespacesResponse__Output as _ateapi_ListAtespacesResponse__Output } from './ateapi/ListAtespacesResponse';
import type { ListTagsRequest as _ateapi_ListTagsRequest, ListTagsRequest__Output as _ateapi_ListTagsRequest__Output } from './ateapi/ListTagsRequest';
import type { ListTagsResponse as _ateapi_ListTagsResponse, ListTagsResponse__Output as _ateapi_ListTagsResponse__Output } from './ateapi/ListTagsResponse';
import type { ListWorkerActorAssignmentsRequest as _ateapi_ListWorkerActorAssignmentsRequest, ListWorkerActorAssignmentsRequest__Output as _ateapi_ListWorkerActorAssignmentsRequest__Output } from './ateapi/ListWorkerActorAssignmentsRequest';
import type { ListWorkerActorAssignmentsResponse as _ateapi_ListWorkerActorAssignmentsResponse, ListWorkerActorAssignmentsResponse__Output as _ateapi_ListWorkerActorAssignmentsResponse__Output } from './ateapi/ListWorkerActorAssignmentsResponse';
import type { ListWorkersRequest as _ateapi_ListWorkersRequest, ListWorkersRequest__Output as _ateapi_ListWorkersRequest__Output } from './ateapi/ListWorkersRequest';
import type { ListWorkersResponse as _ateapi_ListWorkersResponse, ListWorkersResponse__Output as _ateapi_ListWorkersResponse__Output } from './ateapi/ListWorkersResponse';
import type { LocalSnapshotInfo as _ateapi_LocalSnapshotInfo, LocalSnapshotInfo__Output as _ateapi_LocalSnapshotInfo__Output } from './ateapi/LocalSnapshotInfo';
import type { MintActorCertificateRequest as _ateapi_MintActorCertificateRequest, MintActorCertificateRequest__Output as _ateapi_MintActorCertificateRequest__Output } from './ateapi/MintActorCertificateRequest';
import type { MintActorCertificateResponse as _ateapi_MintActorCertificateResponse, MintActorCertificateResponse__Output as _ateapi_MintActorCertificateResponse__Output } from './ateapi/MintActorCertificateResponse';
import type { MintActorJWTRequest as _ateapi_MintActorJWTRequest, MintActorJWTRequest__Output as _ateapi_MintActorJWTRequest__Output } from './ateapi/MintActorJWTRequest';
import type { MintActorJWTResponse as _ateapi_MintActorJWTResponse, MintActorJWTResponse__Output as _ateapi_MintActorJWTResponse__Output } from './ateapi/MintActorJWTResponse';
import type { ObjectRef as _ateapi_ObjectRef, ObjectRef__Output as _ateapi_ObjectRef__Output } from './ateapi/ObjectRef';
import type { OnResumeConfig as _ateapi_OnResumeConfig, OnResumeConfig__Output as _ateapi_OnResumeConfig__Output } from './ateapi/OnResumeConfig';
import type { PauseActorRequest as _ateapi_PauseActorRequest, PauseActorRequest__Output as _ateapi_PauseActorRequest__Output } from './ateapi/PauseActorRequest';
import type { PauseActorResponse as _ateapi_PauseActorResponse, PauseActorResponse__Output as _ateapi_PauseActorResponse__Output } from './ateapi/PauseActorResponse';
import type { ResourceMetadata as _ateapi_ResourceMetadata, ResourceMetadata__Output as _ateapi_ResourceMetadata__Output } from './ateapi/ResourceMetadata';
import type { Resources as _ateapi_Resources, Resources__Output as _ateapi_Resources__Output } from './ateapi/Resources';
import type { ResumeActorRequest as _ateapi_ResumeActorRequest, ResumeActorRequest__Output as _ateapi_ResumeActorRequest__Output } from './ateapi/ResumeActorRequest';
import type { ResumeActorResponse as _ateapi_ResumeActorResponse, ResumeActorResponse__Output as _ateapi_ResumeActorResponse__Output } from './ateapi/ResumeActorResponse';
import type { SandboxConfig as _ateapi_SandboxConfig, SandboxConfig__Output as _ateapi_SandboxConfig__Output } from './ateapi/SandboxConfig';
import type { SecurityContext as _ateapi_SecurityContext, SecurityContext__Output as _ateapi_SecurityContext__Output } from './ateapi/SecurityContext';
import type { Selector as _ateapi_Selector, Selector__Output as _ateapi_Selector__Output } from './ateapi/Selector';
import type { SetWorkerCapacityRequest as _ateapi_SetWorkerCapacityRequest, SetWorkerCapacityRequest__Output as _ateapi_SetWorkerCapacityRequest__Output } from './ateapi/SetWorkerCapacityRequest';
import type { SetWorkerCapacityResponse as _ateapi_SetWorkerCapacityResponse, SetWorkerCapacityResponse__Output as _ateapi_SetWorkerCapacityResponse__Output } from './ateapi/SetWorkerCapacityResponse';
import type { SnapshotsConfig as _ateapi_SnapshotsConfig, SnapshotsConfig__Output as _ateapi_SnapshotsConfig__Output } from './ateapi/SnapshotsConfig';
import type { SuspendActorRequest as _ateapi_SuspendActorRequest, SuspendActorRequest__Output as _ateapi_SuspendActorRequest__Output } from './ateapi/SuspendActorRequest';
import type { SuspendActorResponse as _ateapi_SuspendActorResponse, SuspendActorResponse__Output as _ateapi_SuspendActorResponse__Output } from './ateapi/SuspendActorResponse';
import type { SystemInfoDataSource as _ateapi_SystemInfoDataSource, SystemInfoDataSource__Output as _ateapi_SystemInfoDataSource__Output } from './ateapi/SystemInfoDataSource';
import type { SystemInfoVolumeSource as _ateapi_SystemInfoVolumeSource, SystemInfoVolumeSource__Output as _ateapi_SystemInfoVolumeSource__Output } from './ateapi/SystemInfoVolumeSource';
import type { Tag as _ateapi_Tag, Tag__Output as _ateapi_Tag__Output } from './ateapi/Tag';
import type { TagStatus as _ateapi_TagStatus, TagStatus__Output as _ateapi_TagStatus__Output } from './ateapi/TagStatus';
import type { TrustBundleDataSource as _ateapi_TrustBundleDataSource, TrustBundleDataSource__Output as _ateapi_TrustBundleDataSource__Output } from './ateapi/TrustBundleDataSource';
import type { UpdateActorEgressPolicyRequest as _ateapi_UpdateActorEgressPolicyRequest, UpdateActorEgressPolicyRequest__Output as _ateapi_UpdateActorEgressPolicyRequest__Output } from './ateapi/UpdateActorEgressPolicyRequest';
import type { UpdateActorRequest as _ateapi_UpdateActorRequest, UpdateActorRequest__Output as _ateapi_UpdateActorRequest__Output } from './ateapi/UpdateActorRequest';
import type { UpdateTagRequest as _ateapi_UpdateTagRequest, UpdateTagRequest__Output as _ateapi_UpdateTagRequest__Output } from './ateapi/UpdateTagRequest';
import type { UpdateWorkerRequest as _ateapi_UpdateWorkerRequest, UpdateWorkerRequest__Output as _ateapi_UpdateWorkerRequest__Output } from './ateapi/UpdateWorkerRequest';
import type { Volume as _ateapi_Volume, Volume__Output as _ateapi_Volume__Output } from './ateapi/Volume';
import type { VolumeMount as _ateapi_VolumeMount, VolumeMount__Output as _ateapi_VolumeMount__Output } from './ateapi/VolumeMount';
import type { Worker as _ateapi_Worker, Worker__Output as _ateapi_Worker__Output } from './ateapi/Worker';
import type { WorkerAssignment as _ateapi_WorkerAssignment, WorkerAssignment__Output as _ateapi_WorkerAssignment__Output } from './ateapi/WorkerAssignment';
import type { WorkerResources as _ateapi_WorkerResources, WorkerResources__Output as _ateapi_WorkerResources__Output } from './ateapi/WorkerResources';
import type { WorkerServiceClient as _ateapi_WorkerServiceClient, WorkerServiceDefinition as _ateapi_WorkerServiceDefinition } from './ateapi/WorkerService';
import type { WorkerStatus as _ateapi_WorkerStatus, WorkerStatus__Output as _ateapi_WorkerStatus__Output } from './ateapi/WorkerStatus';
import type { Empty as _google_protobuf_Empty, Empty__Output as _google_protobuf_Empty__Output } from './google/protobuf/Empty';
import type { Timestamp as _google_protobuf_Timestamp, Timestamp__Output as _google_protobuf_Timestamp__Output } from './google/protobuf/Timestamp';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  ateapi: {
    Actor: MessageTypeDefinition<_ateapi_Actor, _ateapi_Actor__Output>
    ActorAssignment: MessageTypeDefinition<_ateapi_ActorAssignment, _ateapi_ActorAssignment__Output>
    ActorCertificatePurpose: EnumTypeDefinition
    ActorMetadataDataSource: MessageTypeDefinition<_ateapi_ActorMetadataDataSource, _ateapi_ActorMetadataDataSource__Output>
    ActorMetadataField: EnumTypeDefinition
    ActorMetadataItem: MessageTypeDefinition<_ateapi_ActorMetadataItem, _ateapi_ActorMetadataItem__Output>
    ActorState: EnumTypeDefinition
    ActorStatus: MessageTypeDefinition<_ateapi_ActorStatus, _ateapi_ActorStatus__Output>
    ActorTemplate: MessageTypeDefinition<_ateapi_ActorTemplate, _ateapi_ActorTemplate__Output>
    ActorTemplateStatus: MessageTypeDefinition<_ateapi_ActorTemplateStatus, _ateapi_ActorTemplateStatus__Output>
    Atespace: MessageTypeDefinition<_ateapi_Atespace, _ateapi_Atespace__Output>
    CIDRRule: MessageTypeDefinition<_ateapi_CIDRRule, _ateapi_CIDRRule__Output>
    Capabilities: MessageTypeDefinition<_ateapi_Capabilities, _ateapi_Capabilities__Output>
    Container: MessageTypeDefinition<_ateapi_Container, _ateapi_Container__Output>
    ContainerReadyz: MessageTypeDefinition<_ateapi_ContainerReadyz, _ateapi_ContainerReadyz__Output>
    Control: SubtypeConstructor<typeof grpc.Client, _ateapi_ControlClient> & { service: _ateapi_ControlDefinition }
    CreateActorEgressPolicyRequest: MessageTypeDefinition<_ateapi_CreateActorEgressPolicyRequest, _ateapi_CreateActorEgressPolicyRequest__Output>
    CreateActorRequest: MessageTypeDefinition<_ateapi_CreateActorRequest, _ateapi_CreateActorRequest__Output>
    CreateActorTemplateRequest: MessageTypeDefinition<_ateapi_CreateActorTemplateRequest, _ateapi_CreateActorTemplateRequest__Output>
    CreateAtespaceRequest: MessageTypeDefinition<_ateapi_CreateAtespaceRequest, _ateapi_CreateAtespaceRequest__Output>
    CreateTagRequest: MessageTypeDefinition<_ateapi_CreateTagRequest, _ateapi_CreateTagRequest__Output>
    CreateWorkerRequest: MessageTypeDefinition<_ateapi_CreateWorkerRequest, _ateapi_CreateWorkerRequest__Output>
    CredentialHeaderInjection: MessageTypeDefinition<_ateapi_CredentialHeaderInjection, _ateapi_CredentialHeaderInjection__Output>
    DeleteActorEgressPolicyRequest: MessageTypeDefinition<_ateapi_DeleteActorEgressPolicyRequest, _ateapi_DeleteActorEgressPolicyRequest__Output>
    DeleteActorRequest: MessageTypeDefinition<_ateapi_DeleteActorRequest, _ateapi_DeleteActorRequest__Output>
    DeleteActorTemplateRequest: MessageTypeDefinition<_ateapi_DeleteActorTemplateRequest, _ateapi_DeleteActorTemplateRequest__Output>
    DeleteAtespaceRequest: MessageTypeDefinition<_ateapi_DeleteAtespaceRequest, _ateapi_DeleteAtespaceRequest__Output>
    DeleteOptions: MessageTypeDefinition<_ateapi_DeleteOptions, _ateapi_DeleteOptions__Output>
    DeleteTagRequest: MessageTypeDefinition<_ateapi_DeleteTagRequest, _ateapi_DeleteTagRequest__Output>
    DeleteWorkerRequest: MessageTypeDefinition<_ateapi_DeleteWorkerRequest, _ateapi_DeleteWorkerRequest__Output>
    DrainWorkerRequest: MessageTypeDefinition<_ateapi_DrainWorkerRequest, _ateapi_DrainWorkerRequest__Output>
    DurableDirVolumeSource: MessageTypeDefinition<_ateapi_DurableDirVolumeSource, _ateapi_DurableDirVolumeSource__Output>
    EgressPolicy: MessageTypeDefinition<_ateapi_EgressPolicy, _ateapi_EgressPolicy__Output>
    EgressRule: MessageTypeDefinition<_ateapi_EgressRule, _ateapi_EgressRule__Output>
    EgressRuleEffects: MessageTypeDefinition<_ateapi_EgressRuleEffects, _ateapi_EgressRuleEffects__Output>
    EnvVar: MessageTypeDefinition<_ateapi_EnvVar, _ateapi_EnvVar__Output>
    ExternalSnapshot: MessageTypeDefinition<_ateapi_ExternalSnapshot, _ateapi_ExternalSnapshot__Output>
    ExternalVolume: MessageTypeDefinition<_ateapi_ExternalVolume, _ateapi_ExternalVolume__Output>
    ExternalVolumeTemplate: MessageTypeDefinition<_ateapi_ExternalVolumeTemplate, _ateapi_ExternalVolumeTemplate__Output>
    GetActorEgressPolicyRequest: MessageTypeDefinition<_ateapi_GetActorEgressPolicyRequest, _ateapi_GetActorEgressPolicyRequest__Output>
    GetActorRequest: MessageTypeDefinition<_ateapi_GetActorRequest, _ateapi_GetActorRequest__Output>
    GetActorSnapshotRequest: MessageTypeDefinition<_ateapi_GetActorSnapshotRequest, _ateapi_GetActorSnapshotRequest__Output>
    GetActorSnapshotTagRequest: MessageTypeDefinition<_ateapi_GetActorSnapshotTagRequest, _ateapi_GetActorSnapshotTagRequest__Output>
    GetActorTemplateRequest: MessageTypeDefinition<_ateapi_GetActorTemplateRequest, _ateapi_GetActorTemplateRequest__Output>
    GetAtespaceRequest: MessageTypeDefinition<_ateapi_GetAtespaceRequest, _ateapi_GetAtespaceRequest__Output>
    GetTagRequest: MessageTypeDefinition<_ateapi_GetTagRequest, _ateapi_GetTagRequest__Output>
    GetWorkerRequest: MessageTypeDefinition<_ateapi_GetWorkerRequest, _ateapi_GetWorkerRequest__Output>
    GoldenSnapshotStatus: MessageTypeDefinition<_ateapi_GoldenSnapshotStatus, _ateapi_GoldenSnapshotStatus__Output>
    HTTPGetAction: MessageTypeDefinition<_ateapi_HTTPGetAction, _ateapi_HTTPGetAction__Output>
    HostnameRule: MessageTypeDefinition<_ateapi_HostnameRule, _ateapi_HostnameRule__Output>
    ImageVolumeSource: MessageTypeDefinition<_ateapi_ImageVolumeSource, _ateapi_ImageVolumeSource__Output>
    Limits: MessageTypeDefinition<_ateapi_Limits, _ateapi_Limits__Output>
    ListActorTemplatesRequest: MessageTypeDefinition<_ateapi_ListActorTemplatesRequest, _ateapi_ListActorTemplatesRequest__Output>
    ListActorTemplatesResponse: MessageTypeDefinition<_ateapi_ListActorTemplatesResponse, _ateapi_ListActorTemplatesResponse__Output>
    ListActorsRequest: MessageTypeDefinition<_ateapi_ListActorsRequest, _ateapi_ListActorsRequest__Output>
    ListActorsResponse: MessageTypeDefinition<_ateapi_ListActorsResponse, _ateapi_ListActorsResponse__Output>
    ListAtespacesRequest: MessageTypeDefinition<_ateapi_ListAtespacesRequest, _ateapi_ListAtespacesRequest__Output>
    ListAtespacesResponse: MessageTypeDefinition<_ateapi_ListAtespacesResponse, _ateapi_ListAtespacesResponse__Output>
    ListTagsRequest: MessageTypeDefinition<_ateapi_ListTagsRequest, _ateapi_ListTagsRequest__Output>
    ListTagsResponse: MessageTypeDefinition<_ateapi_ListTagsResponse, _ateapi_ListTagsResponse__Output>
    ListWorkerActorAssignmentsRequest: MessageTypeDefinition<_ateapi_ListWorkerActorAssignmentsRequest, _ateapi_ListWorkerActorAssignmentsRequest__Output>
    ListWorkerActorAssignmentsResponse: MessageTypeDefinition<_ateapi_ListWorkerActorAssignmentsResponse, _ateapi_ListWorkerActorAssignmentsResponse__Output>
    ListWorkersRequest: MessageTypeDefinition<_ateapi_ListWorkersRequest, _ateapi_ListWorkersRequest__Output>
    ListWorkersResponse: MessageTypeDefinition<_ateapi_ListWorkersResponse, _ateapi_ListWorkersResponse__Output>
    LocalSnapshotInfo: MessageTypeDefinition<_ateapi_LocalSnapshotInfo, _ateapi_LocalSnapshotInfo__Output>
    MintActorCertificateRequest: MessageTypeDefinition<_ateapi_MintActorCertificateRequest, _ateapi_MintActorCertificateRequest__Output>
    MintActorCertificateResponse: MessageTypeDefinition<_ateapi_MintActorCertificateResponse, _ateapi_MintActorCertificateResponse__Output>
    MintActorJWTRequest: MessageTypeDefinition<_ateapi_MintActorJWTRequest, _ateapi_MintActorJWTRequest__Output>
    MintActorJWTResponse: MessageTypeDefinition<_ateapi_MintActorJWTResponse, _ateapi_MintActorJWTResponse__Output>
    ObjectRef: MessageTypeDefinition<_ateapi_ObjectRef, _ateapi_ObjectRef__Output>
    OnResumeConfig: MessageTypeDefinition<_ateapi_OnResumeConfig, _ateapi_OnResumeConfig__Output>
    PauseActorRequest: MessageTypeDefinition<_ateapi_PauseActorRequest, _ateapi_PauseActorRequest__Output>
    PauseActorResponse: MessageTypeDefinition<_ateapi_PauseActorResponse, _ateapi_PauseActorResponse__Output>
    ResourceMetadata: MessageTypeDefinition<_ateapi_ResourceMetadata, _ateapi_ResourceMetadata__Output>
    Resources: MessageTypeDefinition<_ateapi_Resources, _ateapi_Resources__Output>
    ResumeActorRequest: MessageTypeDefinition<_ateapi_ResumeActorRequest, _ateapi_ResumeActorRequest__Output>
    ResumeActorResponse: MessageTypeDefinition<_ateapi_ResumeActorResponse, _ateapi_ResumeActorResponse__Output>
    ResumeSource: EnumTypeDefinition
    SandboxClass: EnumTypeDefinition
    SandboxConfig: MessageTypeDefinition<_ateapi_SandboxConfig, _ateapi_SandboxConfig__Output>
    SecurityContext: MessageTypeDefinition<_ateapi_SecurityContext, _ateapi_SecurityContext__Output>
    Selector: MessageTypeDefinition<_ateapi_Selector, _ateapi_Selector__Output>
    SetWorkerCapacityRequest: MessageTypeDefinition<_ateapi_SetWorkerCapacityRequest, _ateapi_SetWorkerCapacityRequest__Output>
    SetWorkerCapacityResponse: MessageTypeDefinition<_ateapi_SetWorkerCapacityResponse, _ateapi_SetWorkerCapacityResponse__Output>
    SnapshotContentScope: EnumTypeDefinition
    SnapshotsConfig: MessageTypeDefinition<_ateapi_SnapshotsConfig, _ateapi_SnapshotsConfig__Output>
    SuspendActorRequest: MessageTypeDefinition<_ateapi_SuspendActorRequest, _ateapi_SuspendActorRequest__Output>
    SuspendActorResponse: MessageTypeDefinition<_ateapi_SuspendActorResponse, _ateapi_SuspendActorResponse__Output>
    SystemInfoDataSource: MessageTypeDefinition<_ateapi_SystemInfoDataSource, _ateapi_SystemInfoDataSource__Output>
    SystemInfoVolumeSource: MessageTypeDefinition<_ateapi_SystemInfoVolumeSource, _ateapi_SystemInfoVolumeSource__Output>
    Tag: MessageTypeDefinition<_ateapi_Tag, _ateapi_Tag__Output>
    TagScope: EnumTypeDefinition
    TagStatus: MessageTypeDefinition<_ateapi_TagStatus, _ateapi_TagStatus__Output>
    TrustBundleDataSource: MessageTypeDefinition<_ateapi_TrustBundleDataSource, _ateapi_TrustBundleDataSource__Output>
    UpdateActorEgressPolicyRequest: MessageTypeDefinition<_ateapi_UpdateActorEgressPolicyRequest, _ateapi_UpdateActorEgressPolicyRequest__Output>
    UpdateActorRequest: MessageTypeDefinition<_ateapi_UpdateActorRequest, _ateapi_UpdateActorRequest__Output>
    UpdateTagRequest: MessageTypeDefinition<_ateapi_UpdateTagRequest, _ateapi_UpdateTagRequest__Output>
    UpdateWorkerRequest: MessageTypeDefinition<_ateapi_UpdateWorkerRequest, _ateapi_UpdateWorkerRequest__Output>
    Volume: MessageTypeDefinition<_ateapi_Volume, _ateapi_Volume__Output>
    VolumeMount: MessageTypeDefinition<_ateapi_VolumeMount, _ateapi_VolumeMount__Output>
    Worker: MessageTypeDefinition<_ateapi_Worker, _ateapi_Worker__Output>
    WorkerAssignment: MessageTypeDefinition<_ateapi_WorkerAssignment, _ateapi_WorkerAssignment__Output>
    WorkerResources: MessageTypeDefinition<_ateapi_WorkerResources, _ateapi_WorkerResources__Output>
    WorkerService: SubtypeConstructor<typeof grpc.Client, _ateapi_WorkerServiceClient> & { service: _ateapi_WorkerServiceDefinition }
    WorkerState: EnumTypeDefinition
    WorkerStatus: MessageTypeDefinition<_ateapi_WorkerStatus, _ateapi_WorkerStatus__Output>
  }
  google: {
    protobuf: {
      Empty: MessageTypeDefinition<_google_protobuf_Empty, _google_protobuf_Empty__Output>
      Timestamp: MessageTypeDefinition<_google_protobuf_Timestamp, _google_protobuf_Timestamp__Output>
    }
  }
}

