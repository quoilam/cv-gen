export type SystemData = {
  markdown: string;
  resumeId: number | null;
  resumeName: string;
  loaded: boolean;
};

export const useDataStore = defineStore("data", () => {
  const { DEFAULT } = useConstant();

  const data = reactive<SystemData>({
    markdown: "",
    resumeId: null,
    resumeName: DEFAULT.RESUME_NAME,
    loaded: false
  });

  const setData = <T extends keyof SystemData>(key: T, value: SystemData[T]) => {
    data[key] = value;
  };

  const setAndSyncToMonaco = (key: "markdown", value: string) => {
    setData(key, value);

    const { setContent } = useMonaco();
    setContent(key, value);
  };

  return {
    data,
    setData,
    setAndSyncToMonaco
  };
});
