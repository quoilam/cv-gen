<template>
  <div class="info-panel space-y-4">
    <p class="text-xs text-muted-foreground">
      以下语法会实时渲染到右侧预览，Markdown 注释（&lt;!-- ... --&gt;）不会显示。
    </p>

    <div>
      <div class="panel-label">简历头信息（Front-matter）</div>
      <pre class="code-block">
---
name: 姓名
subtitle: 求职意向
header:
  - text: 电话 (+1) 123
  - text: 邮箱
    link: mailto:me@email.com
  - text: 主页
    link: https://example.com
    newLine: true
---</pre
      >
    </div>

    <div>
      <div class="panel-label">头像照片</div>
      <p class="desc">在「照片」面板上传头像，照片自动显示在右侧。</p>
    </div>

    <div>
      <div class="panel-label">标题</div>
      <pre class="code-block">## 教育经历</pre>
      <p class="desc">二级标题作为分节，颜色默认跟随全局主题色。</p>
    </div>

    <div>
      <div class="panel-label">主题色</div>
      <p class="desc">
        全局标题、链接、经历条默认使用主题色
        <code>#377bb5</code>。个别元素需要特殊配色时，用
        <code>#hex</code> 前缀指定（见「彩色 banner」）。
      </p>
    </div>

    <div>
      <div class="panel-label">定义列表</div>
      <pre class="code-block">
**职位名称**
  ~ 公司名称
  ~ 2020 - 2024</pre
      >
    </div>

    <div>
      <div class="panel-label">彩色 banner（经历条）</div>
      <pre class="code-block">
**公司名称**
**#377bb5 公司名称**
**![](图标地址)公司名称**</pre
      >
      <p class="desc">
        加粗的职位/项目名自动变成 banner；可用 <code>#hex</code> 指定颜色，用
        <code>![](图标)</code> 加图标。若加粗内容后还有普通文字（如
        <code>**职位** 备注</code>），则保持普通加粗，不生成 banner。
      </p>
    </div>

    <div>
      <div class="panel-label">交叉引用</div>
      <pre class="code-block">
[~P1]: 论文标题
正文引用 [~P1]</pre
      >
    </div>

    <div>
      <div class="panel-label">公式（KaTeX）</div>
      <pre class="code-block">
行内：$E = mc^2$
块级：$$E = mc^2$$</pre
      >
    </div>

    <div>
      <div class="panel-label">图标（iconify）</div>
      <pre class="code-block">
&lt;span class="iconify" data-icon="tabler:phone"&gt;&lt;/span&gt;</pre
      >
    </div>

    <div>
      <div class="panel-label">图片</div>
      <pre class="code-block">![](图片地址)</pre>
    </div>
  </div>
</template>

<script lang="ts" setup></script>

<style scoped>
.panel-label {
  font-size: 12px;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.desc {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  margin-top: 4px;
  line-height: 1.5;
}

.desc code {
  font-size: 11px;
  padding: 1px 4px;
  border-radius: 3px;
  background: hsl(var(--muted));
}

.code-block {
  margin-top: 6px;
  padding: 8px 10px;
  border-radius: 4px;
  background: hsl(var(--muted));
  font-size: 11px;
  line-height: 1.6;
  font-family: Menlo, Monaco, "Courier New", monospace;
  overflow-x: auto;
  white-space: pre;
}
</style>
