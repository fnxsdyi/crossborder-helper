# TaxFlow - 跨境发票与税务助手

[tax.flowingpulse.com](https://tax.flowingpulse.com) | 全球自由职业者的发票和税务合规工具

## 功能特点

- **AI 发票扫描** - 拍照自动提取发票信息
- **专业发票生成** - 支持 US/EU/UK 模板
- **W-8BEN 税表向导** - 交互式税表填写，自动匹配条约优惠
- **多币种看板** - 实时汇率追踪
- **VAT/GST 支持** - 反向征收处理
- **客户管理** - 管理客户信息和发票历史
- **本地优先** - 数据存储在浏览器本地 (IndexedDB)

## 定价

| 方案 | 价格 | 功能 |
|------|------|------|
| Free | $0 | 基础功能，带水印 |
| Pro Monthly | $9/月 | 无限 AI 扫描，无水印，多币种追踪 |
| Pro Annual | $90/年 | 同上，年付优惠 $18 |

## 技术栈

- **框架**: React 19 + TypeScript + Vite 8
- **样式**: Tailwind CSS 4
- **状态管理**: Zustand
- **本地存储**: Dexie (IndexedDB)
- **PDF 生成**: pdf-lib / jsPDF
- **认证**: Supabase Auth
- **部署**: Vercel

## 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.local.example .env.local
# 编辑 .env.local 填入 Supabase 配置

# 启动开发服务器
npm run dev
```

## 环境变量

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## 项目结构

```
crossborder-helper/
├── src/
│   ├── pages/            # 页面组件
│   │   ├── LandingPage   # 落地页
│   │   ├── Dashboard     # 仪表盘
│   │   ├── Invoices      # 发票管理
│   │   ├── TaxWizard     # W-8BEN 税表向导
│   │   ├── OcrPage       # AI 发票扫描
│   │   ├── Clients       # 客户管理
│   │   └── ...
│   ├── components/       # 通用组件
│   ├── stores/           # Zustand 状态管理
│   ├── hooks/            # 自定义 Hooks
│   ├── lib/              # 工具函数
│   └── db/               # Dexie 数据库
├── public/               # 静态资源（含预渲染 HTML）
└── vercel.json           # Vercel 配置
```

## SEO

- 完整的 meta 标签和 JSON-LD 结构化数据
- 法律页面独立预渲染 HTML（privacy/terms/disclaimer）
- 多语言 hreflang 标签
- Google Search Console 验证

## 许可证

Private - KAKI.llc