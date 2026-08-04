import { toast } from "react-toastify";
import { API_URL as SETTINGS_API_URL } from "../settings";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;
const MAX_DIMENSION = 512;
const API_URL = (process.env.REACT_APP_API_URL || SETTINGS_API_URL || "").replace(/\/$/, "");

export function validatePlayerPhoto(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
        return "Only JPG, PNG, and WEBP images are allowed.";
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        return `Image must be smaller than ${MAX_SIZE_MB}MB.`;
    }
    return null;
}

export function compressPlayerPhoto(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            let { width, height } = img;
            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                if (width > height) {
                    height = Math.round((height * MAX_DIMENSION) / width);
                    width = MAX_DIMENSION;
                } else {
                    width = Math.round((width * MAX_DIMENSION) / height);
                    height = MAX_DIMENSION;
                }
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return reject(new Error("Canvas not supported"));
            ctx.drawImage(img, 0, 0, width, height);
            const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
            canvas.toBlob(
                (blob) => {
                    if (!blob) return reject(new Error("Compression failed"));
                    resolve(blob);
                },
                outputType,
                0.8
            );
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Failed to load image"));
        };
        img.src = url;
    });
}

export async function uploadPlayerPhoto(
    file: File,
    presignFn: (params: { fileName: string; contentType: string }) => Promise<any>
): Promise<string | null> {
    const validationError = validatePlayerPhoto(file);
    if (validationError) {
        toast.error(validationError);
        return null;
    }

    try {
        const compressed = await compressPlayerPhoto(file);
        const contentType = file.type === "image/png" ? "image/png" : "image/jpeg";
        const ext = contentType === "image/png" ? ".png" : ".jpg";
        const fileName = file.name.replace(/\.[^.]+$/, ext);

        const presignResult = await presignFn({ fileName, contentType });
        const { key, uploadUrl } = presignResult?.content ?? presignResult?.data?.content ?? {};

        if (!uploadUrl || !key) throw new Error("No presigned URL returned");

        const uploadResponse = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": contentType },
            body: compressed,
        });

        if (!uploadResponse.ok) throw new Error("Upload to storage failed");

        return key;
    } catch (err: any) {
        toast.error(err?.message || "Failed to upload photo");
        return null;
    }
}

export function toAbsolutePlayerPhotoUrl(photoUrl?: string | null): string | undefined {
    if (!photoUrl) return undefined;
    if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) return photoUrl;
    return API_URL + photoUrl;
}
