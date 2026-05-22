import { toast } from "vue-sonner";
import type { ChangedCase } from "@ohmycv/case-police";

export const useToast = () => {
  const {
    $i18n: { t }
  } = useNuxtApp();

  const save = () => {
    toast.success(t("notification.save"));
  };

  const onSwitch = (msg: string) => {
    toast.info(t("notification.switch", { msg }));
  };

  const onDelete = (msg: string) => {
    toast.error(t("notification.delete", { msg }));
  };

  const onNew = () => {
    toast.success(t("notification.new"));
  };

  const duplicate = (msg: string) => {
    toast.success(
      t("notification.duplicate", {
        old: msg,
        new: msg + " Copy"
      })
    );
  };

  const correct = (msg?: ChangedCase[]) => {
    if (msg?.length) {
      const groups = msg.reduce<Record<string, number>>((acc, { from, to }) => {
        const key = `${from} → ${to}`;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {});

      const description = Object.entries(groups)
        .map(([key, count]) => `${key}${count > 1 ? ` (x${count})` : ""}`)
        .join(", ");

      toast.success(t("notification.correct.yes", { num: msg.length }), {
        description
      });
    } else {
      toast.info(t("notification.correct.no"));
    }
  };

  const onImport = (msg: boolean) => {
    if (msg) {
      toast.success(t("notification.import.yes"));
    } else {
      toast.error(t("notification.import.no"));
    }
  };

  const errorMessages = {
    storage: { en: "Unable to access storage, please try again", "zh-cn": "无法访问本地存储，请重试" },
    not_found: { en: "Resume not found", "zh-cn": "简历未找到" },
    monaco: { en: "Failed to initialize the editor", "zh-cn": "编辑器初始化失败" },
    import_fetch: { en: "Failed to import the file, please check the URL", "zh-cn": "从该 URL 导入失败" }
  };

  const onError = (key: keyof typeof errorMessages) => {
    const { locale } = useI18n();
    toast.error(errorMessages[key][locale.value === "zh-cn" ? "zh-cn" : "en"]);
  };

  return {
    save,
    switch: onSwitch,
    delete: onDelete,
    new: onNew,
    duplicate,
    correct,
    import: onImport,
    error: onError
  };
};
