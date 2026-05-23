import localforage from "localforage";
import { useMonacoState } from "../monaco";

export interface AssetInfo {
  id: string;
  name: string;
  base64: string;
  mimeType: string;
  width: number;
  height: number;
  size: number;
}

let _assetStore: LocalForage | null = null;
function _getAssetStore() {
  if (!_assetStore) {
    _assetStore = localforage.createInstance({ name: "cvgen_assets" });
  }
  return _assetStore;
}

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

        const mimeType = file.type || "image/jpeg";
        const isLossy = mimeType === "image/jpeg";
        const base64 = canvas.toDataURL(mimeType, isLossy ? 0.85 : undefined);
        const id = generateId();
        resolve({
          id,
          name: file.name,
          base64,
          mimeType,
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
    try {
      const asset = await compressImage(file);
      const assets = await getAssets();
      assets.push(asset);
      await _getAssetStore().setItem("assets", assets);
      return asset;
    } catch (error) {
      console.error("Failed to upload image:", error);
      throw error;
    }
  };

  const getAssets = async (): Promise<AssetInfo[]> => {
    const data = await _getAssetStore().getItem<AssetInfo[]>("assets");
    return data ?? [];
  };

  const deleteAsset = async (id: string): Promise<void> => {
    const assets = await getAssets();
    await _getAssetStore().setItem(
      "assets",
      assets.filter((a) => a.id !== id)
    );
  };

  const insertImageRef = (asset: AssetInfo) => {
    const states = useMonacoState();
    if (!states.value) return;

    const { editor } = states.value;
    const position = editor.getPosition();
    if (!position) return;

    const mdRef = `![${asset.name}](${asset.base64})`;

    editor.executeEdits("insert-image-ref", [
      {
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        },
        text: mdRef,
        forceMoveMarkers: true
      }
    ]);

    const newPos = {
      lineNumber: position.lineNumber,
      column: position.column + mdRef.length
    };
    editor.setPosition(newPos);
    editor.revealPositionInCenter(newPos);
    editor.focus();
  };

  return { uploadImage, getAssets, deleteAsset, insertImageRef };
};
