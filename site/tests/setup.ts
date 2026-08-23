// happy-dom 默认无 doctype，KaTeX 检测到 quirks mode 会输出警告。
// 浏览器环境必然存在 doctype，这里补上以消除测试噪音。
Object.defineProperty(document, "compatMode", {
  value: "CSS1Compat",
  configurable: true
});
