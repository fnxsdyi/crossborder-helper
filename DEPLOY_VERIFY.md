# TaxFlow 买断上线部署验证清单（可勾选）

> 用途：PR #4（`buyout-pricing` → `master`，订阅改一次性买断）**合并 + Vercel 部署后**，逐项实测买断链路是否真实可用。
> 合并前可先通读；部署后逐项勾选。合并动作需船长在 GitHub 签字（小福不擅自合 master）。
>
> 关键事实：新买断走 PayPal SDK 动态 `createOrder`（CAPTURE 一次性），**不需要在 PayPal 后台预建固定链接**；复用现有 `VITE_PAYPAL_CLIENT_ID`。老订阅 Plan 等本清单 1~4 全部通过后，再在 §5 停用。

---

## 0. 合并前置（船长签字）

- [ ] 在 GitHub 将 PR #4 合并到 `master`（fast-forward，零冲突，已确认 `master` 为分支祖先）
- [ ] 确认 Vercel 自动部署触发且 build 通过（无 typecheck 错误）
- [ ] 部署完成后，站点 `tax.flowingpulse.com` 已是买断代码

---

## 1. PayPal Sandbox 实测买断解锁（最关键）

目标：确认「一次性支付 → 写 `licenses` 表 → 解锁 premium」全链路真实可用，而非只编译通过。

### 1.1 切到 Sandbox 环境

- [ ] 将 `VITE_PAYPAL_CLIENT_ID` 临时指向 **PayPal Sandbox App** 的 client id（本地 `.env` 或 Vercel preview env）
- [ ] 准备一个 sandbox **买家测试账号**（个人账号，余额充足 / 绑定 sandbox 卡）
- [ ] 准备一个 sandbox **卖家账号**（即你自己的 PayPal 测试商家，与生产 App 同主体或独立均可，仅测试用）

### 1.2 走一遍买断支付

- [ ] 打开站点，登录**测试用户账号**
- [ ] 进入付费入口（Settings 页升级区 或 Landing 页 `BuyoutCta` 按钮）
- [ ] 点击 PayPal 买断按钮，sandbox 弹窗登录买家账号
- [ ] 完成支付，PayPal 显示「支付成功」
- [ ] 前端 `onApprove` 触发 `actions.order.capture()` 并返回 `orderId`
- [ ] 成功调用 `recordLicense(user.id, 'TAXFLOW-LIFETIME-<orderId>')`

### 1.3 验证解锁生效

- [ ] Supabase `licenses` 表新增一行：`user_id=<测试账号>`、`key=TAXFLOW-LIFETIME-<orderId>`、`active=true`
- [ ] 刷新页面，`checkSubscriptionWithFallback` 返回 `isPremium=true` 且 `planType='lifetime'`
- [ ] 实测一个 premium 功能（如 OCR 扫描 / W-8BEN 导出 / 批量导出）确认不再受限

### 1.4 折扣码与会员价

- [ ] 输入 `FOUNDER19` → 价格由 $29 变为 **$19**，按钮金额同步更新
- [ ] （可选）FlowingPulse 会员路径 → 显示 **$49**
- [ ] （可选）无码默认 **$29**

---

## 2. Vercel 环境变量核对

- [ ] 生产环境 `VITE_PAYPAL_CLIENT_ID` 已设（正式收款用，**非** sandbox id）
- [ ] Preview 环境 `VITE_PAYPAL_CLIENT_ID` 已设（用于 preview 部署验证）
- [ ] 确认前端 SDK 仅需 client id，无需 `VITE_PAYPAL_SECRET`（capture 在前端完成，secret 不暴露）
- [ ] 改 env 后执行一次 **redeploy** 使变量生效（Vercel 改环境变量不自动重建旧部署）

---

## 3. Supabase `licenses` 表与 RLS

- [ ] 表已存在（`licenses`：建议字段 `id` / `user_id` / `key` / `active` / 时间戳）
- [ ] **RLS 已开启**，且已登录用户可 `INSERT` 自己的 license（策略示例见附录 A）
- [ ] RLS `SELECT` 允许本人读取自己的 license（供 `checkSubscriptionWithFallback` 判断）
- [ ] 实测：§1.3 的 insert 未报 `401 / permission denied`；若报权限错即 RLS 未配好

---

## 4. 视觉与文案核对（无订阅残留）

- [ ] Landing 页显示买断价：**$29** 标准 / **$19** `FOUNDER19` / **$49** 会员
- [ ] 文案为「one-time / lifetime / no subscription」，无 `$9/month`、`per month`、`subscribe`
- [ ] Settings / Auth 付费区显示买断按钮，**无**旧 `PayPalSubscriptionButton` 痕迹
- [ ] 价格计算正确：`getTaxflowPrice('FOUNDER19')=19`、无码 `=29`、会员 `=49`
- [ ] 全仓搜索确认无 `perMonth` / `proPlanMonthlyDesc` / `annualPrice` / `$9/month` 残留（代码 + 8 语言 i18n）
- [ ] `index.html` 的 `<head>` 元数据（`title` / `description` / `og:` / `twitter:` / JSON-LD）显示买断价（$29 / $19 FOUNDER19 / $49），**无** `$9/month` 等订阅定价残留 —— `curl https://tax.flowingpulse.com` 抓取首访 HTML 核验（避免 Google 搜到错误价、与页面矛盾）

---

## 5. 上线后停用老订阅 Plan（最后一步，不可逆 ⚠️）

> **仅当 §1~§4 全部勾选完成后执行。** 此时买断已在生产真实可用，停用老 Plan 不会造成付费空窗。

- [ ] 确认买断在生产至少跑通 1 笔（sandbox 或真实小额）
- [ ] 登录 PayPal 后台，进入订阅计划管理，停用以下两个老订阅 Plan：
  - [ ] 月付 `P-29E1204392902382CNJCROFI` → 设为 **inactive / suspend**
  - [ ] 年付 `P-3D915014J7223963ENJDBLSY` → 设为 **inactive / suspend**
- [ ] 存量已订阅用户**不受影响**（PayPal 停用 Plan 仅阻止新建订阅，已激活的继续按周期扣费）；如需把存量迁到买断，另行评估
- [ ] FlowingPulse 会员 Plan `P-158046208S2020443NKCDPGI` **本次不动**

---

## ✅ 通过标准

§0~§4 全部勾选 → 买断上线成功；§5 完成后 → 老订阅收款链路彻底关闭。

---

## 附录 A：Supabase `licenses` 表 RLS 参考 SQL

```sql
-- 建表（如尚未建）
create table if not exists public.licenses (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.licenses enable row level security;

-- 本人可插入自己的 license（买断解锁核心权限）
drop policy if exists "insert own license" on public.licenses;
create policy "insert own license"
  on public.licenses for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 本人可读自己的 license（判断 premium 用）
drop policy if exists "select own license" on public.licenses;
create policy "select own license"
  on public.licenses for select
  to authenticated
  using (auth.uid() = user_id);
```

## 附录 B：快速核验命令

```bash
# 查某测试用户的 license 是否写入
# （在 Supabase SQL Editor 执行，或 psql 连库）
select user_id, key, active, created_at
from public.licenses
where user_id = '<测试账号 uuid>'
order by created_at desc;
```

> 注：本文件随 PR #4 提交至 `buyout-pricing` 分支，合并后进入 `master`。
