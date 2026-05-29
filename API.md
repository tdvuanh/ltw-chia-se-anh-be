# Photo Sharing API Documentation

Complete REST API for a photo-sharing social media platform with authentication, photo management, likes, comments, follows, and search.

## Features

- **Photo Management**: Upload photos with titles, descriptions, and tags
- **Social Interactions**: Like/unlike photos, post/edit/delete comments
- **Follow System**: Follow/unfollow users, view followers and following lists
- **Search**: Find photos by name, tags, or username; search users
- **Feed**: Personalized feed from followed users
- **User Profiles**: View and update user profiles

## API Endpoints Summary

### Authentication
- POST `/auth/register` - Register new account
- POST `/auth/login` - Login and get JWT token
- POST `/auth/verify-email` - Verify email address
- POST `/auth/forgot-password` - Request password reset
- POST `/auth/reset-password` - Reset password

### Photos
- GET `/photos` - Get trending photos (paginated)
- GET `/photos/feed` - Get personal feed (requires auth)
- GET `/photos/:id` - Get single photo
- GET `/photos/user/:userId` - Get user's photos
- GET `/photos/search?q=...` - Search photos
- POST `/photos` - Upload new photo (requires auth)
- PATCH `/photos/:id` - Update photo (requires auth, owner only)
- DELETE `/photos/:id` - Delete photo (requires auth, owner only)

### Likes
- POST `/photos/:id/like` - Like a photo (requires auth)
- DELETE `/photos/:id/like` - Unlike a photo (requires auth)
- GET `/photos/:id/likes` - Get users who liked photo

### Comments
- GET `/comments/photo/:photoId` - Get comments on photo
- POST `/comments` - Post comment (requires auth)
- PATCH `/comments/:id` - Update comment (requires auth, author only)
- DELETE `/comments/:id` - Delete comment (requires auth, author only)

### Users
- GET `/users/:id` - Get user profile
- GET `/users/me` - Get authenticated user's profile (requires auth)
- PATCH `/users/:id` - Update user profile (requires auth, owner only)
- GET `/users/search?q=...` - Search users

### Follow
- POST `/users/:id/follow` - Follow user (requires auth)
- DELETE `/users/:id/follow` - Unfollow user (requires auth)
- GET `/users/:id/followers` - Get user's followers
- GET `/users/:id/following` - Get users being followed

### Administration
- GET `/admin/stats` - View stats & reports (requires admin auth)
- PATCH `/admin/photos/:id/moderate` - Moderate pending photo (requires admin auth)
- PATCH `/admin/users/:id/status` - Ban/unban user (requires admin auth)
- DELETE `/admin/photos/:id` - Delete photo (requires admin auth)
- DELETE `/admin/comments/:id` - Delete comment (requires admin auth)

---

## Detailed Endpoint Documentation

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "full_name": "John Doe"
}
```

**Response (201):**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "user": {
      "id": 1,
      "email": "john@example.com",
      "username": "johndoe",
      "full_name": "John Doe"
    }
  }
}
```

---

### POST /auth/login
Login and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "john@example.com",
      "username": "johndoe",
      "full_name": "John Doe"
    }
  }
}
```

---

### POST /photos
Upload a new photo with tags and description.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "title": "Beautiful Sunset",
  "description": "Captured at the beach during golden hour",
  "image_url": "https://example.com/image.jpg",
  "tags": ["sunset", "beach", "nature"]
}
```

**Response (201):**
```json
{
  "message": "Photo created successfully",
  "data": {
    "photo": {
      "id": 1,
      "title": "Beautiful Sunset",
      "description": "Captured at the beach during golden hour",
      "image_url": "https://example.com/image.jpg",
      "user": {
        "id": 1,
        "username": "johndoe",
        "full_name": "John Doe",
        "avatar_url": "https://..."
      },
      "tags": [
        {"id": 1, "name": "sunset"},
        {"id": 2, "name": "beach"},
        {"id": 3, "name": "nature"}
      ],
      "likes_count": 0,
      "comments_count": 0,
      "created_at": "2024-05-17T10:30:00Z"
    }
  }
}
```

---

