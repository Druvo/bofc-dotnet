import { API_URL } from "../settings";
import axiosApi from "../state/api/axiosBase";

interface PresignResponse {
  uploadUrl: string;
  key: string;
  expiresInSeconds: number;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function extractContent<T>(data: any): T {
  return (data?.content ?? data) as T;
}

export async function uploadImageToStorage(file: File, folder: string): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image size must be 10MB or smaller");
  }

  const presignRes = await axiosApi.post(
    `${API_URL}/files/presign`,
    null,
    {
      params: {
        folder,
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
      },
    }
  );

  const presign = extractContent<PresignResponse>(presignRes.data);

  const uploadRes = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error("Failed to upload image to storage");
  }

  return presign.key;
}

export async function getStorageViewUrl(key: string): Promise<string> {
  const res = await axiosApi.get(`${API_URL}/files/view-url`, {
    params: { key },
  });
  const content = extractContent<{ url: string }>(res.data);
  return content.url;
}
