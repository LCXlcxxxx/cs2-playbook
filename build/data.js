window.PLAYBOOK = {
 "generated_at": "2026-10-26T21:09:23",
 "builtAt": "2026-10-26T13:09:23Z",
 "SCHEMA": {
  "entry": [
   {
    "key": "id",
    "type": "scalar",
    "required": true,
    "dump_order": 1,
    "lint": "id_pattern+filename",
    "cn": "条目 id（系统自动生成，改 map/side/type 自动跟随改名）"
   },
   {
    "key": "map",
    "type": "scalar",
    "required": true,
    "dump_order": 2,
    "lint": "map_registered",
    "cn": "地图 key（maps.json）"
   },
   {
    "key": "side",
    "type": "scalar",
    "required": true,
    "enum_check": true,
    "dump_order": 3,
    "default": "T",
    "enum": [
     [
      "T",
      "T 方"
     ],
     [
      "CT",
      "CT 方"
     ],
     [
      "both",
      "双方"
     ]
    ],
    "lint": "enum",
    "cn": "阵营（both 双方通用）"
   },
   {
    "key": "type",
    "type": "scalar",
    "required": true,
    "enum_check": true,
    "dump_order": 4,
    "import_merge": true,
    "enum": [
     [
      "smoke",
      "烟雾"
     ],
     [
      "flash",
      "闪光"
     ],
     [
      "molotov",
      "燃烧"
     ],
     [
      "he",
      "高爆"
     ]
    ],
    "lint": "enum",
    "cn": "道具类型"
   },
   {
    "key": "click",
    "type": "scalar",
    "required": true,
    "enum_check": true,
    "dump_order": 5,
    "default": "lmb",
    "import_merge": true,
    "enum": [
     [
      "lmb",
      "左键"
     ],
     [
      "rmb",
      "右键"
     ],
     [
      "both",
      "双键"
     ]
    ],
    "lint": "enum",
    "cn": "键位（三字段必填，组合即完整投法）"
   },
   {
    "key": "move",
    "type": "scalar",
    "required": true,
    "dump_order": 6,
    "default": "stand",
    "import_merge": true,
    "enum": [
     [
      "stand",
      "原地"
     ],
     [
      "crouch",
      "蹲下"
     ],
     [
      "w",
      "W 前进"
     ],
     [
      "walk-step",
      "W 一步"
     ],
     [
      "shift",
      "Shift"
     ],
     [
      "shift-w",
      "Shift+W"
     ],
     [
      "run",
      "跑"
     ]
    ],
    "lint": "enum_warn_custom",
    "cn": "移动方式（自定义值经 ⚙ 设置，lint WARN）"
   },
   {
    "key": "action",
    "type": "scalar",
    "required": true,
    "enum_check": true,
    "dump_order": 7,
    "default": "direct",
    "import_merge": true,
    "enum": [
     [
      "direct",
      "直接投"
     ],
     [
      "jump",
      "跳投"
     ],
     [
      "crouch-jump",
      "蹲跳投"
     ]
    ],
    "lint": "enum",
    "cn": "投掷方式"
   },
   {
    "key": "origin",
    "type": "scalar",
    "required": true,
    "dump_order": 8,
    "import_merge": true,
    "new_value": "待补中文地标",
    "lint": "spots_callouts(经 spots 兜底)",
    "cn": "起点（报点表中文名）"
   },
   {
    "key": "target",
    "type": "scalar_array",
    "required": true,
    "dump_order": 9,
    "import_merge": true,
    "new_value": "待补",
    "lint": "target_callouts",
    "cn": "目标（报点名；多落点用行内数组）"
   },
   {
    "key": "title",
    "type": "scalar",
    "required": true,
    "dump_order": 10,
    "import_merge": true,
    "new_value": "待补标题",
    "cn": "标题"
   },
   {
    "key": "oneline",
    "type": "scalar",
    "required": true,
    "dump_order": 11,
    "import_merge": true,
    "new_value": "一句话怎么扔（卡片上最大字号的一行）",
    "cn": "一句话「怎么扔」，卡片最大字号的一行"
   },
   {
    "key": "difficulty",
    "type": "scalar",
    "required": true,
    "dump_order": 12,
    "default": "normal",
    "import_merge": true,
    "enum": [
     [
      "easy",
      "简单"
     ],
     [
      "normal",
      "中等"
     ],
     [
      "hard",
      "困难"
     ]
    ],
    "lint": "difficulty_enum",
    "cn": "难度三档（中文只在显示层；数字旧值跑 migrate-difficulty）"
   },
   {
    "key": "phase",
    "type": "scalar_array",
    "required": true,
    "dump_order": 13,
    "default": [
     "default"
    ],
    "import_merge": true,
    "enum": [
     [
      "execute",
      "爆点"
     ],
     [
      "default",
      "默认"
     ],
     [
      "retake",
      "回防"
     ],
     [
      "postplant",
      "防守"
     ],
     [
      "anti-eco",
      "科研"
     ]
    ],
    "lint": "phase_enum",
    "cn": "阶段（可多选，数据键不变）"
   },
   {
    "key": "status",
    "type": "scalar",
    "required": true,
    "enum_check": true,
    "dump_order": 14,
    "default": "draft",
    "enum": [
     [
      "draft",
      "待验证"
     ],
     [
      "verified",
      "已实测"
     ],
     [
      "broken",
      "已失效"
     ],
     [
      "retired",
      "弃用"
     ]
    ],
    "lint": "enum+checked_date",
    "cn": "状态（没实测永远是 draft）"
   },
   {
    "key": "spots",
    "type": "array",
    "dump_order": 15,
    "import_merge": true,
    "lint": "spots_callouts",
    "cn": "互动地图报点关联（精确过滤）"
   },
   {
    "key": "tags",
    "type": "array",
    "dump_order": 16,
    "dump_empty_array": true,
    "import_merge": true,
    "cn": "战术标签（搜索/筛选 chips 用）"
   },
   {
    "key": "sets",
    "type": "array",
    "dump_order": 17,
    "dump_empty_array": true,
    "import_merge": true,
    "lint": "sets_shapes",
    "cn": "战术包（自由中文名数组）"
   },
   {
    "key": "related",
    "type": "array",
    "dump_order": 18,
    "dump_empty_array": true,
    "import_merge": true,
    "lint": "related_link",
    "cn": "条目互链"
   },
   {
    "key": "coords",
    "type": "object",
    "dump_order": 19,
    "cn": "getpos 坐标（全部可选，实测后回填）"
   },
   {
    "key": "pin_origin",
    "type": "array",
    "dump_order": 20,
    "lint": "pin_uv",
    "cn": "图层起点显示坐标覆写 [u, v]"
   },
   {
    "key": "pin_target",
    "type": "array",
    "dump_order": 21,
    "lint": "pin_uv",
    "cn": "单目标落点显示坐标覆写 [u, v]"
   },
   {
    "key": "pin_targets",
    "type": "object",
    "dump_order": 22,
    "lint": "pin_uv",
    "cn": "多目标落点显示坐标覆写 {报点名: [u, v]}（含空格键须引号）"
   },
   {
    "key": "source",
    "type": "object",
    "dump": "block",
    "lint": "source_kind",
    "sub": {
     "kind": {
      "enum": [
       "self",
       "video",
       "web",
       "friend"
      ]
     }
    },
    "cn": "来源署名（video/web 必记 creator/url）"
   },
   {
    "key": "checked",
    "type": "scalar",
    "dump": "conditional",
    "lint": "checked_date",
    "cn": "最后实测日期（仅 verified 必填，YYYY-MM-DD）"
   }
  ],
  "tactic": [
   {
    "key": "id",
    "type": "scalar",
    "required": true,
    "dump_order": 1,
    "lint": "tactic_id_pattern+filename",
    "cn": "战术板 id（<map去前缀>-plan-<两位序号>）"
   },
   {
    "key": "map",
    "type": "scalar",
    "required": true,
    "dump_order": 2,
    "cn": "地图 key（已有板锁定不改）"
   },
   {
    "key": "side",
    "type": "scalar",
    "required": true,
    "enum_check": true,
    "dump_order": 3,
    "default": "both",
    "enum": [
     [
      "T",
      "T 方"
     ],
     [
      "CT",
      "CT 方"
     ],
     [
      "both",
      "双方"
     ]
    ],
    "lint": "enum",
    "cn": "阵营"
   },
   {
    "key": "title",
    "type": "scalar",
    "required": true,
    "dump_order": 4,
    "new_value": "待补标题",
    "cn": "标题"
   },
   {
    "key": "window",
    "type": "scalar",
    "required": true,
    "dump_order": 5,
    "new_value": "整局",
    "cn": "适用回合时间窗"
   },
   {
    "key": "status",
    "type": "scalar",
    "required": true,
    "dump_order": 6,
    "default": "draft",
    "enum": [
     [
      "draft",
      "待验证"
     ],
     [
      "verified",
      "已实测"
     ],
     [
      "broken",
      "已失效"
     ],
     [
      "retired",
      "弃用"
     ]
    ],
    "lint": "enum",
    "cn": "状态"
   },
   {
    "key": "checked",
    "type": "scalar",
    "dump_order": 7,
    "cn": "实测日期（这块板游戏里跑通过）"
   },
   {
    "key": "uses",
    "type": "array",
    "required": true,
    "dump_order": 8,
    "default": [],
    "lint": "uses_link",
    "cn": "引用的道具 id（必须真实存在）"
   },
   {
    "key": "roles",
    "type": "array",
    "dump_order": 9,
    "lint": "roles_shape",
    "cn": "角色名（≤5 项）"
   },
   {
    "key": "timeline",
    "type": "array",
    "dump_order": 10,
    "lint": "timeline_steps",
    "cn": "时间轴步骤（≤20 步，倒计时 M:SS）"
   }
  ]
 },
 "maps": {
  "de_mirage": {
   "name": "Mirage",
   "cn": "荒漠迷城",
   "duty": true,
   "radar": "assets/radar/de_mirage.png",
   "radar_source": {
    "origin": "CS2 官方雷达图（游戏文件导出，2mlml/cs2-radar-images 仓库转存）",
    "url": "https://github.com/2mlml/cs2-radar-images",
    "license": "Valve 版权素材，仅限个人与朋友小范围本地查阅，不上公开平台"
   },
   "radar_exists": true
  },
  "de_inferno": {
   "name": "Inferno",
   "cn": "炼狱小镇",
   "duty": true,
   "radar": "assets/radar/de_inferno.png",
   "radar_source": {
    "origin": "CS2 官方雷达图（2mlml/cs2-radar-images 仓库转存）",
    "url": "https://github.com/2mlml/cs2-radar-images",
    "license": "Valve 版权素材，仅限个人与朋友小范围本地查阅，不上公开平台"
   },
   "radar_exists": true
  },
  "de_dust2": {
   "name": "Dust2",
   "cn": "炙热沙城II",
   "duty": true,
   "radar": "assets/radar/de_dust2.png",
   "radar_source": {
    "origin": "CS2 官方雷达图（2mlml/cs2-radar-images 仓库转存）",
    "url": "https://github.com/2mlml/cs2-radar-images",
    "license": "Valve 版权素材，仅限个人与朋友小范围本地查阅，不上公开平台"
   },
   "radar_exists": true
  },
  "de_nuke": {
   "name": "Nuke",
   "cn": "核子危机",
   "duty": true,
   "radar": "assets/radar/de_nuke_combined.png",
   "radar_lower": "assets/radar/de_nuke_lower.png",
   "radar_source": {
    "origin": "CS2 官方雷达图（2mlml/cs2-radar-images 仓库转存，含下层 de_nuke_lower.png，双层显示待支持）",
    "url": "https://github.com/2mlml/cs2-radar-images",
    "license": "Valve 版权素材，仅限个人与朋友小范围本地查阅，不上公开平台",
    "note": "上下层纵向拼接图（白色分隔带，原始单层图保留溯源）"
   },
   "radar_exists": true
  },
  "de_ancient": {
   "name": "Ancient",
   "cn": "远古遗迹",
   "duty": true,
   "radar": "assets/radar/de_ancient.png",
   "radar_source": {
    "origin": "CS2 官方雷达图（2mlml/cs2-radar-images 仓库转存）",
    "url": "https://github.com/2mlml/cs2-radar-images",
    "license": "Valve 版权素材，仅限个人与朋友小范围本地查阅，不上公开平台"
   },
   "radar_exists": true
  },
  "de_anubis": {
   "name": "Anubis",
   "cn": "阿努比斯",
   "duty": true,
   "radar": "assets/radar/de_anubis.png",
   "radar_source": {
    "origin": "CS2 官方雷达图（2mlml/cs2-radar-images 仓库转存）",
    "url": "https://github.com/2mlml/cs2-radar-images",
    "license": "Valve 版权素材，仅限个人与朋友小范围本地查阅，不上公开平台"
   },
   "radar_exists": true
  },
  "de_train": {
   "name": "Train",
   "cn": "列车停放站",
   "duty": false,
   "radar": "assets/radar/de_train.png",
   "radar_lower": "assets/radar/de_train_lower.png",
   "radar_source": {
    "origin": "CS2 官方雷达图（2mlml/cs2-radar-images 仓库转存，含下层 de_train_lower.png，双层显示待支持）",
    "url": "https://github.com/2mlml/cs2-radar-images",
    "license": "Valve 版权素材，仅限个人与朋友小范围本地查阅，不上公开平台"
   },
   "radar_exists": true
  },
  "de_vertigo": {
   "name": "Vertigo",
   "cn": "殒命大厦",
   "duty": false,
   "radar": "assets/radar/de_vertigo_combined.png",
   "radar_lower": "assets/radar/de_vertigo_lower.png",
   "radar_source": {
    "origin": "CS2 官方雷达图（2mlml/cs2-radar-images 仓库转存，含下层 de_vertigo_lower.png，双层显示待支持）",
    "url": "https://github.com/2mlml/cs2-radar-images",
    "license": "Valve 版权素材，仅限个人与朋友小范围本地查阅，不上公开平台",
    "note": "上下层纵向拼接图（白色分隔带，原始单层图保留溯源）"
   },
   "radar_exists": true
  },
  "de_overpass": {
   "name": "Overpass",
   "cn": "死亡游乐园",
   "duty": false,
   "radar": "assets/radar/de_overpass.png",
   "radar_source": {
    "origin": "CS2 官方雷达图（2mlml/cs2-radar-images 仓库转存）",
    "url": "https://github.com/2mlml/cs2-radar-images",
    "license": "Valve 版权素材，仅限个人与朋友小范围本地查阅，不上公开平台"
   },
   "radar_exists": true
  },
  "cs_office": {
   "name": "Office",
   "cn": "办公室",
   "duty": false,
   "radar": "assets/radar/cs_office.png",
   "radar_source": {
    "origin": "CS2 官方雷达图（2mlml/cs2-radar-images 仓库转存，人质图 cs_ 前缀）",
    "url": "https://github.com/2mlml/cs2-radar-images",
    "license": "Valve 版权素材，仅限个人与朋友小范围本地查阅，不上公开平台"
   },
   "radar_exists": true
  }
 },
 "entries": [
  {
   "id": "dust2-ct-flash-02",
   "map": "de_dust2",
   "side": "CT",
   "type": "flash",
   "click": "lmb",
   "move": "stand",
   "action": "direct",
   "origin": "A大",
   "target": "A大",
   "title": "CT 自助反刷A大卷帘门闪",
   "oneline": "A大→A大，左键直投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "draft",
   "spots": [
    "A大"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "throw_badge": "左键直投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-ct-flash-02/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-ct-flash-02/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-ct-flash-02/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "ctzizhufanadamenshan",
    "ada",
    "ada"
   ],
   "pyi": [
    "ctzzfadms",
    "ad",
    "ad"
   ]
  },
  {
   "id": "dust2-ct-flash-b-retake",
   "map": "de_dust2",
   "side": "CT",
   "type": "flash",
   "click": "lmb",
   "move": "stand",
   "action": "jump",
   "origin": "卡车",
   "target": [
    "B门",
    "B 包点"
   ],
   "title": "CT B区回防瞬闪",
   "oneline": "沙地卡车左键跳投瞬闪，配合队友回防B区",
   "difficulty": "easy",
   "phase": [
    "retake"
   ],
   "status": "draft",
   "spots": [
    "B 包点",
    "B门",
    "卡车"
   ],
   "tags": [
    "CT",
    "B区"
   ],
   "pin_targets": {
    "B门": [
     0.2447,
     0.253
    ]
   },
   "source": {
    "kind": "video",
    "creator": "冷锋",
    "url": "https://www.bilibili.com/video/BV1jnQrBrEVb"
   },
   "throw_badge": "左键跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-ct-flash-b-retake/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-ct-flash-b-retake/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-ct-flash-b-retake/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "- 字幕「回防瞬闪/跳投」，b 点回防比较考验闪光的协同：让队友先补 B 洞烟或大箱火，再配合闪回防。",
   "pyf": [
    "ctbquhuifangshunshan",
    "kache",
    "bmenbbaodian"
   ],
   "pyi": [
    "ctbqhfss",
    "kc",
    "bmbbd"
   ]
  },
  {
   "id": "dust2-ct-he-02",
   "map": "de_dust2",
   "side": "CT",
   "type": "he",
   "click": "lmb",
   "move": "w",
   "action": "direct",
   "origin": "头皮位",
   "target": "A小楼梯下",
   "title": "flamez-A小台下雷",
   "oneline": "头皮位→A小楼梯下，W左键",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "draft",
   "spots": [
    "头皮位",
    "A小楼梯下"
   ],
   "tags": [],
   "related": [],
   "pin_targets": {
    "A小楼梯下": [
     0.6562,
     0.3452
    ]
   },
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "throw_badge": "W左键",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-ct-he-02/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-ct-he-02/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-ct-he-02/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "flamezaxiaotaixialei",
    "touwei",
    "axiaoloutixia"
   ],
   "pyi": [
    "flamezaxtxl",
    "tw",
    "axltx"
   ]
  },
  {
   "id": "dust2-ct-molly-short-rush",
   "map": "de_dust2",
   "side": "CT",
   "type": "molotov",
   "click": "lmb",
   "move": "run",
   "action": "jump",
   "origin": "警家",
   "target": "A小",
   "title": "CT警家&沙地烧A小火",
   "oneline": "往中门跑跳投，A小rush时火烧退对面",
   "difficulty": "normal",
   "phase": [
    "postplant"
   ],
   "status": "draft",
   "spots": [
    "A小",
    "警家"
   ],
   "tags": [
    "CT",
    "A区"
   ],
   "pin_origin": [
    0.4726,
    0.256
   ],
   "pin_targets": {
    "A小": [
     0.5158,
     0.4171
    ]
   },
   "source": {
    "kind": "video",
    "creator": "冷锋",
    "url": "https://www.bilibili.com/video/BV1jnQrBrEVb"
   },
   "throw_badge": "跑·左键·跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-ct-molly-short-rush/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-ct-molly-short-rush/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-ct-molly-short-rush/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "- 字幕「A小套餐/跑跳投」，伤害性反清道具；A 小前压或配合中路 CT 反清时用。\n- 同段还有 A小雷（W跳投）、补A小烟（W双键跳投）组成套餐，未入库。",
   "pyf": [
    "ctjingjiashadishaoaxiaohuo",
    "jingjia",
    "axiao"
   ],
   "pyi": [
    "ctjjsdsaxh",
    "jj",
    "ax"
   ]
  },
  {
   "id": "dust2-ct-smoke-a-door-retake",
   "map": "de_dust2",
   "side": "CT",
   "type": "smoke",
   "click": "lmb",
   "move": "w",
   "action": "direct",
   "origin": "A大坑",
   "target": "A门内",
   "title": "A大坑补A门烟",
   "oneline": "A大坑W跑丢补A门烟",
   "difficulty": "normal",
   "phase": [
    "postplant"
   ],
   "status": "draft",
   "spots": [
    "A门内",
    "A大坑"
   ],
   "tags": [
    "CT",
    "A区"
   ],
   "pin_origin": [
    0.8377,
    0.5563
   ],
   "pin_targets": {
    "A门内": [
     0.6828,
     0.5654
    ]
   },
   "source": {
    "kind": "video",
    "creator": "冷锋",
    "url": "https://www.bilibili.com/video/BV1jnQrBrEVb"
   },
   "throw_badge": "W左键",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-ct-smoke-a-door-retake/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-ct-smoke-a-door-retake/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-ct-smoke-a-door-retake/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "- 字幕「控A门套餐：弹一颗a1门里的箱后火」，配合烟把 A 门彻底控住。\n- 投法画面未给明确提示，占位 lmb+站投直投，**投法待实测**。",
   "pyf": [
    "adakengbuamenyan",
    "adakeng",
    "amennei"
   ],
   "pyi": [
    "adkbamy",
    "adk",
    "amn"
   ]
  },
  {
   "id": "dust2-ct-smoke-a-door",
   "map": "de_dust2",
   "side": "CT",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "jump",
   "origin": "电梯位",
   "target": "A门内",
   "title": "A门烟",
   "oneline": "电梯位→A门内，左键跳投",
   "difficulty": "easy",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "电梯位",
    "警A门"
   ],
   "tags": [
    "A区"
   ],
   "pin_targets": {
    "警A门": [
     0.6856,
     0.5645
    ],
    "A门内": [
     0.6838,
     0.5691
    ]
   },
   "source": {
    "kind": "self"
   },
   "checked": "2026-10-01",
   "throw_badge": "左键跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-ct-smoke-a-door/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-ct-smoke-a-door/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-ct-smoke-a-door/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "- 面板：烟雾弹｜起点 电梯｜落点 A门里｜左键跳投（Tatukunn ID 5431）。\n- 「电梯」即报点「电梯位」，「A门里」即「A门内」。- 素材为用户自截（Tatukunn 道具预览视频，画面含完美平台道具面板：起点/落点/投法已按面板录入）。",
   "pyf": [
    "amenyan",
    "diantiwei",
    "amennei"
   ],
   "pyi": [
    "amy",
    "dtw",
    "amn"
   ]
  },
  {
   "id": "dust2-ct-smoke-a-short-ac",
   "map": "de_dust2",
   "side": "CT",
   "type": "smoke",
   "click": "rmb",
   "move": "stand",
   "action": "direct",
   "origin": "空调",
   "target": "空调",
   "title": "A小空调灭火烟",
   "oneline": "A小空调位灭火烟，蹲下右键投",
   "difficulty": "easy",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "空调"
   ],
   "tags": [
    "A区"
   ],
   "pin_origin": [
    0.6689,
    0.2469
   ],
   "pin_targets": {
    "空调": [
     0.669,
     0.2443
    ]
   },
   "source": {
    "kind": "self"
   },
   "checked": "2026-10-01",
   "throw_badge": "右键轻抛",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-ct-smoke-a-short-ac/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-ct-smoke-a-short-ac/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-ct-smoke-a-short-ac/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "- 用户指认：A 小空调位灭火烟，蹲下右键投。\n- 该帧无道具面板；「蹲下」暂不在移动枚举（按原地+右键轻抛），待扩枚举后修正。- 素材为用户自截（Tatukunn 道具预览视频，画面含完美平台道具面板：起点/落点/投法已按面板录入）。",
   "pyf": [
    "axiaokongdiaomiehuoyan",
    "kongdiao",
    "kongdiao"
   ],
   "pyi": [
    "axkdmhy",
    "kd",
    "kd"
   ]
  },
  {
   "id": "dust2-ct-smoke-a-short-block",
   "map": "de_dust2",
   "side": "CT",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "direct",
   "origin": "A大油桶",
   "target": "空调",
   "title": "卡神A小隔断烟",
   "oneline": "A门外→A小道，左键投掷，隔断 A 小",
   "difficulty": "easy",
   "phase": [
    "retake"
   ],
   "status": "verified",
   "spots": [
    "A大油桶",
    "空调"
   ],
   "tags": [
    "A区"
   ],
   "source": {
    "kind": "self"
   },
   "checked": "2026-10-01",
   "throw_badge": "左键直投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-ct-smoke-a-short-block/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-ct-smoke-a-short-block/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-ct-smoke-a-short-block/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "- 面板：烟雾弹｜起点 A门外｜落点 A小道｜左键投掷（卡神，Tatukunn ID 5401）。\n- 面板「A门外」取近义报点「匪A门」；「A小道」即「A小」。- 素材为用户自截（Tatukunn 道具预览视频，画面含完美平台道具面板：起点/落点/投法已按面板录入）。",
   "pyf": [
    "kashenaxiaogeduanyan",
    "adayoutong",
    "kongdiao"
   ],
   "pyi": [
    "ksaxgdy",
    "adyt",
    "kd"
   ]
  },
  {
   "id": "dust2-ct-smoke-b-door-retake",
   "map": "de_dust2",
   "side": "CT",
   "type": "smoke",
   "click": "both",
   "move": "stand",
   "action": "direct",
   "origin": "B门",
   "target": "B门",
   "title": "熙爷-回防B门展开烟",
   "oneline": "B门→B包点，回防时贴箱展开",
   "difficulty": "easy",
   "phase": [
    "retake"
   ],
   "status": "verified",
   "spots": [
    "B门"
   ],
   "tags": [
    "回防"
   ],
   "source": {
    "kind": "self"
   },
   "checked": "2026-10-01",
   "throw_badge": "双键直投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-ct-smoke-b-door-retake/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-ct-smoke-b-door-retake/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-ct-smoke-b-door-retake/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "- 视频教学字幕：「回防B门展开烟」「贴住箱子再丢」——CT 回防时在 B 门内展开。\n- 该段无道具面板，投法占位待实测。- 素材为用户自截（Tatukunn 道具预览视频，画面含完美平台道具面板：起点/落点/投法已按面板录入）。",
   "pyf": [
    "xiyehuifangbmenzhankaiyan",
    "bmen",
    "bmen"
   ],
   "pyi": [
    "xyhfbmzky",
    "bm",
    "bm"
   ]
  },
  {
   "id": "dust2-ct-smoke-long-delay",
   "map": "de_dust2",
   "side": "CT",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "direct",
   "origin": "电梯位",
   "target": "A大",
   "title": "CT A大隔断烟",
   "oneline": "A电梯位外部边缘站投延迟烟，拖断T的A大节奏",
   "difficulty": "easy",
   "phase": [
    "postplant"
   ],
   "status": "draft",
   "spots": [
    "A大",
    "电梯位"
   ],
   "tags": [
    "CT",
    "A区"
   ],
   "pin_origin": [
    0.764,
    0.1965
   ],
   "pin_targets": {
    "A大": [
     0.8635,
     0.4162
    ]
   },
   "source": {
    "kind": "video",
    "creator": "冷锋",
    "url": "https://www.bilibili.com/video/BV1jnQrBrEVb"
   },
   "throw_badge": "左键直投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-ct-smoke-long-delay/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-ct-smoke-long-delay/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-ct-smoke-long-delay/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "- 字幕「A大隔断烟/站投」，可以再补一颗拖对方进攻节奏，寻找反清时机。\n- 延迟烟讲究时机：等 T 快到 A 门再落，别开局就交。",
   "pyf": [
    "ctadageduanyan",
    "diantiwei",
    "ada"
   ],
   "pyi": [
    "ctadgdy",
    "dtw",
    "ad"
   ]
  },
  {
   "id": "dust2-ct-smoke-tunnel-self",
   "map": "de_dust2",
   "side": "CT",
   "type": "smoke",
   "click": "both",
   "move": "w",
   "action": "jump",
   "origin": "沙地",
   "target": "暗道",
   "title": "自助暗道烟",
   "oneline": "沙地→暗道，W 助跑双键跳投，过道自用",
   "difficulty": "easy",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "暗道",
    "沙地"
   ],
   "tags": [
    "中路"
   ],
   "pin_origin": [
    0.4672,
    0.2615
   ],
   "pin_targets": {
    "暗道": [
     0.4488,
     0.726
    ]
   },
   "source": {
    "kind": "self"
   },
   "checked": "2026-10-01",
   "throw_badge": "W·双键·跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-ct-smoke-tunnel-self/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-ct-smoke-tunnel-self/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-ct-smoke-tunnel-self/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "- 面板：烟雾弹｜起点 沙地｜落点 暗道｜W+助跑双键跳投（Tatukunn ID 1850）。- 素材为用户自截（Tatukunn 道具预览视频，画面含完美平台道具面板：起点/落点/投法已按面板录入）。",
   "pyf": [
    "zizhuandaoyan",
    "shadi",
    "andao"
   ],
   "pyi": [
    "zzady",
    "sd",
    "ad"
   ]
  },
  {
   "id": "dust2-t-flash-02",
   "map": "de_dust2",
   "side": "T",
   "type": "flash",
   "click": "lmb",
   "move": "stand",
   "action": "direct",
   "origin": "中路",
   "target": "中门",
   "title": "apex-夹B烟闪",
   "oneline": "中路→中门，左键直投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "draft",
   "spots": [
    "中路",
    "中门"
   ],
   "tags": [],
   "related": [],
   "pin_targets": {
    "中门": [
     0.442,
     0.3461
    ]
   },
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "throw_badge": "左键直投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-t-flash-02/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-t-flash-02/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-t-flash-02/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "apexbyanshan",
    "zhonglu",
    "zhongmen"
   ],
   "pyi": [
    "apexbys",
    "zl",
    "zm"
   ]
  },
  {
   "id": "dust2-t-flash-a-long",
   "map": "de_dust2",
   "side": "T",
   "type": "flash",
   "click": "lmb",
   "move": "run",
   "action": "direct",
   "origin": "黄车",
   "target": "A门内",
   "title": "A大门突破自助闪",
   "oneline": "黄车旁跑投自助闪，独自破A门",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "draft",
   "spots": [
    "黄车",
    "A门内"
   ],
   "tags": [
    "A区"
   ],
   "pin_targets": {
    "A门内": [
     0.677,
     0.5604
    ]
   },
   "source": {
    "kind": "video",
    "creator": "冷锋",
    "url": "https://www.bilibili.com/video/BV1jnQrBrEVb"
   },
   "throw_badge": "跑左键",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-t-flash-a-long/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-t-flash-a-long/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-t-flash-a-long/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "- 字幕「突破自助闪/跑投」：跑动中出手，闪爆 A 门外，独自也能破 A 门。\n- 出闪后立即跟进修头，别给 CT 反架时间。",
   "pyf": [
    "adamentupozizhushan",
    "huangche",
    "amennei"
   ],
   "pyi": [
    "admtpzzs",
    "hc",
    "amn"
   ]
  },
  {
   "id": "dust2-t-flash-a-main",
   "map": "de_dust2",
   "side": "T",
   "type": "flash",
   "click": "lmb",
   "move": "stand",
   "action": "jump",
   "origin": "黄车",
   "target": [
    "大坑边",
    "A大"
   ],
   "title": "A门启动闪（第二时间）",
   "oneline": "A平台跳投二波闪，配合队友出门",
   "difficulty": "easy",
   "phase": [
    "default"
   ],
   "status": "draft",
   "spots": [
    "黄车",
    "大坑边",
    "A大"
   ],
   "tags": [
    "A区"
   ],
   "source": {
    "kind": "video",
    "creator": "冷锋",
    "url": "https://www.bilibili.com/video/BV1jnQrBrEVb"
   },
   "throw_badge": "左键跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-t-flash-a-main/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-t-flash-a-main/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-t-flash-a-main/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "- 字幕「A门启动闪(第二时间)/跳投」：第一时间烟后、队友出门时补的二波闪。\n- 视频同段还有「A门补保护烟(第二时间)/站投」可配套（未入库，见重复/候选记录）。",
   "pyf": [
    "amenqidongshandiershijian",
    "huangche",
    "dakengbianada"
   ],
   "pyi": [
    "amqdsdesj",
    "hc",
    "dkbad"
   ]
  },
  {
   "id": "dust2-t-flash-b-exec",
   "map": "de_dust2",
   "side": "T",
   "type": "flash",
   "click": "lmb",
   "move": "stand",
   "action": "jump",
   "origin": "B通/B2",
   "target": [
    "狗位",
    "B 包点"
   ],
   "title": "B执行启动闪",
   "oneline": "脚手架跳投，闪白狗洞枪位再出B",
   "difficulty": "normal",
   "phase": [
    "execute"
   ],
   "status": "draft",
   "spots": [
    "B通/B2",
    "狗位",
    "B 包点"
   ],
   "tags": [
    "B区"
   ],
   "pin_origin": [
    0.1889,
    0.5185
   ],
   "pin_targets": {
    "狗位": [
     0.106,
     0.2835
    ],
    "B 包点": [
     0.1306,
     0.2822
    ]
   },
   "source": {
    "kind": "video",
    "creator": "冷锋",
    "url": "https://www.bilibili.com/video/BV1jnQrBrEVb"
   },
   "throw_badge": "左键跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-t-flash-b-exec/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-t-flash-b-exec/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-t-flash-b-exec/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "- 字幕「启动闪/跳投」，闪到位才能白到狗洞的枪位；B 执行出洞前的标配闪。\n- 视频同段有「假门闪（跑投）」骗闪变体，未入库。",
   "pyf": [
    "bzhixingqidongshan",
    "btongb2",
    "gouweibbaodian"
   ],
   "pyi": [
    "bzxqds",
    "btb2",
    "gwbbd"
   ]
  },
  {
   "id": "dust2-t-flash-doghole-self",
   "map": "de_dust2",
   "side": "T",
   "type": "flash",
   "click": "both",
   "move": "run",
   "action": "jump",
   "origin": "B通/B2",
   "target": "B 包点",
   "title": "scrunk-自助狗洞启动闪",
   "oneline": "B二层→B包，W 助跑双键投掷，狗洞启动闪",
   "difficulty": "easy",
   "phase": [
    "execute"
   ],
   "status": "verified",
   "spots": [
    "B 包点",
    "B通/B2"
   ],
   "tags": [
    "B区"
   ],
   "pin_origin": [
    0.1355,
    0.4351
   ],
   "pin_targets": {
    "B 包点": [
     0.129,
     0.3106
    ]
   },
   "source": {
    "kind": "self"
   },
   "checked": "2026-10-01",
   "throw_badge": "跑·双键·跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-t-flash-doghole-self/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-t-flash-doghole-self/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-t-flash-doghole-self/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "- 面板：闪光弹｜起点 B二层｜落点 B包｜W+助跑双键投掷（scrunk，Tatukunn ID 5418）。\n- 「B二层」即上层 B 通（报点「B通/B2」）；闪光类第 3 帧为致盲反馈。- 素材为用户自截（Tatukunn 道具预览视频，画面含完美平台道具面板：起点/落点/投法已按面板录入）。",
   "pyf": [
    "scrunkzizhugoudongqidongshan",
    "btongb2",
    "bbaodian"
   ],
   "pyi": [
    "scrunkzzgdqds",
    "btb2",
    "bbd"
   ]
  },
  {
   "id": "dust2-t-molly-a-site",
   "map": "de_dust2",
   "side": "T",
   "type": "molotov",
   "click": "lmb",
   "move": "walk-step",
   "action": "jump",
   "origin": "厕所",
   "target": [
    "二箱",
    "A 包点"
   ],
   "title": "A包点二箱火",
   "oneline": "A大厕所跑一步跳投，烧包点",
   "difficulty": "normal",
   "phase": [
    "execute"
   ],
   "status": "draft",
   "spots": [
    "A 包点",
    "二箱",
    "厕所"
   ],
   "tags": [
    "A区"
   ],
   "pin_targets": {
    "二箱": [
     0.7699,
     0.1446
    ]
   },
   "source": {
    "kind": "video",
    "creator": "冷锋",
    "url": "https://www.bilibili.com/video/BV1jnQrBrEVb"
   },
   "throw_badge": "W一步·左键·跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-t-molly-a-site/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-t-molly-a-site/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-t-molly-a-site/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "- 字幕「包点火和二箱火都可以在楼梯这边去」，下包后守包也能用。\n- 跑一步跳投越过 A 小出口，火铺包点锚位；二箱方向另有其一（见重复候选）。",
   "pyf": [
    "abaodianerxianghuo",
    "cesuo",
    "erxiangabaodian"
   ],
   "pyi": [
    "abdexh",
    "cs",
    "exabd"
   ]
  },
  {
   "id": "dust2-t-molly-car",
   "map": "de_dust2",
   "side": "T",
   "type": "molotov",
   "click": "lmb",
   "move": "w",
   "action": "jump",
   "origin": "A大油桶",
   "target": [
    "蓝车",
    "蓝车死点"
   ],
   "title": "蓝车火（A大车位）",
   "oneline": "A大蓝箱W跳投，火烧车位逼出架点",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "draft",
   "spots": [
    "蓝车",
    "蓝车死点",
    "A大油桶"
   ],
   "tags": [
    "A区"
   ],
   "source": {
    "kind": "video",
    "creator": "冷锋",
    "url": "https://www.bilibili.com/video/BV1jnQrBrEVb"
   },
   "throw_badge": "W·左键·跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-t-molly-car/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-t-molly-car/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-t-molly-car/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "- 字幕「蓝车火/W跳投」；「不烧车拿不了 A 大」，车位火是 A 大推进的标配件。\n- 站蓝箱侧出手，火落蓝车车体；CS2 火焰可被烟雾弹吹散，注意对方道具交换。",
   "pyf": [
    "lanchehuoadachewei",
    "adayoutong",
    "lanchelanchesidian"
   ],
   "pyi": [
    "lchadcw",
    "adyt",
    "lclcsd"
   ]
  },
  {
   "id": "dust2-t-molly-goose",
   "map": "de_dust2",
   "side": "T",
   "type": "molotov",
   "click": "lmb",
   "move": "walk-step",
   "action": "direct",
   "origin": "A小楼梯",
   "target": "鹅位/狙位",
   "title": "狙位火（鹅位）",
   "oneline": "A小楼梯走一步投，火烧狙位阴人位",
   "difficulty": "normal",
   "phase": [
    "execute"
   ],
   "status": "draft",
   "spots": [
    "A小楼梯",
    "鹅位/狙位"
   ],
   "tags": [
    "A区"
   ],
   "pin_targets": {
    "鹅位/狙位": [
     0.7941,
     0.0554
    ]
   },
   "source": {
    "kind": "video",
    "creator": "冷锋",
    "url": "https://www.bilibili.com/video/BV1jnQrBrEVb"
   },
   "throw_badge": "W一步左键",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-t-molly-goose/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-t-molly-goose/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-t-molly-goose/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "- 冷锋字幕「狙位火/走一步投」，投法按字幕；CS2 弹道有微调，落点以实测为准。\n- 烧狙位台阶阴人位，配合 A 小出头的队友抢包点。",
   "pyf": [
    "juweihuoewei",
    "axiaolouti",
    "eweijuwei"
   ],
   "pyi": [
    "jwhew",
    "axlt",
    "ewjw"
   ]
  },
  {
   "id": "dust2-t-molotov-b-door",
   "map": "de_dust2",
   "side": "T",
   "type": "molotov",
   "click": "lmb",
   "move": "stand",
   "action": "direct",
   "origin": "B通/B2",
   "target": [
    "狗位",
    "假门"
   ],
   "title": "B通狗位假门火",
   "oneline": "B通瞄拱门上沿，左键直接出手——火烧B洞墙前两个老六位",
   "difficulty": "easy",
   "phase": [
    "execute"
   ],
   "status": "verified",
   "spots": [
    "假门",
    "狗位"
   ],
   "tags": [
    "B区"
   ],
   "pin_origin": [
    0.1443,
    0.5
   ],
   "pin_targets": {
    "假门": [
     0.0739,
     0.2425
    ],
    "狗位": [
     0.076,
     0.3039
    ]
   },
   "source": {
    "kind": "video",
    "creator": "祖灵Zu1ing",
    "url": "https://search.bilibili.com/all?keyword=%E7%A5%96%E7%81%B5Zu1ing%20%E6%B2%99%E4%BA%8C%20%E7%87%83%E7%83%A7%E5%BC%B9"
   },
   "checked": "2026-10-02",
   "throw_badge": "左键直投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-t-molotov-b-door/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-t-molotov-b-door/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-t-molotov-b-door/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "- 「三个沙二必备燃烧弹」第 1 颗：效果帧字幕「烧满两个老六位」，目标=B 门墙前墙角 + 门边两个 CT 位。\n- 1-stand 图为 UP 主展示的敌方老六位（墙角）是投掷站位。\n- 开镜不影响弹道，瞄拱门上沿出手即可；T 侧站位全景帧没截到，origin 按瞄点帧场景推定，待实测校准。\n- 视频 BV 号待补（先用搜索链接溯源）。",
   "pyf": [
    "btonggouweijiamenhuo",
    "btongb2",
    "gouweijiamen"
   ],
   "pyi": [
    "btgwjmh",
    "btb2",
    "gwjm"
   ]
  },
  {
   "id": "dust2-t-molotov-boxes-l",
   "map": "de_dust2",
   "side": "T",
   "type": "molotov",
   "click": "lmb",
   "move": "walk-step",
   "action": "jump",
   "origin": "厕所",
   "target": "二箱",
   "title": "二箱电梯位火",
   "oneline": "A 大厕所抵住第一级台阶，瞄白墙污渍左边，走一步跳投烧两位置",
   "difficulty": "normal",
   "phase": [
    "execute"
   ],
   "status": "verified",
   "spots": [
    "二箱",
    "电梯位"
   ],
   "tags": [
    "A区"
   ],
   "related": [],
   "pin_targets": {
    "电梯位": [
     0.7597,
     0.1968
    ],
    "二箱": [
     0.7709,
     0.1617
    ]
   },
   "source": {
    "kind": "video",
    "creator": "祖灵Zu1ing",
    "url": "https://search.bilibili.com/all?keyword=%E7%A5%96%E7%81%B5Zu1ing%20%E6%B2%99%E4%BA%8C%20%E7%87%83%E7%83%A7%E5%BC%B9"
   },
   "checked": "2026-10-02",
   "throw_badge": "W一步·左键·跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-t-molotov-boxes-l/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-t-molotov-boxes-l/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-t-molotov-boxes-l/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "- 「三个沙二必备燃烧弹」第 3 颗：效果帧字幕「二箱后和L位两个老六点」。\n- 站位字幕「抵住第一级台阶」，按瞄点帧场景（TELEBOUTIQUE 红雨棚过点后）推定为 A 大坑下坑台阶，待实测校准。\n- 瞄点参照=白墙红渍（污渍）左侧，视频有辅助线；瞄的是 A 点方向墙棱。\n- 视频 BV 号待补（先用搜索链接溯源）。",
   "pyf": [
    "erxiangdiantiweihuo",
    "cesuo",
    "erxiang"
   ],
   "pyi": [
    "exdtwh",
    "cs",
    "ex"
   ]
  },
  {
   "id": "dust2-t-molotov-mid-doors",
   "map": "de_dust2",
   "side": "T",
   "type": "molotov",
   "click": "lmb",
   "move": "stand",
   "action": "direct",
   "origin": "叉箱",
   "target": "中门",
   "title": "中门后火",
   "oneline": "抵叉箱瞄棱上方，左键直接出手——火越门顶烧门后老六位",
   "difficulty": "easy",
   "phase": [
    "execute"
   ],
   "status": "verified",
   "spots": [
    "叉箱",
    "中门"
   ],
   "tags": [
    "中路"
   ],
   "pin_targets": {
    "中门": [
     0.456,
     0.341
    ]
   },
   "source": {
    "kind": "video",
    "creator": "祖灵Zu1ing",
    "url": "https://search.bilibili.com/all?keyword=%E7%A5%96%E7%81%B5Zu1ing%20%E6%B2%99%E4%BA%8C%20%E7%87%83%E7%83%A7%E5%BC%B9"
   },
   "checked": "2026-10-02",
   "throw_badge": "左键直投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-t-molotov-mid-doors/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-t-molotov-mid-doors/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-t-molotov-mid-doors/4-result.jpg"
    },
    {
     "slot": "5-demo",
     "label": "演示",
     "path": "media/de_dust2/dust2-t-molotov-mid-doors/5-demo.jpg"
    }
   ],
   "missing": [],
   "notes": "- 「三个沙二必备燃烧弹」第 2 颗：效果帧（门缝视角）字幕「烧完中门后所有老六位」。\n- 5-demo 图是 UP 电刃演示的「X箱后」老六位——X 箱即叉箱，也是这颗火的站位参照。\n- 瞄点参照=中门上方墙棱（视频有橙色辅助线）；缺 T 侧站位全景图，待实测补充。\n- 视频 BV 号待补（先用搜索链接溯源）。",
   "pyf": [
    "zhongmenhouhuo",
    "chaxiang",
    "zhongmen"
   ],
   "pyi": [
    "zmhh",
    "cx",
    "zm"
   ]
  },
  {
   "id": "dust2-t-smoke-02",
   "map": "de_dust2",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "run",
   "action": "jump",
   "origin": "匪家",
   "target": "警A门",
   "title": "寒王-抢A大A门烟",
   "oneline": "匪家→警A门，跑·左键·跳投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "draft",
   "spots": [
    "匪家",
    "警A门"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "throw_badge": "跑·左键·跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-t-smoke-02/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-t-smoke-02/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-t-smoke-02/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "qiangadaamenyan",
    "feijia",
    "jingamen"
   ],
   "pyi": [
    "qadamy",
    "fj",
    "jam"
   ]
  },
  {
   "id": "dust2-t-smoke-a-anti-push",
   "map": "de_dust2",
   "side": "T",
   "type": "smoke",
   "click": "both",
   "move": "stand",
   "action": "jump",
   "origin": "蓝箱",
   "target": "警家过点",
   "title": "Jame-防顶警家过点烟",
   "oneline": "蓝箱→警家过点，双键跳投，防警家过点",
   "difficulty": "easy",
   "phase": [
    "execute"
   ],
   "status": "verified",
   "spots": [
    "蓝箱",
    "警家过点"
   ],
   "tags": [
    "A区"
   ],
   "pin_origin": [
    0.7552,
    0.4739
   ],
   "pin_targets": {
    "警家过点": [
     0.7997,
     0.2448
    ]
   },
   "source": {
    "kind": "self"
   },
   "checked": "2026-10-01",
   "throw_badge": "双键跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-t-smoke-a-anti-push/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-t-smoke-a-anti-push/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-t-smoke-a-anti-push/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "- 面板：烟雾弹｜起点 蓝箱｜落点 警家｜双键跳投（Jame，Tatukunn ID 5474）。- 素材为用户自截（Tatukunn 道具预览视频，画面含完美平台道具面板：起点/落点/投法已按面板录入）。",
   "pyf": [
    "jamefangdingjingjiaguodianyan",
    "lanxiang",
    "jingjiaguodian"
   ],
   "pyi": [
    "jamefdjjgdy",
    "lx",
    "jjgd"
   ]
  },
  {
   "id": "dust2-t-smoke-a-prot-rain",
   "map": "de_dust2",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "jump",
   "origin": "匪家",
   "target": "A大",
   "title": "Rain-A大保护烟",
   "oneline": "匪家→A大，左键跳投",
   "difficulty": "easy",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "A大",
    "匪家"
   ],
   "tags": [
    "A区"
   ],
   "pin_origin": [
    0.4342,
    0.8628
   ],
   "pin_targets": {
    "A大": [
     0.8178,
     0.4598
    ]
   },
   "source": {
    "kind": "self"
   },
   "checked": "2026-10-01",
   "throw_badge": "左键跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-t-smoke-a-prot-rain/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-t-smoke-a-prot-rain/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-t-smoke-a-prot-rain/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "- 面板：烟雾弹｜起点 匪家｜落点 A大｜左键跳投（Tatukunn ID 5397）。- 素材为用户自截（Tatukunn 道具预览视频，画面含完美平台道具面板：起点/落点/投法已按面板录入）。",
   "pyf": [
    "rainadabaohuyan",
    "feijia",
    "ada"
   ],
   "pyi": [
    "rainadbhy",
    "fj",
    "ad"
   ]
  },
  {
   "id": "dust2-t-smoke-a-prot",
   "map": "de_dust2",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "jump",
   "origin": "匪家",
   "target": "A大",
   "title": "A大保护烟",
   "oneline": "匪家→A大，左键跳投",
   "difficulty": "easy",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "A大",
    "匪家"
   ],
   "tags": [
    "A区"
   ],
   "pin_origin": [
    0.4885,
    0.8628
   ],
   "pin_targets": {
    "A大": [
     0.814,
     0.4577
    ]
   },
   "source": {
    "kind": "self"
   },
   "checked": "2026-10-01",
   "throw_badge": "左键跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-t-smoke-a-prot/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-t-smoke-a-prot/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-t-smoke-a-prot/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "- 面板：烟雾弹｜起点 匪家｜落点 A大｜左键跳投（PWA ID 6072）。- 素材为用户自截（Tatukunn 道具预览视频，画面含完美平台道具面板：起点/落点/投法已按面板录入）。",
   "pyf": [
    "adabaohuyan",
    "feijia",
    "ada"
   ],
   "pyi": [
    "adbhy",
    "fj",
    "ad"
   ]
  },
  {
   "id": "dust2-t-smoke-b-door",
   "map": "de_dust2",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "jump",
   "origin": "后花园",
   "target": "B门",
   "title": "B门烟",
   "oneline": "后花园→B门，左键跳投",
   "difficulty": "easy",
   "phase": [
    "execute"
   ],
   "status": "verified",
   "spots": [
    "B门",
    "后花园"
   ],
   "tags": [
    "B区"
   ],
   "pin_origin": [
    0.2568,
    0.6125
   ],
   "pin_targets": {
    "B门": [
     0.2618,
     0.2272
    ]
   },
   "source": {
    "kind": "self"
   },
   "checked": "2026-10-01",
   "throw_badge": "左键跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-t-smoke-b-door/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-t-smoke-b-door/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-t-smoke-b-door/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "- 面板：烟雾弹｜起点 后花园｜落点 B门｜左键跳投（Tatukunn ID 1376）。- 素材为用户自截（Tatukunn 道具预览视频，画面含完美平台道具面板：起点/落点/投法已按面板录入）。",
   "pyf": [
    "bmenyan",
    "houhuayuan",
    "bmen"
   ],
   "pyi": [
    "bmy",
    "hhy",
    "bm"
   ]
  },
  {
   "id": "dust2-t-smoke-ct",
   "map": "de_dust2",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "jump",
   "origin": "后花园平台",
   "target": "警家",
   "title": "警家烟",
   "oneline": "后花园跳投直封警家出口，断 CT 增援与回防视野",
   "difficulty": "easy",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "后花园平台",
    "警家"
   ],
   "tags": [
    "默认",
    "控中路"
   ],
   "related": [],
   "pin_origin": [
    0.1986,
    0.7706
   ],
   "pin_targets": {
    "警家": [
     0.5127,
     0.2462
    ]
   },
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-02",
   "throw_badge": "左键跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-t-smoke-ct/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-t-smoke-ct/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-t-smoke-ct/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "中路推进后的第二颗：封住警家方向，CT 只能绕远路回防。\n和 XBOX 烟配套使用，先 XBOX 后警家。\n线位来自完美平台练功房预设（作者 PWA，ID 6136）。",
   "pyf": [
    "jingjiayan",
    "houhuayuanpingtai",
    "jingjia"
   ],
   "pyi": [
    "jjy",
    "hhypt",
    "jj"
   ]
  },
  {
   "id": "dust2-t-smoke-doghole",
   "map": "de_dust2",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "jump",
   "origin": "后花园",
   "target": "狗洞",
   "title": "狗洞烟",
   "oneline": "后花园→狗洞，左键跳投",
   "difficulty": "easy",
   "phase": [
    "execute"
   ],
   "status": "verified",
   "source": {
    "kind": "self"
   },
   "checked": "2026-10-01",
   "tags": [
    "B区"
   ],
   "spots": [
    "后花园",
    "狗洞"
   ],
   "throw_badge": "左键跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-t-smoke-doghole/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-t-smoke-doghole/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-t-smoke-doghole/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "- 面板：烟雾弹｜起点 后花园｜落点 狗洞｜左键跳投（Tatukunn ID 1377）。- 素材为用户自截（Tatukunn 道具预览视频，画面含完美平台道具面板：起点/落点/投法已按面板录入）。",
   "pyf": [
    "goudongyan",
    "houhuayuan",
    "goudong"
   ],
   "pyi": [
    "gdy",
    "hhy",
    "gd"
   ]
  },
  {
   "id": "dust2-t-smoke-mid-arch-teses",
   "map": "de_dust2",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "crouch-jump",
   "origin": "匪家",
   "target": "中门",
   "title": "Teses-中门挂门烟",
   "oneline": "匪家→中门，蹲下左键跳投，挂门烟",
   "difficulty": "easy",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "中门"
   ],
   "tags": [
    "A区"
   ],
   "pin_origin": [
    0.6263,
    0.8501
   ],
   "pin_targets": {
    "中门": [
     0.4479,
     0.3655
    ]
   },
   "source": {
    "kind": "self"
   },
   "checked": "2026-10-01",
   "throw_badge": "左键蹲跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-t-smoke-mid-arch-teses/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-t-smoke-mid-arch-teses/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-t-smoke-mid-arch-teses/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "- 面板：烟雾弹｜起点 匪家｜落点 中门｜蹲下左键跳投（Teses，PS: 以演示为准！）。\n- 蹲下跳投=蹲跳投字段。- 素材为用户自截（Tatukunn 道具预览视频，画面含完美平台道具面板：起点/落点/投法已按面板录入）。",
   "pyf": [
    "teseszhongmenguamenyan",
    "feijia",
    "zhongmen"
   ],
   "pyi": [
    "teseszmgmy",
    "fj",
    "zm"
   ]
  },
  {
   "id": "dust2-t-smoke-mid-door",
   "map": "de_dust2",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "jump",
   "origin": "暗道",
   "target": "中门",
   "title": "Jame-中门满封烟",
   "oneline": "暗道跳投，烟满封中门缝，T 从中门安全过点",
   "difficulty": "easy",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "暗道",
    "中门"
   ],
   "tags": [
    "默认",
    "控中路"
   ],
   "related": [],
   "pin_origin": [
    0.443,
    0.8424
   ],
   "pin_targets": {
    "中门": [
     0.4525,
     0.3557
    ]
   },
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-02",
   "throw_badge": "左键跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-t-smoke-mid-door/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-t-smoke-mid-door/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-t-smoke-mid-door/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "烟完全盖住中门缝，CT 在门后看不到过点的人。\n站位贴暗道口墙角（见站位图标记）。\n来源：完美平台练功房预设「Jame-中门满封烟」（作者 Tatukunn，ID 5411）。",
   "pyf": [
    "jamezhongmenmanfengyan",
    "andao",
    "zhongmen"
   ],
   "pyi": [
    "jamezmmfy",
    "ad",
    "zm"
   ]
  },
  {
   "id": "dust2-t-smoke-xbox",
   "map": "de_dust2",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "jump",
   "origin": "后花园平台",
   "target": "叉箱",
   "title": "XBOX 烟",
   "oneline": "后花园箱子上跳投，烟封 XBOX，掩护中路安全过点",
   "difficulty": "easy",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "后花园平台",
    "叉箱"
   ],
   "tags": [
    "默认",
    "控中路"
   ],
   "related": [],
   "pin_origin": [
    0.1831,
    0.7745
   ],
   "pin_targets": {
    "叉箱": [
     0.4812,
     0.4032
    ]
   },
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-02",
   "throw_badge": "左键跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_dust2/dust2-t-smoke-xbox/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_dust2/dust2-t-smoke-xbox/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_dust2/dust2-t-smoke-xbox/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "中门争夺的第一颗烟：封住 XBOX 区域，断 CT 从警家方向对中路的视野。\n烟起后再过中门，别提前露头。\n线位来自完美平台练功房预设（作者 PWA，ID 6117）。",
   "pyf": [
    "xboxyan",
    "houhuayuanpingtai",
    "chaxiang"
   ],
   "pyi": [
    "xboxy",
    "hhypt",
    "cx"
   ]
  },
  {
   "id": "inferno-ct-flash-02",
   "map": "de_inferno",
   "side": "CT",
   "type": "flash",
   "click": "rmb",
   "move": "stand",
   "action": "jump",
   "origin": "沙袋",
   "target": "石板",
   "title": "major-石板单向闪",
   "oneline": "沙袋→石板，右键跳投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "沙袋",
    "石板"
   ],
   "tags": [
    "反清"
   ],
   "sets": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-11",
   "throw_badge": "右键跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_inferno/inferno-ct-flash-02/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_inferno/inferno-ct-flash-02/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_inferno/inferno-ct-flash-02/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "majorbanxiangshan",
    "shadai",
    "ban"
   ],
   "pyi": [
    "majorbxs",
    "sd",
    "b"
   ]
  },
  {
   "id": "inferno-ct-he-02",
   "map": "de_inferno",
   "side": "CT",
   "type": "he",
   "click": "both",
   "move": "run",
   "action": "direct",
   "origin": "黄墙",
   "target": "香蕉道",
   "title": "JL-蕉道中段雷",
   "oneline": "黄墙→香蕉道，跑双键",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "黄墙",
    "香蕉道"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-11",
   "throw_badge": "跑双键",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_inferno/inferno-ct-he-02/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_inferno/inferno-ct-he-02/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_inferno/inferno-ct-he-02/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "jldaozhongduanlei",
    "huangqiang",
    "dao"
   ],
   "pyi": [
    "jldzdl",
    "hq",
    "d"
   ]
  },
  {
   "id": "inferno-ct-molotov-02",
   "map": "de_inferno",
   "side": "CT",
   "type": "molotov",
   "click": "lmb",
   "move": "shift-w",
   "action": "jump",
   "origin": "喷泉",
   "target": "木板/车位",
   "title": "Niko-木桶火",
   "oneline": "喷泉→木板/车位，Shift+W·左键·跳投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "喷泉",
    "木板/车位"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-11",
   "throw_badge": "Shift+W·左键·跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_inferno/inferno-ct-molotov-02/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_inferno/inferno-ct-molotov-02/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_inferno/inferno-ct-molotov-02/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "nikotonghuo",
    "",
    "banchewei"
   ],
   "pyi": [
    "nikoth",
    "",
    "bcw"
   ]
  },
  {
   "id": "inferno-ct-smoke-01",
   "map": "de_inferno",
   "side": "CT",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "jump",
   "origin": "书房",
   "target": "黄墙",
   "title": "黄墙回防隔断烟",
   "oneline": "书房→黄墙，左键跳投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "书房",
    "黄墙"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-11",
   "throw_badge": "左键跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_inferno/inferno-ct-smoke-01/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_inferno/inferno-ct-smoke-01/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_inferno/inferno-ct-smoke-01/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "huangqianghuifanggeduanyan",
    "fang",
    "huangqiang"
   ],
   "pyi": [
    "hqhfgdy",
    "f",
    "hq"
   ]
  },
  {
   "id": "inferno-ct-smoke-02",
   "map": "de_inferno",
   "side": "CT",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "jump",
   "origin": "警家",
   "target": "香蕉道",
   "title": "警家花坛边丢蕉道中段烟",
   "oneline": "警家→香蕉道，左键跳投",
   "difficulty": "normal",
   "phase": [
    "postplant"
   ],
   "status": "draft",
   "spots": [
    "警家",
    "香蕉道"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "throw_badge": "左键跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_inferno/inferno-ct-smoke-02/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_inferno/inferno-ct-smoke-02/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_inferno/inferno-ct-smoke-02/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "jingjiahuabiandiudaozhongduanyan",
    "jingjia",
    "dao"
   ],
   "pyi": [
    "jjhbddzdy",
    "jj",
    "d"
   ]
  },
  {
   "id": "inferno-ct-smoke-03",
   "map": "de_inferno",
   "side": "CT",
   "type": "smoke",
   "click": "both",
   "move": "stand",
   "action": "direct",
   "origin": "连接凹槽",
   "target": "小凹槽",
   "title": "A连接大凹槽丢连接欺诈烟",
   "oneline": "连接凹槽→小凹槽，双键直投",
   "difficulty": "normal",
   "phase": [
    "anti-eco"
   ],
   "status": "draft",
   "spots": [
    "连接凹槽",
    "小凹槽"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "throw_badge": "双键直投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_inferno/inferno-ct-smoke-03/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_inferno/inferno-ct-smoke-03/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_inferno/inferno-ct-smoke-03/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "alianjiedadiulianjieyan",
    "lianjie",
    "xiao"
   ],
   "pyi": [
    "aljddljy",
    "lj",
    "x"
   ]
  },
  {
   "id": "inferno-ct-smoke-04",
   "map": "de_inferno",
   "side": "CT",
   "type": "smoke",
   "click": "both",
   "move": "stand",
   "action": "direct",
   "origin": "A1",
   "target": "马棚",
   "title": "CT 马棚欺诈烟",
   "oneline": "A1→马棚，双键直投",
   "difficulty": "normal",
   "phase": [
    "anti-eco"
   ],
   "status": "draft",
   "spots": [
    "A1",
    "马棚"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "throw_badge": "双键直投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_inferno/inferno-ct-smoke-04/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_inferno/inferno-ct-smoke-04/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_inferno/inferno-ct-smoke-04/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "ctpengyan",
    "a1",
    "peng"
   ],
   "pyi": [
    "ctpy",
    "a1",
    "p"
   ]
  },
  {
   "id": "inferno-t-flash-01",
   "map": "de_inferno",
   "side": "T",
   "type": "flash",
   "click": "both",
   "move": "stand",
   "action": "direct",
   "origin": "凹槽",
   "target": "石板",
   "title": "T石板自助闪",
   "oneline": "凹槽→石板，双键直投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "凹槽",
    "石板"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-11",
   "throw_badge": "双键直投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_inferno/inferno-t-flash-01/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_inferno/inferno-t-flash-01/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_inferno/inferno-t-flash-01/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "tbanzizhushan",
    "",
    "ban"
   ],
   "pyi": [
    "tbzzs",
    "",
    "b"
   ]
  },
  {
   "id": "inferno-t-flash-02",
   "map": "de_inferno",
   "side": "T",
   "type": "flash",
   "click": "lmb",
   "move": "stand",
   "action": "jump",
   "origin": "匪家",
   "target": "匪口",
   "title": "aleksib-窗户闪",
   "oneline": "匪家→匪口，左键跳投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "匪家",
    "匪口"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-10",
   "throw_badge": "左键跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_inferno/inferno-t-flash-02/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_inferno/inferno-t-flash-02/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_inferno/inferno-t-flash-02/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "aleksibhushan",
    "feijia",
    "feikou"
   ],
   "pyi": [
    "aleksibhs",
    "fj",
    "fk"
   ]
  },
  {
   "id": "inferno-t-flash-03",
   "map": "de_inferno",
   "side": "T",
   "type": "flash",
   "click": "lmb",
   "move": "stand",
   "action": "direct",
   "origin": "A二楼",
   "target": "高箱",
   "title": "G2-A包无敌单向闪",
   "oneline": "A二楼→高箱，左键直投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "A二楼",
    "高箱"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-11",
   "throw_badge": "左键直投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_inferno/inferno-t-flash-03/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_inferno/inferno-t-flash-03/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_inferno/inferno-t-flash-03/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "g2abaowudixiangshan",
    "aerlou",
    "gaoxiang"
   ],
   "pyi": [
    "g2abwdxs",
    "ael",
    "gx"
   ]
  },
  {
   "id": "inferno-t-flash-05",
   "map": "de_inferno",
   "side": "T",
   "type": "flash",
   "click": "lmb",
   "move": "w",
   "action": "jump",
   "origin": "香蕉道",
   "target": "黄墙",
   "title": "Jee-花坛单向闪",
   "oneline": "香蕉道→黄墙，W·左键·跳投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "香蕉道",
    "黄墙"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-11",
   "throw_badge": "W·左键·跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_inferno/inferno-t-flash-05/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_inferno/inferno-t-flash-05/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_inferno/inferno-t-flash-05/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "jeehuaxiangshan",
    "dao",
    "huangqiang"
   ],
   "pyi": [
    "jeehxs",
    "d",
    "hq"
   ]
  },
  {
   "id": "inferno-t-flash-06",
   "map": "de_inferno",
   "side": "T",
   "type": "flash",
   "click": "lmb",
   "move": "stand",
   "action": "direct",
   "origin": "石板",
   "target": "双架",
   "title": "石板丢警家瞬闪",
   "oneline": "石板→双架，左键直投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "draft",
   "spots": [
    "石板",
    "双架"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "throw_badge": "左键直投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_inferno/inferno-t-flash-06/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_inferno/inferno-t-flash-06/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_inferno/inferno-t-flash-06/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "bandiujingjiashunshan",
    "ban",
    "shuangjia"
   ],
   "pyi": [
    "bdjjss",
    "b",
    "sj"
   ]
  },
  {
   "id": "inferno-t-molotov-01",
   "map": "de_inferno",
   "side": "T",
   "type": "molotov",
   "click": "lmb",
   "move": "w",
   "action": "jump",
   "origin": "香蕉道",
   "target": "B 死点",
   "title": "Jee-B死点火",
   "oneline": "香蕉道→B 死点，W·左键·跳投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "香蕉道",
    "B 死点"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-11",
   "throw_badge": "W·左键·跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_inferno/inferno-t-molotov-01/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_inferno/inferno-t-molotov-01/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_inferno/inferno-t-molotov-01/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "jeebsidianhuo",
    "dao",
    "bsidian"
   ],
   "pyi": [
    "jeebsdh",
    "d",
    "bsd"
   ]
  },
  {
   "id": "inferno-t-molotov-02",
   "map": "de_inferno",
   "side": "T",
   "type": "molotov",
   "click": "lmb",
   "move": "run",
   "action": "jump",
   "origin": "侧道桥",
   "target": "VIP",
   "title": "VIP火",
   "oneline": "侧道桥→VIP，跑·左键·跳投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "侧道桥",
    "VIP"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-11",
   "throw_badge": "跑·左键·跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_inferno/inferno-t-molotov-02/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_inferno/inferno-t-molotov-02/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_inferno/inferno-t-molotov-02/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "viphuo",
    "cedao",
    "vip"
   ],
   "pyi": [
    "viph",
    "cd",
    "vip"
   ]
  },
  {
   "id": "inferno-t-molotov-04",
   "map": "de_inferno",
   "side": "T",
   "type": "molotov",
   "click": "lmb",
   "move": "stand",
   "action": "direct",
   "origin": "树位",
   "target": "黄墙",
   "title": "黄墙火",
   "oneline": "树位→黄墙，左键直投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "树位",
    "黄墙"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-11",
   "throw_badge": "左键直投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_inferno/inferno-t-molotov-04/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_inferno/inferno-t-molotov-04/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_inferno/inferno-t-molotov-04/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "huangqianghuo",
    "wei",
    "huangqiang"
   ],
   "pyi": [
    "hqh",
    "w",
    "hq"
   ]
  },
  {
   "id": "inferno-t-molotov-05",
   "map": "de_inferno",
   "side": "T",
   "type": "molotov",
   "click": "lmb",
   "move": "stand",
   "action": "jump",
   "origin": "木板/车位",
   "target": "三箱",
   "title": "车位丢三箱火",
   "oneline": "木板/车位→三箱，左键跳投",
   "difficulty": "normal",
   "phase": [
    "execute"
   ],
   "status": "draft",
   "spots": [
    "木板/车位",
    "三箱"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "throw_badge": "左键跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_inferno/inferno-t-molotov-05/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_inferno/inferno-t-molotov-05/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_inferno/inferno-t-molotov-05/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "cheweidiusanxianghuo",
    "banchewei",
    "sanxiang"
   ],
   "pyi": [
    "cwdsxh",
    "bcw",
    "sx"
   ]
  },
  {
   "id": "inferno-t-smoke-01",
   "map": "de_inferno",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "jump",
   "origin": "香蕉道",
   "target": "棺材",
   "title": "棺材烟",
   "oneline": "香蕉道→棺材，左键跳投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "香蕉道",
    "棺材"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-11",
   "throw_badge": "左键跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_inferno/inferno-t-smoke-01/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_inferno/inferno-t-smoke-01/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_inferno/inferno-t-smoke-01/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "caiyan",
    "dao",
    "cai"
   ],
   "pyi": [
    "cy",
    "d",
    "c"
   ]
  },
  {
   "id": "inferno-t-smoke-02",
   "map": "de_inferno",
   "side": "T",
   "type": "smoke",
   "click": "both",
   "move": "stand",
   "action": "jump",
   "origin": "小凹槽",
   "target": "连接",
   "title": "Blitz-连接夹B烟",
   "oneline": "小凹槽→连接，双键跳投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "小凹槽",
    "连接"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-11",
   "throw_badge": "双键跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_inferno/inferno-t-smoke-02/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_inferno/inferno-t-smoke-02/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_inferno/inferno-t-smoke-02/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "blitzlianjiebyan",
    "xiao",
    "lianjie"
   ],
   "pyi": [
    "blitzljby",
    "x",
    "lj"
   ]
  },
  {
   "id": "inferno-t-smoke-03",
   "map": "de_inferno",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "run",
   "action": "jump",
   "origin": "匪家",
   "target": "T字连接",
   "title": "快T字烟",
   "oneline": "匪家→T字连接，跑·左键·跳投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "匪家",
    "T字连接"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-10",
   "throw_badge": "跑·左键·跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_inferno/inferno-t-smoke-03/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_inferno/inferno-t-smoke-03/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_inferno/inferno-t-smoke-03/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "kuaitziyan",
    "feijia",
    "tzilianjie"
   ],
   "pyi": [
    "ktzy",
    "fj",
    "tzlj"
   ]
  },
  {
   "id": "inferno-t-smoke-04",
   "map": "de_inferno",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "jump",
   "origin": "T字连接",
   "target": "A 凹槽",
   "title": "Niko-摩托烟",
   "oneline": "T字连接→A 凹槽，左键跳投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "T字连接",
    "A 凹槽"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-11",
   "throw_badge": "左键跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_inferno/inferno-t-smoke-04/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_inferno/inferno-t-smoke-04/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_inferno/inferno-t-smoke-04/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "nikoyan",
    "tzilianjie",
    "a"
   ],
   "pyi": [
    "nikoy",
    "tzlj",
    "a"
   ]
  },
  {
   "id": "inferno-t-smoke-05",
   "map": "de_inferno",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "direct",
   "origin": "T字连接",
   "target": "连接",
   "title": "总监-连接夹B烟",
   "oneline": "T字连接→连接，左键直投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "T字连接",
    "连接"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-11",
   "throw_badge": "左键直投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_inferno/inferno-t-smoke-05/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_inferno/inferno-t-smoke-05/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_inferno/inferno-t-smoke-05/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "lianjiebyan",
    "tzilianjie",
    "lianjie"
   ],
   "pyi": [
    "ljby",
    "tzlj",
    "lj"
   ]
  },
  {
   "id": "inferno-t-smoke-06",
   "map": "de_inferno",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "direct",
   "origin": "中路",
   "target": "连接凹槽",
   "title": "EF-连接深烟",
   "oneline": "中路→连接凹槽，左键直投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "中路",
    "连接凹槽"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-11",
   "throw_badge": "左键直投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_inferno/inferno-t-smoke-06/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_inferno/inferno-t-smoke-06/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_inferno/inferno-t-smoke-06/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "eflianjieyan",
    "zhonglu",
    "lianjie"
   ],
   "pyi": [
    "efljy",
    "zl",
    "lj"
   ]
  },
  {
   "id": "inferno-t-smoke-07",
   "map": "de_inferno",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "w",
   "action": "jump",
   "origin": "侧道桥",
   "target": "连接凹槽",
   "title": "快连接深烟",
   "oneline": "侧道桥→连接凹槽，W·左键·跳投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "侧道桥",
    "连接凹槽"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-11",
   "throw_badge": "W·左键·跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_inferno/inferno-t-smoke-07/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_inferno/inferno-t-smoke-07/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_inferno/inferno-t-smoke-07/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "kuailianjieyan",
    "cedao",
    "lianjie"
   ],
   "pyi": [
    "kljy",
    "cd",
    "lj"
   ]
  },
  {
   "id": "inferno-t-smoke-08",
   "map": "de_inferno",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "jump",
   "origin": "匪口",
   "target": "双架",
   "title": "IM-急速警家连接烟",
   "oneline": "匪口→双架，左键跳投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "匪口",
    "双架"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-11",
   "throw_badge": "左键跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_inferno/inferno-t-smoke-08/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_inferno/inferno-t-smoke-08/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_inferno/inferno-t-smoke-08/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "imjingjialianjieyan",
    "feikou",
    "shuangjia"
   ],
   "pyi": [
    "imjjljy",
    "fk",
    "sj"
   ]
  },
  {
   "id": "inferno-t-smoke-09",
   "map": "de_inferno",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "direct",
   "origin": "A二楼",
   "target": "草车",
   "title": "草车烟",
   "oneline": "A二楼→草车，左键直投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "A二楼",
    "草车"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-11",
   "throw_badge": "左键直投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_inferno/inferno-t-smoke-09/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_inferno/inferno-t-smoke-09/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_inferno/inferno-t-smoke-09/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "cheyan",
    "aerlou",
    "che"
   ],
   "pyi": [
    "cy",
    "ael",
    "c"
   ]
  },
  {
   "id": "inferno-t-smoke-10",
   "map": "de_inferno",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "jump",
   "origin": "中路",
   "target": "忍者位",
   "title": "匪口垃圾袋丢A包忍者满封烟",
   "oneline": "中路→忍者位，左键跳投",
   "difficulty": "normal",
   "phase": [
    "execute"
   ],
   "status": "draft",
   "spots": [
    "中路",
    "忍者位"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "throw_badge": "左键跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_inferno/inferno-t-smoke-10/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_inferno/inferno-t-smoke-10/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_inferno/inferno-t-smoke-10/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "feikoudaidiuabaozhemanfengyan",
    "zhonglu",
    "zhewei"
   ],
   "pyi": [
    "fkddabzmfy",
    "zl",
    "zw"
   ]
  },
  {
   "id": "inferno-t-smoke-12",
   "map": "de_inferno",
   "side": "T",
   "type": "smoke",
   "click": "both",
   "move": "w",
   "action": "jump",
   "origin": "香蕉道",
   "target": "双架",
   "title": "警家连接烟",
   "oneline": "香蕉道→双架，W·双键·跳投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "香蕉道",
    "双架"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-11",
   "throw_badge": "W·双键·跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_inferno/inferno-t-smoke-12/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_inferno/inferno-t-smoke-12/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_inferno/inferno-t-smoke-12/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "jingjialianjieyan",
    "dao",
    "shuangjia"
   ],
   "pyi": [
    "jjljy",
    "d",
    "sj"
   ]
  },
  {
   "id": "mirage-ct-flash-01",
   "map": "de_mirage",
   "side": "CT",
   "type": "flash",
   "click": "both",
   "move": "run",
   "action": "direct",
   "origin": "B 连接",
   "target": "B 小",
   "title": "单人自助B小反刷",
   "oneline": "B 连接→B 小，跑双键",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "B 连接",
    "B 小"
   ],
   "tags": [
    "反清"
   ],
   "sets": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-17",
   "throw_badge": "跑双键",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_mirage/mirage-ct-flash-01/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_mirage/mirage-ct-flash-01/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_mirage/mirage-ct-flash-01/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "renzizhubxiaofan",
    "blianjie",
    "bxiao"
   ],
   "pyi": [
    "rzzbxf",
    "blj",
    "bx"
   ]
  },
  {
   "id": "mirage-ct-flash-03",
   "map": "de_mirage",
   "side": "CT",
   "type": "flash",
   "click": "lmb",
   "move": "run",
   "action": "direct",
   "origin": "警亭",
   "target": "A1/A 门",
   "title": "单人自助拱门反刷",
   "oneline": "警亭→A1/A 门，跑左键",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "警亭",
    "A1/A 门"
   ],
   "tags": [
    "反清",
    "控中路"
   ],
   "sets": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-17",
   "throw_badge": "跑左键",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_mirage/mirage-ct-flash-03/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_mirage/mirage-ct-flash-03/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_mirage/mirage-ct-flash-03/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "renzizhugongmenfan",
    "jing",
    "a1amen"
   ],
   "pyi": [
    "rzzgmf",
    "j",
    "a1am"
   ]
  },
  {
   "id": "mirage-ct-smoke-12",
   "map": "de_mirage",
   "side": "CT",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "jump",
   "origin": "狗洞",
   "target": "A 二楼 (宫殿)",
   "title": "警家补A2楼烟",
   "oneline": "狗洞→A 二楼 (宫殿)，左键跳投",
   "difficulty": "easy",
   "phase": [
    "retake"
   ],
   "status": "verified",
   "spots": [
    "狗洞",
    "A 二楼 (宫殿)"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-03",
   "throw_badge": "左键跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_mirage/mirage-ct-smoke-12/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_mirage/mirage-ct-smoke-12/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_mirage/mirage-ct-smoke-12/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "jingjiabua2louyan",
    "goudong",
    "aerlougongdian"
   ],
   "pyi": [
    "jjba2ly",
    "gd",
    "aelgd"
   ]
  },
  {
   "id": "mirage-t-flash-01",
   "map": "de_mirage",
   "side": "T",
   "type": "flash",
   "click": "lmb",
   "move": "walk-step",
   "action": "jump",
   "origin": "匪家",
   "target": "A 包点",
   "title": "A包高闪",
   "oneline": "匪家→A 包点，W一步·左键·跳投",
   "difficulty": "normal",
   "phase": [
    "execute"
   ],
   "status": "verified",
   "spots": [
    "匪家",
    "A 包点"
   ],
   "tags": [],
   "sets": [
    "A包爆弹三件套"
   ],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-03",
   "throw_badge": "W一步·左键·跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_mirage/mirage-t-flash-01/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_mirage/mirage-t-flash-01/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_mirage/mirage-t-flash-01/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "abaogaoshan",
    "feijia",
    "abaodian"
   ],
   "pyi": [
    "abgs",
    "fj",
    "abd"
   ]
  },
  {
   "id": "mirage-t-flash-03",
   "map": "de_mirage",
   "side": "T",
   "type": "flash",
   "click": "lmb",
   "move": "w",
   "action": "direct",
   "origin": "中远匪口",
   "target": "沙袋",
   "title": "沙袋闪",
   "oneline": "中远匪口→沙袋，W左键",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "中远匪口",
    "沙袋"
   ],
   "tags": [],
   "sets": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-03",
   "throw_badge": "W左键",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_mirage/mirage-t-flash-03/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_mirage/mirage-t-flash-03/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_mirage/mirage-t-flash-03/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "shadaishan",
    "zhongyuanfeikou",
    "shadai"
   ],
   "pyi": [
    "sds",
    "zyfk",
    "sd"
   ]
  },
  {
   "id": "mirage-t-flash-04",
   "map": "de_mirage",
   "side": "T",
   "type": "flash",
   "click": "rmb",
   "move": "run",
   "action": "direct",
   "origin": "中远匪口",
   "target": "B 小",
   "title": "单人自助上B小",
   "oneline": "中远匪口→B 小，跑右键",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "中远匪口",
    "B 小"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-17",
   "throw_badge": "跑右键",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_mirage/mirage-t-flash-04/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_mirage/mirage-t-flash-04/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_mirage/mirage-t-flash-04/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "renzizhushangbxiao",
    "zhongyuanfeikou",
    "bxiao"
   ],
   "pyi": [
    "rzzsbx",
    "zyfk",
    "bx"
   ]
  },
  {
   "id": "mirage-t-molotov-01",
   "map": "de_mirage",
   "side": "T",
   "type": "molotov",
   "click": "lmb",
   "move": "stand",
   "action": "direct",
   "origin": "A 二楼 (宫殿)",
   "target": "A 楼梯",
   "title": "有烟时A2楼丢A2下火",
   "oneline": "A 二楼 (宫殿)→A 楼梯，左键直投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "A 二楼 (宫殿)",
    "A 楼梯"
   ],
   "tags": [],
   "sets": [
    "A包爆弹三件套"
   ],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-03",
   "throw_badge": "左键直投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_mirage/mirage-t-molotov-01/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_mirage/mirage-t-molotov-01/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_mirage/mirage-t-molotov-01/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "youyanshia2loudiua2xiahuo",
    "aerlougongdian",
    "alouti"
   ],
   "pyi": [
    "yysa2lda2xh",
    "aelgd",
    "alt"
   ]
  },
  {
   "id": "mirage-t-molotov-02",
   "map": "de_mirage",
   "side": "T",
   "type": "molotov",
   "click": "lmb",
   "move": "stand",
   "action": "direct",
   "origin": "A 二楼 (宫殿)",
   "target": "A 楼梯",
   "title": "A2楼丢A2下火",
   "oneline": "A 二楼 (宫殿)→A 楼梯，左键直投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "A 二楼 (宫殿)",
    "A 楼梯"
   ],
   "tags": [],
   "sets": [
    "A包爆弹三件套"
   ],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-03",
   "throw_badge": "左键直投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_mirage/mirage-t-molotov-02/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_mirage/mirage-t-molotov-02/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_mirage/mirage-t-molotov-02/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "a2loudiua2xiahuo",
    "aerlougongdian",
    "alouti"
   ],
   "pyi": [
    "a2lda2xh",
    "aelgd",
    "alt"
   ]
  },
  {
   "id": "mirage-t-molotov-04",
   "map": "de_mirage",
   "side": "T",
   "type": "molotov",
   "click": "lmb",
   "move": "w",
   "action": "direct",
   "origin": "中远匪口",
   "target": "拱门",
   "title": "拱门火",
   "oneline": "中远匪口→拱门，W左键",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "中远匪口",
    "拱门"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-03",
   "throw_badge": "W左键",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_mirage/mirage-t-molotov-04/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_mirage/mirage-t-molotov-04/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_mirage/mirage-t-molotov-04/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "gongmenhuo",
    "zhongyuanfeikou",
    "gongmen"
   ],
   "pyi": [
    "gmh",
    "zyfk",
    "gm"
   ]
  },
  {
   "id": "mirage-t-molotov-05",
   "map": "de_mirage",
   "side": "T",
   "type": "molotov",
   "click": "lmb",
   "move": "walk-step",
   "action": "direct",
   "origin": "中远匪口",
   "target": "中路",
   "title": "单人自助上拱门",
   "oneline": "中远匪口→中路，W一步左键",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "中远匪口",
    "中路"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-17",
   "throw_badge": "W一步左键",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_mirage/mirage-t-molotov-05/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_mirage/mirage-t-molotov-05/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_mirage/mirage-t-molotov-05/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "renzizhushanggongmen",
    "zhongyuanfeikou",
    "zhonglu"
   ],
   "pyi": [
    "rzzsgm",
    "zyfk",
    "zl"
   ]
  },
  {
   "id": "mirage-t-smoke-01",
   "map": "de_mirage",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "direct",
   "origin": "匪家",
   "target": "中远匪口",
   "title": "匪口过点烟",
   "oneline": "匪家→中远匪口，左键直投",
   "difficulty": "easy",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "匪家",
    "中远匪口"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-03",
   "throw_badge": "左键直投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_mirage/mirage-t-smoke-01/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_mirage/mirage-t-smoke-01/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_mirage/mirage-t-smoke-01/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "feikouguodianyan",
    "feijia",
    "zhongyuanfeikou"
   ],
   "pyi": [
    "fkgdy",
    "fj",
    "zyfk"
   ]
  },
  {
   "id": "mirage-t-smoke-02",
   "map": "de_mirage",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "jump",
   "origin": "匪家",
   "target": "拱门",
   "title": "donk-拱门满封烟",
   "oneline": "匪家→拱门，左键跳投",
   "difficulty": "easy",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "匪家",
    "拱门"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-03",
   "throw_badge": "左键跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_mirage/mirage-t-smoke-02/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_mirage/mirage-t-smoke-02/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_mirage/mirage-t-smoke-02/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "donkgongmenmanfengyan",
    "feijia",
    "gongmen"
   ],
   "pyi": [
    "donkgmmfy",
    "fj",
    "gm"
   ]
  },
  {
   "id": "mirage-t-smoke-03",
   "map": "de_mirage",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "w",
   "action": "jump",
   "origin": "匪家",
   "target": "VIP",
   "title": "snax-VIP慢烟",
   "oneline": "匪家→VIP，W·左键·跳投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "匪家",
    "VIP"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-03",
   "throw_badge": "W·左键·跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_mirage/mirage-t-smoke-03/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_mirage/mirage-t-smoke-03/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_mirage/mirage-t-smoke-03/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "snaxvipmanyan",
    "feijia",
    "vip"
   ],
   "pyi": [
    "snaxvipmy",
    "fj",
    "vip"
   ]
  },
  {
   "id": "mirage-t-smoke-04",
   "map": "de_mirage",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "direct",
   "origin": "屋檐",
   "target": "跳台下",
   "title": "Aleksib-跳台下烟",
   "oneline": "屋檐→跳台下，左键直投",
   "difficulty": "easy",
   "phase": [
    "execute"
   ],
   "status": "verified",
   "spots": [
    "屋檐",
    "跳台下"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-03",
   "throw_badge": "左键直投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_mirage/mirage-t-smoke-04/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_mirage/mirage-t-smoke-04/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_mirage/mirage-t-smoke-04/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "aleksibtiaotaixiayan",
    "wuyan",
    "tiaotaixia"
   ],
   "pyi": [
    "aleksibttxy",
    "wy",
    "ttx"
   ]
  },
  {
   "id": "mirage-t-smoke-05",
   "map": "de_mirage",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "crouch",
   "action": "direct",
   "origin": "沙袋",
   "target": "VIP",
   "title": "Jame-沙袋补VIP烟",
   "oneline": "沙袋→VIP，蹲下左键",
   "difficulty": "easy",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "沙袋",
    "VIP"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-03",
   "throw_badge": "蹲下左键",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_mirage/mirage-t-smoke-05/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_mirage/mirage-t-smoke-05/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_mirage/mirage-t-smoke-05/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "jameshadaibuvipyan",
    "shadai",
    "vip"
   ],
   "pyi": [
    "jamesdbvipy",
    "sd",
    "vip"
   ]
  },
  {
   "id": "mirage-t-smoke-06",
   "map": "de_mirage",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "direct",
   "origin": "沙袋",
   "target": "Jungle",
   "title": "G2-jungle烟",
   "oneline": "沙袋→Jungle，左键直投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "沙袋",
    "Jungle"
   ],
   "tags": [],
   "sets": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-03",
   "throw_badge": "左键直投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_mirage/mirage-t-smoke-06/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_mirage/mirage-t-smoke-06/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_mirage/mirage-t-smoke-06/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "g2jungleyan",
    "shadai",
    "jungle"
   ],
   "pyi": [
    "g2jungley",
    "sd",
    "jungle"
   ]
  },
  {
   "id": "mirage-t-smoke-07",
   "map": "de_mirage",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "direct",
   "origin": "沙袋",
   "target": [
    "拱门",
    "跳台下"
   ],
   "title": "沙袋补拱门内侧烟",
   "oneline": "沙袋→拱门 / 跳台下，左键直投",
   "difficulty": "easy",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "沙袋",
    "拱门",
    "跳台下"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-03",
   "throw_badge": "左键直投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_mirage/mirage-t-smoke-07/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_mirage/mirage-t-smoke-07/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_mirage/mirage-t-smoke-07/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "shadaibugongmenneiceyan",
    "shadai",
    "gongmentiaotaixia"
   ],
   "pyi": [
    "sdbgmncy",
    "sd",
    "gmttx"
   ]
  },
  {
   "id": "mirage-t-smoke-08",
   "map": "de_mirage",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "jump",
   "origin": "匪二楼",
   "target": "VIP",
   "title": "VP-匪楼梯补VIP烟",
   "oneline": "匪二楼→VIP，左键跳投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "匪二楼",
    "VIP"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-03",
   "throw_badge": "左键跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_mirage/mirage-t-smoke-08/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_mirage/mirage-t-smoke-08/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_mirage/mirage-t-smoke-08/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "vpfeiloutibuvipyan",
    "feierlou",
    "vip"
   ],
   "pyi": [
    "vpfltbvipy",
    "fel",
    "vip"
   ]
  },
  {
   "id": "mirage-t-smoke-09",
   "map": "de_mirage",
   "side": "T",
   "type": "smoke",
   "click": "both",
   "move": "crouch",
   "action": "jump",
   "origin": "匪二楼",
   "target": "B 连接",
   "title": "黑豹-b小烟",
   "oneline": "匪二楼→B 连接，蹲下·双键·跳投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "匪二楼",
    "B 连接"
   ],
   "tags": [],
   "related": [],
   "pin_targets": {
    "B 连接": [
     0.4304,
     0.2952
    ]
   },
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-03",
   "throw_badge": "蹲下·双键·跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_mirage/mirage-t-smoke-09/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_mirage/mirage-t-smoke-09/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_mirage/mirage-t-smoke-09/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "heibaobxiaoyan",
    "feierlou",
    "blianjie"
   ],
   "pyi": [
    "hbbxy",
    "fel",
    "blj"
   ]
  },
  {
   "id": "mirage-t-smoke-10",
   "map": "de_mirage",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "w",
   "action": "jump",
   "origin": "匪二楼",
   "target": [
    "超市门",
    "超市"
   ],
   "title": "B超市烟",
   "oneline": "匪二楼→超市门 / 超市，W·左键·跳投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "匪二楼",
    "超市门",
    "超市"
   ],
   "tags": [],
   "related": [],
   "pin_targets": {
    "超市门": [
     0.1717,
     0.3916
    ],
    "超市": [
     0.2506,
     0.3994
    ]
   },
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-03",
   "throw_badge": "W·左键·跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_mirage/mirage-t-smoke-10/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_mirage/mirage-t-smoke-10/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_mirage/mirage-t-smoke-10/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "bchaoshiyan",
    "feierlou",
    "chaoshimenchaoshi"
   ],
   "pyi": [
    "bcsy",
    "fel",
    "csmcs"
   ]
  },
  {
   "id": "mirage-t-smoke-11",
   "map": "de_mirage",
   "side": "T",
   "type": "smoke",
   "click": "both",
   "move": "stand",
   "action": "direct",
   "origin": "下水道",
   "target": "VIP",
   "title": "IM-下水道补VIP烟",
   "oneline": "下水道→VIP，双键直投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "下水道",
    "VIP"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-03",
   "throw_badge": "双键直投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_mirage/mirage-t-smoke-11/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_mirage/mirage-t-smoke-11/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_mirage/mirage-t-smoke-11/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "imxiashuidaobuvipyan",
    "xiashuidao",
    "vip"
   ],
   "pyi": [
    "imxsdbvipy",
    "xsd",
    "vip"
   ]
  },
  {
   "id": "mirage-t-smoke-13",
   "map": "de_mirage",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "w",
   "action": "jump",
   "origin": "匪家",
   "target": "VIP",
   "title": "T出生点VIP烟",
   "oneline": "匪家→VIP，W·左键·跳投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "匪家",
    "VIP"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-03",
   "throw_badge": "W·左键·跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_mirage/mirage-t-smoke-13/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_mirage/mirage-t-smoke-13/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_mirage/mirage-t-smoke-13/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "tchushengdianvipyan",
    "feijia",
    "vip"
   ],
   "pyi": [
    "tcsdvipy",
    "fj",
    "vip"
   ]
  },
  {
   "id": "mirage-t-smoke-14",
   "map": "de_mirage",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "walk-step",
   "action": "direct",
   "origin": "中路",
   "target": [
    "跳台下",
    "拱门"
   ],
   "title": "中路拱门内侧烟火",
   "oneline": "中路→跳台下 / 拱门，W一步左键",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "中路",
    "跳台下",
    "拱门"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-03",
   "throw_badge": "W一步左键",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_mirage/mirage-t-smoke-14/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_mirage/mirage-t-smoke-14/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_mirage/mirage-t-smoke-14/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "zhonglugongmenneiceyanhuo",
    "zhonglu",
    "tiaotaixiagongmen"
   ],
   "pyi": [
    "zlgmncyh",
    "zl",
    "ttxgm"
   ]
  },
  {
   "id": "mirage-t-smoke-15",
   "map": "de_mirage",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "jump",
   "origin": "匪家",
   "target": [
    "跳台下",
    "拱门"
   ],
   "title": "A外匪家拱门内侧烟",
   "oneline": "匪家→跳台下 / 拱门，左键跳投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "匪家",
    "跳台下",
    "拱门"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-03",
   "throw_badge": "左键跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_mirage/mirage-t-smoke-15/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_mirage/mirage-t-smoke-15/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_mirage/mirage-t-smoke-15/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "awaifeijiagongmenneiceyan",
    "feijia",
    "tiaotaixiagongmen"
   ],
   "pyi": [
    "awfjgmncy",
    "fj",
    "ttxgm"
   ]
  },
  {
   "id": "mirage-t-smoke-16",
   "map": "de_mirage",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "jump",
   "origin": "拱门",
   "target": "跳台下",
   "title": "K3-跳台上下烟",
   "oneline": "拱门→跳台下 / 拱门，左键跳投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "跳台下"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-03",
   "throw_badge": "左键跳投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_mirage/mirage-t-smoke-16/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_mirage/mirage-t-smoke-16/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_mirage/mirage-t-smoke-16/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "k3tiaotaishangxiayan",
    "gongmen",
    "tiaotaixia"
   ],
   "pyi": [
    "k3ttsxy",
    "gm",
    "ttx"
   ]
  },
  {
   "id": "mirage-t-smoke-17",
   "map": "de_mirage",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "direct",
   "origin": "屋檐",
   "target": [
    "跳台",
    "跳台下"
   ],
   "title": "apex-跳台上下烟",
   "oneline": "屋檐→跳台 / 跳台下，左键直投",
   "difficulty": "normal",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "屋檐",
    "跳台",
    "跳台下"
   ],
   "tags": [],
   "sets": [
    "A包爆弹三件套"
   ],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-03",
   "throw_badge": "左键直投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_mirage/mirage-t-smoke-17/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_mirage/mirage-t-smoke-17/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_mirage/mirage-t-smoke-17/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "apextiaotaishangxiayan",
    "wuyan",
    "tiaotaitiaotaixia"
   ],
   "pyi": [
    "apexttsxy",
    "wy",
    "ttttx"
   ]
  },
  {
   "id": "mirage-t-smoke-18",
   "map": "de_mirage",
   "side": "T",
   "type": "smoke",
   "click": "lmb",
   "move": "stand",
   "action": "direct",
   "origin": "拱门",
   "target": [
    "拱门",
    "Jungle"
   ],
   "title": "拱门内侧丢jungle烟",
   "oneline": "拱门→跳台下 / 拱门，左键直投",
   "difficulty": "easy",
   "phase": [
    "default"
   ],
   "status": "verified",
   "spots": [
    "拱门",
    "Jungle"
   ],
   "tags": [],
   "related": [],
   "source": {
    "kind": "self",
    "creator": "自己"
   },
   "checked": "2026-10-03",
   "throw_badge": "左键直投",
   "images": [
    {
     "slot": "1-stand",
     "label": "站位",
     "path": "media/de_mirage/mirage-t-smoke-18/1-stand.jpg"
    },
    {
     "slot": "2-aim",
     "label": "瞄点",
     "path": "media/de_mirage/mirage-t-smoke-18/2-aim.jpg"
    },
    {
     "slot": "4-result",
     "label": "落点&效果",
     "path": "media/de_mirage/mirage-t-smoke-18/4-result.jpg"
    }
   ],
   "missing": [],
   "notes": "",
   "pyf": [
    "gongmenneicediujungleyan",
    "gongmen",
    "gongmenjungle"
   ],
   "pyi": [
    "gmncdjungley",
    "gm",
    "gmjungle"
   ]
  }
 ],
 "tactics": [
  {
   "id": "ancient-default",
   "map": "de_ancient",
   "side": "both",
   "title": "打法要点（大白话版）",
   "window": "整局",
   "status": "draft",
   "uses": [],
   "sections": [
    {
     "title": "中路最重要（匪家）",
     "lines": [
      "- 这图抢中路比上包点还优先：至少 2 个人带着道具一起去（凹槽烟+中门烟+火烧甜甜圈），千万别单挑",
      "- 抢下来中路必须用起来：要么从中路（甜甜圈方向）和 A 大两路同时上 A，要么假装打中路骗警家去支援，实际转 B"
     ]
    },
    {
     "title": "打 A 的要点",
     "lines": [
      "- 标准节奏：烟封甜甜圈和 A 包点里侧的架点位（A平台/三箱一带）、火烧小黑屋和 A平台底下、闪光跟上再进",
      "- A 大和 A 厅两面一起压，别单方向硬啃"
     ]
    },
    {
     "title": "打 B 的要点",
     "lines": [
      "- 打 B 前先控制住小黑屋（B 后面的洞）和 B 门外，否则进点就是被两面打",
      "- B 门窄，进点靠闪光开路、拉开距离一个一个补枪，别全挤在门口"
     ]
    },
    {
     "title": "警家怎么守",
     "lines": [
      "- 五个人分：中路拖时间 1 个、甜甜圈位 1 个（全图最关键的位置，守住中路通 A 的连接）、A 大 1 个、B 点 1 个、小黑屋方向支援 1 个",
      "- 纪律：交叉火力互相照应、别为了探情报白白送死、确认了对面真来了再叫人支援",
      "- 守不住就留着道具打回防，别把火和闪全扔了然后裸枪回防；买东西优先买火"
     ]
    }
   ]
  },
  {
   "id": "anubis-default",
   "map": "de_anubis",
   "side": "both",
   "title": "打法要点（大白话版）",
   "window": "整局",
   "status": "draft",
   "uses": [],
   "sections": [
    {
     "title": "中路定胜负（匪家）",
     "lines": [
      "- 这图匪家占便宜（胜率约 57%），但不管打 A 还是打 B，没中路都很难打——中路必抢",
      "- 开局分人：2 个抢中路和 A 水下、1 个走 A 门、1-2 个走 B 通方向、剩 1 个机动",
      "- 这图特别费道具：中路拉扯的时候省着扔，别把上包点的家底提前败光"
     ]
    },
    {
     "title": "打 B 的经典套路（两面包夹）",
     "lines": [
      "- 铁规矩：B 通一面和 B 连接一面，两边没都准备好之前谁也别先动手——一侧先冲就是送",
      "- 打 B 前把 B 门外和一柱/二柱这些贴脸位置清干净"
     ]
    },
    {
     "title": "打 A 的要点",
     "lines": [
      "- 拿下中路和 A 水下后，从 A 门和中路连接口两面进 A 包点",
      "- 烟要封 A2/天堂（上面必有人）和警家方向，火烧喷泉/圆柱附近"
     ]
    },
    {
     "title": "警家怎么守",
     "lines": [
      "- 常见分法：A 点 1 个、中路 1 个、B 点 2 个（其中一个兼顾水下），或再加 1 个自由人",
      "- 守 A 的活着报点最重要，别硬拼；中路一丢必须马上喊——喊晚了 B 就没了",
      "- 水下别白给：CT 水下丢了回防就是噩梦，开局要用道具争一下水下",
      "- 最后 30 秒别乱冲，信息比人头重要；下包后站开些，别挤在一个点被一颗雷全炸了"
     ]
    }
   ]
  },
  {
   "id": "dust2-default",
   "map": "de_dust2",
   "side": "T",
   "title": "打法要点（大白话版）",
   "window": "整局",
   "status": "draft",
   "uses": [
    "dust2-t-smoke-xbox",
    "dust2-t-smoke-mid-door",
    "dust2-t-smoke-ct",
    "dust2-t-smoke-b-door",
    "dust2-ct-smoke-b-door-retake"
   ],
   "timeline": [
    {
     "t": "1:53",
     "role": 1,
     "text": 123,
     "use": "dust2-t-smoke-a-prot"
    }
   ],
   "sections": [
    {
     "title": "开局怎么站（匪家）",
     "lines": [
      "- 标准分法：1 人看 A 大、1 个狙在中路只管架枪、1 人中路帮忙、2 个人进 B 洞",
      "- 包袱（炸弹）放在中路附近，别背着走——随时能改打 A 还是 B",
      "- 中路别空身硬冲：先扔中门烟挡住对面狙击，再派一人拿叉箱，其他人跟上"
     ]
    },
    {
     "title": "打 A 的要点",
     "lines": [
      "- 两面一起打：A 大一面、A 小一面，同时动手",
      "- 烟要封住「A 包点到警家」的过点和警家方向，火烧鹅位/狙位和蓝车，把蹲坑的人都赶出来",
      "- 清完 A 斜坡再下包，别留人在背后"
     ]
    },
    {
     "title": "打 B 的要点",
     "lines": [
      "- 最稳的打法是两面包：B 洞里顶着 B 门，同时从中路破中门/狗洞过来帮忙",
      "- 只从 B 洞一路冲就要快，冲不动马上撤，别在洞里耗"
     ]
    },
    {
     "title": "警家怎么守",
     "lines": [
      "- 常见分法：1 人 A 大、1 人 A 小和 A 包点、1 人中路看情况报点、1 人守 B、1 人到处补位",
      "- 守 B 的人别被假动静骗走，B 一空就难回来了",
      "- 中路的任务主要是「看和报」，不用非抢下来；听到动静先确认再支援"
     ]
    }
   ]
  },
  {
   "id": "inferno-default",
   "map": "de_inferno",
   "side": "both",
   "title": "打法要点（大白话版）",
   "window": "整局",
   "status": "draft",
   "uses": [],
   "sections": [
    {
     "title": "开局怎么站（匪家）",
     "lines": [
      "- 兵分三路看情况：香蕉道、中路、匪二楼（公寓）各去人；香蕉道归谁很大程度看出身位置，出生靠前的先到就占",
      "- 抢香蕉道的标准动作：第一个上去的人先扔火逼退警家方向的枪，手里再捏一颗烟准备扑对面的反烧火"
     ]
    },
    {
     "title": "打 B 的要点",
     "lines": [
      "- 最常用是两面包：先派 1-2 人悄悄蹲在木板/车位附近，大部队压 A 制造动静，再回头封拱门烟一起进 B",
      "- 进 B 前火烧 B 死点和三箱（人最爱蹲的两个角落），闪光跟上",
      "- 顺路把厨房方向的拐角清一遍，防止被打屁股"
     ]
    },
    {
     "title": "打 A 的要点",
     "lines": [
      "- 先拿下匪二楼（公寓）和中路，然后：书房/拱门方向封烟断警家支援、火烧大坑（坑里必有人）、从中路高台往包点丢闪",
      "- 警家方向烟不够就再补一颗，一定把支援枪线断干净"
     ]
    },
    {
     "title": "警家怎么守",
     "lines": [
      "- 常见 2+3：B 点 2 个人够了（只有香蕉道一条路），A 点 3 个",
      "- 守 B 的一明一暗：一个架枪报点，一个躲起来打遭遇；常蹲位是棺材、B 死点、三箱后",
      "- B 点一旦丢了几乎回不来——宁可开局多留一个人守 B",
      "- 没钱的局可以全堆一个点，或者蹲在中路打偷袭"
     ]
    }
   ]
  },
  {
   "id": "mirage-default",
   "map": "de_mirage",
   "side": "both",
   "title": "打法要点（大白话版）",
   "window": "整局",
   "status": "draft",
   "uses": [
    "mirage-t-smoke-01",
    "mirage-t-smoke-02",
    "mirage-t-smoke-13"
   ],
   "sections": [
    {
     "title": "开局怎么站（匪家）",
     "lines": [
      "- 1-2 人去 A 斜坡和宫殿（A 二楼）方向施压、1 人进匪二楼（公寓）、剩下的人抢中路",
      "- 先扔窗户烟挡住警家狙，中路才有得打；中路通了以后，去 A 走连接口、去 B 走狗洞都方便",
      "- A 点能进的路多（斜坡、宫殿、连接口、Jungle、警家五个口），B 点只有三条路，所以这图大多围绕 A 打"
     ]
    },
    {
     "title": "打 A 的要点",
     "lines": [
      "- 三颗烟缺一颗都别上：A 楼梯烟、警家烟、Jungle（跳台边）烟——没烟硬上等于白给",
      "- 打之前扔几颗瞬爆闪（弹出就炸那种），宫殿和斜坡两边一起进",
      "- 得留一个人盯着跳台下和短箱，防止被人绕后"
     ]
    },
    {
     "title": "打 B 的要点",
     "lines": [
      "- 超市窗口烟和超市门烟是同一个位置连着扔的，烟一落立刻进，慢了烟就散了",
      "- 从匪二楼（公寓）冲 B 不要停步，停下来就是活靶子",
      "- 两面包夹时先抢楼下拐角，把公寓和 B 小都看住，厨房方向留人防绕后"
     ]
    },
    {
     "title": "警家怎么守",
     "lines": [
      "- 常见站位 2-1-2 或 3-1-1（A 多放人）；A 点要同时看住斜坡和宫殿两个口",
      "- 守 A 的要站在烟「外面」打，被烟罩住就只能等队友回防",
      "- 中路的狙守在窗户位最好配一个人看下水道；守 B 的蹲在公寓里别乱动，公寓的木墙可以穿枪"
     ]
    }
   ]
  },
  {
   "id": "nuke-default",
   "map": "de_nuke",
   "side": "both",
   "title": "打法要点（大白话版）",
   "window": "整局",
   "status": "draft",
   "uses": [],
   "sections": [
    {
     "title": "外场是心脏（匪家）",
     "lines": [
      "- 谁控制外场谁说了算：先占匪厅和 K1 大厅，然后用两颗烟在外场拉起烟墙，警家的人就被隔开了",
      "- 烟墙拉起来后二选一：从铁门房方向压 B 小道（下层），或者假装打外场、人偷偷回匪厅改打 A（上层）",
      "- 新手最少要学会的 4 颗：外场烟墙 2 颗 + A 包点（三楼方向）烟 1 颗 + B 斜坡烟 1 颗，就够打所有基本套路了"
     ]
    },
    {
     "title": "打 A（上层）",
     "lines": [
      "- 烟封住三楼（天上）和正门的枪线，然后黄房和响门（地图上的死门）两个门同时进",
      "- 进门前闪光先扔，千万别在门口犹豫——犹豫就会白给"
     ]
    },
    {
     "title": "打 B（下层）",
     "lines": [
      "- 先闪光逼退 B 斜坡守着的人，再烟斜坡，清完双门附近下包",
      "- 下完包人散开站：管道外、控制室、K2/洗手间方向都有人看"
     ]
    },
    {
     "title": "警家怎么守",
     "lines": [
      "- 常见分法：外场 1 个、B 斜坡 1 个、A 上层 2 个、下层/自由人 1 个",
      "- 最大的错误：听到一个动静就把 A 上层两个人全调走——先确认再动",
      "- 守外场的人是全队报点的：看见人马上喊方向和数量，拖住就行不用硬拼",
      "- 对面拿下外场后要小心他们假装打 B 其实回头上 A"
     ]
    }
   ]
  },
  {
   "id": "train-default",
   "map": "de_train",
   "side": "both",
   "title": "打法要点（大白话版）",
   "window": "整局",
   "status": "draft",
   "uses": [],
   "sections": [
    {
     "title": "这图长什么样（2024 年底新版）",
     "lines": [
      "- 两层结构：A 包点在外场（露天，一道到六道是几条铁道口），B 包点在内场（室内低处）",
      "- 老玩家常说的几个位置对照：A 区连接口（老叫法 Popdog）在连接台下/警连接一带，绿通就是 Ivy 方向，警连接就是中路的连接口",
      "- 整体对警家有利（类似 Nuke），匪家想赢必须靠道具和配合"
     ]
    },
    {
     "title": "三个必抢的位置",
     "lines": [
      "- A 区连接口、绿通方向、警连接——丢掉警连接，警家支援就只能绕远路",
      "- 匪家千万别裸冲 A 区连接口和绿通，这两个口必有人架枪，先烟先火再进"
     ]
    },
    {
     "title": "怎么分人",
     "lines": [
      "- 警家常见站法：A 外场的 A 口、连接口、绿通、中连接各 1 人，B 内场 1 个人守（B 好回防，活着报点就行）",
      "- 匪家常见分法：2 人 A 口、1 人绿通、1 人看连接口、1 个自由人到处找机会"
     ]
    },
    {
     "title": "打 B（内场）",
     "lines": [
      "- 从 B 斜坡/低坡方向进，上下两层一起施压：上层（B2 台上）慢打架枪，下层快攻",
      "- 注意 B 包点里侧新加的小屋，常规烟挡不住那的角度，要多备一颗烟或换条路进"
     ]
    }
   ]
  }
 ],
 "callouts": {
  "de_mirage": [
   {
    "name": "匪家",
    "search": [
     "匪家",
     "T 出生点",
     "t-spawn"
    ],
    "u": 0.87,
    "v": 0.375,
    "pyf": [
     "feijia",
     "feijia",
     "tchushengdian",
     "tspawn"
    ],
    "pyi": [
     "fj",
     "fj",
     "tcsd",
     "tspawn"
    ]
   },
   {
    "name": "B 包点",
    "search": [
     "B 包点",
     "B点"
    ],
    "u": 0.235,
    "v": 0.3,
    "pyf": [
     "bbaodian",
     "bbaodian",
     "bdian"
    ],
    "pyi": [
     "bbd",
     "bbd",
     "bd"
    ]
   },
   {
    "name": "超市窗口",
    "search": [
     "超市窗口"
    ],
    "u": 0.27,
    "v": 0.415,
    "pyf": [
     "chaoshikou",
     "chaoshikou"
    ],
    "pyi": [
     "csk",
     "csk"
    ]
   },
   {
    "name": "安全包位",
    "search": [
     "安全包位",
     "安全点"
    ],
    "u": 0.155,
    "v": 0.315,
    "pyf": [
     "anquanbaowei",
     "anquanbaowei",
     "anquandian"
    ],
    "pyi": [
     "aqbw",
     "aqbw",
     "aqd"
    ]
   },
   {
    "name": "B 小包位",
    "search": [
     "B小包位",
     "小包位"
    ],
    "u": 0.23,
    "v": 0.272,
    "pyf": [
     "bxiaobaowei",
     "bxiaobaowei",
     "xiaobaowei"
    ],
    "pyi": [
     "bxbw",
     "bxbw",
     "xbw"
    ]
   },
   {
    "name": "二楼包位",
    "search": [
     "二楼包位",
     "上包位"
    ],
    "u": 0.23,
    "v": 0.245,
    "pyf": [
     "erloubaowei",
     "erloubaowei",
     "shangbaowei"
    ],
    "pyi": [
     "elbw",
     "elbw",
     "sbw"
    ]
   },
   {
    "name": "匪二楼",
    "search": [
     "匪二楼"
    ],
    "u": 0.655,
    "v": 0.155,
    "pyf": [
     "feierlou",
     "feierlou"
    ],
    "pyi": [
     "fel",
     "fel"
    ]
   },
   {
    "name": "B 二楼",
    "search": [
     "B 二楼",
     "B2楼",
     "公寓"
    ],
    "u": 0.315,
    "v": 0.165,
    "pyf": [
     "berlou",
     "berlou",
     "b2lou",
     ""
    ],
    "pyi": [
     "bel",
     "bel",
     "b2l",
     ""
    ]
   },
   {
    "name": "阳台",
    "search": [
     "阳台"
    ],
    "u": 0.235,
    "v": 0.17,
    "pyf": [
     "tai",
     "tai"
    ],
    "pyi": [
     "t",
     "t"
    ]
   },
   {
    "name": "白车",
    "search": [
     "白车",
     "面包车"
    ],
    "u": 0.185,
    "v": 0.19,
    "pyf": [
     "baiche",
     "baiche",
     "mianbaoche"
    ],
    "pyi": [
     "bc",
     "bc",
     "mbc"
    ]
   },
   {
    "name": "沙发",
    "search": [
     "沙发"
    ],
    "u": 0.14,
    "v": 0.28,
    "pyf": [
     "sha",
     "sha"
    ],
    "pyi": [
     "s",
     "s"
    ]
   },
   {
    "name": "外围",
    "search": [
     "外围"
    ],
    "u": 0.24,
    "v": 0.36,
    "pyf": [
     "wai",
     "wai"
    ],
    "pyi": [
     "w",
     "w"
    ]
   },
   {
    "name": "窗户",
    "search": [
     "窗户",
     "窗口"
    ],
    "u": 0.2867,
    "v": 0.3908,
    "pyf": [
     "hu",
     "hu",
     "kou"
    ],
    "pyi": [
     "h",
     "h",
     "k"
    ]
   },
   {
    "name": "超市",
    "search": [
     "超市",
     "market"
    ],
    "u": 0.2234,
    "v": 0.4314,
    "pyf": [
     "chaoshi",
     "chaoshi",
     "market"
    ],
    "pyi": [
     "cs",
     "cs",
     "market"
    ]
   },
   {
    "name": "收银台",
    "search": [
     "收银台"
    ],
    "u": 0.295,
    "v": 0.445,
    "pyf": [
     "tai",
     "tai"
    ],
    "pyi": [
     "t",
     "t"
    ]
   },
   {
    "name": "货柜",
    "search": [
     "货柜"
    ],
    "u": 0.132,
    "v": 0.4525,
    "pyf": [
     "",
     ""
    ],
    "pyi": [
     "",
     ""
    ]
   },
   {
    "name": "厨房",
    "search": [
     "厨房"
    ],
    "u": 0.41,
    "v": 0.26,
    "pyf": [
     "fang",
     "fang"
    ],
    "pyi": [
     "f",
     "f"
    ]
   },
   {
    "name": "下水道楼梯",
    "search": [
     "下水道楼梯"
    ],
    "u": 0.51,
    "v": 0.26,
    "pyf": [
     "xiashuidaolouti",
     "xiashuidaolouti"
    ],
    "pyi": [
     "xsdlt",
     "xsdlt"
    ]
   },
   {
    "name": "B 连接",
    "search": [
     "B 连接",
     "b连接"
    ],
    "u": 0.41,
    "v": 0.3,
    "pyf": [
     "blianjie",
     "blianjie",
     "blianjie"
    ],
    "pyi": [
     "blj",
     "blj",
     "blj"
    ]
   },
   {
    "name": "小黑屋",
    "search": [
     "小黑屋"
    ],
    "u": 0.4,
    "v": 0.36,
    "pyf": [
     "xiaoheiwu",
     "xiaoheiwu"
    ],
    "pyi": [
     "xhw",
     "xhw"
    ]
   },
   {
    "name": "B 小",
    "search": [
     "B 小",
     "b短"
    ],
    "u": 0.475,
    "v": 0.39,
    "pyf": [
     "bxiao",
     "bxiao",
     "b"
    ],
    "pyi": [
     "bx",
     "bx",
     "b"
    ]
   },
   {
    "name": "下水道",
    "search": [
     "下水道",
     "underpass"
    ],
    "u": 0.425,
    "v": 0.43,
    "pyf": [
     "xiashuidao",
     "xiashuidao",
     "underpass"
    ],
    "pyi": [
     "xsd",
     "xsd",
     "underpass"
    ]
   },
   {
    "name": "中远匪口",
    "search": [
     "中远",
     "匪口"
    ],
    "u": 0.7,
    "v": 0.37,
    "pyf": [
     "zhongyuanfeikou",
     "zhongyuan",
     "feikou"
    ],
    "pyi": [
     "zyfk",
     "zy",
     "fk"
    ]
   },
   {
    "name": "VIP",
    "search": [
     "VIP",
     "vip",
     "窗房"
    ],
    "u": 0.375,
    "v": 0.46,
    "pyf": [
     "vip",
     "vip",
     "vip",
     "fang"
    ],
    "pyi": [
     "vip",
     "vip",
     "vip",
     "f"
    ]
   },
   {
    "name": "中路",
    "search": [
     "中路",
     "mid"
    ],
    "u": 0.555,
    "v": 0.47,
    "pyf": [
     "zhonglu",
     "zhonglu",
     "mid"
    ],
    "pyi": [
     "zl",
     "zl",
     "mid"
    ]
   },
   {
    "name": "沙袋",
    "search": [
     "沙袋",
     "草车"
    ],
    "u": 0.71,
    "v": 0.47,
    "pyf": [
     "shadai",
     "shadai",
     "che"
    ],
    "pyi": [
     "sd",
     "sd",
     "c"
    ]
   },
   {
    "name": "狗洞",
    "search": [
     "狗洞"
    ],
    "u": 0.3633,
    "v": 0.5143,
    "pyf": [
     "goudong",
     "goudong"
    ],
    "pyi": [
     "gd",
     "gd"
    ]
   },
   {
    "name": "拱门",
    "search": [
     "拱门",
     "arch"
    ],
    "u": 0.5,
    "v": 0.545,
    "pyf": [
     "gongmen",
     "gongmen",
     "arch"
    ],
    "pyi": [
     "gm",
     "gm",
     "arch"
    ]
   },
   {
    "name": "L 位",
    "search": [
     "L 位",
     "L位"
    ],
    "u": 0.565,
    "v": 0.505,
    "pyf": [
     "lwei",
     "lwei",
     "lwei"
    ],
    "pyi": [
     "lw",
     "lw",
     "lw"
    ]
   },
   {
    "name": "跳台楼梯",
    "search": [
     "跳台楼梯"
    ],
    "u": 0.5266,
    "v": 0.5939,
    "pyf": [
     "tiaotailouti",
     "tiaotailouti"
    ],
    "pyi": [
     "ttlt",
     "ttlt"
    ]
   },
   {
    "name": "连接口",
    "search": [
     "连接口",
     "链接",
     "connector"
    ],
    "u": 0.6242,
    "v": 0.5854,
    "pyf": [
     "lianjiekou",
     "lianjiekou",
     "lianjie",
     "connector"
    ],
    "pyi": [
     "ljk",
     "ljk",
     "lj",
     "connector"
    ]
   },
   {
    "name": "Jungle",
    "search": [
     "jungle",
     "Jungle"
    ],
    "u": 0.4078,
    "v": 0.601,
    "pyf": [
     "jungle",
     "jungle",
     "jungle"
    ],
    "pyi": [
     "jungle",
     "jungle",
     "jungle"
    ]
   },
   {
    "name": "跳台下",
    "search": [
     "跳台下"
    ],
    "u": 0.48,
    "v": 0.62,
    "pyf": [
     "tiaotaixia",
     "tiaotaixia"
    ],
    "pyi": [
     "ttx",
     "ttx"
    ]
   },
   {
    "name": "跳台",
    "search": [
     "跳台"
    ],
    "u": 0.515,
    "v": 0.645,
    "pyf": [
     "tiaotai",
     "tiaotai"
    ],
    "pyi": [
     "tt",
     "tt"
    ]
   },
   {
    "name": "三明治",
    "search": [
     "三明治",
     "sandwich"
    ],
    "u": 0.5633,
    "v": 0.6158,
    "pyf": [
     "sanming",
     "sanming",
     "sandwich"
    ],
    "pyi": [
     "sm",
     "sm",
     "sandwich"
    ]
   },
   {
    "name": "匪跳",
    "search": [
     "匪跳"
    ],
    "u": 0.6211,
    "v": 0.6127,
    "pyf": [
     "feitiao",
     "feitiao"
    ],
    "pyi": [
     "ft",
     "ft"
    ]
   },
   {
    "name": "A1/A 门",
    "search": [
     "A1",
     "A 门"
    ],
    "u": 0.715,
    "v": 0.655,
    "pyf": [
     "a1amen",
     "a1",
     "amen"
    ],
    "pyi": [
     "a1am",
     "a1",
     "am"
    ]
   },
   {
    "name": "屋檐",
    "search": [
     "屋檐"
    ],
    "u": 0.79,
    "v": 0.635,
    "pyf": [
     "wuyan",
     "wuyan"
    ],
    "pyi": [
     "wy",
     "wy"
    ]
   },
   {
    "name": "警家凹槽",
    "search": [
     "凹槽"
    ],
    "u": 0.3609,
    "v": 0.6658,
    "pyf": [
     "jingjia",
     ""
    ],
    "pyi": [
     "jj",
     ""
    ]
   },
   {
    "name": "警家",
    "search": [
     "警家",
     "CT",
     "ct-spawn"
    ],
    "u": 0.2961,
    "v": 0.7111,
    "pyf": [
     "jingjia",
     "jingjia",
     "ct",
     "ctspawn"
    ],
    "pyi": [
     "jj",
     "jj",
     "ct",
     "ctspawn"
    ]
   },
   {
    "name": "长椅",
    "search": [
     "长椅"
    ],
    "u": 0.4523,
    "v": 0.6986,
    "pyf": [
     "",
     ""
    ],
    "pyi": [
     "",
     ""
    ]
   },
   {
    "name": "A 楼梯",
    "search": [
     "A 楼梯",
     "二楼上下"
    ],
    "u": 0.6594,
    "v": 0.7119,
    "pyf": [
     "alouti",
     "alouti",
     "erloushangxia"
    ],
    "pyi": [
     "alt",
     "alt",
     "elsx"
    ]
   },
   {
    "name": "长箱",
    "search": [
     "长箱"
    ],
    "u": 0.5102,
    "v": 0.7135,
    "pyf": [
     "xiang",
     "xiang"
    ],
    "pyi": [
     "x",
     "x"
    ]
   },
   {
    "name": "短箱",
    "search": [
     "短箱"
    ],
    "u": 0.5766,
    "v": 0.7166,
    "pyf": [
     "xiang",
     "xiang"
    ],
    "pyi": [
     "x",
     "x"
    ]
   },
   {
    "name": "A 包点",
    "search": [
     "A 包点",
     "A点"
    ],
    "u": 0.5273,
    "v": 0.7564,
    "pyf": [
     "abaodian",
     "abaodian",
     "adian"
    ],
    "pyi": [
     "abd",
     "abd",
     "ad"
    ]
   },
   {
    "name": "垃圾桶",
    "search": [
     "垃圾桶"
    ],
    "u": 0.4211,
    "v": 0.7518,
    "pyf": [
     "tong",
     "tong"
    ],
    "pyi": [
     "t",
     "t"
    ]
   },
   {
    "name": "斜坡",
    "search": [
     "斜坡",
     "ramp"
    ],
    "u": 0.375,
    "v": 0.8041,
    "pyf": [
     "",
     "",
     "ramp"
    ],
    "pyi": [
     "",
     "",
     "ramp"
    ]
   },
   {
    "name": "警亭",
    "search": [
     "警亭"
    ],
    "u": 0.4469,
    "v": 0.8299,
    "pyf": [
     "jing",
     "jing"
    ],
    "pyi": [
     "j",
     "j"
    ]
   },
   {
    "name": "死点",
    "search": [
     "死点"
    ],
    "u": 0.6016,
    "v": 0.7994,
    "pyf": [
     "sidian",
     "sidian"
    ],
    "pyi": [
     "sd",
     "sd"
    ]
   },
   {
    "name": "忍者位",
    "search": [
     "忍者位"
    ],
    "u": 0.5312,
    "v": 0.8018,
    "pyf": [
     "zhewei",
     "zhewei"
    ],
    "pyi": [
     "zw",
     "zw"
    ]
   },
   {
    "name": "A 二楼 (宫殿)",
    "search": [
     "A 二楼",
     "A2",
     "宫殿",
     "palace"
    ],
    "u": 0.74,
    "v": 0.79,
    "pyf": [
     "aerlougongdian",
     "aerlou",
     "a2",
     "gongdian",
     "palace"
    ],
    "pyi": [
     "aelgd",
     "ael",
     "a2",
     "gd",
     "palace"
    ]
   },
   {
    "name": "超市门",
    "search": [
     "超市门"
    ],
    "u": 0.1281,
    "v": 0.3838,
    "pyf": [
     "chaoshimen",
     "chaoshimen"
    ],
    "pyi": [
     "csm",
     "csm"
    ]
   }
  ],
  "de_dust2": [
   {
    "name": "狙位",
    "search": [
     "狙位",
     "A平台狙位"
    ],
    "u": 0.1,
    "v": 0.06,
    "pyf": [
     "juwei",
     "juwei",
     "apingtaijuwei"
    ],
    "pyi": [
     "jw",
     "jw",
     "aptjw"
    ]
   },
   {
    "name": "油桶",
    "search": [
     "油桶"
    ],
    "u": 0.135,
    "v": 0.11,
    "pyf": [
     "youtong",
     "youtong"
    ],
    "pyi": [
     "yt",
     "yt"
    ]
   },
   {
    "name": "短箱",
    "search": [
     "短箱"
    ],
    "u": 0.177,
    "v": 0.0768,
    "pyf": [
     "xiang",
     "xiang"
    ],
    "pyi": [
     "x",
     "x"
    ]
   },
   {
    "name": "B 包点",
    "search": [
     "B包点",
     "B点",
     "B site"
    ],
    "u": 0.1949,
    "v": 0.1275,
    "pyf": [
     "bbaodian",
     "bbaodian",
     "bdian",
     "bsite"
    ],
    "pyi": [
     "bbd",
     "bbd",
     "bd",
     "bsite"
    ]
   },
   {
    "name": "B 死点",
    "search": [
     "B死点",
     "B包死点"
    ],
    "u": 0.2395,
    "v": 0.0939,
    "pyf": [
     "bsidian",
     "bsidian",
     "bbaosidian"
    ],
    "pyi": [
     "bsd",
     "bsd",
     "bbsd"
    ]
   },
   {
    "name": "脚手架",
    "search": [
     "脚手架"
    ],
    "u": 0.3199,
    "v": 0.1229,
    "pyf": [
     "jiaoshoujia",
     "jiaoshoujia"
    ],
    "pyi": [
     "jsj",
     "jsj"
    ]
   },
   {
    "name": "狗洞",
    "search": [
     "狗洞",
     "B狗洞"
    ],
    "u": 0.2605,
    "v": 0.1236,
    "pyf": [
     "goudong",
     "goudong",
     "bgoudong"
    ],
    "pyi": [
     "gd",
     "gd",
     "bgd"
    ]
   },
   {
    "name": "高箱",
    "search": [
     "高箱"
    ],
    "u": 0.1777,
    "v": 0.1682,
    "pyf": [
     "gaoxiang",
     "gaoxiang"
    ],
    "pyi": [
     "gx",
     "gx"
    ]
   },
   {
    "name": "大箱",
    "search": [
     "大箱"
    ],
    "u": 0.1355,
    "v": 0.2104,
    "pyf": [
     "daxiang",
     "daxiang"
    ],
    "pyi": [
     "dx",
     "dx"
    ]
   },
   {
    "name": "假门",
    "search": [
     "假门"
    ],
    "u": 0.04,
    "v": 0.226,
    "pyf": [
     "jiamen",
     "jiamen"
    ],
    "pyi": [
     "jm",
     "jm"
    ]
   },
   {
    "name": "B门",
    "search": [
     "B门"
    ],
    "u": 0.254,
    "v": 0.23,
    "pyf": [
     "bmen",
     "bmen"
    ],
    "pyi": [
     "bm",
     "bm"
    ]
   },
   {
    "name": "沙地",
    "search": [
     "沙地"
    ],
    "u": 0.3762,
    "v": 0.2096,
    "pyf": [
     "shadi",
     "shadi"
    ],
    "pyi": [
     "sd",
     "sd"
    ]
   },
   {
    "name": "卡车",
    "search": [
     "卡车"
    ],
    "u": 0.4645,
    "v": 0.1752,
    "pyf": [
     "kache",
     "kache"
    ],
    "pyi": [
     "kc",
     "kc"
    ]
   },
   {
    "name": "白车",
    "search": [
     "白车",
     "B白车"
    ],
    "u": 0.198,
    "v": 0.296,
    "pyf": [
     "baiche",
     "baiche",
     "bbaiche"
    ],
    "pyi": [
     "bc",
     "bc",
     "bbc"
    ]
   },
   {
    "name": "狗位",
    "search": [
     "狗位"
    ],
    "u": 0.073,
    "v": 0.3,
    "pyf": [
     "gouwei",
     "gouwei"
    ],
    "pyi": [
     "gw",
     "gw"
    ]
   },
   {
    "name": "B洞",
    "search": [
     "B洞",
     "上B洞"
    ],
    "u": 0.108,
    "v": 0.358,
    "pyf": [
     "bdong",
     "bdong",
     "shangbdong"
    ],
    "pyi": [
     "bd",
     "bd",
     "sbd"
    ]
   },
   {
    "name": "白车死点",
    "search": [
     "白车死点"
    ],
    "u": 0.195,
    "v": 0.362,
    "pyf": [
     "baichesidian",
     "baichesidian"
    ],
    "pyi": [
     "bcsd",
     "bcsd"
    ]
   },
   {
    "name": "B通/B2",
    "search": [
     "B通",
     "B2",
     "B通道",
     "下B"
    ],
    "u": 0.132,
    "v": 0.456,
    "pyf": [
     "btongb2",
     "btong",
     "b2",
     "btongdao",
     "xiab"
    ],
    "pyi": [
     "btb2",
     "bt",
     "b2",
     "btd",
     "xb"
    ]
   },
   {
    "name": "旋转楼梯",
    "search": [
     "旋转楼梯"
    ],
    "u": 0.295,
    "v": 0.44,
    "pyf": [
     "louti",
     "louti"
    ],
    "pyi": [
     "lt",
     "lt"
    ]
   },
   {
    "name": "B1",
    "search": [
     "B1"
    ],
    "u": 0.365,
    "v": 0.393,
    "pyf": [
     "b1",
     "b1"
    ],
    "pyi": [
     "b1",
     "b1"
    ]
   },
   {
    "name": "中门",
    "search": [
     "中门"
    ],
    "u": 0.463,
    "v": 0.362,
    "pyf": [
     "zhongmen",
     "zhongmen"
    ],
    "pyi": [
     "zm",
     "zm"
    ]
   },
   {
    "name": "叉箱",
    "search": [
     "叉箱",
     "X箱",
     "Xbox"
    ],
    "u": 0.487,
    "v": 0.41,
    "pyf": [
     "chaxiang",
     "chaxiang",
     "xxiang",
     "xbox"
    ],
    "pyi": [
     "cx",
     "cx",
     "xx",
     "xbox"
    ]
   },
   {
    "name": "A小",
    "search": [
     "A小",
     "A短",
     "catwalk"
    ],
    "u": 0.55,
    "v": 0.4,
    "pyf": [
     "axiao",
     "axiao",
     "a",
     "catwalk"
    ],
    "pyi": [
     "ax",
     "ax",
     "a",
     "catwalk"
    ]
   },
   {
    "name": "A小楼梯",
    "search": [
     "A小楼梯",
     "A短楼梯"
    ],
    "u": 0.5962,
    "v": 0.3421,
    "pyf": [
     "axiaolouti",
     "axiaolouti",
     "alouti"
    ],
    "pyi": [
     "axlt",
     "axlt",
     "alt"
    ]
   },
   {
    "name": "A小楼梯下",
    "search": [
     "A小楼梯下"
    ],
    "u": 0.6888,
    "v": 0.3421,
    "pyf": [
     "axiaoloutixia",
     "axiaoloutixia"
    ],
    "pyi": [
     "axltx",
     "axltx"
    ]
   },
   {
    "name": "中路凹槽",
    "search": [
     "中路凹槽",
     "凹槽"
    ],
    "u": 0.494,
    "v": 0.327,
    "pyf": [
     "zhonglu",
     "zhonglu",
     ""
    ],
    "pyi": [
     "zl",
     "zl",
     ""
    ]
   },
   {
    "name": "警家",
    "search": [
     "警家",
     "CT出生点",
     "ct-spawn"
    ],
    "u": 0.5738,
    "v": 0.2064,
    "pyf": [
     "jingjia",
     "jingjia",
     "ctchushengdian",
     "ctspawn"
    ],
    "pyi": [
     "jj",
     "jj",
     "ctcsd",
     "ctspawn"
    ]
   },
   {
    "name": "头皮位",
    "search": [
     "头皮位",
     "头皮"
    ],
    "u": 0.6867,
    "v": 0.1904,
    "pyf": [
     "touwei",
     "touwei",
     "tou"
    ],
    "pyi": [
     "tw",
     "tw",
     "t"
    ]
   },
   {
    "name": "忍者位",
    "search": [
     "忍者位"
    ],
    "u": 0.6656,
    "v": 0.0896,
    "pyf": [
     "zhewei",
     "zhewei"
    ],
    "pyi": [
     "zw",
     "zw"
    ]
   },
   {
    "name": "A平台",
    "search": [
     "A平台"
    ],
    "u": 0.7786,
    "v": 0.1284,
    "pyf": [
     "apingtai",
     "apingtai"
    ],
    "pyi": [
     "apt",
     "apt"
    ]
   },
   {
    "name": "二箱",
    "search": [
     "二箱",
     "A二箱"
    ],
    "u": 0.7505,
    "v": 0.1502,
    "pyf": [
     "erxiang",
     "erxiang",
     "aerxiang"
    ],
    "pyi": [
     "ex",
     "ex",
     "aex"
    ]
   },
   {
    "name": "一箱",
    "search": [
     "一箱",
     "A一箱"
    ],
    "u": 0.8295,
    "v": 0.1393,
    "pyf": [
     "yixiang",
     "yixiang",
     "ayixiang"
    ],
    "pyi": [
     "yx",
     "yx",
     "ayx"
    ]
   },
   {
    "name": "A 包点",
    "search": [
     "A包点",
     "A点",
     "A site"
    ],
    "u": 0.8086,
    "v": 0.1702,
    "pyf": [
     "abaodian",
     "abaodian",
     "adian",
     "asite"
    ],
    "pyi": [
     "abd",
     "abd",
     "ad",
     "asite"
    ]
   },
   {
    "name": "电梯位",
    "search": [
     "电梯位",
     "电梯"
    ],
    "u": 0.7461,
    "v": 0.192,
    "pyf": [
     "diantiwei",
     "diantiwei",
     "dianti"
    ],
    "pyi": [
     "dtw",
     "dtw",
     "dt"
    ]
   },
   {
    "name": "鹅位/狙位",
    "search": [
     "鹅位",
     "goose",
     "A狙位"
    ],
    "u": 0.7359,
    "v": 0.0428,
    "pyf": [
     "eweijuwei",
     "ewei",
     "goose",
     "ajuwei"
    ],
    "pyi": [
     "ewjw",
     "ew",
     "goose",
     "ajw"
    ]
   },
   {
    "name": "沙袋",
    "search": [
     "沙袋"
    ],
    "u": 0.8391,
    "v": 0.0693,
    "pyf": [
     "shadai",
     "shadai"
    ],
    "pyi": [
     "sd",
     "sd"
    ]
   },
   {
    "name": "A斜坡",
    "search": [
     "A斜坡"
    ],
    "u": 0.8977,
    "v": 0.1553,
    "pyf": [
     "a",
     "a"
    ],
    "pyi": [
     "a",
     "a"
    ]
   },
   {
    "name": "警家过点",
    "search": [
     "警家过点"
    ],
    "u": 0.79,
    "v": 0.24,
    "pyf": [
     "jingjiaguodian",
     "jingjiaguodian"
    ],
    "pyi": [
     "jjgd",
     "jjgd"
    ]
   },
   {
    "name": "蓝车",
    "search": [
     "蓝车",
     "A蓝车"
    ],
    "u": 0.9383,
    "v": 0.2607,
    "pyf": [
     "lanche",
     "lanche",
     "alanche"
    ],
    "pyi": [
     "lc",
     "lc",
     "alc"
    ]
   },
   {
    "name": "蓝车死点",
    "search": [
     "蓝车死点"
    ],
    "u": 0.9531,
    "v": 0.3076,
    "pyf": [
     "lanchesidian",
     "lanchesidian"
    ],
    "pyi": [
     "lcsd",
     "lcsd"
    ]
   },
   {
    "name": "A大",
    "search": [
     "A大",
     "A长",
     "long"
    ],
    "u": 0.8625,
    "v": 0.3764,
    "pyf": [
     "ada",
     "ada",
     "a",
     "long"
    ],
    "pyi": [
     "ad",
     "ad",
     "a",
     "long"
    ]
   },
   {
    "name": "厕所",
    "search": [
     "厕所",
     "pit"
    ],
    "u": 0.925,
    "v": 0.5021,
    "pyf": [
     "cesuo",
     "cesuo",
     "pit"
    ],
    "pyi": [
     "cs",
     "cs",
     "pit"
    ]
   },
   {
    "name": "蓝箱",
    "search": [
     "蓝箱"
    ],
    "u": 0.7281,
    "v": 0.435,
    "pyf": [
     "lanxiang",
     "lanxiang"
    ],
    "pyi": [
     "lx",
     "lx"
    ]
   },
   {
    "name": "警A门",
    "search": [
     "警A门",
     "A大门"
    ],
    "u": 0.6555,
    "v": 0.5092,
    "pyf": [
     "jingamen",
     "jingamen",
     "adamen"
    ],
    "pyi": [
     "jam",
     "jam",
     "adm"
    ]
   },
   {
    "name": "大坑边",
    "search": [
     "大坑边"
    ],
    "u": 0.7883,
    "v": 0.5779,
    "pyf": [
     "dakengbian",
     "dakengbian"
    ],
    "pyi": [
     "dkb",
     "dkb"
    ]
   },
   {
    "name": "A大坑",
    "search": [
     "A大坑",
     "大坑"
    ],
    "u": 0.8688,
    "v": 0.6436,
    "pyf": [
     "adakeng",
     "adakeng",
     "dakeng"
    ],
    "pyi": [
     "adk",
     "adk",
     "dk"
    ]
   },
   {
    "name": "A坑平台",
    "search": [
     "A坑平台"
    ],
    "u": 0.9289,
    "v": 0.5998,
    "pyf": [
     "akengpingtai",
     "akengpingtai"
    ],
    "pyi": [
     "akpt",
     "akpt"
    ]
   },
   {
    "name": "A门内",
    "search": [
     "A门内"
    ],
    "u": 0.6586,
    "v": 0.5982,
    "pyf": [
     "amennei",
     "amennei"
    ],
    "pyi": [
     "amn",
     "amn"
    ]
   },
   {
    "name": "匪A门",
    "search": [
     "匪A门"
    ],
    "u": 0.65,
    "v": 0.6475,
    "pyf": [
     "feiamen",
     "feiamen"
    ],
    "pyi": [
     "fam",
     "fam"
    ]
   },
   {
    "name": "黄车",
    "search": [
     "黄车"
    ],
    "u": 0.7094,
    "v": 0.7232,
    "pyf": [
     "huangche",
     "huangche"
    ],
    "pyi": [
     "hc",
     "hc"
    ]
   },
   {
    "name": "L位",
    "search": [
     "L位",
     "L 位"
    ],
    "u": 0.393,
    "v": 0.574,
    "pyf": [
     "lwei",
     "lwei",
     "lwei"
    ],
    "pyi": [
     "lw",
     "lw",
     "lw"
    ]
   },
   {
    "name": "中远",
    "search": [
     "中远"
    ],
    "u": 0.4641,
    "v": 0.6217,
    "pyf": [
     "zhongyuan",
     "zhongyuan"
    ],
    "pyi": [
     "zy",
     "zy"
    ]
   },
   {
    "name": "匪口",
    "search": [
     "匪口",
     "上路匪口"
    ],
    "u": 0.5375,
    "v": 0.6264,
    "pyf": [
     "feikou",
     "feikou",
     "shanglufeikou"
    ],
    "pyi": [
     "fk",
     "fk",
     "slfk"
    ]
   },
   {
    "name": "暗道",
    "search": [
     "暗道"
    ],
    "u": 0.452,
    "v": 0.75,
    "pyf": [
     "andao",
     "andao"
    ],
    "pyi": [
     "ad",
     "ad"
    ]
   },
   {
    "name": "后花园",
    "search": [
     "后花园"
    ],
    "u": 0.167,
    "v": 0.672,
    "pyf": [
     "houhuayuan",
     "houhuayuan"
    ],
    "pyi": [
     "hhy",
     "hhy"
    ]
   },
   {
    "name": "垃圾桶",
    "search": [
     "垃圾桶"
    ],
    "u": 0.271,
    "v": 0.724,
    "pyf": [
     "tong",
     "tong"
    ],
    "pyi": [
     "t",
     "t"
    ]
   },
   {
    "name": "斜坡",
    "search": [
     "斜坡",
     "T斜坡"
    ],
    "u": 0.115,
    "v": 0.795,
    "pyf": [
     "",
     "",
     "t"
    ],
    "pyi": [
     "",
     "",
     "t"
    ]
   },
   {
    "name": "后花园平台",
    "search": [
     "后花园平台"
    ],
    "u": 0.24,
    "v": 0.828,
    "pyf": [
     "houhuayuanpingtai",
     "houhuayuanpingtai"
    ],
    "pyi": [
     "hhypt",
     "hhypt"
    ]
   },
   {
    "name": "匪家蓝车",
    "search": [
     "匪家蓝车",
     "T蓝车"
    ],
    "u": 0.125,
    "v": 0.9,
    "pyf": [
     "feijialanche",
     "feijialanche",
     "tlanche"
    ],
    "pyi": [
     "fjlc",
     "fjlc",
     "tlc"
    ]
   },
   {
    "name": "匪家",
    "search": [
     "匪家",
     "T出生点",
     "t-spawn"
    ],
    "u": 0.39,
    "v": 0.898,
    "pyf": [
     "feijia",
     "feijia",
     "tchushengdian",
     "tspawn"
    ],
    "pyi": [
     "fj",
     "fj",
     "tcsd",
     "tspawn"
    ]
   },
   {
    "name": "中路",
    "search": [
     "中路",
     "mid"
    ],
    "u": 0.505,
    "v": 0.47,
    "pyf": [
     "zhonglu",
     "zhonglu",
     "mid"
    ],
    "pyi": [
     "zl",
     "zl",
     "mid"
    ]
   },
   {
    "name": "空调",
    "search": [
     "空调",
     "AC",
     "空调位"
    ],
    "u": 0.6865,
    "v": 0.2703,
    "pyf": [
     "kongdiao",
     "kongdiao",
     "ac",
     "kongdiaowei"
    ],
    "pyi": [
     "kd",
     "kd",
     "ac",
     "kdw"
    ]
   },
   {
    "name": "A大油桶",
    "search": [
     "油桶",
     "A大油桶"
    ],
    "u": 0.7567,
    "v": 0.5357,
    "pyf": [
     "adayoutong",
     "youtong",
     "adayoutong"
    ],
    "pyi": [
     "adyt",
     "yt",
     "adyt"
    ]
   }
  ],
  "de_inferno": [
   {
    "name": "后花园",
    "search": [
     "后花园",
     "B后花园"
    ],
    "u": 0.557,
    "v": 0.08,
    "pyf": [
     "houhuayuan",
     "houhuayuan",
     "bhouhuayuan"
    ],
    "pyi": [
     "hhy",
     "hhy",
     "bhhy"
    ]
   },
   {
    "name": "B 死点",
    "search": [
     "B死点",
     "死点"
    ],
    "u": 0.3823,
    "v": 0.1293,
    "pyf": [
     "bsidian",
     "bsidian",
     "sidian"
    ],
    "pyi": [
     "bsd",
     "bsd",
     "sd"
    ]
   },
   {
    "name": "死点上",
    "search": [
     "死点上"
    ],
    "u": 0.4723,
    "v": 0.1265,
    "pyf": [
     "sidianshang",
     "sidianshang"
    ],
    "pyi": [
     "sds",
     "sds"
    ]
   },
   {
    "name": "棺材",
    "search": [
     "棺材"
    ],
    "u": 0.5259,
    "v": 0.1429,
    "pyf": [
     "cai",
     "cai"
    ],
    "pyi": [
     "c",
     "c"
    ]
   },
   {
    "name": "教堂",
    "search": [
     "教堂",
     "chapel"
    ],
    "u": 0.623,
    "v": 0.143,
    "pyf": [
     "jiao",
     "jiao",
     "chapel"
    ],
    "pyi": [
     "j",
     "j",
     "chapel"
    ]
   },
   {
    "name": "喷泉",
    "search": [
     "喷泉",
     "B喷泉"
    ],
    "u": 0.485,
    "v": 0.2202,
    "pyf": [
     "",
     "",
     "b"
    ],
    "pyi": [
     "",
     "",
     "b"
    ]
   },
   {
    "name": "B 包点",
    "search": [
     "B包点",
     "B点"
    ],
    "u": 0.4877,
    "v": 0.2429,
    "pyf": [
     "bbaodian",
     "bbaodian",
     "bdian"
    ],
    "pyi": [
     "bbd",
     "bbd",
     "bd"
    ]
   },
   {
    "name": "台下",
    "search": [
     "台下"
    ],
    "u": 0.5238,
    "v": 0.1924,
    "pyf": [
     "taixia",
     "taixia"
    ],
    "pyi": [
     "tx",
     "tx"
    ]
   },
   {
    "name": "三箱",
    "search": [
     "三箱"
    ],
    "u": 0.4068,
    "v": 0.252,
    "pyf": [
     "sanxiang",
     "sanxiang"
    ],
    "pyi": [
     "sx",
     "sx"
    ]
   },
   {
    "name": "双架",
    "search": [
     "双架",
     "B双架"
    ],
    "u": 0.6232,
    "v": 0.2629,
    "pyf": [
     "shuangjia",
     "shuangjia",
     "bshuangjia"
    ],
    "pyi": [
     "sj",
     "sj",
     "bsj"
    ]
   },
   {
    "name": "B 树位",
    "search": [
     "B树位",
     "树位"
    ],
    "u": 0.7305,
    "v": 0.212,
    "pyf": [
     "bwei",
     "bwei",
     "wei"
    ],
    "pyi": [
     "bw",
     "bw",
     "w"
    ]
   },
   {
    "name": "二箱",
    "search": [
     "二箱"
    ],
    "u": 0.485,
    "v": 0.2965,
    "pyf": [
     "erxiang",
     "erxiang"
    ],
    "pyi": [
     "ex",
     "ex"
    ]
   },
   {
    "name": "一箱",
    "search": [
     "一箱"
    ],
    "u": 0.5323,
    "v": 0.2993,
    "pyf": [
     "yixiang",
     "yixiang"
    ],
    "pyi": [
     "yx",
     "yx"
    ]
   },
   {
    "name": "卡车",
    "search": [
     "卡车",
     "警家卡车"
    ],
    "u": 0.8341,
    "v": 0.2547,
    "pyf": [
     "kache",
     "kache",
     "jingjiakache"
    ],
    "pyi": [
     "kc",
     "kc",
     "jjkc"
    ]
   },
   {
    "name": "警家长廊",
    "search": [
     "警家长廊",
     "长廊"
    ],
    "u": 0.74,
    "v": 0.33,
    "pyf": [
     "jingjia",
     "jingjia",
     ""
    ],
    "pyi": [
     "jj",
     "jj",
     ""
    ]
   },
   {
    "name": "警家",
    "search": [
     "警家",
     "CT出生点",
     "ct-spawn"
    ],
    "u": 0.8932,
    "v": 0.3465,
    "pyf": [
     "jingjia",
     "jingjia",
     "ctchushengdian",
     "ctspawn"
    ],
    "pyi": [
     "jj",
     "jj",
     "ctcsd",
     "ctspawn"
    ]
   },
   {
    "name": "木板/车位",
    "search": [
     "木板",
     "车位"
    ],
    "u": 0.4932,
    "v": 0.3329,
    "pyf": [
     "banchewei",
     "ban",
     "chewei"
    ],
    "pyi": [
     "bcw",
     "b",
     "cw"
    ]
   },
   {
    "name": "沙袋",
    "search": [
     "沙袋"
    ],
    "u": 0.5695,
    "v": 0.4156,
    "pyf": [
     "shadai",
     "shadai"
    ],
    "pyi": [
     "sd",
     "sd"
    ]
   },
   {
    "name": "沙袋死点",
    "search": [
     "沙袋死点"
    ],
    "u": 0.625,
    "v": 0.4147,
    "pyf": [
     "shadaisidian",
     "shadaisidian"
    ],
    "pyi": [
     "sdsd",
     "sdsd"
    ]
   },
   {
    "name": "石板",
    "search": [
     "石板"
    ],
    "u": 0.5277,
    "v": 0.4165,
    "pyf": [
     "ban",
     "ban"
    ],
    "pyi": [
     "b",
     "b"
    ]
   },
   {
    "name": "香蕉道",
    "search": [
     "香蕉道",
     "banana"
    ],
    "u": 0.4577,
    "v": 0.4538,
    "pyf": [
     "dao",
     "dao",
     "banana"
    ],
    "pyi": [
     "d",
     "d",
     "banana"
    ]
   },
   {
    "name": "树位",
    "search": [
     "树位",
     "香蕉树位"
    ],
    "u": 0.373,
    "v": 0.5018,
    "pyf": [
     "wei",
     "wei",
     "wei"
    ],
    "pyi": [
     "w",
     "w",
     "w"
    ]
   },
   {
    "name": "凹槽",
    "search": [
     "凹槽",
     "香蕉凹槽"
    ],
    "u": 0.4941,
    "v": 0.5138,
    "pyf": [
     "",
     "",
     ""
    ],
    "pyi": [
     "",
     "",
     ""
    ]
   },
   {
    "name": "拱门",
    "search": [
     "拱门",
     "arch"
    ],
    "u": 0.7805,
    "v": 0.4847,
    "pyf": [
     "gongmen",
     "gongmen",
     "arch"
    ],
    "pyi": [
     "gm",
     "gm",
     "arch"
    ]
   },
   {
    "name": "书房",
    "search": [
     "书房",
     "library"
    ],
    "u": 0.9368,
    "v": 0.5093,
    "pyf": [
     "fang",
     "fang",
     "library"
    ],
    "pyi": [
     "f",
     "f",
     "library"
    ]
   },
   {
    "name": "连接凹槽",
    "search": [
     "连接凹槽"
    ],
    "u": 0.6082,
    "v": 0.5041,
    "pyf": [
     "lianjie",
     "lianjie"
    ],
    "pyi": [
     "lj",
     "lj"
    ]
   },
   {
    "name": "连接",
    "search": [
     "连接",
     "connector"
    ],
    "u": 0.8195,
    "v": 0.5456,
    "pyf": [
     "lianjie",
     "lianjie",
     "connector"
    ],
    "pyi": [
     "lj",
     "lj",
     "connector"
    ]
   },
   {
    "name": "A 凹槽",
    "search": [
     "A凹槽",
     "凹槽"
    ],
    "u": 0.925,
    "v": 0.6065,
    "pyf": [
     "a",
     "a",
     ""
    ],
    "pyi": [
     "a",
     "a",
     ""
    ]
   },
   {
    "name": "小凹槽",
    "search": [
     "小凹槽"
    ],
    "u": 0.6095,
    "v": 0.6165,
    "pyf": [
     "xiao",
     "xiao"
    ],
    "pyi": [
     "x",
     "x"
    ]
   },
   {
    "name": "A 死点",
    "search": [
     "A死点",
     "死点"
    ],
    "u": 0.7741,
    "v": 0.6238,
    "pyf": [
     "asidian",
     "asidian",
     "sidian"
    ],
    "pyi": [
     "asd",
     "asd",
     "sd"
    ]
   },
   {
    "name": "A 包点",
    "search": [
     "A包点",
     "A点"
    ],
    "u": 0.8186,
    "v": 0.6756,
    "pyf": [
     "abaodian",
     "abaodian",
     "adian"
    ],
    "pyi": [
     "abd",
     "abd",
     "ad"
    ]
   },
   {
    "name": "匪狙位",
    "search": [
     "匪狙位"
    ],
    "u": 0.271,
    "v": 0.592,
    "pyf": [
     "feijuwei",
     "feijuwei"
    ],
    "pyi": [
     "fjw",
     "fjw"
    ]
   },
   {
    "name": "匪口",
    "search": [
     "匪口",
     "第二匪口"
    ],
    "u": 0.4314,
    "v": 0.6047,
    "pyf": [
     "feikou",
     "feikou",
     "dierfeikou"
    ],
    "pyi": [
     "fk",
     "fk",
     "defk"
    ]
   },
   {
    "name": "中路",
    "search": [
     "中路",
     "mid"
    ],
    "u": 0.532,
    "v": 0.654,
    "pyf": [
     "zhonglu",
     "zhonglu",
     "mid"
    ],
    "pyi": [
     "zl",
     "zl",
     "mid"
    ]
   },
   {
    "name": "墓地",
    "search": [
     "墓地",
     "graveyard"
    ],
    "u": 0.9305,
    "v": 0.7056,
    "pyf": [
     "di",
     "di",
     "graveyard"
    ],
    "pyi": [
     "d",
     "d",
     "graveyard"
    ]
   },
   {
    "name": "下水道",
    "search": [
     "下水道",
     "sewers"
    ],
    "u": 0.485,
    "v": 0.7184,
    "pyf": [
     "xiashuidao",
     "xiashuidao",
     "sewers"
    ],
    "pyi": [
     "xsd",
     "xsd",
     "sewers"
    ]
   },
   {
    "name": "锅炉房",
    "search": [
     "锅炉房",
     "boiler"
    ],
    "u": 0.6632,
    "v": 0.7065,
    "pyf": [
     "fang",
     "fang",
     "boiler"
    ],
    "pyi": [
     "f",
     "f",
     "boiler"
    ]
   },
   {
    "name": "忍者位",
    "search": [
     "忍者位"
    ],
    "u": 0.7668,
    "v": 0.7184,
    "pyf": [
     "zhewei",
     "zhewei"
    ],
    "pyi": [
     "zw",
     "zw"
    ]
   },
   {
    "name": "高箱",
    "search": [
     "高箱",
     "A高箱"
    ],
    "u": 0.8668,
    "v": 0.7229,
    "pyf": [
     "gaoxiang",
     "gaoxiang",
     "agaoxiang"
    ],
    "pyi": [
     "gx",
     "gx",
     "agx"
    ]
   },
   {
    "name": "匪二楼",
    "search": [
     "匪二楼",
     "T公寓"
    ],
    "u": 0.341,
    "v": 0.741,
    "pyf": [
     "feierlou",
     "feierlou",
     "t"
    ],
    "pyi": [
     "fel",
     "fel",
     "t"
    ]
   },
   {
    "name": "A1",
    "search": [
     "A1"
    ],
    "u": 0.7695,
    "v": 0.7647,
    "pyf": [
     "a1",
     "a1"
    ],
    "pyi": [
     "a1",
     "a1"
    ]
   },
   {
    "name": "匪二阳台",
    "search": [
     "匪二阳台",
     "T阳台"
    ],
    "u": 0.4323,
    "v": 0.7593,
    "pyf": [
     "feiertai",
     "feiertai",
     "ttai"
    ],
    "pyi": [
     "fet",
     "fet",
     "tt"
    ]
   },
   {
    "name": "马棚",
    "search": [
     "马棚",
     "balcony"
    ],
    "u": 0.715,
    "v": 0.7765,
    "pyf": [
     "peng",
     "peng",
     "balcony"
    ],
    "pyi": [
     "p",
     "p",
     "balcony"
    ]
   },
   {
    "name": "VIP",
    "search": [
     "VIP",
     "vip"
    ],
    "u": 0.6277,
    "v": 0.7875,
    "pyf": [
     "vip",
     "vip",
     "vip"
    ],
    "pyi": [
     "vip",
     "vip",
     "vip"
    ]
   },
   {
    "name": "A二楼",
    "search": [
     "A二楼",
     "A阳台"
    ],
    "u": 0.7341,
    "v": 0.8338,
    "pyf": [
     "aerlou",
     "aerlou",
     "atai"
    ],
    "pyi": [
     "ael",
     "ael",
     "at"
    ]
   },
   {
    "name": "草车",
    "search": [
     "草车"
    ],
    "u": 0.8159,
    "v": 0.7811,
    "pyf": [
     "che",
     "che"
    ],
    "pyi": [
     "c",
     "c"
    ]
   },
   {
    "name": "侧道桥",
    "search": [
     "侧道桥"
    ],
    "u": 0.3423,
    "v": 0.7984,
    "pyf": [
     "cedao",
     "cedao"
    ],
    "pyi": [
     "cd",
     "cd"
    ]
   },
   {
    "name": "侧道",
    "search": [
     "侧道",
     "第二中路"
    ],
    "u": 0.5005,
    "v": 0.8111,
    "pyf": [
     "cedao",
     "cedao",
     "dierzhonglu"
    ],
    "pyi": [
     "cd",
     "cd",
     "dezl"
    ]
   },
   {
    "name": "阳台小坑",
    "search": [
     "阳台小坑"
    ],
    "u": 0.8805,
    "v": 0.8065,
    "pyf": [
     "taixiaokeng",
     "taixiaokeng"
    ],
    "pyi": [
     "txk",
     "txk"
    ]
   },
   {
    "name": "大坑",
    "search": [
     "大坑",
     "A大坑"
    ],
    "u": 0.9486,
    "v": 0.7947,
    "pyf": [
     "dakeng",
     "dakeng",
     "adakeng"
    ],
    "pyi": [
     "dk",
     "dk",
     "adk"
    ]
   },
   {
    "name": "楼梯间",
    "search": [
     "楼梯间"
    ],
    "u": 0.348,
    "v": 0.86,
    "pyf": [
     "loutijian",
     "loutijian"
    ],
    "pyi": [
     "ltj",
     "ltj"
    ]
   },
   {
    "name": "红门",
    "search": [
     "红门"
    ],
    "u": 0.48,
    "v": 0.856,
    "pyf": [
     "hongmen",
     "hongmen"
    ],
    "pyi": [
     "hm",
     "hm"
    ]
   },
   {
    "name": "阳台下",
    "search": [
     "阳台下"
    ],
    "u": 0.8368,
    "v": 0.8293,
    "pyf": [
     "taixia",
     "taixia"
    ],
    "pyi": [
     "tx",
     "tx"
    ]
   },
   {
    "name": "楼梯",
    "search": [
     "楼梯",
     "A楼梯",
     "A坡"
    ],
    "u": 0.6668,
    "v": 0.8702,
    "pyf": [
     "louti",
     "louti",
     "alouti",
     "a"
    ],
    "pyi": [
     "lt",
     "lt",
     "alt",
     "a"
    ]
   },
   {
    "name": "匪家",
    "search": [
     "匪家",
     "T出生点",
     "t-spawn"
    ],
    "u": 0.0887,
    "v": 0.6666,
    "pyf": [
     "feijia",
     "feijia",
     "tchushengdian",
     "tspawn"
    ],
    "pyi": [
     "fj",
     "fj",
     "tcsd",
     "tspawn"
    ]
   },
   {
    "name": "T字连接",
    "search": [
     "T字连接"
    ],
    "u": 0.682,
    "v": 0.6666,
    "pyf": [
     "tzilianjie",
     "tzilianjie"
    ],
    "pyi": [
     "tzlj",
     "tzlj"
    ]
   },
   {
    "name": "黄墙",
    "search": [
     "黄墙"
    ],
    "u": 0.5967,
    "v": 0.299,
    "pyf": [
     "huangqiang",
     "huangqiang"
    ],
    "pyi": [
     "hq",
     "hq"
    ]
   }
  ],
  "de_ancient": [
   {
    "name": "警家",
    "search": [
     "警家",
     "CT出生点",
     "ct-spawn"
    ],
    "u": 0.4809,
    "v": 0.1432,
    "pyf": [
     "jingjia",
     "jingjia",
     "ctchushengdian",
     "ctspawn"
    ],
    "pyi": [
     "jj",
     "jj",
     "ctcsd",
     "ctspawn"
    ]
   },
   {
    "name": "遗迹",
    "search": [
     "遗迹",
     "ruins"
    ],
    "u": 0.2918,
    "v": 0.1697,
    "pyf": [
     "",
     "",
     "ruins"
    ],
    "pyi": [
     "",
     "",
     "ruins"
    ]
   },
   {
    "name": "A平台",
    "search": [
     "A平台"
    ],
    "u": 0.1449,
    "v": 0.1916,
    "pyf": [
     "apingtai",
     "apingtai"
    ],
    "pyi": [
     "apt",
     "apt"
    ]
   },
   {
    "name": "一箱",
    "search": [
     "一箱",
     "A一箱"
    ],
    "u": 0.198,
    "v": 0.2158,
    "pyf": [
     "yixiang",
     "yixiang",
     "ayixiang"
    ],
    "pyi": [
     "yx",
     "yx",
     "ayx"
    ]
   },
   {
    "name": "二箱",
    "search": [
     "二箱",
     "A二箱"
    ],
    "u": 0.2121,
    "v": 0.265,
    "pyf": [
     "erxiang",
     "erxiang",
     "aerxiang"
    ],
    "pyi": [
     "ex",
     "ex",
     "aex"
    ]
   },
   {
    "name": "A 包点",
    "search": [
     "A包点",
     "A点"
    ],
    "u": 0.277,
    "v": 0.2541,
    "pyf": [
     "abaodian",
     "abaodian",
     "adian"
    ],
    "pyi": [
     "abd",
     "abd",
     "ad"
    ]
   },
   {
    "name": "三箱",
    "search": [
     "三箱",
     "A三箱"
    ],
    "u": 0.3426,
    "v": 0.2666,
    "pyf": [
     "sanxiang",
     "sanxiang",
     "asanxiang"
    ],
    "pyi": [
     "sx",
     "sx",
     "asx"
    ]
   },
   {
    "name": "VIP",
    "search": [
     "VIP",
     "vip"
    ],
    "u": 0.4441,
    "v": 0.2689,
    "pyf": [
     "vip",
     "vip",
     "vip"
    ],
    "pyi": [
     "vip",
     "vip",
     "vip"
    ]
   },
   {
    "name": "底线",
    "search": [
     "底线",
     "B底线"
    ],
    "u": 0.7105,
    "v": 0.2596,
    "pyf": [
     "dixian",
     "dixian",
     "bdixian"
    ],
    "pyi": [
     "dx",
     "dx",
     "bdx"
    ]
   },
   {
    "name": "一道",
    "search": [
     "一道"
    ],
    "u": 0.6613,
    "v": 0.3096,
    "pyf": [
     "yidao",
     "yidao"
    ],
    "pyi": [
     "yd",
     "yd"
    ]
   },
   {
    "name": "二道",
    "search": [
     "二道"
    ],
    "u": 0.7785,
    "v": 0.3041,
    "pyf": [
     "erdao",
     "erdao"
    ],
    "pyi": [
     "ed",
     "ed"
    ]
   },
   {
    "name": "A 双架位",
    "search": [
     "A双架位",
     "双架位"
    ],
    "u": 0.24,
    "v": 0.345,
    "pyf": [
     "ashuangjiawei",
     "ashuangjiawei",
     "shuangjiawei"
    ],
    "pyi": [
     "asjw",
     "asjw",
     "sjw"
    ]
   },
   {
    "name": "A小",
    "search": [
     "A小"
    ],
    "u": 0.2949,
    "v": 0.3729,
    "pyf": [
     "axiao",
     "axiao"
    ],
    "pyi": [
     "ax",
     "ax"
    ]
   },
   {
    "name": "中门",
    "search": [
     "中门"
    ],
    "u": 0.4449,
    "v": 0.3455,
    "pyf": [
     "zhongmen",
     "zhongmen"
    ],
    "pyi": [
     "zm",
     "zm"
    ]
   },
   {
    "name": "台阶",
    "search": [
     "台阶"
    ],
    "u": 0.7707,
    "v": 0.3854,
    "pyf": [
     "taijie",
     "taijie"
    ],
    "pyi": [
     "tj",
     "tj"
    ]
   },
   {
    "name": "柱子",
    "search": [
     "柱子",
     "B柱子"
    ],
    "u": 0.7223,
    "v": 0.426,
    "pyf": [
     "zi",
     "zi",
     "bzi"
    ],
    "pyi": [
     "z",
     "z",
     "bz"
    ]
   },
   {
    "name": "B 包点",
    "search": [
     "B包点",
     "B点"
    ],
    "u": 0.698,
    "v": 0.4018,
    "pyf": [
     "bbaodian",
     "bbaodian",
     "bdian"
    ],
    "pyi": [
     "bbd",
     "bbd",
     "bd"
    ]
   },
   {
    "name": "小黑屋",
    "search": [
     "小黑屋"
    ],
    "u": 0.5926,
    "v": 0.4143,
    "pyf": [
     "xiaoheiwu",
     "xiaoheiwu"
    ],
    "pyi": [
     "xhw",
     "xhw"
    ]
   },
   {
    "name": "A大",
    "search": [
     "A大",
     "A main"
    ],
    "u": 0.1473,
    "v": 0.4002,
    "pyf": [
     "ada",
     "ada",
     "amain"
    ],
    "pyi": [
     "ad",
     "ad",
     "amain"
    ]
   },
   {
    "name": "A厅",
    "search": [
     "A厅"
    ],
    "u": 0.2074,
    "v": 0.4682,
    "pyf": [
     "a",
     "a"
    ],
    "pyi": [
     "a",
     "a"
    ]
   },
   {
    "name": "甜甜圈",
    "search": [
     "甜甜圈",
     "donut"
    ],
    "u": 0.2863,
    "v": 0.4463,
    "pyf": [
     "",
     "",
     "donut"
    ],
    "pyi": [
     "",
     "",
     "donut"
    ]
   },
   {
    "name": "凹槽",
    "search": [
     "凹槽",
     "中路凹槽"
    ],
    "u": 0.5145,
    "v": 0.4619,
    "pyf": [
     "",
     "",
     "zhonglu"
    ],
    "pyi": [
     "",
     "",
     "zl"
    ]
   },
   {
    "name": "中路",
    "search": [
     "中路",
     "mid"
    ],
    "u": 0.4488,
    "v": 0.4658,
    "pyf": [
     "zhonglu",
     "zhonglu",
     "mid"
    ],
    "pyi": [
     "zl",
     "zl",
     "mid"
    ]
   },
   {
    "name": "忍者位",
    "search": [
     "忍者位",
     "B忍者位"
    ],
    "u": 0.6941,
    "v": 0.4807,
    "pyf": [
     "zhewei",
     "zhewei",
     "bzhewei"
    ],
    "pyi": [
     "zw",
     "zw",
     "bzw"
    ]
   },
   {
    "name": "B斜坡",
    "search": [
     "B斜坡"
    ],
    "u": 0.7934,
    "v": 0.4986,
    "pyf": [
     "b",
     "b"
    ],
    "pyi": [
     "b",
     "b"
    ]
   },
   {
    "name": "B 双架位",
    "search": [
     "B双架位"
    ],
    "u": 0.741,
    "v": 0.5385,
    "pyf": [
     "bshuangjiawei",
     "bshuangjiawei"
    ],
    "pyi": [
     "bsjw",
     "bsjw"
    ]
   },
   {
    "name": "猎豹房",
    "search": [
     "猎豹房",
     "cheetah"
    ],
    "u": 0.6082,
    "v": 0.5307,
    "pyf": [
     "baofang",
     "baofang",
     "cheetah"
    ],
    "pyi": [
     "bf",
     "bf",
     "cheetah"
    ]
   },
   {
    "name": "B 凹槽",
    "search": [
     "B凹槽"
    ],
    "u": 0.673,
    "v": 0.5291,
    "pyf": [
     "b",
     "b"
    ],
    "pyi": [
     "b",
     "b"
    ]
   },
   {
    "name": "跳台",
    "search": [
     "跳台"
    ],
    "u": 0.523,
    "v": 0.5689,
    "pyf": [
     "tiaotai",
     "tiaotai"
    ],
    "pyi": [
     "tt",
     "tt"
    ]
   },
   {
    "name": "跳台下",
    "search": [
     "跳台下"
    ],
    "u": 0.4551,
    "v": 0.5893,
    "pyf": [
     "tiaotaixia",
     "tiaotaixia"
    ],
    "pyi": [
     "ttx",
     "ttx"
    ]
   },
   {
    "name": "B小/连接",
    "search": [
     "B小",
     "连接"
    ],
    "u": 0.6238,
    "v": 0.59,
    "pyf": [
     "bxiaolianjie",
     "bxiao",
     "lianjie"
    ],
    "pyi": [
     "bxlj",
     "bx",
     "lj"
    ]
   },
   {
    "name": "匪口",
    "search": [
     "匪口"
    ],
    "u": 0.3246,
    "v": 0.5557,
    "pyf": [
     "feikou",
     "feikou"
    ],
    "pyi": [
     "fk",
     "fk"
    ]
   },
   {
    "name": "B门",
    "search": [
     "B门"
    ],
    "u": 0.7738,
    "v": 0.6088,
    "pyf": [
     "bmen",
     "bmen"
    ],
    "pyi": [
     "bm",
     "bm"
    ]
   },
   {
    "name": "B门外",
    "search": [
     "B门外"
    ],
    "u": 0.7605,
    "v": 0.6635,
    "pyf": [
     "bmenwai",
     "bmenwai"
    ],
    "pyi": [
     "bmw",
     "bmw"
    ]
   },
   {
    "name": "A外",
    "search": [
     "A外"
    ],
    "u": 0.29,
    "v": 0.685,
    "pyf": [
     "awai",
     "awai"
    ],
    "pyi": [
     "aw",
     "aw"
    ]
   },
   {
    "name": "匪家",
    "search": [
     "匪家",
     "T出生点",
     "t-spawn"
    ],
    "u": 0.49,
    "v": 0.867,
    "pyf": [
     "feijia",
     "feijia",
     "tchushengdian",
     "tspawn"
    ],
    "pyi": [
     "fj",
     "fj",
     "tcsd",
     "tspawn"
    ]
   }
  ],
  "de_train": [
   {
    "name": "匪家",
    "search": [
     "匪家",
     "T出生点",
     "t-spawn"
    ],
    "u": 0.066,
    "v": 0.167,
    "pyf": [
     "feijia",
     "feijia",
     "tchushengdian",
     "tspawn"
    ],
    "pyi": [
     "fj",
     "fj",
     "tcsd",
     "tspawn"
    ]
   },
   {
    "name": "匪凹槽",
    "search": [
     "匪凹槽"
    ],
    "u": 0.129,
    "v": 0.24,
    "pyf": [
     "fei",
     "fei"
    ],
    "pyi": [
     "f",
     "f"
    ]
   },
   {
    "name": "匪楼梯",
    "search": [
     "匪楼梯"
    ],
    "u": 0.055,
    "v": 0.373,
    "pyf": [
     "feilouti",
     "feilouti"
    ],
    "pyi": [
     "flt",
     "flt"
    ]
   },
   {
    "name": "匪口",
    "search": [
     "匪口"
    ],
    "u": 0.115,
    "v": 0.368,
    "pyf": [
     "feikou",
     "feikou"
    ],
    "pyi": [
     "fk",
     "fk"
    ]
   },
   {
    "name": "匪口大箱",
    "search": [
     "匪口大箱"
    ],
    "u": 0.125,
    "v": 0.46,
    "pyf": [
     "feikoudaxiang",
     "feikoudaxiang"
    ],
    "pyi": [
     "fkdx",
     "fkdx"
    ]
   },
   {
    "name": "A旋梯",
    "search": [
     "A旋梯"
    ],
    "u": 0.014,
    "v": 0.61,
    "pyf": [
     "ati",
     "ati"
    ],
    "pyi": [
     "at",
     "at"
    ]
   },
   {
    "name": "B旋梯",
    "search": [
     "B旋梯"
    ],
    "u": 0.129,
    "v": 0.63,
    "pyf": [
     "bti",
     "bti"
    ],
    "pyi": [
     "bt",
     "bt"
    ]
   },
   {
    "name": "红楼梯",
    "search": [
     "红楼梯",
     "西红楼梯"
    ],
    "u": 0.157,
    "v": 0.588,
    "pyf": [
     "honglouti",
     "honglouti",
     "honglouti"
    ],
    "pyi": [
     "hlt",
     "hlt",
     "hlt"
    ]
   },
   {
    "name": "中红楼梯",
    "search": [
     "中红楼梯"
    ],
    "u": 0.463,
    "v": 0.592,
    "pyf": [
     "zhonghonglouti",
     "zhonghonglouti"
    ],
    "pyi": [
     "zhlt",
     "zhlt"
    ]
   },
   {
    "name": "匪二楼",
    "search": [
     "匪二楼"
    ],
    "u": 0.323,
    "v": 0.434,
    "pyf": [
     "feierlou",
     "feierlou"
    ],
    "pyi": [
     "fel",
     "fel"
    ]
   },
   {
    "name": "匪电箱",
    "search": [
     "匪电箱"
    ],
    "u": 0.386,
    "v": 0.484,
    "pyf": [
     "feidianxiang",
     "feidianxiang"
    ],
    "pyi": [
     "fdx",
     "fdx"
    ]
   },
   {
    "name": "休息室",
    "search": [
     "休息室"
    ],
    "u": 0.393,
    "v": 0.296,
    "pyf": [
     "",
     ""
    ],
    "pyi": [
     "",
     ""
    ]
   },
   {
    "name": "匪电梯",
    "search": [
     "匪电梯"
    ],
    "u": 0.317,
    "v": 0.262,
    "pyf": [
     "feidianti",
     "feidianti"
    ],
    "pyi": [
     "fdt",
     "fdt"
    ]
   },
   {
    "name": "侧道",
    "search": [
     "侧道",
     "后巷",
     "匪长廊"
    ],
    "u": 0.543,
    "v": 0.118,
    "pyf": [
     "cedao",
     "cedao",
     "hou",
     "fei"
    ],
    "pyi": [
     "cd",
     "cd",
     "h",
     "f"
    ]
   },
   {
    "name": "大垃圾箱",
    "search": [
     "大垃圾箱"
    ],
    "u": 0.473,
    "v": 0.195,
    "pyf": [
     "daxiang",
     "daxiang"
    ],
    "pyi": [
     "dx",
     "dx"
    ]
   },
   {
    "name": "侧道监视位",
    "search": [
     "侧道监视位"
    ],
    "u": 0.512,
    "v": 0.059,
    "pyf": [
     "cedaoshiwei",
     "cedaoshiwei"
    ],
    "pyi": [
     "cdsw",
     "cdsw"
    ]
   },
   {
    "name": "侧道垃圾桶",
    "search": [
     "侧道垃圾桶"
    ],
    "u": 0.755,
    "v": 0.143,
    "pyf": [
     "cedaotong",
     "cedaotong"
    ],
    "pyi": [
     "cdt",
     "cdt"
    ]
   },
   {
    "name": "白车",
    "search": [
     "白车",
     "侧道白车"
    ],
    "u": 0.647,
    "v": 0.15,
    "pyf": [
     "baiche",
     "baiche",
     "cedaobaiche"
    ],
    "pyi": [
     "bc",
     "bc",
     "cdbc"
    ]
   },
   {
    "name": "侧道黄箱",
    "search": [
     "侧道黄箱"
    ],
    "u": 0.692,
    "v": 0.198,
    "pyf": [
     "cedaohuangxiang",
     "cedaohuangxiang"
    ],
    "pyi": [
     "cdhx",
     "cdhx"
    ]
   },
   {
    "name": "侧道凹槽",
    "search": [
     "侧道凹槽"
    ],
    "u": 0.592,
    "v": 0.223,
    "pyf": [
     "cedao",
     "cedao"
    ],
    "pyi": [
     "cd",
     "cd"
    ]
   },
   {
    "name": "鸽子位",
    "search": [
     "鸽子位"
    ],
    "u": 0.88,
    "v": 0.108,
    "pyf": [
     "ziwei",
     "ziwei"
    ],
    "pyi": [
     "zw",
     "zw"
    ]
   },
   {
    "name": "绿通",
    "search": [
     "绿通"
    ],
    "u": 0.804,
    "v": 0.258,
    "pyf": [
     "tong",
     "tong"
    ],
    "pyi": [
     "t",
     "t"
    ]
   },
   {
    "name": "绿通凹槽",
    "search": [
     "绿通凹槽"
    ],
    "u": 0.887,
    "v": 0.223,
    "pyf": [
     "tong",
     "tong"
    ],
    "pyi": [
     "t",
     "t"
    ]
   },
   {
    "name": "匪口白箱",
    "search": [
     "匪口白箱"
    ],
    "u": 0.532,
    "v": 0.306,
    "pyf": [
     "feikoubaixiang",
     "feikoubaixiang"
    ],
    "pyi": [
     "fkbx",
     "fkbx"
    ]
   },
   {
    "name": "奥拉夫位",
    "search": [
     "奥拉夫位",
     "olaf"
    ],
    "u": 0.5,
    "v": 0.35,
    "pyf": [
     "wei",
     "wei",
     "olaf"
    ],
    "pyi": [
     "w",
     "w",
     "olaf"
    ]
   },
   {
    "name": "老三楼下",
    "search": [
     "老三楼下"
    ],
    "u": 0.685,
    "v": 0.306,
    "pyf": [
     "laosanlouxia",
     "laosanlouxia"
    ],
    "pyi": [
     "lslx",
     "lslx"
    ]
   },
   {
    "name": "六道",
    "search": [
     "六道"
    ],
    "u": 0.571,
    "v": 0.383,
    "pyf": [
     "liudao",
     "liudao"
    ],
    "pyi": [
     "ld",
     "ld"
    ]
   },
   {
    "name": "六道黄皮",
    "search": [
     "六道黄皮"
    ],
    "u": 0.679,
    "v": 0.386,
    "pyf": [
     "liudaohuang",
     "liudaohuang"
    ],
    "pyi": [
     "ldh",
     "ldh"
    ]
   },
   {
    "name": "六道尾/六库",
    "search": [
     "六道尾",
     "六库"
    ],
    "u": 0.821,
    "v": 0.383,
    "pyf": [
     "liudaoliuku",
     "liudao",
     "liuku"
    ],
    "pyi": [
     "ldlk",
     "ld",
     "lk"
    ]
   },
   {
    "name": "底线",
    "search": [
     "底线",
     "上底线"
    ],
    "u": 0.936,
    "v": 0.44,
    "pyf": [
     "dixian",
     "dixian",
     "shangdixian"
    ],
    "pyi": [
     "dx",
     "dx",
     "sdx"
    ]
   },
   {
    "name": "五道红皮",
    "search": [
     "五道红皮"
    ],
    "u": 0.522,
    "v": 0.438,
    "pyf": [
     "daohong",
     "daohong"
    ],
    "pyi": [
     "dh",
     "dh"
    ]
   },
   {
    "name": "五道",
    "search": [
     "五道"
    ],
    "u": 0.595,
    "v": 0.452,
    "pyf": [
     "dao",
     "dao"
    ],
    "pyi": [
     "d",
     "d"
    ]
   },
   {
    "name": "五道口",
    "search": [
     "五道口"
    ],
    "u": 0.738,
    "v": 0.456,
    "pyf": [
     "daokou",
     "daokou"
    ],
    "pyi": [
     "dk",
     "dk"
    ]
   },
   {
    "name": "电箱",
    "search": [
     "电箱",
     "场内电箱"
    ],
    "u": 0.512,
    "v": 0.487,
    "pyf": [
     "dianxiang",
     "dianxiang",
     "changneidianxiang"
    ],
    "pyi": [
     "dx",
     "dx",
     "cndx"
    ]
   },
   {
    "name": "四道",
    "search": [
     "四道"
    ],
    "u": 0.55,
    "v": 0.526,
    "pyf": [
     "dao",
     "dao"
    ],
    "pyi": [
     "d",
     "d"
    ]
   },
   {
    "name": "A 包点（外场）",
    "search": [
     "A包点",
     "A点",
     "外场"
    ],
    "u": 0.654,
    "v": 0.529,
    "pyf": [
     "abaodianwaichang",
     "abaodian",
     "adian",
     "waichang"
    ],
    "pyi": [
     "abdwc",
     "abd",
     "ad",
     "wc"
    ]
   },
   {
    "name": "包车尾",
    "search": [
     "包车尾"
    ],
    "u": 0.72,
    "v": 0.533,
    "pyf": [
     "baoche",
     "baoche"
    ],
    "pyi": [
     "bc",
     "bc"
    ]
   },
   {
    "name": "四道尾/四库",
    "search": [
     "四道尾",
     "四库"
    ],
    "u": 0.838,
    "v": 0.529,
    "pyf": [
     "daoku",
     "dao",
     "ku"
    ],
    "pyi": [
     "dk",
     "d",
     "k"
    ]
   },
   {
    "name": "二楼下",
    "search": [
     "二楼下"
    ],
    "u": 0.72,
    "v": 0.595,
    "pyf": [
     "erlouxia",
     "erlouxia"
    ],
    "pyi": [
     "elx",
     "elx"
    ]
   },
   {
    "name": "警中大箱",
    "search": [
     "警中大箱"
    ],
    "u": 0.532,
    "v": 0.637,
    "pyf": [
     "jingzhongdaxiang",
     "jingzhongdaxiang"
    ],
    "pyi": [
     "jzdx",
     "jzdx"
    ]
   },
   {
    "name": "警中",
    "search": [
     "警中"
    ],
    "u": 0.63,
    "v": 0.651,
    "pyf": [
     "jingzhong",
     "jingzhong"
    ],
    "pyi": [
     "jz",
     "jz"
    ]
   },
   {
    "name": "底线尾",
    "search": [
     "底线尾",
     "下底线"
    ],
    "u": 0.974,
    "v": 0.592,
    "pyf": [
     "dixian",
     "dixian",
     "xiadixian"
    ],
    "pyi": [
     "dx",
     "dx",
     "xdx"
    ]
   },
   {
    "name": "警连接",
    "search": [
     "警连接"
    ],
    "u": 0.71,
    "v": 0.696,
    "pyf": [
     "jinglianjie",
     "jinglianjie"
    ],
    "pyi": [
     "jlj",
     "jlj"
    ]
   },
   {
    "name": "连接台下",
    "search": [
     "连接台下"
    ],
    "u": 0.783,
    "v": 0.707,
    "pyf": [
     "lianjietaixia",
     "lianjietaixia"
    ],
    "pyi": [
     "ljtx",
     "ljtx"
    ]
   },
   {
    "name": "B斜坡/低坡",
    "search": [
     "B斜坡",
     "低坡"
    ],
    "u": 0.386,
    "v": 0.703,
    "pyf": [
     "b",
     "b",
     ""
    ],
    "pyi": [
     "b",
     "b",
     ""
    ]
   },
   {
    "name": "B二楼",
    "search": [
     "B二楼"
    ],
    "u": 0.296,
    "v": 0.736,
    "pyf": [
     "berlou",
     "berlou"
    ],
    "pyi": [
     "bel",
     "bel"
    ]
   },
   {
    "name": "B2台上",
    "search": [
     "B2台上"
    ],
    "u": 0.292,
    "v": 0.8,
    "pyf": [
     "b2taishang",
     "b2taishang"
    ],
    "pyi": [
     "b2ts",
     "b2ts"
    ]
   },
   {
    "name": "三道",
    "search": [
     "三道"
    ],
    "u": 0.477,
    "v": 0.755,
    "pyf": [
     "sandao",
     "sandao"
    ],
    "pyi": [
     "sd",
     "sd"
    ]
   },
   {
    "name": "前三道",
    "search": [
     "前三道"
    ],
    "u": 0.539,
    "v": 0.748,
    "pyf": [
     "qiansandao",
     "qiansandao"
    ],
    "pyi": [
     "qsd",
     "qsd"
    ]
   },
   {
    "name": "三道中",
    "search": [
     "三道中"
    ],
    "u": 0.609,
    "v": 0.748,
    "pyf": [
     "sandaozhong",
     "sandaozhong"
    ],
    "pyi": [
     "sdz",
     "sdz"
    ]
   },
   {
    "name": "后三道",
    "search": [
     "后三道"
    ],
    "u": 0.685,
    "v": 0.748,
    "pyf": [
     "housandao",
     "housandao"
    ],
    "pyi": [
     "hsd",
     "hsd"
    ]
   },
   {
    "name": "三道尾",
    "search": [
     "三道尾"
    ],
    "u": 0.793,
    "v": 0.755,
    "pyf": [
     "sandao",
     "sandao"
    ],
    "pyi": [
     "sd",
     "sd"
    ]
   },
   {
    "name": "二道",
    "search": [
     "二道"
    ],
    "u": 0.477,
    "v": 0.807,
    "pyf": [
     "erdao",
     "erdao"
    ],
    "pyi": [
     "ed",
     "ed"
    ]
   },
   {
    "name": "B 包点（内场）",
    "search": [
     "B包点",
     "B点",
     "内场"
    ],
    "u": 0.553,
    "v": 0.811,
    "pyf": [
     "bbaodianneichang",
     "bbaodian",
     "bdian",
     "neichang"
    ],
    "pyi": [
     "bbdnc",
     "bbd",
     "bd",
     "nc"
    ]
   },
   {
    "name": "二道尾",
    "search": [
     "二道尾"
    ],
    "u": 0.78,
    "v": 0.807,
    "pyf": [
     "erdao",
     "erdao"
    ],
    "pyi": [
     "ed",
     "ed"
    ]
   },
   {
    "name": "一道",
    "search": [
     "一道"
    ],
    "u": 0.49,
    "v": 0.866,
    "pyf": [
     "yidao",
     "yidao"
    ],
    "pyi": [
     "yd",
     "yd"
    ]
   },
   {
    "name": "油罐车",
    "search": [
     "油罐车"
    ],
    "u": 0.612,
    "v": 0.87,
    "pyf": [
     "youche",
     "youche"
    ],
    "pyi": [
     "yc",
     "yc"
    ]
   },
   {
    "name": "一道尾",
    "search": [
     "一道尾"
    ],
    "u": 0.78,
    "v": 0.866,
    "pyf": [
     "yidao",
     "yidao"
    ],
    "pyi": [
     "yd",
     "yd"
    ]
   },
   {
    "name": "B2狙位",
    "search": [
     "B2狙位"
    ],
    "u": 0.313,
    "v": 0.915,
    "pyf": [
     "b2juwei",
     "b2juwei"
    ],
    "pyi": [
     "b2jw",
     "b2jw"
    ]
   },
   {
    "name": "B2高台",
    "search": [
     "B2高台"
    ],
    "u": 0.47,
    "v": 0.915,
    "pyf": [
     "b2gaotai",
     "b2gaotai"
    ],
    "pyi": [
     "b2gt",
     "b2gt"
    ]
   },
   {
    "name": "警狙位",
    "search": [
     "警狙位"
    ],
    "u": 0.672,
    "v": 0.915,
    "pyf": [
     "jingjuwei",
     "jingjuwei"
    ],
    "pyi": [
     "jjw",
     "jjw"
    ]
   },
   {
    "name": "云梯",
    "search": [
     "云梯"
    ],
    "u": 0.832,
    "v": 0.915,
    "pyf": [
     "ti",
     "ti"
    ],
    "pyi": [
     "t",
     "t"
    ]
   },
   {
    "name": "警家",
    "search": [
     "警家",
     "CT出生点",
     "ct-spawn"
    ],
    "u": 0.905,
    "v": 0.814,
    "pyf": [
     "jingjia",
     "jingjia",
     "ctchushengdian",
     "ctspawn"
    ],
    "pyi": [
     "jj",
     "jj",
     "ctcsd",
     "ctspawn"
    ]
   }
  ],
  "de_overpass": [
   {
    "name": "银行",
    "search": [
     "银行",
     "bank"
    ],
    "u": 0.452,
    "v": 0.035,
    "pyf": [
     "xing",
     "xing",
     "bank"
    ],
    "pyi": [
     "x",
     "x",
     "bank"
    ]
   },
   {
    "name": "储藏室",
    "search": [
     "储藏室"
    ],
    "u": 0.473,
    "v": 0.087,
    "pyf": [
     "",
     ""
    ],
    "pyi": [
     "",
     ""
    ]
   },
   {
    "name": "运钞车",
    "search": [
     "运钞车"
    ],
    "u": 0.4,
    "v": 0.139,
    "pyf": [
     "che",
     "che"
    ],
    "pyi": [
     "c",
     "c"
    ]
   },
   {
    "name": "垃圾桶",
    "search": [
     "垃圾桶",
     "警垃圾桶"
    ],
    "u": 0.487,
    "v": 0.139,
    "pyf": [
     "tong",
     "tong",
     "jingtong"
    ],
    "pyi": [
     "t",
     "t",
     "jt"
    ]
   },
   {
    "name": "警楼梯",
    "search": [
     "警楼梯"
    ],
    "u": 0.539,
    "v": 0.136,
    "pyf": [
     "jinglouti",
     "jinglouti"
    ],
    "pyi": [
     "jlt",
     "jlt"
    ]
   },
   {
    "name": "阴人位",
    "search": [
     "阴人位"
    ],
    "u": 0.327,
    "v": 0.177,
    "pyf": [
     "yinrenwei",
     "yinrenwei"
    ],
    "pyi": [
     "yrw",
     "yrw"
    ]
   },
   {
    "name": "包点阴面",
    "search": [
     "包点阴面"
    ],
    "u": 0.414,
    "v": 0.177,
    "pyf": [
     "baodianyinmian",
     "baodianyinmian"
    ],
    "pyi": [
     "bdym",
     "bdym"
    ]
   },
   {
    "name": "警家",
    "search": [
     "警家",
     "CT出生点",
     "ct-spawn"
    ],
    "u": 0.487,
    "v": 0.181,
    "pyf": [
     "jingjia",
     "jingjia",
     "ctchushengdian",
     "ctspawn"
    ],
    "pyi": [
     "jj",
     "jj",
     "ctcsd",
     "ctspawn"
    ]
   },
   {
    "name": "包点阳面",
    "search": [
     "包点阳面"
    ],
    "u": 0.421,
    "v": 0.223,
    "pyf": [
     "baodianmian",
     "baodianmian"
    ],
    "pyi": [
     "bdm",
     "bdm"
    ]
   },
   {
    "name": "A 包点",
    "search": [
     "A包点",
     "A点"
    ],
    "u": 0.473,
    "v": 0.219,
    "pyf": [
     "abaodian",
     "abaodian",
     "adian"
    ],
    "pyi": [
     "abd",
     "abd",
     "ad"
    ]
   },
   {
    "name": "卡车头",
    "search": [
     "卡车头"
    ],
    "u": 0.518,
    "v": 0.219,
    "pyf": [
     "kachetou",
     "kachetou"
    ],
    "pyi": [
     "kct",
     "kct"
    ]
   },
   {
    "name": "卡车尾",
    "search": [
     "卡车尾"
    ],
    "u": 0.557,
    "v": 0.23,
    "pyf": [
     "kache",
     "kache"
    ],
    "pyi": [
     "kc",
     "kc"
    ]
   },
   {
    "name": "忍者位",
    "search": [
     "忍者位",
     "B1忍者位"
    ],
    "u": 0.369,
    "v": 0.303,
    "pyf": [
     "zhewei",
     "zhewei",
     "b1zhewei"
    ],
    "pyi": [
     "zw",
     "zw",
     "b1zw"
    ]
   },
   {
    "name": "长管忍者位",
    "search": [
     "长管忍者位"
    ],
    "u": 0.838,
    "v": 0.268,
    "pyf": [
     "zhewei",
     "zhewei"
    ],
    "pyi": [
     "zw",
     "zw"
    ]
   },
   {
    "name": "B1",
    "search": [
     "B1"
    ],
    "u": 0.515,
    "v": 0.282,
    "pyf": [
     "b1",
     "b1"
    ],
    "pyi": [
     "b1",
     "b1"
    ]
   },
   {
    "name": "老六位",
    "search": [
     "老六位"
    ],
    "u": 0.56,
    "v": 0.292,
    "pyf": [
     "laoliuwei",
     "laoliuwei"
    ],
    "pyi": [
     "llw",
     "llw"
    ]
   },
   {
    "name": "B二楼",
    "search": [
     "B二楼"
    ],
    "u": 0.592,
    "v": 0.247,
    "pyf": [
     "berlou",
     "berlou"
    ],
    "pyi": [
     "bel",
     "bel"
    ]
   },
   {
    "name": "水下",
    "search": [
     "水下"
    ],
    "u": 0.63,
    "v": 0.299,
    "pyf": [
     "shuixia",
     "shuixia"
    ],
    "pyi": [
     "sx",
     "sx"
    ]
   },
   {
    "name": "油桶",
    "search": [
     "油桶"
    ],
    "u": 0.748,
    "v": 0.254,
    "pyf": [
     "youtong",
     "youtong"
    ],
    "pyi": [
     "yt",
     "yt"
    ]
   },
   {
    "name": "B 包点",
    "search": [
     "B包点",
     "B点"
    ],
    "u": 0.696,
    "v": 0.317,
    "pyf": [
     "bbaodian",
     "bbaodian",
     "bdian"
    ],
    "pyi": [
     "bbd",
     "bbd",
     "bd"
    ]
   },
   {
    "name": "石柱",
    "search": [
     "石柱"
    ],
    "u": 0.738,
    "v": 0.334,
    "pyf": [
     "",
     ""
    ],
    "pyi": [
     "",
     ""
    ]
   },
   {
    "name": "长管外",
    "search": [
     "长管外"
    ],
    "u": 0.814,
    "v": 0.324,
    "pyf": [
     "wai",
     "wai"
    ],
    "pyi": [
     "w",
     "w"
    ]
   },
   {
    "name": "台下",
    "search": [
     "台下"
    ],
    "u": 0.459,
    "v": 0.317,
    "pyf": [
     "taixia",
     "taixia"
    ],
    "pyi": [
     "tx",
     "tx"
    ]
   },
   {
    "name": "厕所口",
    "search": [
     "厕所口"
    ],
    "u": 0.407,
    "v": 0.369,
    "pyf": [
     "cesuokou",
     "cesuokou"
    ],
    "pyi": [
     "csk",
     "csk"
    ]
   },
   {
    "name": "桥",
    "search": [
     "桥"
    ],
    "u": 0.651,
    "v": 0.376,
    "pyf": [
     "",
     ""
    ],
    "pyi": [
     "",
     ""
    ]
   },
   {
    "name": "狙位",
    "search": [
     "狙位",
     "A狙位"
    ],
    "u": 0.219,
    "v": 0.397,
    "pyf": [
     "juwei",
     "juwei",
     "ajuwei"
    ],
    "pyi": [
     "jw",
     "jw",
     "ajw"
    ]
   },
   {
    "name": "墙角",
    "search": [
     "墙角"
    ],
    "u": 0.282,
    "v": 0.397,
    "pyf": [
     "qiangjiao",
     "qiangjiao"
    ],
    "pyi": [
     "qj",
     "qj"
    ]
   },
   {
    "name": "凹槽",
    "search": [
     "凹槽",
     "B凹槽"
    ],
    "u": 0.626,
    "v": 0.41,
    "pyf": [
     "",
     "",
     "b"
    ],
    "pyi": [
     "",
     "",
     "b"
    ]
   },
   {
    "name": "B小",
    "search": [
     "B小"
    ],
    "u": 0.717,
    "v": 0.41,
    "pyf": [
     "bxiao",
     "bxiao"
    ],
    "pyi": [
     "bx",
     "bx"
    ]
   },
   {
    "name": "沙袋",
    "search": [
     "沙袋"
    ],
    "u": 0.748,
    "v": 0.449,
    "pyf": [
     "shadai",
     "shadai"
    ],
    "pyi": [
     "sd",
     "sd"
    ]
   },
   {
    "name": "长管",
    "search": [
     "长管"
    ],
    "u": 0.814,
    "v": 0.433,
    "pyf": [
     "",
     ""
    ],
    "pyi": [
     "",
     ""
    ]
   },
   {
    "name": "厕所",
    "search": [
     "厕所",
     "A厕所"
    ],
    "u": 0.438,
    "v": 0.45,
    "pyf": [
     "cesuo",
     "cesuo",
     "acesuo"
    ],
    "pyi": [
     "cs",
     "cs",
     "acs"
    ]
   },
   {
    "name": "A小",
    "search": [
     "A小"
    ],
    "u": 0.487,
    "v": 0.436,
    "pyf": [
     "axiao",
     "axiao"
    ],
    "pyi": [
     "ax",
     "ax"
    ]
   },
   {
    "name": "ABC墓地",
    "search": [
     "ABC墓地",
     "墓地"
    ],
    "u": 0.546,
    "v": 0.449,
    "pyf": [
     "abcdi",
     "abcdi",
     "di"
    ],
    "pyi": [
     "abcd",
     "abcd",
     "d"
    ]
   },
   {
    "name": "工地",
    "search": [
     "工地"
    ],
    "u": 0.647,
    "v": 0.48,
    "pyf": [
     "di",
     "di"
    ],
    "pyi": [
     "d",
     "d"
    ]
   },
   {
    "name": "门",
    "search": [
     "门",
     "B门"
    ],
    "u": 0.588,
    "v": 0.487,
    "pyf": [
     "men",
     "men",
     "bmen"
    ],
    "pyi": [
     "m",
     "m",
     "bm"
    ]
   },
   {
    "name": "短管",
    "search": [
     "短管"
    ],
    "u": 0.734,
    "v": 0.515,
    "pyf": [
     "",
     ""
    ],
    "pyi": [
     "",
     ""
    ]
   },
   {
    "name": "B外/长廊",
    "search": [
     "B外",
     "长廊"
    ],
    "u": 0.842,
    "v": 0.529,
    "pyf": [
     "bwai",
     "bwai",
     ""
    ],
    "pyi": [
     "bw",
     "bw",
     ""
    ]
   },
   {
    "name": "A大",
    "search": [
     "A大"
    ],
    "u": 0.184,
    "v": 0.494,
    "pyf": [
     "ada",
     "ada"
    ],
    "pyi": [
     "ad",
     "ad"
    ]
   },
   {
    "name": "A大厕所",
    "search": [
     "A大厕所"
    ],
    "u": 0.292,
    "v": 0.487,
    "pyf": [
     "adacesuo",
     "adacesuo"
    ],
    "pyi": [
     "adcs",
     "adcs"
    ]
   },
   {
    "name": "中段",
    "search": [
     "中段",
     "厕所中段"
    ],
    "u": 0.442,
    "v": 0.48,
    "pyf": [
     "zhongduan",
     "zhongduan",
     "cesuozhongduan"
    ],
    "pyi": [
     "zd",
     "zd",
     "cszd"
    ]
   },
   {
    "name": "树位",
    "search": [
     "树位",
     "A大树位"
    ],
    "u": 0.198,
    "v": 0.571,
    "pyf": [
     "wei",
     "wei",
     "adawei"
    ],
    "pyi": [
     "w",
     "w",
     "adw"
    ]
   },
   {
    "name": "气球",
    "search": [
     "气球"
    ],
    "u": 0.341,
    "v": 0.588,
    "pyf": [
     "",
     ""
    ],
    "pyi": [
     "",
     ""
    ]
   },
   {
    "name": "中路",
    "search": [
     "中路",
     "mid"
    ],
    "u": 0.431,
    "v": 0.567,
    "pyf": [
     "zhonglu",
     "zhonglu",
     "mid"
    ],
    "pyi": [
     "zl",
     "zl",
     "mid"
    ]
   },
   {
    "name": "下水道",
    "search": [
     "下水道"
    ],
    "u": 0.571,
    "v": 0.606,
    "pyf": [
     "xiashuidao",
     "xiashuidao"
    ],
    "pyi": [
     "xsd",
     "xsd"
    ]
   },
   {
    "name": "下水道口",
    "search": [
     "下水道口"
    ],
    "u": 0.484,
    "v": 0.59,
    "pyf": [
     "xiashuidaokou",
     "xiashuidaokou"
    ],
    "pyi": [
     "xsdk",
     "xsdk"
    ]
   },
   {
    "name": "石头",
    "search": [
     "石头"
    ],
    "u": 0.237,
    "v": 0.647,
    "pyf": [
     "tou",
     "tou"
    ],
    "pyi": [
     "t",
     "t"
    ]
   },
   {
    "name": "匪凹槽",
    "search": [
     "匪凹槽"
    ],
    "u": 0.905,
    "v": 0.71,
    "pyf": [
     "fei",
     "fei"
    ],
    "pyi": [
     "f",
     "f"
    ]
   },
   {
    "name": "喷泉",
    "search": [
     "喷泉"
    ],
    "u": 0.438,
    "v": 0.724,
    "pyf": [
     "",
     ""
    ],
    "pyi": [
     "",
     ""
    ]
   },
   {
    "name": "梯子",
    "search": [
     "梯子"
    ],
    "u": 0.595,
    "v": 0.72,
    "pyf": [
     "tizi",
     "tizi"
    ],
    "pyi": [
     "tz",
     "tz"
    ]
   },
   {
    "name": "匪楼梯",
    "search": [
     "匪楼梯"
    ],
    "u": 0.724,
    "v": 0.741,
    "pyf": [
     "feilouti",
     "feilouti"
    ],
    "pyi": [
     "flt",
     "flt"
    ]
   },
   {
    "name": "四架位",
    "search": [
     "四架位"
    ],
    "u": 0.793,
    "v": 0.741,
    "pyf": [
     "jiawei",
     "jiawei"
    ],
    "pyi": [
     "jw",
     "jw"
    ]
   },
   {
    "name": "游乐园",
    "search": [
     "游乐园"
    ],
    "u": 0.393,
    "v": 0.79,
    "pyf": [
     "yuan",
     "yuan"
    ],
    "pyi": [
     "y",
     "y"
    ]
   },
   {
    "name": "匪口",
    "search": [
     "匪口"
    ],
    "u": 0.571,
    "v": 0.79,
    "pyf": [
     "feikou",
     "feikou"
    ],
    "pyi": [
     "fk",
     "fk"
    ]
   },
   {
    "name": "匪垃圾桶",
    "search": [
     "匪垃圾桶"
    ],
    "u": 0.838,
    "v": 0.821,
    "pyf": [
     "feitong",
     "feitong"
    ],
    "pyi": [
     "ft",
     "ft"
    ]
   },
   {
    "name": "匪家",
    "search": [
     "匪家",
     "T出生点",
     "t-spawn"
    ],
    "u": 0.661,
    "v": 0.943,
    "pyf": [
     "feijia",
     "feijia",
     "tchushengdian",
     "tspawn"
    ],
    "pyi": [
     "fj",
     "fj",
     "tcsd",
     "tspawn"
    ]
   }
  ],
  "de_anubis": [
   {
    "name": "CT 水下",
    "search": [
     "CT水下",
     "水下"
    ],
    "u": 0.49,
    "v": 0.1,
    "pyf": [
     "ctshuixia",
     "ctshuixia",
     "shuixia"
    ],
    "pyi": [
     "ctsx",
     "ctsx",
     "sx"
    ]
   },
   {
    "name": "警家",
    "search": [
     "警家",
     "CT出生点",
     "ct-spawn"
    ],
    "u": 0.431,
    "v": 0.226,
    "pyf": [
     "jingjia",
     "jingjia",
     "ctchushengdian",
     "ctspawn"
    ],
    "pyi": [
     "jj",
     "jj",
     "ctcsd",
     "ctspawn"
    ]
   },
   {
    "name": "A2/天堂",
    "search": [
     "A2",
     "天堂",
     "heaven"
    ],
    "u": 0.672,
    "v": 0.244,
    "pyf": [
     "a2",
     "a2",
     "",
     "heaven"
    ],
    "pyi": [
     "a2",
     "a2",
     "",
     "heaven"
    ]
   },
   {
    "name": "狙击位",
    "search": [
     "狙击位",
     "A狙位"
    ],
    "u": 0.717,
    "v": 0.202,
    "pyf": [
     "juwei",
     "juwei",
     "ajuwei"
    ],
    "pyi": [
     "jw",
     "jw",
     "ajw"
    ]
   },
   {
    "name": "忍者位",
    "search": [
     "忍者位"
    ],
    "u": 0.79,
    "v": 0.198,
    "pyf": [
     "zhewei",
     "zhewei"
    ],
    "pyi": [
     "zw",
     "zw"
    ]
   },
   {
    "name": "A 包点",
    "search": [
     "A包点",
     "A点"
    ],
    "u": 0.748,
    "v": 0.261,
    "pyf": [
     "abaodian",
     "abaodian",
     "adian"
    ],
    "pyi": [
     "abd",
     "abd",
     "ad"
    ]
   },
   {
    "name": "喷泉/圆柱",
    "search": [
     "喷泉",
     "圆柱"
    ],
    "u": 0.877,
    "v": 0.275,
    "pyf": [
     "",
     "",
     ""
    ],
    "pyi": [
     "",
     "",
     ""
    ]
   },
   {
    "name": "旋转楼梯",
    "search": [
     "旋转楼梯"
    ],
    "u": 0.588,
    "v": 0.247,
    "pyf": [
     "louti",
     "louti"
    ],
    "pyi": [
     "lt",
     "lt"
    ]
   },
   {
    "name": "A门",
    "search": [
     "A门"
    ],
    "u": 0.838,
    "v": 0.365,
    "pyf": [
     "amen",
     "amen"
    ],
    "pyi": [
     "am",
     "am"
    ]
   },
   {
    "name": "狙位",
    "search": [
     "狙位",
     "B狙位"
    ],
    "u": 0.282,
    "v": 0.317,
    "pyf": [
     "juwei",
     "juwei",
     "bjuwei"
    ],
    "pyi": [
     "jw",
     "jw",
     "bjw"
    ]
   },
   {
    "name": "隧道",
    "search": [
     "隧道"
    ],
    "u": 0.358,
    "v": 0.334,
    "pyf": [
     "dao",
     "dao"
    ],
    "pyi": [
     "d",
     "d"
    ]
   },
   {
    "name": "B 连接上",
    "search": [
     "B连接上"
    ],
    "u": 0.508,
    "v": 0.33,
    "pyf": [
     "blianjieshang",
     "blianjieshang"
    ],
    "pyi": [
     "bljs",
     "bljs"
    ]
   },
   {
    "name": "警A小/连接",
    "search": [
     "警A小",
     "A小连接"
    ],
    "u": 0.62,
    "v": 0.379,
    "pyf": [
     "jingaxiaolianjie",
     "jingaxiao",
     "axiaolianjie"
    ],
    "pyi": [
     "jaxlj",
     "jax",
     "axlj"
    ]
   },
   {
    "name": "警中",
    "search": [
     "警中"
    ],
    "u": 0.567,
    "v": 0.397,
    "pyf": [
     "jingzhong",
     "jingzhong"
    ],
    "pyi": [
     "jz",
     "jz"
    ]
   },
   {
    "name": "后巷/警家",
    "search": [
     "后巷"
    ],
    "u": 0.296,
    "v": 0.4,
    "pyf": [
     "houjingjia",
     "hou"
    ],
    "pyi": [
     "hjj",
     "h"
    ]
   },
   {
    "name": "红桌",
    "search": [
     "红桌"
    ],
    "u": 0.859,
    "v": 0.407,
    "pyf": [
     "hong",
     "hong"
    ],
    "pyi": [
     "h",
     "h"
    ]
   },
   {
    "name": "铁门",
    "search": [
     "铁门"
    ],
    "u": 0.793,
    "v": 0.418,
    "pyf": [
     "men",
     "men"
    ],
    "pyi": [
     "m",
     "m"
    ]
   },
   {
    "name": "A通",
    "search": [
     "A通"
    ],
    "u": 0.835,
    "v": 0.438,
    "pyf": [
     "atong",
     "atong"
    ],
    "pyi": [
     "at",
     "at"
    ]
   },
   {
    "name": "B 连接",
    "search": [
     "B连接"
    ],
    "u": 0.428,
    "v": 0.418,
    "pyf": [
     "blianjie",
     "blianjie"
    ],
    "pyi": [
     "blj",
     "blj"
    ]
   },
   {
    "name": "拱门",
    "search": [
     "拱门"
    ],
    "u": 0.776,
    "v": 0.463,
    "pyf": [
     "gongmen",
     "gongmen"
    ],
    "pyi": [
     "gm",
     "gm"
    ]
   },
   {
    "name": "凹槽",
    "search": [
     "凹槽"
    ],
    "u": 0.226,
    "v": 0.48,
    "pyf": [
     "",
     ""
    ],
    "pyi": [
     "",
     ""
    ]
   },
   {
    "name": "B 包点",
    "search": [
     "B包点",
     "B点"
    ],
    "u": 0.327,
    "v": 0.497,
    "pyf": [
     "bbaodian",
     "bbaodian",
     "bdian"
    ],
    "pyi": [
     "bbd",
     "bbd",
     "bd"
    ]
   },
   {
    "name": "B平台",
    "search": [
     "B平台"
    ],
    "u": 0.407,
    "v": 0.459,
    "pyf": [
     "bpingtai",
     "bpingtai"
    ],
    "pyi": [
     "bpt",
     "bpt"
    ]
   },
   {
    "name": "二柱",
    "search": [
     "二柱"
    ],
    "u": 0.386,
    "v": 0.508,
    "pyf": [
     "er",
     "er"
    ],
    "pyi": [
     "e",
     "e"
    ]
   },
   {
    "name": "VIP",
    "search": [
     "VIP",
     "vip"
    ],
    "u": 0.505,
    "v": 0.477,
    "pyf": [
     "vip",
     "vip",
     "vip"
    ],
    "pyi": [
     "vip",
     "vip",
     "vip"
    ]
   },
   {
    "name": "死点",
    "search": [
     "死点",
     "B死点"
    ],
    "u": 0.438,
    "v": 0.518,
    "pyf": [
     "sidian",
     "sidian",
     "bsidian"
    ],
    "pyi": [
     "sd",
     "sd",
     "bsd"
    ]
   },
   {
    "name": "中门",
    "search": [
     "中门"
    ],
    "u": 0.571,
    "v": 0.512,
    "pyf": [
     "zhongmen",
     "zhongmen"
    ],
    "pyi": [
     "zm",
     "zm"
    ]
   },
   {
    "name": "A外",
    "search": [
     "A外"
    ],
    "u": 0.692,
    "v": 0.526,
    "pyf": [
     "awai",
     "awai"
    ],
    "pyi": [
     "aw",
     "aw"
    ]
   },
   {
    "name": "跳台",
    "search": [
     "跳台"
    ],
    "u": 0.776,
    "v": 0.526,
    "pyf": [
     "tiaotai",
     "tiaotai"
    ],
    "pyi": [
     "tt",
     "tt"
    ]
   },
   {
    "name": "一柱",
    "search": [
     "一柱"
    ],
    "u": 0.306,
    "v": 0.574,
    "pyf": [
     "yi",
     "yi"
    ],
    "pyi": [
     "y",
     "y"
    ]
   },
   {
    "name": "黑屋",
    "search": [
     "黑屋"
    ],
    "u": 0.39,
    "v": 0.574,
    "pyf": [
     "heiwu",
     "heiwu"
    ],
    "pyi": [
     "hw",
     "hw"
    ]
   },
   {
    "name": "B门",
    "search": [
     "B门"
    ],
    "u": 0.23,
    "v": 0.557,
    "pyf": [
     "bmen",
     "bmen"
    ],
    "pyi": [
     "bm",
     "bm"
    ]
   },
   {
    "name": "水渠双架",
    "search": [
     "水渠双架"
    ],
    "u": 0.595,
    "v": 0.557,
    "pyf": [
     "shuishuangjia",
     "shuishuangjia"
    ],
    "pyi": [
     "ssj",
     "ssj"
    ]
   },
   {
    "name": "桥上",
    "search": [
     "桥上"
    ],
    "u": 0.505,
    "v": 0.581,
    "pyf": [
     "shang",
     "shang"
    ],
    "pyi": [
     "s",
     "s"
    ]
   },
   {
    "name": "狗洞",
    "search": [
     "狗洞"
    ],
    "u": 0.539,
    "v": 0.588,
    "pyf": [
     "goudong",
     "goudong"
    ],
    "pyi": [
     "gd",
     "gd"
    ]
   },
   {
    "name": "B 水下",
    "search": [
     "B水下",
     "水下"
    ],
    "u": 0.456,
    "v": 0.592,
    "pyf": [
     "bshuixia",
     "bshuixia",
     "shuixia"
    ],
    "pyi": [
     "bsx",
     "bsx",
     "sx"
    ]
   },
   {
    "name": "A 水下",
    "search": [
     "A水下",
     "水下"
    ],
    "u": 0.64,
    "v": 0.592,
    "pyf": [
     "ashuixia",
     "ashuixia",
     "shuixia"
    ],
    "pyi": [
     "asx",
     "asx",
     "sx"
    ]
   },
   {
    "name": "B门外",
    "search": [
     "B门外"
    ],
    "u": 0.209,
    "v": 0.609,
    "pyf": [
     "bmenwai",
     "bmenwai"
    ],
    "pyi": [
     "bmw",
     "bmw"
    ]
   },
   {
    "name": "B 凹槽",
    "search": [
     "B凹槽"
    ],
    "u": 0.317,
    "v": 0.62,
    "pyf": [
     "b",
     "b"
    ],
    "pyi": [
     "b",
     "b"
    ]
   },
   {
    "name": "匪二楼",
    "search": [
     "匪二楼"
    ],
    "u": 0.78,
    "v": 0.6,
    "pyf": [
     "feierlou",
     "feierlou"
    ],
    "pyi": [
     "fel",
     "fel"
    ]
   },
   {
    "name": "匪中",
    "search": [
     "匪中"
    ],
    "u": 0.497,
    "v": 0.651,
    "pyf": [
     "feizhong",
     "feizhong"
    ],
    "pyi": [
     "fz",
     "fz"
    ]
   },
   {
    "name": "匪梯",
    "search": [
     "匪梯"
    ],
    "u": 0.679,
    "v": 0.651,
    "pyf": [
     "feiti",
     "feiti"
    ],
    "pyi": [
     "ft",
     "ft"
    ]
   },
   {
    "name": "B通平台/上",
    "search": [
     "B通平台",
     "B通上"
    ],
    "u": 0.247,
    "v": 0.71,
    "pyf": [
     "btongpingtaishang",
     "btongpingtai",
     "btongshang"
    ],
    "pyi": [
     "btpts",
     "btpt",
     "bts"
    ]
   },
   {
    "name": "B通",
    "search": [
     "B通"
    ],
    "u": 0.313,
    "v": 0.692,
    "pyf": [
     "btong",
     "btong"
    ],
    "pyi": [
     "bt",
     "bt"
    ]
   },
   {
    "name": "匪家凹槽",
    "search": [
     "匪家凹槽"
    ],
    "u": 0.518,
    "v": 0.838,
    "pyf": [
     "feijia",
     "feijia"
    ],
    "pyi": [
     "fj",
     "fj"
    ]
   },
   {
    "name": "匪家",
    "search": [
     "匪家",
     "T出生点",
     "t-spawn"
    ],
    "u": 0.484,
    "v": 0.912,
    "pyf": [
     "feijia",
     "feijia",
     "tchushengdian",
     "tspawn"
    ],
    "pyi": [
     "fj",
     "fj",
     "tcsd",
     "tspawn"
    ]
   }
  ],
  "cs_office": [
   {
    "name": "侧院",
    "search": [
     "侧院"
    ],
    "u": 0.15,
    "v": 0.24,
    "pyf": [
     "ce",
     "ce"
    ],
    "pyi": [
     "c",
     "c"
    ]
   },
   {
    "name": "红楼梯",
    "search": [
     "红楼梯"
    ],
    "u": 0.247,
    "v": 0.219,
    "pyf": [
     "honglouti",
     "honglouti"
    ],
    "pyi": [
     "hlt",
     "hlt"
    ]
   },
   {
    "name": "侧房",
    "search": [
     "侧房"
    ],
    "u": 0.292,
    "v": 0.306,
    "pyf": [
     "cefang",
     "cefang"
    ],
    "pyi": [
     "cf",
     "cf"
    ]
   },
   {
    "name": "侧廊",
    "search": [
     "侧廊"
    ],
    "u": 0.707,
    "v": 0.219,
    "pyf": [
     "ce",
     "ce"
    ],
    "pyi": [
     "c",
     "c"
    ]
   },
   {
    "name": "匪后门",
    "search": [
     "匪后门"
    ],
    "u": 0.776,
    "v": 0.24,
    "pyf": [
     "feihoumen",
     "feihoumen"
    ],
    "pyi": [
     "fhm",
     "fhm"
    ]
   },
   {
    "name": "匪家死点",
    "search": [
     "匪家死点"
    ],
    "u": 0.83,
    "v": 0.26,
    "pyf": [
     "feijiasidian",
     "feijiasidian"
    ],
    "pyi": [
     "fjsd",
     "fjsd"
    ]
   },
   {
    "name": "匪家",
    "search": [
     "匪家",
     "T出生点",
     "t-spawn"
    ],
    "u": 0.804,
    "v": 0.317,
    "pyf": [
     "feijia",
     "feijia",
     "tchushengdian",
     "tspawn"
    ],
    "pyi": [
     "fj",
     "fj",
     "tcsd",
     "tspawn"
    ]
   },
   {
    "name": "长廊",
    "search": [
     "长廊"
    ],
    "u": 0.602,
    "v": 0.324,
    "pyf": [
     "",
     ""
    ],
    "pyi": [
     "",
     ""
    ]
   },
   {
    "name": "匪前门",
    "search": [
     "匪前门"
    ],
    "u": 0.717,
    "v": 0.341,
    "pyf": [
     "feiqianmen",
     "feiqianmen"
    ],
    "pyi": [
     "fqm",
     "fqm"
    ]
   },
   {
    "name": "弯道",
    "search": [
     "弯道"
    ],
    "u": 0.672,
    "v": 0.41,
    "pyf": [
     "dao",
     "dao"
    ],
    "pyi": [
     "d",
     "d"
    ]
   },
   {
    "name": "连接死点",
    "search": [
     "连接死点"
    ],
    "u": 0.463,
    "v": 0.358,
    "pyf": [
     "lianjiesidian",
     "lianjiesidian"
    ],
    "pyi": [
     "ljsd",
     "ljsd"
    ]
   },
   {
    "name": "电脑",
    "search": [
     "电脑",
     "电箱"
    ],
    "u": 0.783,
    "v": 0.362,
    "pyf": [
     "dian",
     "dian",
     "dianxiang"
    ],
    "pyi": [
     "d",
     "d",
     "dx"
    ]
   },
   {
    "name": "Flock",
    "search": [
     "Flock",
     "flock"
    ],
    "u": 0.372,
    "v": 0.386,
    "pyf": [
     "flock",
     "flock",
     "flock"
    ],
    "pyi": [
     "flock",
     "flock",
     "flock"
    ]
   },
   {
    "name": "办公室",
    "search": [
     "办公室"
    ],
    "u": 0.323,
    "v": 0.424,
    "pyf": [
     "",
     ""
    ],
    "pyi": [
     "",
     ""
    ]
   },
   {
    "name": "侧道",
    "search": [
     "侧道"
    ],
    "u": 0.529,
    "v": 0.418,
    "pyf": [
     "cedao",
     "cedao"
    ],
    "pyi": [
     "cd",
     "cd"
    ]
   },
   {
    "name": "连接",
    "search": [
     "连接",
     "connector"
    ],
    "u": 0.456,
    "v": 0.487,
    "pyf": [
     "lianjie",
     "lianjie",
     "connector"
    ],
    "pyi": [
     "lj",
     "lj",
     "connector"
    ]
   },
   {
    "name": "厕所",
    "search": [
     "厕所"
    ],
    "u": 0.612,
    "v": 0.501,
    "pyf": [
     "cesuo",
     "cesuo"
    ],
    "pyi": [
     "cs",
     "cs"
    ]
   },
   {
    "name": "意大利",
    "search": [
     "意大利",
     "italy"
    ],
    "u": 0.254,
    "v": 0.494,
    "pyf": [
     "yida",
     "yida",
     "italy"
    ],
    "pyi": [
     "yd",
     "yd",
     "italy"
    ]
   },
   {
    "name": "会议室",
    "search": [
     "会议室"
    ],
    "u": 0.936,
    "v": 0.477,
    "pyf": [
     "",
     ""
    ],
    "pyi": [
     "",
     ""
    ]
   },
   {
    "name": "仓库/小黑屋",
    "search": [
     "仓库",
     "小黑屋"
    ],
    "u": 0.748,
    "v": 0.484,
    "pyf": [
     "kuxiaoheiwu",
     "ku",
     "xiaoheiwu"
    ],
    "pyi": [
     "kxhw",
     "k",
     "xhw"
    ]
   },
   {
    "name": "大狙击位/vip",
    "search": [
     "大狙击位",
     "vip"
    ],
    "u": 0.056,
    "v": 0.529,
    "pyf": [
     "dajuweivip",
     "dajuwei",
     "vip"
    ],
    "pyi": [
     "djwvip",
     "djw",
     "vip"
    ]
   },
   {
    "name": "前院",
    "search": [
     "前院"
    ],
    "u": 0.146,
    "v": 0.536,
    "pyf": [
     "qian",
     "qian"
    ],
    "pyi": [
     "q",
     "q"
    ]
   },
   {
    "name": "前院蓝箱",
    "search": [
     "前院蓝箱"
    ],
    "u": 0.244,
    "v": 0.557,
    "pyf": [
     "qianlanxiang",
     "qianlanxiang"
    ],
    "pyi": [
     "qlx",
     "qlx"
    ]
   },
   {
    "name": "中门窗户",
    "search": [
     "中门窗户"
    ],
    "u": 0.379,
    "v": 0.567,
    "pyf": [
     "zhongmenhu",
     "zhongmenhu"
    ],
    "pyi": [
     "zmh",
     "zmh"
    ]
   },
   {
    "name": "中路",
    "search": [
     "中路",
     "mid"
    ],
    "u": 0.557,
    "v": 0.567,
    "pyf": [
     "zhonglu",
     "zhonglu",
     "mid"
    ],
    "pyi": [
     "zl",
     "zl",
     "mid"
    ]
   },
   {
    "name": "电梯间",
    "search": [
     "电梯间"
    ],
    "u": 0.672,
    "v": 0.578,
    "pyf": [
     "diantijian",
     "diantijian"
    ],
    "pyi": [
     "dtj",
     "dtj"
    ]
   },
   {
    "name": "厨房",
    "search": [
     "厨房"
    ],
    "u": 0.783,
    "v": 0.574,
    "pyf": [
     "fang",
     "fang"
    ],
    "pyi": [
     "f",
     "f"
    ]
   },
   {
    "name": "后路/后院通道",
    "search": [
     "后路",
     "后院通道"
    ],
    "u": 0.574,
    "v": 0.644,
    "pyf": [
     "houluhoutongdao",
     "houlu",
     "houtongdao"
    ],
    "pyi": [
     "hlhtd",
     "hl",
     "htd"
    ]
   },
   {
    "name": "楼梯井",
    "search": [
     "楼梯井"
    ],
    "u": 0.435,
    "v": 0.675,
    "pyf": [
     "louti",
     "louti"
    ],
    "pyi": [
     "lt",
     "lt"
    ]
   },
   {
    "name": "小狙击位",
    "search": [
     "小狙击位"
    ],
    "u": 0.278,
    "v": 0.713,
    "pyf": [
     "xiaojuwei",
     "xiaojuwei"
    ],
    "pyi": [
     "xjw",
     "xjw"
    ]
   },
   {
    "name": "后院箱子",
    "search": [
     "后院箱子"
    ],
    "u": 0.71,
    "v": 0.741,
    "pyf": [
     "houxiangzi",
     "houxiangzi"
    ],
    "pyi": [
     "hxz",
     "hxz"
    ]
   },
   {
    "name": "后院",
    "search": [
     "后院"
    ],
    "u": 0.657,
    "v": 0.842,
    "pyf": [
     "hou",
     "hou"
    ],
    "pyi": [
     "h",
     "h"
    ]
   },
   {
    "name": "警家",
    "search": [
     "警家",
     "CT出生点",
     "ct-spawn"
    ],
    "u": 0.177,
    "v": 0.88,
    "pyf": [
     "jingjia",
     "jingjia",
     "ctchushengdian",
     "ctspawn"
    ],
    "pyi": [
     "jj",
     "jj",
     "ctcsd",
     "ctspawn"
    ]
   },
   {
    "name": "警家蓝箱",
    "search": [
     "警家蓝箱"
    ],
    "u": 0.365,
    "v": 0.88,
    "pyf": [
     "jingjialanxiang",
     "jingjialanxiang"
    ],
    "pyi": [
     "jjlx",
     "jjlx"
    ]
   },
   {
    "name": "警车",
    "search": [
     "警车"
    ],
    "u": 0.212,
    "v": 0.943,
    "pyf": [
     "jingche",
     "jingche"
    ],
    "pyi": [
     "jc",
     "jc"
    ]
   },
   {
    "name": "车库",
    "search": [
     "车库"
    ],
    "u": 0.477,
    "v": 0.88,
    "pyf": [
     "cheku",
     "cheku"
    ],
    "pyi": [
     "ck",
     "ck"
    ]
   }
  ],
  "de_nuke": [
   {
    "name": "匪家",
    "search": [
     "匪家",
     "T出生点"
    ],
    "u": 0.202,
    "v": 0.276,
    "pyf": [
     "feijia",
     "feijia",
     "tchushengdian"
    ],
    "pyi": [
     "fj",
     "fj",
     "tcsd"
    ]
   },
   {
    "name": "内场",
    "search": [
     "内场"
    ],
    "u": 0.478,
    "v": 0.27,
    "pyf": [
     "neichang",
     "neichang"
    ],
    "pyi": [
     "nc",
     "nc"
    ]
   },
   {
    "name": "匪厅",
    "search": [
     "匪厅",
     "T厅"
    ],
    "u": 0.445,
    "v": 0.2525,
    "pyf": [
     "fei",
     "fei",
     "t"
    ],
    "pyi": [
     "f",
     "f",
     "t"
    ]
   },
   {
    "name": "贩卖机",
    "search": [
     "贩卖机"
    ],
    "u": 0.438,
    "v": 0.231,
    "pyf": [
     "ji",
     "ji"
    ],
    "pyi": [
     "j",
     "j"
    ]
   },
   {
    "name": "垃圾桶",
    "search": [
     "垃圾桶"
    ],
    "u": 0.42,
    "v": 0.276,
    "pyf": [
     "tong",
     "tong"
    ],
    "pyi": [
     "t",
     "t"
    ]
   },
   {
    "name": "卡车",
    "search": [
     "卡车"
    ],
    "u": 0.408,
    "v": 0.293,
    "pyf": [
     "kache",
     "kache"
    ],
    "pyi": [
     "kc",
     "kc"
    ]
   },
   {
    "name": "外场",
    "search": [
     "外场"
    ],
    "u": 0.395,
    "v": 0.31,
    "pyf": [
     "waichang",
     "waichang"
    ],
    "pyi": [
     "wc",
     "wc"
    ]
   },
   {
    "name": "山上/水箱",
    "search": [
     "山上",
     "水箱"
    ],
    "u": 0.493,
    "v": 0.3175,
    "pyf": [
     "shangshuixiang",
     "shang",
     "shuixiang"
    ],
    "pyi": [
     "ssx",
     "s",
     "sx"
    ]
   },
   {
    "name": "山上狙位",
    "search": [
     "山上狙位",
     "狙位"
    ],
    "u": 0.468,
    "v": 0.331,
    "pyf": [
     "shangjuwei",
     "shangjuwei",
     "juwei"
    ],
    "pyi": [
     "sjw",
     "sjw",
     "jw"
    ]
   },
   {
    "name": "铁门房",
    "search": [
     "铁门房"
    ],
    "u": 0.488,
    "v": 0.294,
    "pyf": [
     "menfang",
     "menfang"
    ],
    "pyi": [
     "mf",
     "mf"
    ]
   },
   {
    "name": "铁门",
    "search": [
     "铁门"
    ],
    "u": 0.528,
    "v": 0.294,
    "pyf": [
     "men",
     "men"
    ],
    "pyi": [
     "m",
     "m"
    ]
   },
   {
    "name": "三箱",
    "search": [
     "三箱"
    ],
    "u": 0.565,
    "v": 0.281,
    "pyf": [
     "sanxiang",
     "sanxiang"
    ],
    "pyi": [
     "sx",
     "sx"
    ]
   },
   {
    "name": "管道",
    "search": [
     "管道"
    ],
    "u": 0.52,
    "v": 0.301,
    "pyf": [
     "dao",
     "dao"
    ],
    "pyi": [
     "d",
     "d"
    ]
   },
   {
    "name": "凹槽",
    "search": [
     "凹槽"
    ],
    "u": 0.498,
    "v": 0.304,
    "pyf": [
     "",
     ""
    ],
    "pyi": [
     "",
     ""
    ]
   },
   {
    "name": "正门",
    "search": [
     "正门"
    ],
    "u": 0.556,
    "v": 0.309,
    "pyf": [
     "zhengmen",
     "zhengmen"
    ],
    "pyi": [
     "zm",
     "zm"
    ]
   },
   {
    "name": "正门上",
    "search": [
     "正门上"
    ],
    "u": 0.532,
    "v": 0.296,
    "pyf": [
     "zhengmenshang",
     "zhengmenshang"
    ],
    "pyi": [
     "zms",
     "zms"
    ]
   },
   {
    "name": "死管",
    "search": [
     "死管"
    ],
    "u": 0.556,
    "v": 0.294,
    "pyf": [
     "si",
     "si"
    ],
    "pyi": [
     "s",
     "s"
    ]
   },
   {
    "name": "仓库箱",
    "search": [
     "仓库箱"
    ],
    "u": 0.615,
    "v": 0.2925,
    "pyf": [
     "kuxiang",
     "kuxiang"
    ],
    "pyi": [
     "kx",
     "kx"
    ]
   },
   {
    "name": "红房狙位",
    "search": [
     "红房狙位"
    ],
    "u": 0.638,
    "v": 0.3075,
    "pyf": [
     "hongfangjuwei",
     "hongfangjuwei"
    ],
    "pyi": [
     "hfjw",
     "hfjw"
    ]
   },
   {
    "name": "红房/大仓",
    "search": [
     "红房",
     "大仓"
    ],
    "u": 0.705,
    "v": 0.33,
    "pyf": [
     "hongfangda",
     "hongfang",
     "da"
    ],
    "pyi": [
     "hfd",
     "hf",
     "d"
    ]
   },
   {
    "name": "红箱",
    "search": [
     "红箱"
    ],
    "u": 0.565,
    "v": 0.3425,
    "pyf": [
     "hongxiang",
     "hongxiang"
    ],
    "pyi": [
     "hx",
     "hx"
    ]
   },
   {
    "name": "K1",
    "search": [
     "K1"
    ],
    "u": 0.7,
    "v": 0.36,
    "pyf": [
     "k1",
     "k1"
    ],
    "pyi": [
     "k1",
     "k1"
    ]
   },
   {
    "name": "A 包点",
    "search": [
     "A包点",
     "A点"
    ],
    "u": 0.573,
    "v": 0.25,
    "pyf": [
     "abaodian",
     "abaodian",
     "adian"
    ],
    "pyi": [
     "abd",
     "abd",
     "ad"
    ]
   },
   {
    "name": "狙位",
    "search": [
     "狙位"
    ],
    "u": 0.56,
    "v": 0.15,
    "pyf": [
     "juwei",
     "juwei"
    ],
    "pyi": [
     "jw",
     "jw"
    ]
   },
   {
    "name": "铁板斜坡",
    "search": [
     "铁板斜坡"
    ],
    "u": 0.575,
    "v": 0.186,
    "pyf": [
     "ban",
     "ban"
    ],
    "pyi": [
     "b",
     "b"
    ]
   },
   {
    "name": "铁板",
    "search": [
     "铁板"
    ],
    "u": 0.57,
    "v": 0.204,
    "pyf": [
     "ban",
     "ban"
    ],
    "pyi": [
     "b",
     "b"
    ]
   },
   {
    "name": "连接",
    "search": [
     "连接"
    ],
    "u": 0.525,
    "v": 0.2225,
    "pyf": [
     "lianjie",
     "lianjie"
    ],
    "pyi": [
     "lj",
     "lj"
    ]
   },
   {
    "name": "双架",
    "search": [
     "双架"
    ],
    "u": 0.622,
    "v": 0.251,
    "pyf": [
     "shuangjia",
     "shuangjia"
    ],
    "pyi": [
     "sj",
     "sj"
    ]
   },
   {
    "name": "屋檐",
    "search": [
     "屋檐"
    ],
    "u": 0.598,
    "v": 0.226,
    "pyf": [
     "wuyan",
     "wuyan"
    ],
    "pyi": [
     "wy",
     "wy"
    ]
   },
   {
    "name": "三楼下",
    "search": [
     "三楼下"
    ],
    "u": 0.618,
    "v": 0.219,
    "pyf": [
     "sanlouxia",
     "sanlouxia"
    ],
    "pyi": [
     "slx",
     "slx"
    ]
   },
   {
    "name": "三楼",
    "search": [
     "三楼"
    ],
    "u": 0.638,
    "v": 0.206,
    "pyf": [
     "sanlou",
     "sanlou"
    ],
    "pyi": [
     "sl",
     "sl"
    ]
   },
   {
    "name": "陈列室",
    "search": [
     "陈列室"
    ],
    "u": 0.468,
    "v": 0.235,
    "pyf": [
     "",
     ""
    ],
    "pyi": [
     "",
     ""
    ]
   },
   {
    "name": "忍者位",
    "search": [
     "忍者位"
    ],
    "u": 0.478,
    "v": 0.261,
    "pyf": [
     "zhewei",
     "zhewei"
    ],
    "pyi": [
     "zw",
     "zw"
    ]
   },
   {
    "name": "一层",
    "search": [
     "一层"
    ],
    "u": 0.532,
    "v": 0.2725,
    "pyf": [
     "yiceng",
     "yiceng"
    ],
    "pyi": [
     "yc",
     "yc"
    ]
   },
   {
    "name": "黄房",
    "search": [
     "黄房"
    ],
    "u": 0.618,
    "v": 0.274,
    "pyf": [
     "huangfang",
     "huangfang"
    ],
    "pyi": [
     "hf",
     "hf"
    ]
   },
   {
    "name": "更衣室",
    "search": [
     "更衣室"
    ],
    "u": 0.658,
    "v": 0.239,
    "pyf": [
     "",
     ""
    ],
    "pyi": [
     "",
     ""
    ]
   },
   {
    "name": "CT箱",
    "search": [
     "CT箱"
    ],
    "u": 0.695,
    "v": 0.246,
    "pyf": [
     "ctxiang",
     "ctxiang"
    ],
    "pyi": [
     "ctx",
     "ctx"
    ]
   },
   {
    "name": "警家",
    "search": [
     "警家",
     "CT出生点"
    ],
    "u": 0.815,
    "v": 0.235,
    "pyf": [
     "jingjia",
     "jingjia",
     "ctchushengdian"
    ],
    "pyi": [
     "jj",
     "jj",
     "ctcsd"
    ]
   },
   {
    "name": "B 包点",
    "search": [
     "B包点",
     "B点"
    ],
    "u": 0.561,
    "v": 0.7585,
    "pyf": [
     "bbaodian",
     "bbaodian",
     "bdian"
    ],
    "pyi": [
     "bbd",
     "bbd",
     "bd"
    ]
   },
   {
    "name": "B斜坡",
    "search": [
     "B斜坡"
    ],
    "u": 0.56,
    "v": 0.71,
    "pyf": [
     "b",
     "b"
    ],
    "pyi": [
     "b",
     "b"
    ]
   },
   {
    "name": "控制室",
    "search": [
     "控制室"
    ],
    "u": 0.655,
    "v": 0.736,
    "pyf": [
     "kong",
     "kong"
    ],
    "pyi": [
     "k",
     "k"
    ]
   },
   {
    "name": "二层",
    "search": [
     "二层"
    ],
    "u": 0.585,
    "v": 0.731,
    "pyf": [
     "erceng",
     "erceng"
    ],
    "pyi": [
     "ec",
     "ec"
    ]
   },
   {
    "name": "B 忍者位",
    "search": [
     "B忍者位",
     "忍者位"
    ],
    "u": 0.598,
    "v": 0.774,
    "pyf": [
     "bzhewei",
     "bzhewei",
     "zhewei"
    ],
    "pyi": [
     "bzw",
     "bzw",
     "zw"
    ]
   },
   {
    "name": "活门",
    "search": [
     "活门"
    ],
    "u": 0.545,
    "v": 0.774,
    "pyf": [
     "men",
     "men"
    ],
    "pyi": [
     "m",
     "m"
    ]
   },
   {
    "name": "死点",
    "search": [
     "死点"
    ],
    "u": 0.508,
    "v": 0.776,
    "pyf": [
     "sidian",
     "sidian"
    ],
    "pyi": [
     "sd",
     "sd"
    ]
   },
   {
    "name": "死门",
    "search": [
     "死门"
    ],
    "u": 0.472,
    "v": 0.764,
    "pyf": [
     "simen",
     "simen"
    ],
    "pyi": [
     "sm",
     "sm"
    ]
   },
   {
    "name": "B 管道",
    "search": [
     "B管道",
     "管道"
    ],
    "u": 0.438,
    "v": 0.746,
    "pyf": [
     "bdao",
     "bdao",
     "dao"
    ],
    "pyi": [
     "bd",
     "bd",
     "d"
    ]
   },
   {
    "name": "管道外",
    "search": [
     "管道外"
    ],
    "u": 0.418,
    "v": 0.7275,
    "pyf": [
     "daowai",
     "daowai"
    ],
    "pyi": [
     "dw",
     "dw"
    ]
   },
   {
    "name": "K2/洗手间",
    "search": [
     "K2",
     "洗手间"
    ],
    "u": 0.33,
    "v": 0.76,
    "pyf": [
     "k2shoujian",
     "k2",
     "shoujian"
    ],
    "pyi": [
     "k2sj",
     "k2",
     "sj"
    ]
   },
   {
    "name": "K1走廊",
    "search": [
     "K1走廊"
    ],
    "u": 0.622,
    "v": 0.799,
    "pyf": [
     "k1zou",
     "k1zou"
    ],
    "pyi": [
     "k1z",
     "k1z"
    ]
   },
   {
    "name": "K1楼梯",
    "search": [
     "K1楼梯"
    ],
    "u": 0.638,
    "v": 0.834,
    "pyf": [
     "k1louti",
     "k1louti"
    ],
    "pyi": [
     "k1lt",
     "k1lt"
    ]
   },
   {
    "name": "K1 大厅",
    "search": [
     "K1大厅",
     "K1"
    ],
    "u": 0.685,
    "v": 0.8175,
    "pyf": [
     "k1da",
     "k1da",
     "k1"
    ],
    "pyi": [
     "k1d",
     "k1d",
     "k1"
    ]
   }
  ],
  "de_vertigo": [
   {
    "name": "B 包点",
    "search": [
     "B包点",
     "B点"
    ],
    "u": 0.207,
    "v": 0.1135,
    "pyf": [
     "bbaodian",
     "bbaodian",
     "bdian"
    ],
    "pyi": [
     "bbd",
     "bbd",
     "bd"
    ]
   },
   {
    "name": "柱子",
    "search": [
     "柱子"
    ],
    "u": 0.235,
    "v": 0.1225,
    "pyf": [
     "zi",
     "zi"
    ],
    "pyi": [
     "z",
     "z"
    ]
   },
   {
    "name": "三箱",
    "search": [
     "三箱"
    ],
    "u": 0.262,
    "v": 0.104,
    "pyf": [
     "sanxiang",
     "sanxiang"
    ],
    "pyi": [
     "sx",
     "sx"
    ]
   },
   {
    "name": "二箱",
    "search": [
     "二箱"
    ],
    "u": 0.185,
    "v": 0.134,
    "pyf": [
     "erxiang",
     "erxiang"
    ],
    "pyi": [
     "ex",
     "ex"
    ]
   },
   {
    "name": "一箱",
    "search": [
     "一箱"
    ],
    "u": 0.148,
    "v": 0.1475,
    "pyf": [
     "yixiang",
     "yixiang"
    ],
    "pyi": [
     "yx",
     "yx"
    ]
   },
   {
    "name": "一箱后",
    "search": [
     "一箱后"
    ],
    "u": 0.125,
    "v": 0.159,
    "pyf": [
     "yixianghou",
     "yixianghou"
    ],
    "pyi": [
     "yxh",
     "yxh"
    ]
   },
   {
    "name": "电箱",
    "search": [
     "电箱"
    ],
    "u": 0.245,
    "v": 0.1525,
    "pyf": [
     "dianxiang",
     "dianxiang"
    ],
    "pyi": [
     "dx",
     "dx"
    ]
   },
   {
    "name": "跳台",
    "search": [
     "跳台"
    ],
    "u": 0.302,
    "v": 0.159,
    "pyf": [
     "tiaotai",
     "tiaotai"
    ],
    "pyi": [
     "tt",
     "tt"
    ]
   },
   {
    "name": "老跳台",
    "search": [
     "老跳台"
    ],
    "u": 0.275,
    "v": 0.169,
    "pyf": [
     "laotiaotai",
     "laotiaotai"
    ],
    "pyi": [
     "ltt",
     "ltt"
    ]
   },
   {
    "name": "木板/双架位",
    "search": [
     "木板",
     "双架位"
    ],
    "u": 0.222,
    "v": 0.1725,
    "pyf": [
     "banshuangjiawei",
     "ban",
     "shuangjiawei"
    ],
    "pyi": [
     "bsjw",
     "b",
     "sjw"
    ]
   },
   {
    "name": "B楼梯",
    "search": [
     "B楼梯"
    ],
    "u": 0.162,
    "v": 0.241,
    "pyf": [
     "blouti",
     "blouti"
    ],
    "pyi": [
     "blt",
     "blt"
    ]
   },
   {
    "name": "匪楼梯",
    "search": [
     "匪楼梯"
    ],
    "u": 0.208,
    "v": 0.219,
    "pyf": [
     "feilouti",
     "feilouti"
    ],
    "pyi": [
     "flt",
     "flt"
    ]
   },
   {
    "name": "警家",
    "search": [
     "警家",
     "CT出生点"
    ],
    "u": 0.552,
    "v": 0.114,
    "pyf": [
     "jingjia",
     "jingjia",
     "ctchushengdian"
    ],
    "pyi": [
     "jj",
     "jj",
     "ctcsd"
    ]
   },
   {
    "name": "匪一楼",
    "search": [
     "匪一楼"
    ],
    "u": 0.505,
    "v": 0.2325,
    "pyf": [
     "feiyilou",
     "feiyilou"
    ],
    "pyi": [
     "fyl",
     "fyl"
    ]
   },
   {
    "name": "匪家",
    "search": [
     "匪家",
     "T出生点"
    ],
    "u": 0.41,
    "v": 0.374,
    "pyf": [
     "feijia",
     "feijia",
     "tchushengdian"
    ],
    "pyi": [
     "fj",
     "fj",
     "tcsd"
    ]
   },
   {
    "name": "51区",
    "search": [
     "51区"
    ],
    "u": 0.362,
    "v": 0.391,
    "pyf": [
     "51qu",
     "51qu"
    ],
    "pyi": [
     "51q",
     "51q"
    ]
   },
   {
    "name": "发电机",
    "search": [
     "发电机"
    ],
    "u": 0.128,
    "v": 0.361,
    "pyf": [
     "dianji",
     "dianji"
    ],
    "pyi": [
     "dj",
     "dj"
    ]
   },
   {
    "name": "匪二楼",
    "search": [
     "匪二楼"
    ],
    "u": 0.148,
    "v": 0.395,
    "pyf": [
     "feierlou",
     "feierlou"
    ],
    "pyi": [
     "fel",
     "fel"
    ]
   },
   {
    "name": "后路",
    "search": [
     "后路"
    ],
    "u": 0.475,
    "v": 0.2725,
    "pyf": [
     "houlu",
     "houlu"
    ],
    "pyi": [
     "hl",
     "hl"
    ]
   },
   {
    "name": "中路",
    "search": [
     "中路",
     "mid"
    ],
    "u": 0.362,
    "v": 0.2725,
    "pyf": [
     "zhonglu",
     "zhonglu",
     "mid"
    ],
    "pyi": [
     "zl",
     "zl",
     "mid"
    ]
   },
   {
    "name": "中路箱子",
    "search": [
     "中路箱子"
    ],
    "u": 0.335,
    "v": 0.2575,
    "pyf": [
     "zhongluxiangzi",
     "zhongluxiangzi"
    ],
    "pyi": [
     "zlxz",
     "zlxz"
    ]
   },
   {
    "name": "中厅",
    "search": [
     "中厅"
    ],
    "u": 0.362,
    "v": 0.2175,
    "pyf": [
     "zhong",
     "zhong"
    ],
    "pyi": [
     "z",
     "z"
    ]
   },
   {
    "name": "电梯房",
    "search": [
     "电梯房"
    ],
    "u": 0.455,
    "v": 0.294,
    "pyf": [
     "diantifang",
     "diantifang"
    ],
    "pyi": [
     "dtf",
     "dtf"
    ]
   },
   {
    "name": "电梯间",
    "search": [
     "电梯间"
    ],
    "u": 0.408,
    "v": 0.3175,
    "pyf": [
     "diantijian",
     "diantijian"
    ],
    "pyi": [
     "dtj",
     "dtj"
    ]
   },
   {
    "name": "A连接",
    "search": [
     "A连接"
    ],
    "u": 0.512,
    "v": 0.3075,
    "pyf": [
     "alianjie",
     "alianjie"
    ],
    "pyi": [
     "alj",
     "alj"
    ]
   },
   {
    "name": "狙位",
    "search": [
     "狙位"
    ],
    "u": 0.545,
    "v": 0.28,
    "pyf": [
     "juwei",
     "juwei"
    ],
    "pyi": [
     "jw",
     "jw"
    ]
   },
   {
    "name": "后门",
    "search": [
     "后门"
    ],
    "u": 0.578,
    "v": 0.276,
    "pyf": [
     "houmen",
     "houmen"
    ],
    "pyi": [
     "hm",
     "hm"
    ]
   },
   {
    "name": "外围",
    "search": [
     "外围"
    ],
    "u": 0.602,
    "v": 0.2575,
    "pyf": [
     "wai",
     "wai"
    ],
    "pyi": [
     "w",
     "w"
    ]
   },
   {
    "name": "红箱",
    "search": [
     "红箱"
    ],
    "u": 0.565,
    "v": 0.32,
    "pyf": [
     "hongxiang",
     "hongxiang"
    ],
    "pyi": [
     "hx",
     "hx"
    ]
   },
   {
    "name": "白箱",
    "search": [
     "白箱"
    ],
    "u": 0.598,
    "v": 0.336,
    "pyf": [
     "baixiang",
     "baixiang"
    ],
    "pyi": [
     "bx",
     "bx"
    ]
   },
   {
    "name": "A小",
    "search": [
     "A小"
    ],
    "u": 0.498,
    "v": 0.344,
    "pyf": [
     "axiao",
     "axiao"
    ],
    "pyi": [
     "ax",
     "ax"
    ]
   },
   {
    "name": "A 包点",
    "search": [
     "A包点",
     "A点"
    ],
    "u": 0.7,
    "v": 0.2865,
    "pyf": [
     "abaodian",
     "abaodian",
     "adian"
    ],
    "pyi": [
     "abd",
     "abd",
     "ad"
    ]
   },
   {
    "name": "A平台",
    "search": [
     "A平台"
    ],
    "u": 0.672,
    "v": 0.304,
    "pyf": [
     "apingtai",
     "apingtai"
    ],
    "pyi": [
     "apt",
     "apt"
    ]
   },
   {
    "name": "沙袋",
    "search": [
     "沙袋"
    ],
    "u": 0.645,
    "v": 0.311,
    "pyf": [
     "shadai",
     "shadai"
    ],
    "pyi": [
     "sd",
     "sd"
    ]
   },
   {
    "name": "大坡",
    "search": [
     "大坡"
    ],
    "u": 0.762,
    "v": 0.314,
    "pyf": [
     "da",
     "da"
    ],
    "pyi": [
     "d",
     "d"
    ]
   },
   {
    "name": "小坡",
    "search": [
     "小坡"
    ],
    "u": 0.728,
    "v": 0.336,
    "pyf": [
     "xiao",
     "xiao"
    ],
    "pyi": [
     "x",
     "x"
    ]
   },
   {
    "name": "黄布/铁板",
    "search": [
     "黄布",
     "铁板"
    ],
    "u": 0.692,
    "v": 0.3225,
    "pyf": [
     "huangban",
     "huang",
     "ban"
    ],
    "pyi": [
     "hb",
     "h",
     "b"
    ]
   },
   {
    "name": "下层一箱",
    "search": [
     "下层一箱",
     "一箱"
    ],
    "u": 0.44,
    "v": 0.776,
    "pyf": [
     "xiacengyixiang",
     "xiacengyixiang",
     "yixiang"
    ],
    "pyi": [
     "xcyx",
     "xcyx",
     "yx"
    ]
   },
   {
    "name": "下层木板/双架位",
    "search": [
     "下层木板",
     "木板"
    ],
    "u": 0.48,
    "v": 0.76,
    "pyf": [
     "xiacengbanshuangjiawei",
     "xiacengban",
     "ban"
    ],
    "pyi": [
     "xcbsjw",
     "xcb",
     "b"
    ]
   },
   {
    "name": "下层B楼梯",
    "search": [
     "下层B楼梯",
     "B楼梯"
    ],
    "u": 0.19,
    "v": 0.6675,
    "pyf": [
     "xiacengblouti",
     "xiacengblouti",
     "blouti"
    ],
    "pyi": [
     "xcblt",
     "xcblt",
     "blt"
    ]
   },
   {
    "name": "B连接",
    "search": [
     "B连接"
    ],
    "u": 0.205,
    "v": 0.68,
    "pyf": [
     "blianjie",
     "blianjie"
    ],
    "pyi": [
     "blj",
     "blj"
    ]
   },
   {
    "name": "连接",
    "search": [
     "连接"
    ],
    "u": 0.352,
    "v": 0.726,
    "pyf": [
     "lianjie",
     "lianjie"
    ],
    "pyi": [
     "lj",
     "lj"
    ]
   },
   {
    "name": "长廊",
    "search": [
     "长廊"
    ],
    "u": 0.402,
    "v": 0.75,
    "pyf": [
     "",
     ""
    ],
    "pyi": [
     "",
     ""
    ]
   },
   {
    "name": "桥",
    "search": [
     "桥"
    ],
    "u": 0.472,
    "v": 0.736,
    "pyf": [
     "",
     ""
    ],
    "pyi": [
     "",
     ""
    ]
   },
   {
    "name": "A坡下/叉车",
    "search": [
     "A坡下",
     "叉车"
    ],
    "u": 0.62,
    "v": 0.8275,
    "pyf": [
     "axiachache",
     "axia",
     "chache"
    ],
    "pyi": [
     "axcc",
     "ax",
     "cc"
    ]
   },
   {
    "name": "电梯间下",
    "search": [
     "电梯间下"
    ],
    "u": 0.502,
    "v": 0.79,
    "pyf": [
     "diantijianxia",
     "diantijianxia"
    ],
    "pyi": [
     "dtjx",
     "dtjx"
    ]
   },
   {
    "name": "厕所",
    "search": [
     "厕所"
    ],
    "u": 0.572,
    "v": 0.841,
    "pyf": [
     "cesuo",
     "cesuo"
    ],
    "pyi": [
     "cs",
     "cs"
    ]
   },
   {
    "name": "下层黄布/铁板",
    "search": [
     "下层黄布"
    ],
    "u": 0.552,
    "v": 0.801,
    "pyf": [
     "xiacenghuangban",
     "xiacenghuang"
    ],
    "pyi": [
     "xchb",
     "xch"
    ]
   },
   {
    "name": "下层大坡",
    "search": [
     "下层大坡"
    ],
    "u": 0.702,
    "v": 0.799,
    "pyf": [
     "xiacengda",
     "xiacengda"
    ],
    "pyi": [
     "xcd",
     "xcd"
    ]
   },
   {
    "name": "下层小坡",
    "search": [
     "下层小坡"
    ],
    "u": 0.645,
    "v": 0.874,
    "pyf": [
     "xiacengxiao",
     "xiacengxiao"
    ],
    "pyi": [
     "xcx",
     "xcx"
    ]
   }
  ]
 }
};
