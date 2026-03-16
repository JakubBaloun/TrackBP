import api from "./client";

export const getActivities = async (filters = {}) => {
  const response = await api.get("/activities", { params: filters });
  return response.data;
};

export const getActivity = async (id) => {
  const response = await api.get(`/activities/${id}`);
  return response.data;
};

export const updateActivity = async (id, data) => {
  const response = await api.put(`/activities/${id}`, data);
  return response.data;
};

export const deleteActivity = async (id) => {
  const response = await api.delete(`/activities/${id}`);
  return response.data;
};

export const syncActivities = async () => {
  const response = await api.post("/activities/sync");
  return response.data;
};

export const getStats = async () => {
  const response = await api.get("/activities/stats");
  return response.data;
};
