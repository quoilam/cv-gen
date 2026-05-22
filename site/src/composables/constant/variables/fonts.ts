export type Font = {
  readonly name: string;
  readonly fontFamily?: string;
};

export const LOCAL_EN_FONTS: Font[] = [
  {
    name: "Adobe Garamond Pro"
  },
  {
    name: "Arial"
  },
  {
    name: "Arial Black"
  },
  {
    name: "Arial Narrow"
  },
  {
    name: "CMU Sans Serif"
  },
  {
    name: "Courier New"
  },
  {
    name: "Euclid"
  },
  {
    name: "Georgia"
  },
  {
    name: "Minion Pro"
  },
  {
    name: "Palatino"
  },
  {
    name: "Tahoma"
  },
  {
    name: "Tex Gyre Pagella"
  },
  {
    name: "Times New Roman"
  },
  {
    name: "Times Newer Roman"
  },
  {
    name: "Trebuchet MS"
  },
  {
    name: "Verdana"
  }
];

export const LOCAL_CJK_FONTS: Font[] = [
  {
    name: "华康宋体",
    fontFamily: "HKST"
  },
  {
    name: "霞鹜文楷",
    fontFamily: "LXGW WenKai"
  }
];
