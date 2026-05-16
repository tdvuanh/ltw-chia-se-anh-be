import Joi from "joi";

const passwordSchema = Joi.string().min(8).max(128).required().messages({
  "string.min": "Password must be at least 8 characters",
  "string.max": "Password cannot exceed 128 characters",
});

export const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required().messages({
    "string.alphanum": "Username must contain only alphanumeric characters",
    "string.min": "Username must be at least 3 characters",
  }),
  email: Joi.string().email().max(100).required(),
  password: passwordSchema,
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match",
  }),
  full_name: Joi.string().max(100).optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: passwordSchema,
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match",
  }),
});

export const verifyEmailSchema = Joi.object({
  token: Joi.string().required(),
});

export function validate(schema: Joi.ObjectSchema, data: unknown) {
  return schema.validate(data, { abortEarly: false });
}
