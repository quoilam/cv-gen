import localforage from "localforage";

export interface AssetInfo {
  id: string;
  name: string;
  base64: string;
  mimeType: string;
  width: number;
  height: number;
  size: number;
}

const assetStore = localforage.createInstance({
  name: "ohmycv_assets"
});

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function compressImage(file: File): Promise<AssetInfo> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 1200;
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL("image/jpeg", 0.85);
        const id = generateId();
        resolve({
          id,
          name: file.name,
          base64,
          mimeType: "image/jpeg",
          width,
          height,
          size: base64.length
        });
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const useAsset = () => {
  const uploadImage = async (file: File): Promise<AssetInfo> => {
    const asset = await compressImage(file);
    const assets = await getAssets();
    assets.push(asset);
    await assetStore.setItem("assets", assets);
    return asset;
  };

  const getAssets = async (): Promise<AssetInfo[]> => {
    const data = await assetStore.getItem<AssetInfo[]>("assets");
    return data ?? [];
  };

  const deleteAsset = async (id: string): Promise<void> => {
    const assets = await getAssets();
    await assetStore.setItem(
      "assets",
      assets.filter((a) => a.id !== id)
    );
  };

  const insertImageRef = (asset: AssetInfo) => {
    const { setContent } = useMonaco();
    const { data } = useDataStore();
    const mdRef = `![${asset.name}](${asset.base64})`;
    setContent("markdown", data.markdown + "\n" + mdRef);
  };

  return { uploadImage, getAssets, deleteAsset, insertImageRef };
};
