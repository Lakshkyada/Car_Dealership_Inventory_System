import axiosInstance from './axiosInstance.js';

export function registerRequest(payload) {
  return axiosInstance.post('/auth/register', payload);
}

export function loginRequest(payload) {
  return axiosInstance.post('/auth/login', payload);
}
