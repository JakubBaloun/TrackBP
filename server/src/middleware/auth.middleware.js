import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../lib/errors.js";

export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw new UnauthorizedError("User not authorized, missing token");
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    throw new UnauthorizedError("User not authorized, token invalid");
  }
};
