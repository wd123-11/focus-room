# ⏱️ 专注打卡 FocusRoom

多人在线专注打卡应用：创建一个打卡房间，邀请同学加入，各自开始 / 结束打卡，结束后生成打卡成果单，一键分享到 QQ。

> 打开即开始，结束即分享，无需持续监测。

## ✨ 功能特性

- **创建 / 加入房间**：6 位房间号，昵称加入，多人同时在线
- **开始 / 结束打卡**：服务器时间戳记录，本地每秒刷新 + 轮询同步，无法作弊篡改时长
- **实时成员列表**：展示每位成员的打卡状态（待开始 / 打卡中 / 已结束）和实时时长
- **打卡成果单**：完成人数、总专注时长、人均时长、专注排行榜
- **分享到 QQ**：内置 QQ 分享组件，也可复制成果链接
- **双数据库适配**：本地开发用 SQLite，云端自动切换 PostgreSQL，无需改代码

## 🛠️ 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | 原生 HTML5 / CSS3 / JavaScript（无框架，Fetch API） |
| 后端 | Node.js + Express（RESTful API） |
| 数据库 | SQLite（本地）/ PostgreSQL（云端），通过 DATABASE_URL 自动切换 |
| 部署 | Render（免费，绑定 GitHub 自动部署，基础设施即代码 render.yaml） |

## 📁 项目结构

```
focus-room/
├── server.js          # Express 服务入口与 REST API
├── db.js              # 数据库入口：按环境选择 SQLite / PostgreSQL
├── db-sqlite.js       # SQLite 数据访问层
├── db-postgres.js     # PostgreSQL 数据访问层
├── package.json
├── render.yaml        # Render 一键部署蓝图（Web + 数据库）
├── railway.json       # Railway 部署配置（备用）
├── data/              # 本地 SQLite 数据文件（已忽略）
└── public/            # 前端静态资源
    ├── index.html     # 首页：创建 / 加入房间
    ├── room.html      # 房间页：打卡与成员列表
    ├── share.html     # 成果页：排行榜与 QQ 分享
    ├── css/style.css
    └── js/ (home.js / room.js / share.js)
```

## 🚀 本地运行

```bash
# 1. 安装依赖
npm install

# 2. 启动服务（自动使用本地 SQLite）
npm start

# 3. 浏览器打开
http://localhost:3000
```

## ☁️ Render 免费部署（推荐，无需信用卡）

### 方式一：一键部署（推荐）

1. 确保本仓库已推送到 GitHub
2. 打开 Render：**https://dashboard.render.com/blueprints**
3. 点击 **New Blueprint Instance**，选择本仓库
4. 点击 **Apply**，Render 会自动创建 Web 服务和 PostgreSQL 数据库并完成部署
5. 部署完成后，点击 Web 服务的 `xxx.onrender.com` 域名即可访问

### 方式二：手动创建

1. 打开 https://render.com 注册（可用 GitHub 账号）
2. **New → PostgreSQL** 创建免费数据库
3. **New → Web Service**，从 GitHub 选择本仓库，计划选 **Free**
4. 添加环境变量 `DATABASE_URL`（值为数据库的 External Database URL）
5. 部署完成后生成域名访问

> 免费版说明：Web 服务 15 分钟无访问会休眠，首次打开需等待约 1 分钟；免费 PostgreSQL 为 1GB、30 天有效期，到期后重新创建即可。

## 🔌 API 设计

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/rooms` | 创建房间 |
| POST | `/api/rooms/:code/join` | 加入房间 |
| GET | `/api/rooms/:code` | 获取房间状态 |
| POST | `/api/rooms/:code/start` | 开始打卡 |
| POST | `/api/rooms/:code/end` | 结束打卡 |
| GET | `/api/rooms/:code/result` | 成果单数据 |

## 📄 License

MIT
