import localforage from "localforage";

type BadgeIcon = { id: string; url: string };

const INSTANCE_NAME = "cvgen_badge_icons";

function getStore(): LocalForage {
  return localforage.createInstance({ name: INSTANCE_NAME });
}

function compressIcon(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 256;
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("Failed to decode icon image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read icon file"));
    reader.readAsDataURL(file);
  });
}

const icons = ref<BadgeIcon[]>([]);

export const useBadgeIcon = () => {
  const init = async () => {
    try {
      const store = getStore();
      const keys = await store.keys();
      const entries: BadgeIcon[] = [];
      for (const key of keys) {
        const url = await store.getItem<string>(key);
        if (url) entries.push({ id: key, url });
      }
      icons.value = entries;
    } catch (error) {
      console.error("Failed to load badge icons:", error);
      icons.value = [];
    }
  };

  const upload = async (file: File) => {
    const url = await compressIcon(file);
    const id = `icon_${Date.now()}`;
    await getStore().setItem(id, url);
    icons.value = [...icons.value, { id, url }];
  };

  const remove = async (id: string) => {
    await getStore().removeItem(id);
    icons.value = icons.value.filter((i) => i.id !== id);
  };

  const insert = (url: string) => `![](${url})`;

  return { icons, init, upload, remove, insert };
};
