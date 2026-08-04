const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export function validateImageFile(file: File, maxSizeBytes: number) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    throw new Error("Only JPG, PNG, or WEBP images are allowed");
  }

  if (file.size > maxSizeBytes) {
    throw new Error(`Image size must be ${Math.round(maxSizeBytes / (1024 * 1024))}MB or less`);
  }
}

export async function compressImage(file: File, maxDimension: number, quality = 0.85): Promise<File> {
  const imageDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(imageDataUrl);

  const ratio = Math.min(maxDimension / image.width, maxDimension / image.height, 1);
  const targetWidth = Math.max(1, Math.round(image.width * ratio));
  const targetHeight = Math.max(1, Math.round(image.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    return file;
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), outputType, quality);
  });

  if (!blob) {
    return file;
  }

  const normalizedName = file.name.replace(/\.[^.]+$/, outputType === "image/png" ? ".png" : ".jpg");
  const compressedFile = new File([blob], normalizedName, { type: outputType });

  return compressedFile.size <= file.size ? compressedFile : file;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Invalid image file"));
    image.src = src;
  });
}
