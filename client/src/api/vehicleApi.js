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

export function createVehicle(payload) {
  return axiosInstance.post('/vehicles', payload);
}

export function updateVehicle(id, payload) {
  return axiosInstance.put(`/vehicles/${id}`, payload);
}

export function deleteVehicle(id) {
  return axiosInstance.delete(`/vehicles/${id}`);
}
