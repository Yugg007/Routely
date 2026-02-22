import { SpringBackendInstance, NodeBackendInstance } from './AxiosInstance';

const BackendService = async (url, body, contentType = 'application/json') => {
  const response = await SpringBackendInstance.post(url, body, {
    headers: {
      'Content-Type': contentType,
    },
  });
  return response;
};

const NodeBackendService = async (url, body = {}, contentType = 'application/json') => {
  const response = await NodeBackendInstance.post(url, body, {
    headers: {
      'Content-Type': contentType,
    },
  });
  return response;
};

export { BackendService, NodeBackendService };