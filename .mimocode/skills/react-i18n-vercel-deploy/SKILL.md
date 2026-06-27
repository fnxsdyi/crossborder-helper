---
name: react-i18n-vercel-deploy
description: Use when building React apps with Vite, i18n (8 languages), and deploying to Vercel with Supabase auth
---

# React + i18n + Vercel 部署 Skill

## 技术栈模板
- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Dexie.js (IndexedDB 本地存储)
- Zustand (状态管理)
- Supabase (认证 + 数据库)
- jsPDF (PDF 生成)
- 8种语言 i18n (EN/ZH/JA/KO/DE/FR/ES/PT)

## i18n 系统架构

### 翻译键命名规范
```
nav.*          - 导航栏
dashboard.*    - 仪表盘
invoices.*     - 发票
editor.*       - 编辑器
clients.*      - 客户
currency.*     - 多币种
tax.*          - 税务向导
settings.*     - 设置
common.*       - 通用
disclaimer.*   - 免责声明
premium.*      - 高级功能
auth.*         - 认证
landing.*      - 着陆页
```

### 添加新翻译键流程
1. 在 `TranslationKeys` 类型中添加键定义
2. 在所有8个语言块中添加翻译值
3. 运行 `npm run build` 验证无 TypeScript 错误

### 语言块查找技巧
每个语言块以 `'premium.oneTime'` 结尾，用 `Select-String` 可快速定位。

## Vercel 部署检查清单

### 部署前检查
1. `npm run build` 无错误
2. 所有翻译键在8种语言中都有定义
3. 没有使用 `as any` 类型断言（除非必要）
4. 环境变量在 `.env.local` 中配置

### 常见构建错误
- **TS2740**: 缺少翻译键 → 添加到所有语言块
- **TS7009**: jsPDF GState 类型问题 → 使用 `(doc as any).GState()`
- **TS6133**: 未使用的变量 → 删除或使用

### Vercel 环境变量
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## Supabase 用户系统模板

### 数据库表结构
```sql
CREATE TABLE licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 认证流程
1. 用户注册/登录 → Supabase Auth
2. 检查 licenses 表验证 Premium 状态
3. PremiumGate 组件控制功能访问

## SEO 优化清单

### Meta 标签
- title (包含关键词 + 价格)
- description (150字符内)
- keywords
- Open Graph (og:title, og:description, og:image)
- Twitter Card
- canonical URL
- robots meta

### 结构化数据
- SoftwareApplication JSON-LD
- 包含 offers、featureList

### 文件
- sitemap.xml
- robots.txt (可选)

## 项目结构模板
```
src/
├── components/
│   ├── Layout.tsx
│   ├── Sidebar.tsx
│   ├── PremiumGate.tsx
│   ├── Disclaimer.tsx
│   └── ThemeProvider.tsx
├── pages/
│   ├── LandingPage.tsx
│   ├── AuthPage.tsx
│   ├── Dashboard.tsx
│   ├── Invoices.tsx
│   ├── Clients.tsx
│   ├── CurrencyDashboard.tsx
│   ├── TaxWizard.tsx
│   └── Settings.tsx
├── stores/
│   ├── appStore.ts
│   └── authStore.ts
├── hooks/
│   └── useI18n.ts
├── lib/
│   ├── i18n.ts
│   ├── supabase.ts
│   ├── exchangeRate.ts
│   ├── rateHistory.ts
│   └── generateInvoicePDF.ts
└── db/
    └── index.ts
```

## 付款集成

### PayPal NCP 链接格式
```
https://www.paypal.com/ncp/payment/{PAYMENT_ID}
```

### Premium 验证流程
1. 用户付款 → 获取许可证密钥
2. 在应用中输入密钥 → Supabase 验证
3. 更新 licenses 表 → 激活 Premium

## 性能优化建议

### 代码分割
- 使用 `React.lazy()` 懒加载页面组件
- 拆分大型依赖（如 jsPDF）

### 缓存策略
- IndexedDB 用于本地数据
- Supabase 查询结果可缓存
- 汇率数据每日缓存

## 安全注意事项

1. 不要在前端存储敏感信息
2. 使用 Supabase RLS 保护数据
3. 许可证密钥验证必须在服务端
4. 定期更新依赖包
