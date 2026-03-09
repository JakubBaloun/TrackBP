import axios from "axios";
import User from "../../user/model/User.model.js";
import { UnauthorizedError, NotFoundError } from "../../lib/errors.js";

const POLAR_AUTH_URL = "https://flow.polar.com/oauth2/authorization";
const POLAR_TOKEN_URL = "https://polarremote.com/v2/oauth2/token";
const POLAR_API_BASE = "https://www.polaraccesslink.com/v3";

const _exchangeCodeForToken = async (code) => {
  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", process.env.POLAR_REDIRECT_URI);

  const credentials = `${process.env.POLAR_CLIENT_ID}:${process.env.POLAR_CLIENT_SECRET}`;

  const basicAuth = `Basic ${Buffer.from(credentials).toString("base64")}`;

  const tokenResponse = await axios.post(POLAR_TOKEN_URL, params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuth,
    },
  });

  const {
    access_token: accessToken,
    expires_in: expiresIn,
    x_user_id: providerUserId,
  } = tokenResponse.data;

  return { accessToken, expiresIn, providerUserId };
};

const _registerUserOnPolar = async (accessToken, userId) => {
  try {
    await axios.post(
      `${POLAR_API_BASE}/users`,
      {
        "member-id": userId.toString(),
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  } catch (error) {
    if (error.response && error.response.status === 409) {
      return;
    }
    throw error;
  }
};

const _saveOrUpdateConnection = async (userId, tokenData) => {
  const { accessToken, expiresIn, providerUserId } = tokenData;

  const user = await User.findById(userId);
  if (!user) {
    throw new UnauthorizedError("User not found during callback processing");
  }

  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  const newConnection = {
    provider: "polar",
    accessToken,
    expiresAt,
    providerUserId: providerUserId.toString(),
  };

  const existingConnIdx = user.connections.findIndex(
    (conn) => conn.provider === "polar",
  );

  if (existingConnIdx >= 0) {
    user.connections[existingConnIdx] = newConnection;
  } else {
    user.connections.push(newConnection);
  }

  await user.save();
  return user;
};

export const getPolarAuthUrl = async (userId) => {
  const params = new URLSearchParams({
    client_id: process.env.POLAR_CLIENT_ID,
    redirect_uri: process.env.POLAR_REDIRECT_URI,
    response_type: "code",
    scope: "accesslink.read_all",
    state: userId,
  });

  return { authorizationUrl: `${POLAR_AUTH_URL}?${params.toString()}` };
};

export const handlePolarCallback = async (code, userId) => {
  const tokenData = await _exchangeCodeForToken(code);

  await _registerUserOnPolar(tokenData.accessToken, userId);

  const user = await _saveOrUpdateConnection(userId, tokenData);

  return user;
};

export const getPolarConnectionStatus = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const conn = user.connections?.find((c) => c.provider === "polar");

  if (!conn) {
    return {
      connected: false,
      meta: {
        hasConnection: false,
        isExpired: false,
      },
    };
  }

  const now = new Date();
  const isExpired = conn.expiresAt ? conn.expiresAt <= now : false;

  return {
    connected: !isExpired,
    providerUserId: conn.providerUserId,
    expiresAt: conn.expiresAt,
    meta: {
      hasConnection: true,
      isExpired,
    },
  };
};

export const getPolarExercises = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const conn = user.connections?.find((c) => c.provider === "polar");

  if (!conn) {
    throw new UnauthorizedError("Polar account not connected");
  }

  const now = new Date();
  if (conn.expiresAt && conn.expiresAt <= now) {
    throw new UnauthorizedError("Polar access token expired");
  }

  const accessToken = conn.accessToken;

  const response = await axios.get(
    `${POLAR_API_BASE}/exercises/?samples=true&zones=true&route=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    },
  );

  return response.data;
};

export const getPolarExerciseById = async (userId, exerciseId) => {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("User not found");

  const conn = user.connections?.find((c) => c.provider === "polar");
  if (!conn) throw new UnauthorizedError("Polar account not connected");

  const now = new Date();
  if (conn.expiresAt && conn.expiresAt <= now) {
    throw new UnauthorizedError("Polar access token expired");
  }

  const accessToken = conn.accessToken;

  try {
    const response = await axios.get(
      `${POLAR_API_BASE}/exercises/${exerciseId}`,
      {
        params: {
          samples: "true",
          zones: "true",
          route: "true",
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      },
    );

    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new NotFoundError("Exercise not found");
    }
    throw error;
  }
};
