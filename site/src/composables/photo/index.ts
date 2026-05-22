import localforage from "localforage";

const photoStore = localforage.createInstance({
  name: "ohmycv_photo"
});

const PHOTO_KEY = "photo";

const photo = ref<string | null>(null);

function compressPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 400;
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = file.type || "image/jpeg";
        const isLossy = mimeType === "image/jpeg";
        resolve(canvas.toDataURL(mimeType, isLossy ? 0.85 : undefined));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const usePhoto = () => {
  const init = async () => {
    photo.value = await photoStore.getItem<string>(PHOTO_KEY) ?? null;
  };

  const uploadPhoto = async (file: File) => {
    const base64 = await compressPhoto(file);
    await photoStore.setItem(PHOTO_KEY, base64);
    photo.value = base64;
  };

  const removePhoto = async () => {
    await photoStore.removeItem(PHOTO_KEY);
    photo.value = null;
  };

  return { photo, init, uploadPhoto, removePhoto };
};
