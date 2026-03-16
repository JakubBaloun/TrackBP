import api from "./client";

export const getPolarConnectUrl = async () => {
  const response = await api.get("/polar/connect");
  return response.data;
};

export const getPolarStatus = async () => {
  const response = await api.get("/polar/status");
  return response.data;
};
