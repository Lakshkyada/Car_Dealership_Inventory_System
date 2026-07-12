import axiosInstance from './axiosInstance.js';

export function fetchVehicles(params = {}) {
  return axiosInstance.get('/vehicles', { params });
}

export function searchVehicles(params) {
  return axiosInstance.get('/vehicles/search', { params });
}

export function purchaseVehicle(id) {
  return axiosInstance.post(`/vehicles/${id}/purchase`);
}

export function createVehicle(payload) {
  const formData = new FormData();
  formData.append('make', payload.make);
  formData.append('model', payload.model);
  formData.append('category', payload.category);
  formData.append('price', payload.price);
  formData.append('quantity', payload.quantity);
  if (payload.image) {
    formData.append('image', payload.image);
  }
  return axiosInstance.post('/vehicles', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function updateVehicle(id, payload) {
  const formData = new FormData();
  if (payload.make !== undefined) formData.append('make', payload.make);
  if (payload.model !== undefined) formData.append('model', payload.model);
  if (payload.category !== undefined) formData.append('category', payload.category);
  if (payload.price !== undefined) formData.append('price', payload.price);
  if (payload.quantity !== undefined) formData.append('quantity', payload.quantity);
  if (payload.image) {
    formData.append('image', payload.image);
  }
  return axiosInstance.put(`/vehicles/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function deleteVehicle(id) {
  return axiosInstance.delete(`/vehicles/${id}`);
}

export function restockVehicle(id, quantity) {
  return axiosInstance.post(`/vehicles/${id}/restock`, { quantity });
}
