export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("render:html", (html) => {
    html.head = html.head.map((node) =>
      node.replace(/<link rel="modulepreload"[^>]*>\s*/g, "")
    );
  });
});
