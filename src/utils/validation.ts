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

export const updateProfileSchema = Joi.object({
  full_name: Joi.string().max(100).optional(),
  avatar_url: Joi.string().max(255).uri().optional(),
  bio: Joi.string().optional(),
});

export const createCommentSchema = Joi.object({
  photo_id: Joi.number().integer().positive().required().messages({
    "number.positive": "Photo ID must be a positive number",
  }),
  content: Joi.string().min(1).max(1000).required().messages({
    "string.min": "Comment content cannot be empty",
    "string.max": "Comment cannot exceed 1000 characters",
  }),
});

export const updateCommentSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required().messages({
    "string.min": "Comment content cannot be empty",
    "string.max": "Comment cannot exceed 1000 characters",
  }),
});

export const createPhotoSchema = Joi.object({
  title: Joi.string().max(150).required(),
  description: Joi.string().optional().allow("", null),
  tags: Joi.array().items(Joi.string().max(50)).optional(),
});

export const updatePhotoSchema = Joi.object({
  title: Joi.string().max(150).optional(),
  description: Joi.string().optional(),
});

export const searchPhotosSchema = Joi.object({
  query: Joi.string().required(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  tag: Joi.string().optional(),
  username: Joi.string().optional(),
});

export const searchUsersSchema = Joi.object({
  query: Joi.string().required(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

export const moderatePhotoSchema = Joi.object({
  status: Joi.string().valid("approved", "rejected").required(),
});

export const updateUserStatusSchema = Joi.object({
  status: Joi.string().valid("active", "banned").required(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "string.empty": "Current password is required",
  }),
  newPassword: passwordSchema,
  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "Passwords do not match",
    }),
});

export const createReportSchema = Joi.object({
  target_type: Joi.string().valid("photo", "comment").required(),
  target_id: Joi.number().integer().positive().required(),
  reason: Joi.string().max(100).required().messages({
    "string.empty": "Report reason is required",
  }),
  description: Joi.string().max(1000).optional().allow("", null),
});

export function validate(schema: Joi.ObjectSchema, data: unknown) {
  return schema.validate(data, { abortEarly: false });
}
