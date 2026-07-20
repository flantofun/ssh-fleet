<p align="center">
  <a href="https://github.com/flantofun/ssh-fleet/releases/latest"><img src="https://img.shields.io/github/v/release/flantofun/ssh-fleet?style=flat-square" alt="Latest Release"></a>
  <a href="https://github.com/flantofun/ssh-fleet/blob/main/package.json"><img src="https://img.shields.io/badge/Node.js-%3E%3D18-green?style=flat-square&logo=node.js" alt="Node Version"></a>
  <a href="https://github.com/flantofun/ssh-fleet/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/flantofun/ssh-fleet/ci.yml?branch=main&label=CI&style=flat-square" alt="CI"></a>
  <a href="https://github.com/flantofun/ssh-fleet/blob/main/LICENSE"><img src="https://img.shields.io/github/license/flantofun/ssh-fleet?style=flat-square" alt="License"></a>
  <a href="https://www.npmjs.com/package/ssh-fleet"><img src="https://img.shields.io/badge/npm-ssh--fleet-blue?style=flat-square&logo=npm" alt="npm"></a>
</p>

<h1 align="center">SSH Fleet</h1>

<p align="center">
  <a href="README.md">English</a> | 简体中文
</p>

<p align="center">
  ⚡ 一行命令，同时在所有服务器上并行执行。
</p>

<p align="center">
  <a href="#安装">安装</a> · <a href="#快速开始">快速开始</a> · <a href="#命令一览">命令</a> · <a href="#配置文件">配置</a>
</p>

---

SSH Fleet 是一个轻量级 Node.js CLI 工具，用于在多台 SSH 主机上并行管理和执行命令。
只需用一个 YAML 或 JSON 文件定义服务器清单，即可并行执行命令、按标签筛选主机、
推送或拉取文件，并输出 JSON 格式结果方便脚本消费。

- 🚀 **并行执行**，可自定义并发数
- 🏷️ **标签筛选**（`--hosts tag:prod`）
- 📊 **多种输出格式**：分组、合并、JSON、静默
- 🔑 **密钥 / 密码认证**，支持 agent 转发
- 📦 **配置即代码** — YAML / JSON，自动向上查找
- 🔄 **文件传输** — 基于 SFTP 的 push / pull
- ❤️ **MIT 协议**，TypeScript 编写，附 27 个单元测试

## 安装

```bash
npm install -g ssh-fleet
```

或临时使用：

```bash
npx ssh-fleet exec 'uptime'
```

## 快速开始

### 1. 生成配置文件

```bash
ssh-fleet init
```

会在当前目录创建 `ssh-fleet.yml`：

```yaml
defaultUser: root
defaultPort: 22
defaultPrivateKeyPath: ~/.ssh/id_rsa

hosts:
  - name: web-1
    host: 192.168.1.10
    tags: [web, prod]
  - name: web-2
    host: 192.168.1.11
    tags: [web, prod]
  - name: db-1
    host: 192.168.1.20
    user: postgres
    tags: [db, prod]
```

### 2. 查看主机列表

```bash
ssh-fleet list
```

```
Fleet hosts: 3 host(s)
Config: /path/to/ssh-fleet.yml
Tags: db, prod, web

web-1  root@192.168.1.10:22  ✓  [web,prod]
web-2  root@192.168.1.11:22  ✓  [web,prod]
db-1   postgres@192.168.1.20:22  ✓  [db,prod]
```

### 3. 在所有主机上执行命令

```bash
ssh-fleet exec 'uptime'
```

### 4. 筛选目标主机

```bash
# 按名称
ssh-fleet exec 'df -h' --hosts web-1,web-2

# 按标签
ssh-fleet exec 'sudo systemctl restart nginx' --hosts tag:web

# 所有主机
ssh-fleet exec 'free -m' --hosts all
```

### 5. 传输文件

```bash
# 上传配置文件到所有 web 服务器
ssh-fleet copy push ./nginx.conf /etc/nginx/nginx.conf --hosts tag:web

# 从单台主机拉取日志（自动加 .主机名 后缀）
ssh-fleet copy pull /var/log/syslog ./syslog --hosts web-1
```

