# Add Avatar Upload Endpoint

## Metadata
- **Ticket ID:** TICKET-025
- **Priority:** P3
- **Type:** feature-gap
- **Area:** multi-area
- **Status:** open
- **Dependencies:** TICKET-013 (admin RBAC should be in place; this endpoint is user-scoped so no admin role needed, but the overall auth infrastructure should be stable)

---

## Problem
The `User` model has an `avatarUrl String?` field. The settings page has an "Avatar URL" text input where users paste an external URL. There is no actual upload endpoint — users cannot upload an image from their device.

This means avatar support is limited to users who host their own images externally. No native avatar upload capability exists.

---

## Why This Matters
Real avatar uploads are a standard user profile feature. Requiring users to find external image hosting is poor UX and a barrier to profile customization (a PREMIUM feature per `PROJECT_OVERVIEW.md`).

---

## Evidence
- `backend/src/modules/users/users.service.ts` — `updateProfile()` accepts only `{ username, avatarUrl }` (string URL)
- `frontend/src/app/(main)/settings/page.tsx:184-189` — "Avatar URL" text input, no file upload
- `User` Prisma model: `avatarUrl String?`

---

## Scope

### Backend

**1. Install `multer` for file handling:**
```bash
cd backend && npm install multer @types/multer
```

**2. Create `POST /api/users/avatar` endpoint:**
```typescript
@Post('avatar')
@UseGuards(JwtAuthGuard)
@UseInterceptors(FileInterceptor('file', {
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new BadRequestException('Only image files allowed'), false);
    }
    cb(null, true);
  },
}))
async uploadAvatar(
  @UploadedFile() file: Express.Multer.File,
  @CurrentUser() user: User,
): Promise<{ avatarUrl: string }> {
  const avatarUrl = await this.usersService.saveAvatar(user.id, file);
  return { avatarUrl };
}
```

**3. Implement `UsersService.saveAvatar()`:**
- **For development:** save to `backend/public/uploads/avatars/` with a unique filename (`uuid + extension`)
- **For production:** replace with S3 upload (add as a note, not required in this ticket)
- Return the full URL: `${process.env.API_URL}/uploads/avatars/${filename}`

**4. Serve static files from `public/` in `main.ts`:**
```typescript
app.useStaticAssets(join(__dirname, '..', 'public'));
```

### Frontend

**5. Update settings page avatar input:**
Replace the plain URL text input with a hybrid: file upload button + URL fallback:
```tsx
<div>
  <label>Avatar</label>
  <input type="file" accept="image/*" onChange={handleAvatarUpload} />
  <span>or</span>
  <Input label="Avatar URL" value={avatarUrl} onChange={...} />
</div>
```

**6. Add `usersService.uploadAvatar(file: File)` method:**
```typescript
async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);
  return this.client.post('/users/avatar', formData, { requireAuth: true });
}
```

---

## Out of Scope
- S3 integration (noted as future production work)
- Image resizing/compression
- Avatar cropping UI

---

## Implementation Notes
- Create `backend/public/uploads/avatars/` directory and add a `.gitkeep` file (add the directory to `.gitignore` for actual uploads)
- Use `uuid` (already likely installed) for unique filenames
- The API URL for serving uploads: in dev, `http://localhost:3001/uploads/avatars/<filename>`
- Validate file size (5MB) and type (images only) on the backend — not just on the frontend
- After a successful upload, call `updateProfile({ avatarUrl: response.avatarUrl })` to persist the URL to the user record

---

## Acceptance Criteria
- [ ] `POST /api/users/avatar` with a valid image file returns `{ avatarUrl: string }`
- [ ] The uploaded image is accessible via the returned URL
- [ ] Files over 5MB are rejected with 400
- [ ] Non-image files are rejected with 400
- [ ] Settings page shows a file upload input in addition to the URL field
- [ ] After uploading, user's avatar is updated and displayed on the profile page

---

## Testing Requirements
- **Manual QA:**
  1. Open settings → upload a JPG → verify avatar updates on profile
  2. Try uploading a 10MB file → verify error shown
  3. Try uploading a PDF → verify error shown
- **Unit test:** `UsersService.saveAvatar()` — verify filename generated, file saved, URL returned

---

## Affected Areas
- `backend/src/modules/users/users.controller.ts`
- `backend/src/modules/users/users.service.ts`
- `backend/src/main.ts` (static assets)
- New: `backend/public/uploads/avatars/.gitkeep`
- `frontend/src/app/(main)/settings/page.tsx`
- `frontend/src/api/services/users.service.ts`

---

## Risks / Edge Cases
- File storage on the server's disk is not scalable for production — document the S3 upgrade path clearly
- Large number of avatar uploads will fill disk space — add a cleanup strategy (delete old avatar when a new one is uploaded)
- Concurrent uploads from the same user should be handled gracefully (last upload wins)

---

## Open Questions
- For production: S3 or a CDN? Note this as a required follow-up before launch.
