# ⏱️ 专注打卡 FocusRoom

多人在线专注打卡应用：创建一个打卡房间，邀请同学加入，各自开始 / 结束打卡，结束后生成打卡成果单，一键分享到 QQ。

> 打开即开始，结束即分享，无需持续监测。

## ✨ 功能特性

- **创建 / 加入房间**：6 位房间号，昵称加入，多人同时在线
- **开始 / 结束打卡**：服务器时间戳记录，本地每秒刷新 + 轮询同步，无法作弊篡改时长
- **实时成员列表**：展示每位成员的打卡状态（待开始 / 打卡中 / 已结束）和实时时长
- **打卡成果单**：完成人数、总专注时长、人均时长、专注排行榜
- **分享到 QQ**：内置 QQ 分享组件，也可复制成果链接
- **数据持久化**：SQLite 数据库 + 持久化卷，服务重启数据不丢失

## 🛠️ 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | 原生 HTML5 / CSS3 / JavaScript（无框架，Fetch API） |
| 后端 | Node.js + Express（RESTful API） |
| 数据库 | SQLite（better-sqlite3） |
| 部署 | Railway（Nixpacks 自动构建，绑定 GitHub 自动部署） |

## 📁 项目结构

```
focus-room/
├── server.js          # Express 服务入口与 REST API
├── db.js              # SQLite 建表与数据访问层
├── package.json
├── railway.json       # Railway 部署配置
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

# 2. 启动服务
npm start

# 3. 浏览器打开
http://localhost:3000
```

## ☁️ Railway 部署（GitHub 自动部署）

1. 将本仓库推送到 GitHub
2. 登录 [Railway](https://railway.app/)，点击 **New Project → Deploy from repo**，选择本仓库
3. （重要，持久化数据）在服务中打开 **Variables/Volumes**：
   - 添加 **Volume**，挂载路径填写 `/data`
4. 部署完成后在 **Settings → Networking** 生成公网域名即可访问
5. 以后每次 `git push`，Railway 会自动重新构建部署

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