## 命令一览

### `exec <command>`

在选定的主机上执行 shell 命令。

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--hosts <选择器>` | 主机选择器（名称、`tag:xxx` 或 `all`） | 全部 |
| `-c, --concurrency <n>` | 最大并发连接数 | 8 |
| `--seq` | 串行执行 | 否 |
| `-t, --timeout <ms>` | 单主机超时（毫秒） | 无 |
| `-o, --output <模式>` | 输出格式：`grouped` / `combined` / `json` / `silent` | grouped |
| `-f, --fail-fast` | 遇到第一个失败即停止 | 否 |
| `--config <路径>` | 配置文件路径 | 自动查找 |

```bash
# JSON 输出，配合 jq 使用
ssh-fleet exec 'hostname' -o json | jq '.[] | select(.exitCode==0) | .name'
```

### `list`

列出所有已配置的主机。参数：`--verbose`、`--json`、`--tags`。

### `init`

创建初始配置文件。参数：`--force`、`--json`、`--path <目录>`。

### `status`

快速健康检查 — 在每台主机上执行 `hostname && uptime`。

### `copy push|pull`

通过 SFTP 上传或下载文件。

## 配置文件

SSH Fleet 按以下顺序查找配置（取第一个找到的）：

1. `./ssh-fleet.yml` / `.ssh-fleet.yml`
2. `./ssh-fleet.yaml` / `.ssh-fleet.yaml`
3. `./ssh-fleet.json` / `.ssh-fleet.json`
4. 向上遍历父目录（直到 home 目录）
5. `~/.ssh-fleet.{yml,yaml,json}`

### 主机字段

| 字段 | 必填 | 说明 |
|------|------|------|
| `name` | ✅ | 唯一标识名 |
| `host` | ✅ | 主机名或 IP |
| `port` | ❌ | SSH 端口（默认 22） |
| `user` | ❌ | SSH 用户（回退到 `defaultUser`） |
| `password` | ❌ | 密码认证（建议优先用密钥） |
| `privateKeyPath` | ❌ | 私钥路径 |
| `passphrase` | ❌ | 加密私钥的密码 |
| `tags` | ❌ | 标签数组，用于分组筛选 |

### 全局默认值

```yaml
defaultUser: root
defaultPort: 22
defaultPrivateKeyPath: ~/.ssh/id_rsa
defaultPassword: your-password   # 可选
```

主机级字段会覆盖全局默认值。

## 为什么造这个轮子？

管 5 台、50 台甚至 500 台服务器，不该开 500 个终端标签页。Ansible 这类工具很强大，
但太重了；SSH Fleet 想做的是**它下面那一层**——当你只想在所有机器上跑一条命令时，
随手就能用的那个工具。

## 对比

| 特性 | ssh-fleet | Ansible | Fabric | pdsh |
|------|-----------|---------|--------|------|
| 安装 | npm i -g | pip + inventory | pip | apt/brew |
| 配置 | 1 个 YAML | inventory + playbook | Python 文件 | 无 |
| 并行 | ✓ | ✓ | ✓ | ✓ |
| 远程零依赖 | ✓ | ✗ 需 Python | ✗ 需 Python | ✓ |
| JSON 输出 | ✓ | ✓ | ✗ | ✗ |
| 文件传输 | ✓ | ✓ | ✓ | ✗ |
| 轻量 | ✓（Node.js） | ✗（Python） | ✗（Python） | ✓（C） |

## 开发路线

- [ ] `run` 命令：从文件执行多行脚本
- [ ] Diff 模式：只显示输出有差异的主机
- [ ] 交互式主机选择器（fzf 风格）
- [ ] Docker 镜像，方便 CI 流水线
- [ ] Shell 自动补全（bash、zsh、fish）
- [ ] `top` 命令：实时资源监控

## 本地开发

```bash
git clone https://github.com/flantofun/ssh-fleet
cd ssh-fleet
npm install
npm run dev -- list          # 通过 tsx 运行
npm run build                # 编译到 dist/
node dist/cli.js exec 'uptime'
```

## 许可证

MIT © 2026 flantofun
