---
title: Getting Started
description: Start your documentation site
---

# Getting Started

Your markdown files under `docs/` will be rendered into HTML pages.



## Codeblock

```typescript
console.log("hello word")
```


> This is a quote



- This is a list
- This is a list


## TODO LIST

- [ ] todo1
- [x] todo2


This is a [Link](https://xuco.me)

| 配置项       | 必填 | 说明                           | 建议                                   |
| :----------- | :--: | :----------------------------- | :------------------------------------- |
| **名称**     |  是  | API Key 的标识名称             | 设置为项目名或用途，如 `Chat-Bot-Prod` |
| **模型**     |  是  | 选择该 Key 支持调用的模型范围  | **注意**：未勾选的模型将无法发起请求   |
| **请求上限** |  否  | 设置单次或周期内的请求次数限制 | 用于防止程序异常导致的消耗过快         |
| **额度**     |  否  | 设置该 Key 可使用的最高额度    | 建议根据项目预算分配独立额度           |
| **过期时间** |  否  | 设置 Key 的有效期限            | 临时测试建议设置有效期，长期项目可留空 |

> [!IMPORTANT]
> **关于密钥可见性**
> 为了保障您的账户安全，所有 API Key 在数据库中均经过**加密处理**。
>
> - **仅限创建时查看**：API Key 仅在点击“完成创建”后的弹出窗口中完整显示**一次**。
> - **后续不可找回**：一旦关闭弹窗，您将无法再次在控制台查看到完整的 Key 内容。
> - **若丢失怎么办**：如果您遗失了该 Key，将无法找回，必须通过「删除旧 Key 并重新创建」的方式来获取新的密钥。


> [!TIP]
> **遇到 404 错误？**
> 若页面提示「错误 404」，通常是由于登录状态刷新延迟。请点击页面中的 **「返回控制台」** 按钮，或从侧边导航栏重新进入即可。


```typescript
console.log("hello word")
```

```typescript
console.log("hello word")
```

```typescript
console.log("hello word")
```

```typescript
console.log("hello word")
```
