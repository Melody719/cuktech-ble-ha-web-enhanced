# CUKTECH BLE-HA Web 增强版

> 基于 [kairui1108/cuktech-ble-ha](https://github.com/kairui1108/cuktech-ble-ha) 改良的 CUKTECH 10 号 GaN 超充屏 Web 控制台，新增 Windows 原生部署支持、开机自启、自定义下拉组件、纯黑主题、充电协议可视化、场景模式独立卡片、延时关闭等多项增强。

---

## 相比原项目的主要改进

### 前端增强

| 改进项 | 说明 |
|--------|------|
| **自定义下拉组件** | 充电记录时间段、设备设置全部改为自定义下拉菜单（仿主题按钮逻辑），支持互斥、点击外部关闭、z-index 层叠优化 |
| **纯黑主题** | 新增 AMOLED 纯黑配色主题（`#000000` 背景），在主题菜单中可选 |
| **充电协议模块** | 新增独立的充电协议配置卡片，C1/C2 口支持 UFCS/PD/PPS，C3/A 口支持 UFCS/SCP，带开关和备注提示 |
| **场景模式独立卡片** | 场景模式从设备设置下拉中独立出来，做成大图标卡片（AI智能/数码生态/极速单充/均衡输出） |
| **延时关闭模块** | 新增端口延时关闭配置，支持开关、快捷分钟按钮、自定义分钟数 |
| **模块重排** | 页面顺序优化为：概览→场景模式→端口监控→充电协议→功率曲线→充电记录→延时关闭→设备设置 |
| **第一模块布局优化** | 充电器图片放大、右侧控件竖直三行排列（连接状态/BLE控制/总功率+最高电压），支持响应式单列布局 |
| **全局细节美化** | 间距、圆角、阴影、hover 状态、按钮尺寸、徽章间隔等多轮微调 |

### 部署与运维

| 改进项 | 说明 |
|--------|------|
| **Windows 原生部署** | 原项目官方测试环境为 Linux，本版本验证并支持 Windows 10/11 原生 Python 部署（bleak 走 WinRT） |
| **开机自启** | 提供启动文件夹 + 注册表双保险自启方案，含 PowerShell 脚本（端口检测、就绪等待、日志记录）和 VBS 静默启动 |
| **手动启动脚本** | `start_server.bat` 一键启动 |
| **事件监听器优化** | document 点击监听器从 5 个合并为 2 个，下拉菜单全部互斥，提升响应速度 |

### Bug 修复

| Bug | 修复 |
|-----|------|
| `buildSettingsHtml` 默认值 `s.options.value`（数组无此属性） | 改为 `s.options[0].value` |
| 长按下拉按钮触发浏览器原生文本选择/上下文菜单 | 添加 `user-select:none` + `-webkit-touch-callout:none` |
| 下拉框被同级设置项遮挡（z-index 层叠） | `.setting-item:has(.open) { z-index:100 }` |
| 息屏时间 1 分钟选项在最后 | 调整为 1分钟→5分钟→10分钟→30分钟→常亮 |
| 充电协议 C1/C2 顺序 | 调整为 UFCS→PD→PPS；C3/A 调整为 UFCS→SCP |

---

## 支持的设备

- CUKTECH 10 号 GaN 超充屏（型号 `njcuk.fitting.ad1204_`）
- 理论支持同系列其他 BLE 协议设备（需自行验证）

---

## Windows 部署教程

### 环境要求
(其他环境自行测试)
- Windows 10 2004+ / Windows 11（需支持 WinRT Bluetooth）
- Python 3.10+（推荐 3.13）
- 内置蓝牙适配器（Intel/Qualcomm 均可）
- 小米账号（用于获取设备 BLE Token 和 Key）

### 步骤一：克隆项目

```bash
git clone https://github.com/Melody719/cuktech-ble-ha-web-.git
cd cuktech-ble-ha-web-\ble_server
```

### 步骤二：创建虚拟环境并安装依赖

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .
```

> 如果执行 `Activate.ps1` 报错"无法加载文件，因为在此系统上禁止运行脚本"，先执行：
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

### 步骤三：配置设备

复制配置模板：

```powershell
copy config.yaml.example config.yaml
```

编辑 `config.yaml`，填入以下信息：

```yaml
ble:
  mac: "3C:CD:73:XX:XX:XX"    # 设备蓝牙 MAC 地址
  token: "你的设备Token"          # 小米云获取
  ble_key: "你的设备BLE Key"      # 小米云获取

mqtt:
  enabled: false                  # 暂不使用 Home Assistant 可设为 false

server:
  port: 8199                      # Web 服务端口
```

> **获取设备 MAC/Token/BLE Key**：启动服务后访问 `http://localhost:8199/config.html`，通过小米云扫码自动获取并写入配置。

### 步骤四：启动服务

```powershell
# 方式一：手动启动（前台运行，可看日志）
.\.venv\Scripts\python.exe -u ha_server.py

# 方式二：一键启动脚本
.\start_server.bat
```

启动成功后访问：**http://localhost:8199/**

### 步骤五：验证连接

打开网页后，查看第一模块"连接状态"：
- **BLE**：绿色已连接
- **设备型号**：显示 `njcuk.fitting.ad1204_`
- **固件版本**：显示如 `2.1.2_0073`
- **总功率/最高电压**：有实时数值

---

## 开机自启设置

本项目提供两种自启方式（双保险）：

### 方式一：启动文件夹（推荐）

1. 确认 `start_server_autostart.ps1` 和 `start_server_autostart.vbs` 在 `ble_server` 目录下
2. 按 `Win+R`，输入 `shell:startup`，打开启动文件夹
3. 将 `start_server_autostart.vbs` 的**快捷方式**复制到启动文件夹中

### 方式二：注册表（备用）

```powershell
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "CUKTECH-BLE-Server" /t REG_SZ /d "wscript.exe \"D:\path\to\cuktech-ble-ha\ble_server\start_server_autostart.vbs\"" /f
```
###
- 本项目就修改web管理页面 MQTT / Home Assistant / 巴法云集成参考原项目
- 后端 BLE 协议、API 接口、SSE 事件完全兼容原项目
- 前端在原项目基础上增强，不影响原有功能
- 配置文件格式与原项目一致
- MQTT / Home Assistant / 巴法云集成保持原有实现

### 自启脚本特性

- 启动前检测 8199 端口是否已占用，避免重复启动
- 等待 8 秒让系统蓝牙服务就绪
- 检查 Python 解释器是否存在
- 所有输出重定向到 `autostart.log`，方便排查问题
- VBS 包装实现无控制台窗口静默启动

---

## 使用说明

### 主题切换

点击右上角 🎨 主题按钮，可选：
- 暗色（默认）
- 深蓝
- 海洋
- 灰色
- **纯黑（新增）**
- 浅色
- 跟随系统

### 场景模式

页面顶部场景模式卡片，点击切换：
- **AI 智能**：智能分配功率
- **数码生态**：多设备均衡充电
- **极速单充**：单口最大功率输出
- **均衡输出**：各口平均分配

### 充电协议

充电协议卡片中可独立开关各端口协议：
- **C1/C2 口**：UFCS / PD / PPS（关闭 PD 后 PPS 自动关闭）
- **C3/A 口**：UFCS / SCP（修改后需重新插拔设备生效）

### 延时关闭

延时关闭模块中可设置各端口自动断电：
- 打开开关后默认 60 分钟
- 快捷按钮：15/30/60/90/120/180/240 分钟
- 支持自定义分钟数
- 关闭开关自动清除设置

### 端口监控

点击任意端口卡片可查看详细信息弹窗，含实时功率曲线和协议开关。

---

## 项目结构

```
cuktech-ble-ha-web-/
├── ble_server/                     # BLE 服务核心
│   ├── ha_server.py               # HTTP API + SSE + MQTT 服务主入口
│   ├── ble_manager.py             # BLE 连接管理
│   ├── controller.py              # BLE 连接和命令处理
│   ├── cli.py                     # CLI 用户界面
│   ├── state.py                   # 状态管理
│   ├── state_protocol_v2.py       # 协议检测引擎 V2
│   ├── history.py                 # SQLite 历史数据
│   ├── energy.py                  # 能耗统计
│   ├── downsample.py              # 数据降采样
│   ├── config.py                  # 配置加载（支持 YAML）
│   ├── xiaomi_cloud.py            # 小米云 Token 获取
│   ├── bemfa_client.py            # 巴法云 MQTT 客户端（小爱/小度）
│   ├── config.yaml                # 设备配置（含敏感信息，不入库）
│   ├── config.yaml.example        # 配置模板
│   ├── check_env.sh               # 环境检查脚本
│   ├── cuktech_ctl.sh             # 服务控制脚本
│   ├── requirements.txt           # Python 依赖
│   ├── pyproject.toml             # 项目配置
│   ├── start_server.bat           # 【新增】一键启动脚本
│   ├── start_server_autostart.ps1 # 【新增】开机自启 PowerShell
│   ├── start_server_autostart.vbs # 【新增】静默启动包装
│   ├── web/
│   │   ├── index.html             # 桌面端 Web 界面（模块重排+自定义下拉）
│   │   ├── phone.html             # 移动端 Web 界面
│   │   ├── config.html            # 配置页面
│   │   └── static/
│   │       ├── app.js             # 前端逻辑（自定义下拉+协议+场景+延时）
│   │       ├── index.css          # 样式（含 52 个 OVERRIDES 增强块）
│   │       └── locales/
│   │           ├── zh-CN.js       # 中文语言包
│   │           └── en.js          # 英文语言包
│   ├── docker/                    # Docker 部署文件
│   ├── tests/                     # 单元测试 (240+ tests)
│   └── systemd/                   # systemd 服务配置
│
├── ha_integration/                # Home Assistant 自定义集成
│   └── custom_components/cuktech_charger/
│       ├── __init__.py            # Coordinator
│       ├── binary_sensor.py       # 端口状态 + BLE 连接状态
│       ├── config_flow.py         # 配置流程（支持 reauth）
│       ├── const.py               # 常量定义
│       ├── manifest.json
│       ├── number.py              # 倒计时数字实体
│       ├── select.py              # 选择器实体
│       ├── sensor.py              # 传感器实体
│       ├── switch.py              # 开关实体 + BLE 连接控制
│       ├── strings.json           # 英文翻译
│       ├── translations/          # 多语言翻译
│       ├── brand/                 # HACS 品牌图标
│       └── icon.png
│
├── esp32_ble/                     # ESP32 固件
│   └── main/
│       ├── main.c                 # WiFi/MQTT/HTTP/OTA
│       ├── ble_manager.c          # BLE 状态机 + 异步命令
│       └── ...
│
├── docs/                          # 文档
│   ├── server-readme.md
│   ├── server-readme-en.md
│   ├── integration-readme.md
│   ├── integration-readme-en.md
│   ├── esp32-readme.md
│   ├── esp32-readme-en.md
│   └── tools/                     # CLI 测试工具
│
├── README.md                      # 原项目说明
├── README_ENHANCED.md             # 【新增】增强版项目介绍 + Windows 部署教程
├── RELEASE_NOTES.md               # 原项目更新日志
├── LICENSE
└── bump-version.sh
```

---

## 与原项目的兼容性

- 后端 BLE 协议、API 接口、SSE 事件完全兼容原项目
- 前端在原项目基础上增强，不影响原有功能
- 配置文件格式与原项目一致
- MQTT / Home Assistant / 巴法云集成保持原有实现

---
## 效果预览

<img width="1380" height="1480" alt="image" src="https://github.com/user-attachments/assets/0024cf9e-b07c-405a-ae51-3045d21c131e" />

<img width="1376" height="1461" alt="image" src="https://github.com/user-attachments/assets/9a14b7c7-dab2-4f32-a1f9-acbce67b8399" />

<img width="1403" height="1349" alt="image" src="https://github.com/user-attachments/assets/84691437-8723-4ff9-bcaf-dfdc1e1e2f5f" />


## 常见问题

### Q: 启动后页面显示"localhost 拒绝连接"？

A: 检查服务是否正常启动，查看 `server.log` 或 `autostart.log`。确认 8199 端口未被其他程序占用：
```powershell
netstat -ano | findstr :8199
```

### Q: BLE 连接失败？

A: 
1. 确认电脑蓝牙已开启
2. 确认设备未被其他设备（如手机）连接
3. 检查 `config.yaml` 中的 MAC/Token/BLE Key 是否正确
4. 尝试在设备上重新插拔电源后重启服务

### Q: 如何更新到最新版本？

```bash
git pull
cd ble_server
.\.venv\Scripts\python.exe -m pip install -e . --upgrade
```

## 致谢

- 原项目：[kairui1108/cuktech-ble-ha](https://github.com/kairui1108/cuktech-ble-ha)
- BLE 库：[bleak](https://github.com/hbldh/bleak)
- CUKTECH / 酷态科 提供的优秀硬件产品

---

## 许可证

与原项目保持一致。
