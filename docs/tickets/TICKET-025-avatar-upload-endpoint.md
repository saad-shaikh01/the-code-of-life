# Add Avatar Upload Endpoint

## Metadata
- **Ticket ID:** TICKET-025
- **Priority:** P3
- **Type:** feature-gap
- **Area:** multi-area
- **Status:** done
- **Dependencies:** TICKET-013

---

## Problem
The `User` model already had `avatarUrl`, but users could only paste an external URL into settings. There was no backend upload endpoint, no local file storage path, and no frontend file-upload UI, so native avatar uploads did not exist.

---

## Why This Matters
Avatar uploads are a standard profile feature. Requiring users to host their own image externally is poor UX and makes profile customization much harder than it should be.

---

## Evidence
- `backend/prisma/schema.prisma` already defined `avatarUrl String?`
- `backend/src/modules/users/users.controller.ts` had only profile/stats/delete endpoints
- `frontend/src/app/(main)/settings/page.tsx` only exposed an `Avatar URL` text input

---

## Scope

### Backend
- Install `multer` and `@types/multer`
- Add `POST /api/users/avatar`
- Add a dedicated `AvatarService` to validate, save, and clean up avatar files
- Serve `backend/public` as static assets so `/uploads/avatars/...` is reachable

### Frontend
- Add a file picker, preview, upload button, loading state, and inline error state to settings
- Keep the existing URL fallback field
- Add `usersService.uploadAvatar(file)`
- Ensure uploaded `/uploads/...` avatar paths resolve correctly in the UI

---

## Out of Scope
- S3 or CDN storage
- Image resizing/compression
- Cropping UI

---

## Implementation Notes
- Added `multer` to backend dependencies and `@types/multer` to backend dev dependencies.
- Added `backend/src/modules/users/avatar.service.ts` with:
  - allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
  - 2MB size cap
  - save path: `backend/public/uploads/avatars/{userId}-{timestamp}.{ext}`
  - local old-avatar cleanup when the previous `avatarUrl` points to `/uploads/...`
- Added `POST /api/users/avatar` in `UsersController` using `FileInterceptor('avatar', { storage: memoryStorage() })`.
- Kept the repo's existing API response envelope pattern via `ApiResponseDto.success({ avatarUrl })`.
- Updated `main.ts` to serve `backend/public` statically with `useStaticAssets(...)`.
- Added `backend/public/uploads/avatars/.gitkeep` and ignored real uploaded files in the repo root `.gitignore`.
- Added frontend multipart support in `apiClient` so `FormData` requests do not force `Content-Type: application/json`.
- Added `usersService.uploadAvatar(file)` and settings-page upload UI with:
  - local file preview
  - loading state on upload
  - inline validation errors for invalid type and oversized files
  - auth-store update after successful upload
  - `user-profile` query-cache patching so the avatar stays fresh across profile/settings views
- Updated the shared `Avatar` component to resolve backend-relative `/uploads/...` paths against the API origin, which is required because uploaded avatars are now persisted as backend paths instead of full external URLs.
- Correction to the older ticket draft:
  - the final implementation follows the newer backlog prompt: 2MB max size and a separate `AvatarService`
  - the older 5MB / `UsersService.saveAvatar()` draft was not used

---

## Acceptance Criteria
- [x] `POST /api/users/avatar` with a valid image file returns `{ avatarUrl: string }` in the API response data payload
- [x] The uploaded image is accessible via the returned `/uploads/avatars/...` path
- [x] Files over 2MB are rejected with 400-style validation errors
- [x] Non-image files are rejected with 400-style validation errors
- [x] Settings page shows a file upload input in addition to the URL field
- [x] After uploading, the user's avatar is updated in the auth state and is displayable on avatar-based UI components

---

## Testing Requirements
- **Automated coverage added:**
  - `AvatarService.saveAvatar()` saves valid files, deletes old local avatars, rejects oversized files, rejects non-images, and rejects missing users
- **Manual QA recommended:**
  1. Open `/settings`, upload a JPG/PNG/WEBP/GIF, and verify the preview updates immediately
  2. Refresh the app and verify the avatar still renders in the header/profile/sidebar
  3. Upload a file larger than 2MB and verify the inline error/toast
  4. Upload a PDF or other non-image and verify the inline error/toast

---

## Affected Areas
- `backend/package.json`
- `backend/src/main.ts`
- `backend/src/modules/users/avatar.service.ts`
- `backend/src/modules/users/avatar.service.spec.ts`
- `backend/src/modules/users/users.controller.ts`
- `backend/src/modules/users/users.module.ts`
- `backend/src/modules/users/index.ts`
- `backend/public/uploads/avatars/.gitkeep`
- `.gitignore`
- `frontend/src/api/client.ts`
- `frontend/src/api/services/users.service.ts`
- `frontend/src/components/ui/avatar.tsx`
- `frontend/src/app/(main)/settings/page.tsx`

---

## Risks / Edge Cases
- Disk-backed local uploads are appropriate for development and small deployments, but production should move to object storage such as S3 or a CDN-backed asset service.
- If a file is written successfully but the subsequent profile update fails, the new upload can remain orphaned on disk. That is acceptable for this minimal endpoint ticket but should be revisited if uploads become high-volume.
- The current frontend uses a loading state rather than byte-level upload progress, which is acceptable for this backlog item.

---

## Open Questions
- Which production asset storage target should replace local disk before launch: S3, R2, or another CDN-backed option?

---

## Files Changed
- `.gitignore`
- `backend/package.json`
- `package-lock.json`
- `backend/src/main.ts`
- `backend/src/modules/users/avatar.service.ts`
- `backend/src/modules/users/avatar.service.spec.ts`
- `backend/src/modules/users/users.controller.ts`
- `backend/src/modules/users/users.module.ts`
- `backend/src/modules/users/index.ts`
- `backend/public/uploads/avatars/.gitkeep`
- `frontend/src/api/client.ts`
- `frontend/src/api/services/users.service.ts`
- `frontend/src/components/ui/avatar.tsx`
- `frontend/src/app/(main)/settings/page.tsx`
- `docs/tickets/TICKET-025-avatar-upload-endpoint.md`
- `docs/tickets/README.md`

---

## Validation Performed
- `backend`: `npm install multer`
- `backend`: `npm install -D @types/multer`
- `backend`: `npm run test -- avatar.service.spec.ts --runInBand`
- `backend`: `npm run test -- --runInBand`
- `backend`: `npm run build`
- `backend`: `npx eslint -- "src/modules/users/avatar.service.ts" "src/modules/users/avatar.service.spec.ts" "src/modules/users/users.controller.ts" "src/modules/users/users.module.ts" "src/modules/users/index.ts" "src/main.ts"`
- `frontend`: `npx eslint -- "src/api/client.ts" "src/api/services/users.service.ts" "src/components/ui/avatar.tsx" "src/app/(main)/settings/page.tsx"`
- `frontend`: `npm run build`

---

## Follow-up Notes
- Completed: 2026-03-15.
- No Prisma migration was required because `User.avatarUrl` already existed in the schema.
