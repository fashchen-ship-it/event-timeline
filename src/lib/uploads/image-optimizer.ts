export const MAX_SOURCE_IMAGE_SIZE = 15 * 1024 * 1024;

const MAX_IMAGE_EDGE = 1600;
const WEBP_QUALITY = 0.82;

function isOptimizableImage(file: File) {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type) && file.size > 220 * 1024;
}

function outputName(file: File, type: string) {
  const base = file.name.replace(/\.[^.]+$/, "") || "photo";
  const extension = type === "image/webp" ? "webp" : type === "image/png" ? "png" : "jpg";
  return `${base}.${extension}`;
}

async function loadImage(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; release: () => void } | null> {
  try {
    if (typeof createImageBitmap === "function") {
      const bitmap = await createImageBitmap(file);
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    }
    const url = URL.createObjectURL(file);
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = reject;
      element.src = url;
    });
    return { source: image, width: image.naturalWidth, height: image.naturalHeight, release: () => URL.revokeObjectURL(url) };
  } catch {
    return null;
  }
}

async function optimizeImage(file: File) {
  if (!isOptimizableImage(file)) return file;
  const loaded = await loadImage(file);
  if (!loaded || !loaded.width || !loaded.height) return file;
  try {
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(loaded.width, loaded.height));
    const width = Math.max(1, Math.round(loaded.width * scale));
    const height = Math.max(1, Math.round(loaded.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(loaded.source, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", WEBP_QUALITY));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], outputName(file, blob.type), { type: blob.type, lastModified: file.lastModified });
  } catch {
    return file;
  } finally {
    loaded.release();
  }
}

/** Downsizes ordinary still images before either online upload or offline queueing. GIFs and documents stay untouched. */
export async function optimizeImageFiles(files: File[]) {
  return Promise.all(files.map(optimizeImage));
}