### GET /photos
Get trending photos (sorted by likes, then date).

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Results per page, max 100 (default: 20)

**Response (200):**
```json
{
  "message": "Photos retrieved successfully",
  "data": {
    "photos": [
      {
        "id": 1,
        "title": "Beautiful Sunset",
        "description": "Captured at the beach",
        "image_url": "https://...",
        "user": {
          "id": 1,
          "username": "johndoe",
          "full_name": "John Doe",
          "avatar_url": "https://..."
        },
        "tags": [
          {"id": 1, "name": "sunset"},
          {"id": 2, "name": "beach"}
        ],
        "likes_count": 42,
        "comments_count": 5,
        "created_at": "2024-05-17T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100
    }
  }
}
```

---

### GET /photos/:id
Get single photo with all details including comments.

**Response (200):**
```json
{
  "message": "Photo retrieved successfully",
  "data": {
    "photo": {
      "id": 1,
      "title": "Beautiful Sunset",
      "description": "Captured at the beach",
      "image_url": "https://...",
      "user": {
        "id": 1,
        "username": "johndoe",
        "full_name": "John Doe",
        "avatar_url": "https://..."
      },
      "tags": [
        {"id": 1, "name": "sunset"},
        {"id": 2, "name": "beach"}
      ],
      "likes_count": 42,
      "comments_count": 5,
      "comments": [
        {
          "id": 1,
          "content": "Amazing shot!",
          "user": {
            "id": 2,
            "username": "janedoe",
            "avatar_url": "https://..."
          },
          "created_at": "2024-05-17T11:00:00Z"
        }
      ],
      "created_at": "2024-05-17T10:30:00Z"
    }
  }
}
```

---

### POST /photos/:id/like
Like a photo.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Photo liked successfully",
  "data": {
    "likes_count": 43
  }
}
```

**Error (409):**
```json
{
  "message": "You already liked this photo"
}
```

---

### DELETE /photos/:id/like
Unlike a photo.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Photo unliked successfully",
  "data": {
    "likes_count": 42
  }
}
```

---

### GET /photos/:id/likes
Get list of users who liked the photo.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Results per page, max 100 (default: 20)

**Response (200):**
```json
{
  "message": "Likes retrieved successfully",
  "data": {
    "users": [
      {
        "id": 2,
        "username": "janedoe",
        "full_name": "Jane Doe",
        "avatar_url": "https://..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 43
    }
  }
}
```

---

### GET /photos/search
Search photos by title, description, tags, or username.

**Query Parameters:**
- `q` (required) - Search query
- `tag` (optional) - Filter by specific tag
- `username` (optional) - Filter by username
- `page` - Page number (default: 1)
- `limit` - Results per page, max 100 (default: 20)

**Example:** `/photos/search?q=sunset&tag=beach&username=johndoe`

**Response (200):**
```json
{
  "message": "Search results retrieved successfully",
  "data": {
    "photos": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5
    }
  }
}
```

---

### GET /photos/feed
Get personalized feed (photos from followed users + own photos).

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Results per page, max 100 (default: 20)

**Response (200):**
```json
{
  "message": "Feed retrieved successfully",
  "data": {
    "photos": [...],
    "pagination": {
      "page": 1,
      "limit": 20
    }
  }
}
```

---

### GET /photos/user/:userId
Get all approved photos from a specific user.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Results per page, max 100 (default: 20)

**Response (200):**
```json
{
  "message": "User photos retrieved successfully",
  "data": {
    "photos": [...],
    "pagination": {
      "page": 1,
      "limit": 20
    }
  }
}
```

---

