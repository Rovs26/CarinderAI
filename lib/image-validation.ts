export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const INVALID_IMAGE_MESSAGE = "Please upload a clear image under 5MB.";

export function validateImageFile(file: File | null | undefined): string | null {
  if (!file) return INVALID_IMAGE_MESSAGE;
  if (!file.type.startsWith("image/")) return INVALID_IMAGE_MESSAGE;
  if (file.size > MAX_IMAGE_BYTES) return INVALID_IMAGE_MESSAGE;
  return null;
}
