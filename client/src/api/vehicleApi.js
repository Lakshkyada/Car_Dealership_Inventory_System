import axiosInstance from './axiosInstance.js';

export function fetchVehicles() {
  return axiosInstance.get('/vehicles');
}

export function searchVehicles(params) {
  return axiosInstance.get('/vehicles/search', { params });
}

export function purchaseVehicle(id) {
  return axiosInstance.post(`/vehicles/${id}/purchase`);
}
