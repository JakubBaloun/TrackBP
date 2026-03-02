import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../model/User.model.js";
import {
  ConflictError,
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
} from "../../lib/errors.js";
import Joi from "joi";

const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Email format is invalid (e.g., name@domain.com)",
    "any.required": "Email is required",
  }),
  password: Joi.string()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$"))
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.pattern.base":
        "Password must be at least 8 characters long and contain an uppercase letter, a lowercase letter, and a number",
      "any.required": "Password is required",
    }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Email format is invalid",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),
});

export const registerUser = async (email, password) => {
  try {
    await registerSchema.validateAsync({ email, password });
  } catch (err) {
    throw new BadRequestError(err.details[0].message);
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ConflictError("User with this email already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = new User({
    email,
    passwordHash,
  });

  const savedUser = await newUser.save();
  return savedUser;
};

export const loginUser = async (email, password) => {
  try {
    await loginSchema.validateAsync({ email, password });
  } catch (err) {
    throw new BadRequestError(err.details[0].message);
  }

  const user = await User.findOne({ email });

  const isMatch = user
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  if (!user || !isMatch) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const payload = { id: user._id, email: user.email };
  const secret = process.env.JWT_SECRET;
  const options = { expiresIn: process.env.JWT_LIFESPAN };

  const token = jwt.sign(payload, secret, options);

  return token;
};

export const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select(
    "-passwordHash -__v -connections",
  );

  if (!user) {
    throw new NotFoundError("User not found");
  }

  //todo: possibly add connections fields later
  return {
    id: user._id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
