import axiosInstance from './axiosInstance.js';

export function fetchVehicles() {
  return axiosInstance.get('/vehicles');
}
