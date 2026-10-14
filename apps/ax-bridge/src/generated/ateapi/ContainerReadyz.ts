// Original file: proto/ateapi.proto

import type { HTTPGetAction as _ateapi_HTTPGetAction, HTTPGetAction__Output as _ateapi_HTTPGetAction__Output } from '../ateapi/HTTPGetAction';

export interface ContainerReadyz {
  'httpGet'?: (_ateapi_HTTPGetAction | null);
  'timeoutSeconds'?: (number);
}

export interface ContainerReadyz__Output {
  'httpGet': (_ateapi_HTTPGetAction__Output | null);
  'timeoutSeconds': (number);
}
