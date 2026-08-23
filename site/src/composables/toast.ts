import { toast } from "vue-sonner";
import type { ChangedCase } from "@cvgen/case-police";

function formatFrontMatterError(err: unknown): string {
  const mark = (err as { mark?: { line?: number; column?: number } })?.mark;
  if (mark && typeof mark.line === "number") {
    const column = typeof mark.column === "number" ? mark.column + 1 : 1;
    return `，错误位于第 ${mark.line + 1} 行第 ${column} 列`;
  }
  return "";
}

export const useToast = () => {
  const save = () => {
    toast.success("保存成功");
  };

  const onSwitch = (msg: string) => {
    toast.info(`已切换到简历 "${msg}"`);
  };

  const onDelete = (msg: string) => {
    toast.error(`已删除简历 "${msg}"`);
  };

  const onNew = () => {
    toast.success("新建成功");
  };

  const duplicate = (msg: string) => {
    toast.success(`已创建简历 "${msg}" 的副本 "${msg} Copy"`);
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

      toast.success(`成功修正 ${msg.length} 个单词`, {
        description
      });
    } else {
      toast.info("您的所有拼写都是正确的！");
    }
  };

  const onImport = (msg: boolean) => {
    if (msg) {
      toast.success("已成功导入数据！");
    } else {
      toast.error("数据格式不正确");
    }
  };

  const errorMessages: Record<string, string> = {
    storage: "无法访问本地存储，请重试",
    not_found: "简历未找到",
    monaco: "编辑器初始化失败",
    import_fetch: "从该 URL 导入失败"
  };

  const onError = (key: keyof typeof errorMessages) => {
    toast.error(errorMessages[key]);
  };

  const frontMatter = (err: unknown) => {
    toast.error("简历头信息格式错误", {
      description: `已显示上一次正确的内容${formatFrontMatterError(err)}。`
    });
  };

  return {
    save,
    switch: onSwitch,
    delete: onDelete,
    new: onNew,
    duplicate,
    correct,
    import: onImport,
    error: onError,
    frontMatter
  };
};