### POST /comments
Post a comment on a photo.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "photo_id": 1,
  "content": "Amazing shot!"
}
```

**Response (201):**
```json
{
  "message": "Comment created successfully",
  "data": {
    "comment": {
      "id": 1,
      "content": "Amazing shot!",
      "photo_id": 1,
      "user": {
        "id": 1,
        "username": "johndoe"
      },
      "created_at": "2024-05-17T11:00:00Z"
    }
  }
}
```

---

### GET /comments/photo/:photoId
Get all comments on a photo.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Results per page, max 100 (default: 20)

**Response (200):**
```json
{
  "message": "Comments retrieved successfully",
  "data": {
    "comments": [
      {
        "id": 1,
        "content": "Amazing shot!",
        "user": {
          "id": 2,
          "username": "janedoe",
          "avatar_url": "https://..."
        },
        "created_at": "2024-05-17T11:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20
    }
  }
}
```

---

### POST /users/:id/follow
Follow a user.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Followed successfully"
}
```

---

### DELETE /users/:id/follow
Unfollow a user.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Unfollowed successfully"
}
```

---

### GET /users/:id/followers
Get list of user's followers.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Results per page, max 100 (default: 20)

**Response (200):**
```json
{
  "message": "Followers retrieved successfully",
  "data": {
    "followers": [
      {
        "id": 2,
        "username": "janedoe",
        "full_name": "Jane Doe",
        "avatar_url": "https://...",
        "bio": "Nature photographer"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5
    }
  }
}
```

---

### GET /users/:id/following
Get list of users being followed.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Results per page, max 100 (default: 20)

**Response (200):**
```json
{
  "message": "Following retrieved successfully",
  "data": {
    "following": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10
    }
  }
}
```

---

### GET /users/search
Search for users by username or full name.

**Query Parameters:**
- `q` (required) - Search query
- `page` - Page number (default: 1)
- `limit` - Results per page, max 100 (default: 20)

**Response (200):**
```json
{
  "message": "Users found successfully",
  "data": {
    "users": [
      {
        "id": 1,
        "username": "johndoe",
        "full_name": "John Doe",
        "avatar_url": "https://...",
        "bio": "Photography enthusiast",
        "created_at": "2024-05-17T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1
    }
  }
}
```

---

### GET /admin/stats
Get administrative dashboard stats & reports.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Administrative dashboard stats retrieved successfully",
  "data": {
    "total_photos": 12,
    "total_users": 6,
    "banned_users": 1,
    "active_users": 4,
    "photos_by_status": {
      "pending": 2,
      "approved": 9,
      "rejected": 1
    }
  }
}
```

---

### PATCH /admin/photos/:id/moderate
Moderate pending uploaded photo (approve or reject).

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "status": "approved" // or "rejected"
}
```

**Response (200):**
```json
{
  "message": "Photo status updated successfully to approved",
  "data": {
    "photo": {
      "id": 1,
      "title": "Violating Image",
      "status": "approved",
      "image_url": "https://..."
    }
  }
}
```

---

### PATCH /admin/users/:id/status
Change user status (ban or unban a user).

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "status": "banned" // or "active"
}
```

**Response (200):**
```json
{
  "message": "User status updated successfully to banned",
  "data": {
    "user": {
      "id": 5,
      "username": "spammer",
      "email": "spammer@example.com",
      "status": "banned",
      "role": "user"
    }
  }
}
```

---

### DELETE /admin/photos/:id
Delete violating photo as an administrator.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Photo deleted by administrator successfully"
}
```

---

### DELETE /admin/comments/:id
Delete violating comment as an administrator.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Comment deleted by administrator successfully"
}
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "message": "Error message",
  "details": [
    {
      "field": "fieldName",
      "message": "Validation message"
    }
  ]
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (permission denied) |
| 404 | Not found |
| 409 | Conflict (already exists) |
| 410 | Gone (token expired/used) |
| 500 | Server error |

---

## Authentication

Use JWT token in Authorization header for protected endpoints:

```
Authorization: Bearer {token}
```

Token obtained from login or register endpoint. Valid for 24 hours.

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT + bcrypt
- **Validation**: Joi
- **Email**: Nodemailer
- **Language**: TypeScript

---

## Installation & Running

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- pnpm

### Setup Steps

1. **Clone repository and install dependencies**
```bash
pnpm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your database URL and email settings
```

3. **Run database migrations**
```bash
pnpm prisma migrate dev
```

4. **Start development server**
```bash
pnpm dev
```

Server runs at `http://localhost:3000/api/v1`

### Available Scripts

```bash
pnpm dev              # Start with hot reload
pnpm build            # Build for production
pnpm start            # Run production build
pnpm lint             # Check code quality
pnpm format           # Format code with Prettier
```

---

## License

ISC
