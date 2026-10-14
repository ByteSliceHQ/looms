import type * as grpc from '@grpc/grpc-js';
import type { EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';

import type { AXClient as _ax_v1alpha1_AXClient, AXDefinition as _ax_v1alpha1_AXDefinition } from './ax/v1alpha1/AX';
import type { Condition as _ax_v1alpha1_Condition, Condition__Output as _ax_v1alpha1_Condition__Output } from './ax/v1alpha1/Condition';
import type { DeleteGatewayRequest as _ax_v1alpha1_DeleteGatewayRequest, DeleteGatewayRequest__Output as _ax_v1alpha1_DeleteGatewayRequest__Output } from './ax/v1alpha1/DeleteGatewayRequest';
import type { DeleteGatewayResponse as _ax_v1alpha1_DeleteGatewayResponse, DeleteGatewayResponse__Output as _ax_v1alpha1_DeleteGatewayResponse__Output } from './ax/v1alpha1/DeleteGatewayResponse';
import type { DeleteModelRequest as _ax_v1alpha1_DeleteModelRequest, DeleteModelRequest__Output as _ax_v1alpha1_DeleteModelRequest__Output } from './ax/v1alpha1/DeleteModelRequest';
import type { DeleteModelResponse as _ax_v1alpha1_DeleteModelResponse, DeleteModelResponse__Output as _ax_v1alpha1_DeleteModelResponse__Output } from './ax/v1alpha1/DeleteModelResponse';
import type { DeleteTaskRequest as _ax_v1alpha1_DeleteTaskRequest, DeleteTaskRequest__Output as _ax_v1alpha1_DeleteTaskRequest__Output } from './ax/v1alpha1/DeleteTaskRequest';
import type { DeleteTaskResponse as _ax_v1alpha1_DeleteTaskResponse, DeleteTaskResponse__Output as _ax_v1alpha1_DeleteTaskResponse__Output } from './ax/v1alpha1/DeleteTaskResponse';
import type { DeleteWorkspaceRequest as _ax_v1alpha1_DeleteWorkspaceRequest, DeleteWorkspaceRequest__Output as _ax_v1alpha1_DeleteWorkspaceRequest__Output } from './ax/v1alpha1/DeleteWorkspaceRequest';
import type { DeleteWorkspaceResponse as _ax_v1alpha1_DeleteWorkspaceResponse, DeleteWorkspaceResponse__Output as _ax_v1alpha1_DeleteWorkspaceResponse__Output } from './ax/v1alpha1/DeleteWorkspaceResponse';
import type { EgressAllowlist as _ax_v1alpha1_EgressAllowlist, EgressAllowlist__Output as _ax_v1alpha1_EgressAllowlist__Output } from './ax/v1alpha1/EgressAllowlist';
import type { EgressConfig as _ax_v1alpha1_EgressConfig, EgressConfig__Output as _ax_v1alpha1_EgressConfig__Output } from './ax/v1alpha1/EgressConfig';
import type { EnvVar as _ax_v1alpha1_EnvVar, EnvVar__Output as _ax_v1alpha1_EnvVar__Output } from './ax/v1alpha1/EnvVar';
import type { Gateway as _ax_v1alpha1_Gateway, Gateway__Output as _ax_v1alpha1_Gateway__Output } from './ax/v1alpha1/Gateway';
import type { GatewayRef as _ax_v1alpha1_GatewayRef, GatewayRef__Output as _ax_v1alpha1_GatewayRef__Output } from './ax/v1alpha1/GatewayRef';
import type { GatewaySpec as _ax_v1alpha1_GatewaySpec, GatewaySpec__Output as _ax_v1alpha1_GatewaySpec__Output } from './ax/v1alpha1/GatewaySpec';
import type { GetGatewayRequest as _ax_v1alpha1_GetGatewayRequest, GetGatewayRequest__Output as _ax_v1alpha1_GetGatewayRequest__Output } from './ax/v1alpha1/GetGatewayRequest';
import type { GetModelRequest as _ax_v1alpha1_GetModelRequest, GetModelRequest__Output as _ax_v1alpha1_GetModelRequest__Output } from './ax/v1alpha1/GetModelRequest';
import type { GetTaskRequest as _ax_v1alpha1_GetTaskRequest, GetTaskRequest__Output as _ax_v1alpha1_GetTaskRequest__Output } from './ax/v1alpha1/GetTaskRequest';
import type { GetWorkspaceRequest as _ax_v1alpha1_GetWorkspaceRequest, GetWorkspaceRequest__Output as _ax_v1alpha1_GetWorkspaceRequest__Output } from './ax/v1alpha1/GetWorkspaceRequest';
import type { GitRepo as _ax_v1alpha1_GitRepo, GitRepo__Output as _ax_v1alpha1_GitRepo__Output } from './ax/v1alpha1/GitRepo';
import type { HostRule as _ax_v1alpha1_HostRule, HostRule__Output as _ax_v1alpha1_HostRule__Output } from './ax/v1alpha1/HostRule';
import type { ListGatewaysRequest as _ax_v1alpha1_ListGatewaysRequest, ListGatewaysRequest__Output as _ax_v1alpha1_ListGatewaysRequest__Output } from './ax/v1alpha1/ListGatewaysRequest';
import type { ListGatewaysResponse as _ax_v1alpha1_ListGatewaysResponse, ListGatewaysResponse__Output as _ax_v1alpha1_ListGatewaysResponse__Output } from './ax/v1alpha1/ListGatewaysResponse';
import type { ListModelsRequest as _ax_v1alpha1_ListModelsRequest, ListModelsRequest__Output as _ax_v1alpha1_ListModelsRequest__Output } from './ax/v1alpha1/ListModelsRequest';
import type { ListModelsResponse as _ax_v1alpha1_ListModelsResponse, ListModelsResponse__Output as _ax_v1alpha1_ListModelsResponse__Output } from './ax/v1alpha1/ListModelsResponse';
import type { ListTasksRequest as _ax_v1alpha1_ListTasksRequest, ListTasksRequest__Output as _ax_v1alpha1_ListTasksRequest__Output } from './ax/v1alpha1/ListTasksRequest';
import type { ListTasksResponse as _ax_v1alpha1_ListTasksResponse, ListTasksResponse__Output as _ax_v1alpha1_ListTasksResponse__Output } from './ax/v1alpha1/ListTasksResponse';
import type { ListWorkspacesRequest as _ax_v1alpha1_ListWorkspacesRequest, ListWorkspacesRequest__Output as _ax_v1alpha1_ListWorkspacesRequest__Output } from './ax/v1alpha1/ListWorkspacesRequest';
import type { ListWorkspacesResponse as _ax_v1alpha1_ListWorkspacesResponse, ListWorkspacesResponse__Output as _ax_v1alpha1_ListWorkspacesResponse__Output } from './ax/v1alpha1/ListWorkspacesResponse';
import type { Listener as _ax_v1alpha1_Listener, Listener__Output as _ax_v1alpha1_Listener__Output } from './ax/v1alpha1/Listener';
import type { MCPConfig as _ax_v1alpha1_MCPConfig, MCPConfig__Output as _ax_v1alpha1_MCPConfig__Output } from './ax/v1alpha1/MCPConfig';
import type { MCPRegistry as _ax_v1alpha1_MCPRegistry, MCPRegistry__Output as _ax_v1alpha1_MCPRegistry__Output } from './ax/v1alpha1/MCPRegistry';
import type { MCPServer as _ax_v1alpha1_MCPServer, MCPServer__Output as _ax_v1alpha1_MCPServer__Output } from './ax/v1alpha1/MCPServer';
import type { Model as _ax_v1alpha1_Model, Model__Output as _ax_v1alpha1_Model__Output } from './ax/v1alpha1/Model';
import type { ModelSpec as _ax_v1alpha1_ModelSpec, ModelSpec__Output as _ax_v1alpha1_ModelSpec__Output } from './ax/v1alpha1/ModelSpec';
import type { ObjectMeta as _ax_v1alpha1_ObjectMeta, ObjectMeta__Output as _ax_v1alpha1_ObjectMeta__Output } from './ax/v1alpha1/ObjectMeta';
import type { PendingApproval as _ax_v1alpha1_PendingApproval, PendingApproval__Output as _ax_v1alpha1_PendingApproval__Output } from './ax/v1alpha1/PendingApproval';
import type { ResourceList as _ax_v1alpha1_ResourceList, ResourceList__Output as _ax_v1alpha1_ResourceList__Output } from './ax/v1alpha1/ResourceList';
import type { ResourceReqs as _ax_v1alpha1_ResourceReqs, ResourceReqs__Output as _ax_v1alpha1_ResourceReqs__Output } from './ax/v1alpha1/ResourceReqs';
import type { ResumeTaskRequest as _ax_v1alpha1_ResumeTaskRequest, ResumeTaskRequest__Output as _ax_v1alpha1_ResumeTaskRequest__Output } from './ax/v1alpha1/ResumeTaskRequest';
import type { SecretKeyRef as _ax_v1alpha1_SecretKeyRef, SecretKeyRef__Output as _ax_v1alpha1_SecretKeyRef__Output } from './ax/v1alpha1/SecretKeyRef';
import type { SkillRegistry as _ax_v1alpha1_SkillRegistry, SkillRegistry__Output as _ax_v1alpha1_SkillRegistry__Output } from './ax/v1alpha1/SkillRegistry';
import type { SkillsConfig as _ax_v1alpha1_SkillsConfig, SkillsConfig__Output as _ax_v1alpha1_SkillsConfig__Output } from './ax/v1alpha1/SkillsConfig';
import type { SuspendTaskRequest as _ax_v1alpha1_SuspendTaskRequest, SuspendTaskRequest__Output as _ax_v1alpha1_SuspendTaskRequest__Output } from './ax/v1alpha1/SuspendTaskRequest';
import type { Task as _ax_v1alpha1_Task, Task__Output as _ax_v1alpha1_Task__Output } from './ax/v1alpha1/Task';
import type { TaskSpec as _ax_v1alpha1_TaskSpec, TaskSpec__Output as _ax_v1alpha1_TaskSpec__Output } from './ax/v1alpha1/TaskSpec';
import type { TaskStatus as _ax_v1alpha1_TaskStatus, TaskStatus__Output as _ax_v1alpha1_TaskStatus__Output } from './ax/v1alpha1/TaskStatus';
import type { UpdateGatewayRequest as _ax_v1alpha1_UpdateGatewayRequest, UpdateGatewayRequest__Output as _ax_v1alpha1_UpdateGatewayRequest__Output } from './ax/v1alpha1/UpdateGatewayRequest';
import type { UpdateModelRequest as _ax_v1alpha1_UpdateModelRequest, UpdateModelRequest__Output as _ax_v1alpha1_UpdateModelRequest__Output } from './ax/v1alpha1/UpdateModelRequest';
import type { UpdateTaskRequest as _ax_v1alpha1_UpdateTaskRequest, UpdateTaskRequest__Output as _ax_v1alpha1_UpdateTaskRequest__Output } from './ax/v1alpha1/UpdateTaskRequest';
import type { UpdateWorkspaceRequest as _ax_v1alpha1_UpdateWorkspaceRequest, UpdateWorkspaceRequest__Output as _ax_v1alpha1_UpdateWorkspaceRequest__Output } from './ax/v1alpha1/UpdateWorkspaceRequest';
import type { UsageStats as _ax_v1alpha1_UsageStats, UsageStats__Output as _ax_v1alpha1_UsageStats__Output } from './ax/v1alpha1/UsageStats';
import type { WatchTaskRequest as _ax_v1alpha1_WatchTaskRequest, WatchTaskRequest__Output as _ax_v1alpha1_WatchTaskRequest__Output } from './ax/v1alpha1/WatchTaskRequest';
import type { WatchTaskResponse as _ax_v1alpha1_WatchTaskResponse, WatchTaskResponse__Output as _ax_v1alpha1_WatchTaskResponse__Output } from './ax/v1alpha1/WatchTaskResponse';
import type { Workspace as _ax_v1alpha1_Workspace, Workspace__Output as _ax_v1alpha1_Workspace__Output } from './ax/v1alpha1/Workspace';
import type { WorkspaceRef as _ax_v1alpha1_WorkspaceRef, WorkspaceRef__Output as _ax_v1alpha1_WorkspaceRef__Output } from './ax/v1alpha1/WorkspaceRef';
import type { WorkspaceSpec as _ax_v1alpha1_WorkspaceSpec, WorkspaceSpec__Output as _ax_v1alpha1_WorkspaceSpec__Output } from './ax/v1alpha1/WorkspaceSpec';
import type { ListValue as _google_protobuf_ListValue, ListValue__Output as _google_protobuf_ListValue__Output } from './google/protobuf/ListValue';
import type { Struct as _google_protobuf_Struct, Struct__Output as _google_protobuf_Struct__Output } from './google/protobuf/Struct';
import type { Timestamp as _google_protobuf_Timestamp, Timestamp__Output as _google_protobuf_Timestamp__Output } from './google/protobuf/Timestamp';
import type { Value as _google_protobuf_Value, Value__Output as _google_protobuf_Value__Output } from './google/protobuf/Value';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  ax: {
    v1alpha1: {
      AX: SubtypeConstructor<typeof grpc.Client, _ax_v1alpha1_AXClient> & { service: _ax_v1alpha1_AXDefinition }
      Condition: MessageTypeDefinition<_ax_v1alpha1_Condition, _ax_v1alpha1_Condition__Output>
      DeleteGatewayRequest: MessageTypeDefinition<_ax_v1alpha1_DeleteGatewayRequest, _ax_v1alpha1_DeleteGatewayRequest__Output>
      DeleteGatewayResponse: MessageTypeDefinition<_ax_v1alpha1_DeleteGatewayResponse, _ax_v1alpha1_DeleteGatewayResponse__Output>
      DeleteModelRequest: MessageTypeDefinition<_ax_v1alpha1_DeleteModelRequest, _ax_v1alpha1_DeleteModelRequest__Output>
      DeleteModelResponse: MessageTypeDefinition<_ax_v1alpha1_DeleteModelResponse, _ax_v1alpha1_DeleteModelResponse__Output>
      DeleteTaskRequest: MessageTypeDefinition<_ax_v1alpha1_DeleteTaskRequest, _ax_v1alpha1_DeleteTaskRequest__Output>
      DeleteTaskResponse: MessageTypeDefinition<_ax_v1alpha1_DeleteTaskResponse, _ax_v1alpha1_DeleteTaskResponse__Output>
      DeleteWorkspaceRequest: MessageTypeDefinition<_ax_v1alpha1_DeleteWorkspaceRequest, _ax_v1alpha1_DeleteWorkspaceRequest__Output>
      DeleteWorkspaceResponse: MessageTypeDefinition<_ax_v1alpha1_DeleteWorkspaceResponse, _ax_v1alpha1_DeleteWorkspaceResponse__Output>
      EgressAllowlist: MessageTypeDefinition<_ax_v1alpha1_EgressAllowlist, _ax_v1alpha1_EgressAllowlist__Output>
      EgressConfig: MessageTypeDefinition<_ax_v1alpha1_EgressConfig, _ax_v1alpha1_EgressConfig__Output>
      EnvVar: MessageTypeDefinition<_ax_v1alpha1_EnvVar, _ax_v1alpha1_EnvVar__Output>
      Gateway: MessageTypeDefinition<_ax_v1alpha1_Gateway, _ax_v1alpha1_Gateway__Output>
      GatewayRef: MessageTypeDefinition<_ax_v1alpha1_GatewayRef, _ax_v1alpha1_GatewayRef__Output>
      GatewaySpec: MessageTypeDefinition<_ax_v1alpha1_GatewaySpec, _ax_v1alpha1_GatewaySpec__Output>
      GetGatewayRequest: MessageTypeDefinition<_ax_v1alpha1_GetGatewayRequest, _ax_v1alpha1_GetGatewayRequest__Output>
      GetModelRequest: MessageTypeDefinition<_ax_v1alpha1_GetModelRequest, _ax_v1alpha1_GetModelRequest__Output>
      GetTaskRequest: MessageTypeDefinition<_ax_v1alpha1_GetTaskRequest, _ax_v1alpha1_GetTaskRequest__Output>
      GetWorkspaceRequest: MessageTypeDefinition<_ax_v1alpha1_GetWorkspaceRequest, _ax_v1alpha1_GetWorkspaceRequest__Output>
      GitRepo: MessageTypeDefinition<_ax_v1alpha1_GitRepo, _ax_v1alpha1_GitRepo__Output>
      HostRule: MessageTypeDefinition<_ax_v1alpha1_HostRule, _ax_v1alpha1_HostRule__Output>
      ListGatewaysRequest: MessageTypeDefinition<_ax_v1alpha1_ListGatewaysRequest, _ax_v1alpha1_ListGatewaysRequest__Output>
      ListGatewaysResponse: MessageTypeDefinition<_ax_v1alpha1_ListGatewaysResponse, _ax_v1alpha1_ListGatewaysResponse__Output>
      ListModelsRequest: MessageTypeDefinition<_ax_v1alpha1_ListModelsRequest, _ax_v1alpha1_ListModelsRequest__Output>
      ListModelsResponse: MessageTypeDefinition<_ax_v1alpha1_ListModelsResponse, _ax_v1alpha1_ListModelsResponse__Output>
      ListTasksRequest: MessageTypeDefinition<_ax_v1alpha1_ListTasksRequest, _ax_v1alpha1_ListTasksRequest__Output>
      ListTasksResponse: MessageTypeDefinition<_ax_v1alpha1_ListTasksResponse, _ax_v1alpha1_ListTasksResponse__Output>
      ListWorkspacesRequest: MessageTypeDefinition<_ax_v1alpha1_ListWorkspacesRequest, _ax_v1alpha1_ListWorkspacesRequest__Output>
      ListWorkspacesResponse: MessageTypeDefinition<_ax_v1alpha1_ListWorkspacesResponse, _ax_v1alpha1_ListWorkspacesResponse__Output>
      Listener: MessageTypeDefinition<_ax_v1alpha1_Listener, _ax_v1alpha1_Listener__Output>
      MCPConfig: MessageTypeDefinition<_ax_v1alpha1_MCPConfig, _ax_v1alpha1_MCPConfig__Output>
      MCPRegistry: MessageTypeDefinition<_ax_v1alpha1_MCPRegistry, _ax_v1alpha1_MCPRegistry__Output>
      MCPServer: MessageTypeDefinition<_ax_v1alpha1_MCPServer, _ax_v1alpha1_MCPServer__Output>
      Model: MessageTypeDefinition<_ax_v1alpha1_Model, _ax_v1alpha1_Model__Output>
      ModelSpec: MessageTypeDefinition<_ax_v1alpha1_ModelSpec, _ax_v1alpha1_ModelSpec__Output>
      ObjectMeta: MessageTypeDefinition<_ax_v1alpha1_ObjectMeta, _ax_v1alpha1_ObjectMeta__Output>
      PendingApproval: MessageTypeDefinition<_ax_v1alpha1_PendingApproval, _ax_v1alpha1_PendingApproval__Output>
      ResourceList: MessageTypeDefinition<_ax_v1alpha1_ResourceList, _ax_v1alpha1_ResourceList__Output>
      ResourceReqs: MessageTypeDefinition<_ax_v1alpha1_ResourceReqs, _ax_v1alpha1_ResourceReqs__Output>
      ResumeTaskRequest: MessageTypeDefinition<_ax_v1alpha1_ResumeTaskRequest, _ax_v1alpha1_ResumeTaskRequest__Output>
      SecretKeyRef: MessageTypeDefinition<_ax_v1alpha1_SecretKeyRef, _ax_v1alpha1_SecretKeyRef__Output>
      SkillRegistry: MessageTypeDefinition<_ax_v1alpha1_SkillRegistry, _ax_v1alpha1_SkillRegistry__Output>
      SkillsConfig: MessageTypeDefinition<_ax_v1alpha1_SkillsConfig, _ax_v1alpha1_SkillsConfig__Output>
      SuspendTaskRequest: MessageTypeDefinition<_ax_v1alpha1_SuspendTaskRequest, _ax_v1alpha1_SuspendTaskRequest__Output>
      Task: MessageTypeDefinition<_ax_v1alpha1_Task, _ax_v1alpha1_Task__Output>
      TaskSpec: MessageTypeDefinition<_ax_v1alpha1_TaskSpec, _ax_v1alpha1_TaskSpec__Output>
      TaskStatus: MessageTypeDefinition<_ax_v1alpha1_TaskStatus, _ax_v1alpha1_TaskStatus__Output>
      UpdateGatewayRequest: MessageTypeDefinition<_ax_v1alpha1_UpdateGatewayRequest, _ax_v1alpha1_UpdateGatewayRequest__Output>
      UpdateModelRequest: MessageTypeDefinition<_ax_v1alpha1_UpdateModelRequest, _ax_v1alpha1_UpdateModelRequest__Output>
      UpdateTaskRequest: MessageTypeDefinition<_ax_v1alpha1_UpdateTaskRequest, _ax_v1alpha1_UpdateTaskRequest__Output>
      UpdateWorkspaceRequest: MessageTypeDefinition<_ax_v1alpha1_UpdateWorkspaceRequest, _ax_v1alpha1_UpdateWorkspaceRequest__Output>
      UsageStats: MessageTypeDefinition<_ax_v1alpha1_UsageStats, _ax_v1alpha1_UsageStats__Output>
      WatchTaskRequest: MessageTypeDefinition<_ax_v1alpha1_WatchTaskRequest, _ax_v1alpha1_WatchTaskRequest__Output>
      WatchTaskResponse: MessageTypeDefinition<_ax_v1alpha1_WatchTaskResponse, _ax_v1alpha1_WatchTaskResponse__Output>
      Workspace: MessageTypeDefinition<_ax_v1alpha1_Workspace, _ax_v1alpha1_Workspace__Output>
      WorkspaceRef: MessageTypeDefinition<_ax_v1alpha1_WorkspaceRef, _ax_v1alpha1_WorkspaceRef__Output>
      WorkspaceSpec: MessageTypeDefinition<_ax_v1alpha1_WorkspaceSpec, _ax_v1alpha1_WorkspaceSpec__Output>
    }
  }
  google: {
    protobuf: {
      ListValue: MessageTypeDefinition<_google_protobuf_ListValue, _google_protobuf_ListValue__Output>
      NullValue: EnumTypeDefinition
      Struct: MessageTypeDefinition<_google_protobuf_Struct, _google_protobuf_Struct__Output>
      Timestamp: MessageTypeDefinition<_google_protobuf_Timestamp, _google_protobuf_Timestamp__Output>
      Value: MessageTypeDefinition<_google_protobuf_Value, _google_protobuf_Value__Output>
    }
  }
}

