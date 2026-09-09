        // Theme definitions
        const THEMES = {
            'ha-dark': {
                '--bg': '#1c1c1c', '--card-bg': '#252525', '--card-border': '#3b3b3b',
                '--text': '#e1e1e1', '--text-dim': '#959595',
                '--accent': '#03a9f4', '--accent-rgb': '3, 169, 244',
                '--success': '#389e3d', '--success-rgb': '56, 158, 61',
                '--warning': '#ffa42b', '--warning-rgb': '255, 164, 43',
                '--danger': '#db4437', '--danger-rgb': '219, 68, 55'
            },
            'deep-blue': {
                '--bg': '#0f0f1a', '--card-bg': '#1a1a2e', '--card-border': '#2a2a4a',
                '--text': '#e8e8f0', '--text-dim': '#8888aa',
                '--accent': '#00d4ff', '--accent-rgb': '0, 212, 255',
                '--success': '#00e676', '--success-rgb': '0, 230, 118',
                '--warning': '#ffc107', '--warning-rgb': '255, 193, 7',
                '--danger': '#ff5252', '--danger-rgb': '255, 82, 82'
            },
            'ocean': {
                '--bg': '#0a1628', '--card-bg': '#0f2035', '--card-border': '#1a3a5c',
                '--text': '#e0f0ff', '--text-dim': '#7aa3cc',
                '--accent': '#00b4d8', '--accent-rgb': '0, 180, 216',
                '--success': '#48bb78', '--success-rgb': '72, 187, 120',
                '--warning': '#f6ad55', '--warning-rgb': '246, 173, 85',
                '--danger': '#fc8181', '--danger-rgb': '252, 129, 129'
            },
            'gray': {
                '--bg': '#2d2d2d', '--card-bg': '#3a3a3a', '--card-border': '#4a4a4a',
                '--text': '#f0f0f0', '--text-dim': '#aaaaaa',
                '--accent': '#4fc3f7', '--accent-rgb': '79, 195, 247',
                '--success': '#81c784', '--success-rgb': '129, 199, 132',
                '--warning': '#ffb74d', '--warning-rgb': '255, 183, 77',
                '--danger': '#e57373', '--danger-rgb': '229, 115, 115'
            },
            'pure-black': {
                '--bg': '#000000', '--card-bg': '#0d0d0d', '--card-border': '#1f1f1f',
                '--text': '#ffffff', '--text-dim': '#888888',
                '--accent': '#03a9f4', '--accent-rgb': '3, 169, 244',
                '--success': '#4caf50', '--success-rgb': '76, 175, 80',
                '--warning': '#ff9800', '--warning-rgb': '255, 152, 0',
                '--danger': '#f44336', '--danger-rgb': '244, 67, 54'
            },
            'light': {
                '--bg': '#f5f5f5', '--card-bg': '#ffffff', '--card-border': '#e0e0e0',
                '--text': '#212121', '--text-dim': '#757575',
                '--accent': '#1976d2', '--accent-rgb': '25, 118, 210',
                '--success': '#388e3c', '--success-rgb': '56, 142, 60',
                '--warning': '#f57c00', '--warning-rgb': '245, 124, 0',
                '--danger': '#d32f2f', '--danger-rgb': '211, 47, 47'
            }
        };

        function setTheme(themeName) {
            if (themeName === 'system') {
                localStorage.setItem('cuktech-theme', 'system');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                applyTheme(prefersDark ? 'ha-dark' : 'light');
            } else {
                localStorage.setItem('cuktech-theme', themeName);
                localStorage.removeItem('cuktech-theme-original');
                applyTheme(themeName);
            }
            document.querySelectorAll('.theme-option').forEach(opt => {
                opt.classList.toggle('active', opt.dataset.theme === themeName);
            });
            document.getElementById('themeMenu').classList.remove('show');
        }

        function applyTheme(themeName) {
            const theme = THEMES[themeName];
            if (!theme) return;
            const root = document.documentElement;
            Object.entries(theme).forEach(([key, value]) => {
                root.style.setProperty(key, value);
            });
        }

                // ── 统一: 点击外部关闭所有下拉菜单 ──
        document.addEventListener('click', (e) => {
            if (e.target.closest('.theme-switcher') || e.target.closest('#logLevelSwitcher') ||
                e.target.closest('#chargePeriodSwitcher') || e.target.closest('.setting-switcher')) return;
            document.getElementById('themeMenu')?.classList.remove('show');
            document.getElementById('logLevelMenu')?.classList.remove('show');
            document.getElementById('chargePeriodSwitcher')?.classList.remove('open');
            document.querySelectorAll('.setting-switcher.open').forEach(s => s.classList.remove('open'));
        });

function toggleThemeMenu() {
            const menu = document.getElementById('themeMenu');
            const wasOpen = menu.classList.contains('show');
            document.getElementById('logLevelMenu')?.classList.remove('show');
            document.getElementById('chargePeriodSwitcher')?.classList.remove('open');
            document.querySelectorAll('.setting-switcher.open').forEach(s => s.classList.remove('open'));
            if (!wasOpen) menu.classList.add('show');
        }


        // Load saved theme
        const savedTheme = localStorage.getItem('cuktech-theme') || 'ha-dark';
        setTimeout(() => setTheme(savedTheme), 0);

        // Log level management
        async function setLogLevel(level) {
            try {
                await fetch(`${API_BASE}/api/log-level`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ level })
                });
                localStorage.setItem('cuktech-log-level', level);
                document.querySelectorAll('#logLevelMenu .theme-option').forEach(opt => {
                    opt.classList.toggle('active', opt.dataset.level === level);
                });
                document.getElementById('logLevelMenu').classList.remove('show');
            } catch (e) {
                console.error('Failed to set log level:', e);
            }
        }

        async function initLogLevel() {
            try {
                const res = await fetch(`${API_BASE}/api/log-level`);
                const data = await res.json();
                if (data.level) {
                    localStorage.setItem('cuktech-log-level', data.level);
                    document.querySelectorAll('#logLevelMenu .theme-option').forEach(opt => {
                        opt.classList.toggle('active', opt.dataset.level === data.level);
                    });
                }
            } catch (e) {
                // Fallback to localStorage
                const saved = localStorage.getItem('cuktech-log-level') || 'info';
                document.querySelectorAll('#logLevelMenu .theme-option').forEach(opt => {
                    opt.classList.toggle('active', opt.dataset.level === saved);
                });
            }
        }

        function toggleLogLevelMenu() {
            const menu = document.getElementById('logLevelMenu');
            const wasOpen = menu.classList.contains('show');
            document.getElementById('themeMenu')?.classList.remove('show');
            document.getElementById('chargePeriodSwitcher')?.classList.remove('open');
            document.querySelectorAll('.setting-switcher.open').forEach(s => s.classList.remove('open'));
            if (!wasOpen) menu.classList.add('show');
        }


        // Initialize log level from server
        setTimeout(() => initLogLevel(), 0);

        const API_BASE = window.location.origin;
        const PORT_MAP = { 1: 'C1', 2: 'C2', 3: 'C3', 4: 'A' };
        const PORT_KEY_MAP = { 1: 'c1', 2: 'c2', 3: 'c3', 4: 'a' };

        const SETTINGS_CONFIG = [
            { piid: 5, nameKey: 'settings.sceneMode', options: [{ value: 1, labelKey: 'scene.ai' }, { value: 2, labelKey: 'scene.eco' }, { value: 3, labelKey: 'scene.single' }, { value: 4, labelKey: 'scene.balanced' }] },
            { piid: 6, nameKey: 'settings.screenTimeout', options: [{ value: 5, labelKey: 'settings.min1' }, { value: 1, labelKey: 'settings.min5' }, { value: 2, labelKey: 'settings.min10' }, { value: 3, labelKey: 'settings.min30' }, { value: 4, labelKey: 'settings.alwaysOn' }] },
            { piid: 13, nameKey: 'settings.deviceLanguage', options: [{ value: 0, label: 'English' }, { value: 1, label: '中文' }] },
            { piid: 15, nameKey: 'settings.usbATrickle', options: [{ value: 0, labelKey: 'settings.off' }, { value: 1, labelKey: 'settings.on' }] },
            { piid: 19, nameKey: 'settings.idleScreenOff', options: [{ value: 0, labelKey: 'settings.off' }, { value: 1, labelKey: 'settings.on' }] },
            { piid: 20, nameKey: 'settings.screenLock', options: [{ value: 0, labelKey: 'settings.off' }, { value: 1, labelKey: 'settings.on' }] }
        ];

        let lastSettings = {};
        let powerChart = null, modalChart = null, currentModalPort = null, latestPorts = {};
        let protocolSwitches = {}, protocolExtend = 0;
        let bleConnected = false;
        const portHistory = {
            1: { voltage: [], current: [], power: [], protocol: [] },
            2: { voltage: [], current: [], power: [], protocol: [] },
            3: { voltage: [], current: [], power: [], protocol: [] },
            4: { voltage: [], current: [], power: [], protocol: [] }
        };

        // ── Real-time modal chart ──
        const REAL_TIME_WINDOW_MS = 10 * 60 * 1000;  // 保留最近10分钟
        let realTimeBuf = { 1: [], 2: [], 3: [], 4: [] };
        let modalRealTimePort = null;
        let modalRealTimeDebounce = null;
        let modalRealTimeTimer = null;  // 数据稳定时的后台刷新定时器

        function setTimeRange(minutes) {
            setCurrentHours(minutes / 60);
            localStorage.setItem('cuktech-chart-hours', minutes);
            document.querySelectorAll('.time-btn').forEach(btn => {
                const btnMinutes = parseInt(btn.dataset.minutes, 10);
                if (!isNaN(btnMinutes)) btn.classList.toggle('active', btnMinutes === minutes);
            });
            fetchChartData();
        }

        const COUNTDOWN_PIIDS = { 1: 9, 2: 10, 3: 11, 4: 12 };
        const PORT_KEY_TO_ID = { 'c1': 1, 'c2': 2, 'c3': 3, 'a': 4 };
        let lastLocalChange = 0;
        function markLocal() { lastLocalChange = Date.now(); }
        function isRecent() { return Date.now() - lastLocalChange < 3000; }
        const QUICK_MINUTES = [15, 30, 60, 90, 120, 240];

        function initChart() {
            const cs = getComputedStyle(document.documentElement);
            const c1 = cs.getPropertyValue('--port-c1').trim() || '#03a9f4';
            const c2 = cs.getPropertyValue('--port-c2').trim() || '#7c4dff';
            const c3 = cs.getPropertyValue('--port-c3').trim() || '#389e3d';
            const ca = cs.getPropertyValue('--port-a').trim() || '#ffa42b';
            const textColor = cs.getPropertyValue('--text').trim() || '#e1e1e1';
            const accentColor = cs.getPropertyValue('--accent').trim() || '#03a9f4';
            const ctx = document.getElementById('powerChart').getContext('2d');
            powerChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        { label: 'C1', data: [], borderColor: c1, borderWidth: 2, tension: 0.4, pointRadius: 0, fill: false },
                        { label: 'C2', data: [], borderColor: c2, borderWidth: 2, tension: 0.4, pointRadius: 0, fill: false },
                        { label: 'C3', data: [], borderColor: c3, borderWidth: 2, tension: 0.4, pointRadius: 0, fill: false },
                        { label: 'A', data: [], borderColor: ca, borderWidth: 2, tension: 0.4, pointRadius: 0, fill: false },
                        { label: 'Total', data: [], borderColor: textColor, borderWidth: 2.5, tension: 0.4, pointRadius: 0, fill: false, borderDash: [5, 3] },
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, animation: { duration: 0 }, interaction: { intersect: false, mode: 'index' },
                    plugins: { legend: { display: true, position: 'top', labels: { color: textColor, font: { size: 11 }, boxWidth: 12, padding: 12 } } },
                    scales: { x: { display: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#666', maxTicksLimit: 8, font: { size: 10 } } }, y: { display: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#666', font: { size: 10 } }, beginAtZero: true } }
                }
            });
        }
        let _chartDataLoaded = false;
        async function fetchChartData() {
            try {
                const interval = getInterval();
                const url = `${API_BASE}/api/chart?hours=${getCurrentHours()}&interval=${interval}`;
                const res = await fetch(url);
                if (res.status === 304) {
                    if (!_chartDataLoaded) {
                        // Force fetch on first load (bypass cache)
                        const r2 = await fetch(url + '&_=' + Date.now());
                        if (r2.ok) { const j2 = await r2.json(); if (j2.ok) updateChart(j2); }
                        _chartDataLoaded = true;
                    }
                    return;
                }
                if (!res.ok) return;
                const result = await res.json();
                if (result.ok) { updateChart(result); _chartDataLoaded = true; }
            } catch (e) {
                console.error('Failed to fetch chart data:', e);
            }
        }

        function updateChart(data) {
            let labels = data.labels;
            const power = data.datasets.power;
            // Trim trailing epoch(s) where all ports have 0 power (bucket not yet populated)
            while (labels.length > 1) {
                const last = labels.length - 1;
                const allZero = power.every(ds => ds.data[last] === 0);
                if (!allZero) break;
                labels = labels.slice(0, last);
                for (const ds of power) ds.data = ds.data.slice(0, last);
                for (const ds of data.datasets.voltage) ds.data = ds.data.slice(0, last);
                for (const ds of data.datasets.current) ds.data = ds.data.slice(0, last);
            }
            powerChart.data.labels = labels;
            for (let i = 0; i < power.length; i++) {
                powerChart.data.datasets[i].data = power[i].data;
            }
            for (let port = 1; port <= 4; port++) {
                portHistory[port].power = power[port - 1].data.slice();
                portHistory[port].voltage = data.datasets.voltage[port - 1].data.slice();
                portHistory[port].current = data.datasets.current[port - 1].data.slice();
                portHistory[port].protocol = power[port - 1].data.map(() => 'idle');
            }
            powerChart.update('none');
        }

        // ── Real-time modal chart ──
        function toggleModalRealTime() {
            const btn = document.getElementById('modalRealTimeBtn');
            if (modalRealTimePort !== null) {
                modalRealTimePort = null;
                btn.classList.remove('active');
                btn.textContent = I18N.t('modal.realtime');
                if (modalRealTimeDebounce) { clearTimeout(modalRealTimeDebounce); modalRealTimeDebounce = null; }
                if (modalRealTimeTimer) { clearInterval(modalRealTimeTimer); modalRealTimeTimer = null; }
                if (currentModalPort) updateModalChart();
            } else {
                modalRealTimePort = currentModalPort;
                btn.classList.add('active');
                btn.textContent = I18N.t('modal.realtimeStop');
                // 后台 2 秒刷新：数据到达时会通过 500ms 去抖更快更新，无数据时图表保持最新
                if (modalRealTimeTimer) clearInterval(modalRealTimeTimer);
                modalRealTimeTimer = setInterval(_updateRealTimeModalChart, 2000);
                _updateRealTimeModalChart();
            }
        }

        function _buildRealTimeLabels(buf, offset, count) {
            return buf.slice(offset, offset + count).map(e => {
                const d = new Date(e.ts);
                return String(d.getHours()).padStart(2,'0') + ':' +
                       String(d.getMinutes()).padStart(2,'0') + ':' +
                       String(d.getSeconds()).padStart(2,'0');
            });
        }

        function _accumulateRealTimeData(portId, data) {
            const ts = Date.now();
            const buf = realTimeBuf[portId];
            buf.push({ ts, voltage: data.voltage, current: data.current, power: data.power, protocol: data.protocol });
            const cutoff = ts - REAL_TIME_WINDOW_MS;
            while (buf.length > 0 && buf[0].ts < cutoff) buf.shift();
            // 弹窗实时模式下，对应当前端口的数据到达时去抖更新图表
            if (modalRealTimePort !== null && portId === modalRealTimePort) {
                if (modalRealTimeDebounce) clearTimeout(modalRealTimeDebounce);
                modalRealTimeDebounce = setTimeout(() => {
                    modalRealTimeDebounce = null;
                    _updateRealTimeModalChart();
                }, 500);
            }
        }

        function _updateRealTimeModalChart() {
            if (!currentModalPort || !modalChart || modalRealTimePort === null) return;
            const buf = realTimeBuf[currentModalPort];
            if (!buf || buf.length < 1) return;
            // ── 更新弹窗顶部的瞬时值 ──
            const rt = latestPorts[currentModalPort];
            if (rt) {
                document.getElementById('modalVoltage').textContent = rt.voltage.toFixed(1);
                document.getElementById('modalCurrent').textContent = rt.current.toFixed(2);
                document.getElementById('modalPower').textContent = rt.power.toFixed(1);
                const protocolEl = document.getElementById('modalProtocol');
                if (protocolEl) {
                    protocolEl.textContent = rt.protocol || 'idle';
                    protocolEl.style.color = (rt.protocol && rt.protocol !== 'idle') ? 'var(--accent)' : 'var(--text-dim)';
                }
            }
            // ── 更新图表曲线 ──
            const MAX_VISIBLE = 120;
            const showBuf = buf.slice(-MAX_VISIBLE);
            const padding = MAX_VISIBLE - showBuf.length;
            const padLabels = new Array(padding).fill('--:--:--');
            const padZeros = new Array(padding).fill(0);
            const realLabels = _buildRealTimeLabels(showBuf, 0, showBuf.length);
            modalChart.data.labels = [...padLabels, ...realLabels];
            modalChart.data.datasets[0].data = [...padZeros, ...showBuf.map(e => e.voltage)];
            modalChart.data.datasets[1].data = [...padZeros, ...showBuf.map(e => e.current)];
            modalChart.data.datasets[2].data = [...padZeros, ...showBuf.map(e => e.power)];
            modalChart.update('none');
        }

        function initModalChart() {
            if (modalChart) modalChart.destroy();
            const colors = getChartColors();
            const ctx = document.getElementById('modalChart').getContext('2d');
            modalChart = new Chart(ctx, {
                type: 'line',
                data: { labels: [], datasets: [
                    { label: I18N.t('modal.voltage'), data: [], borderColor: colors.c1, borderWidth: 2, tension: 0.4, pointRadius: 0, fill: false, yAxisID: 'y' },
                    { label: I18N.t('modal.current'), data: [], borderColor: colors.c3, borderWidth: 2, tension: 0.4, pointRadius: 0, fill: false, yAxisID: 'y' },
                    { label: I18N.t('modal.power'), data: [], borderColor: colors.a, borderWidth: 2, tension: 0.4, pointRadius: 0, fill: false, yAxisID: 'y1' },
                ]},
                options: { responsive: true, maintainAspectRatio: false, animation: { duration: 0 }, interaction: { intersect: false, mode: 'index' },
                    plugins: { legend: { display: true, position: 'top', labels: { color: colors.textDim, font: { size: 11 }, boxWidth: 12, padding: 12 } } },
                    scales: { x: { display: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#666', maxTicksLimit: 8, font: { size: 10 } } },
                        y: { type: 'linear', display: true, position: 'left', grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: colors.c1, font: { size: 10 } }, beginAtZero: true, title: { display: true, text: 'V / A', color: colors.textDim } },
                        y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, ticks: { color: colors.a, font: { size: 10 } }, beginAtZero: true, title: { display: true, text: 'W', color: colors.textDim } }
                    }
                }
            });
        }

        function openModal(portId) {
            currentModalPort = portId;
            const titleEl = document.getElementById('modalTitle');
            // Keep the data-i18n-params in sync so a later applyTranslations
            // (e.g. server language applied at page load) re-translates the title
            // with the actually open port instead of the static default.
            titleEl.setAttribute('data-i18n-params', JSON.stringify({ port: PORT_MAP[portId] }));
            titleEl.textContent = I18N.t('modal.portDetail', { port: PORT_MAP[portId] });
            titleEl.style.color = `var(--port-${PORT_KEY_MAP[portId]})`;
            initModalChart();
            updateModalChart();
            renderModalProtocols();
            document.getElementById('portModal').classList.add('show');
        }

        function renderModalProtocols() {
            const container = document.getElementById('modalProtocols');
            if (!container) return;
            const portKey = PORT_KEY_MAP[currentModalPort];
            const sw = protocolSwitches[portKey];
            if (!sw) {
                container.innerHTML = `<div class="proto-title">${I18N.t('modal.noData')}</div>`;
                return;
            }
            const protoKeys = Object.keys(sw);
            const labels = { pd: 'PD', pps: 'PPS', ufcs: 'UFCS', scp: 'SCP' };
            let html = `<div class="proto-title">${I18N.t('modal.protocolSwitch')}</div><div class="proto-btns">`;
            for (const pk of protoKeys) {
                // PD 关闭时隐藏 PPS 按钮
                if ((portKey === 'c1' || portKey === 'c2') && pk === 'pps' && !sw.pd) continue;
                const on = sw[pk];
                const cls = on ? 'proto-btn on' : 'proto-btn';
                html += `<button class="${cls}" data-port="${portKey}" data-proto="${pk}" onclick="toggleProtocol(this)">${labels[pk] || pk}</button>`;
            }
            html += '</div>';
            if (portKey === 'c1' || portKey === 'c2') {
                html += `<div style="font-size:10px;color:var(--text-dim);margin-top:6px;">${I18N.t('modal.ppsNote')}</div>`;
            } else {
                html += `<div style="font-size:10px;color:var(--text-dim);margin-top:6px;">${I18N.t('modal.replugNote')}</div>`;
            }
            container.innerHTML = html;
        }

        async function toggleProtocol(btn) {
            if (btn.disabled) return;
            btn.disabled = true;
            const port = btn.dataset.port;
            const proto = btn.dataset.proto;
            // 按钮当前是否开启（渲染 state 的唯一权威来源）。用显式 action
            // (on/off) 而非后端 toggle，并让乐观更新写入这个确定值——
            // 避免「SSE 广播已成真→前端再用 ! 反转」的竞态把按钮状态改回错误值，
            // 导致需刷新页面才显示正确（ha 侧改协议走纯 SSE 无此问题）。
            const wasOn = !!(protocolSwitches[port] && protocolSwitches[port][proto]);
            const action = wasOn ? 'off' : 'on';
            try {
                const res = await fetch(`${API_BASE}/api/protocol`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ port, protocol: proto, action })
                });
                const data = await res.json();
                if (data.ok) {
                    // 显式设置确定值（而非 ! 取反），与 SSE 广播收敛到同一结果，顺序无关
                    if (protocolSwitches[port]) protocolSwitches[port][proto] = action === 'on';
                    renderModalProtocols();
                }
            } catch (e) { console.error('Protocol toggle error:', e); }
            finally { btn.disabled = false; }
        }


        // ── Charging Protocol Card (充电协议独立卡片) ──
        function renderProtocolCard() {
            const grid = document.getElementById('protoGrid');
            if (!grid) return;
            const labels = { pd: 'PD', pps: 'PPS', ufcs: 'UFCS', scp: 'SCP' };
            const portOrder = ['c1', 'c2', 'c3', 'a'];
            let html = '';
            for (const portKey of portOrder) {
                const sw = protocolSwitches[portKey] || {};
                const protoKeys = Object.keys(sw);
                if (protoKeys.length === 0) continue;
                const portId = PORT_KEY_TO_ID[portKey];
                const portName = PORT_MAP[portId] || portKey.toUpperCase();
                const portData = latestPorts[portId];
                const curProto = portData ? portData.protocol : 'idle';
                html += '<div class="proto-port">';
                html += '<div class="proto-port-header">';
                html += '<span class="proto-port-name ' + portKey + '">' + portName + '</span>';
                html += '<span class="proto-port-cur">' + (curProto !== 'idle' ? curProto : '无输出') + '</span>';
                html += '</div>';
                html += '<div class="proto-section-label">充电协议</div>';
                const isC1C2Port = (portKey === 'c1' || portKey === 'c2');
                const isC3APort = (portKey === 'c3' || portKey === 'a');
                const displayKeys = isC1C2Port ? ['ufcs', 'pd', 'pps'] : (isC3APort ? ['ufcs', 'scp'] : protoKeys);
                for (const pk of displayKeys) {
                    const on = !!sw[pk];
                    const isC1C2 = isC1C2Port;
                    const disabled = (pk === 'pps' && !sw.pd) ? 'disabled' : '';
                    html += '<div class="proto-row">';
                    html += '<div class="proto-row-info">';
                    html += '<div class="proto-row-label">' + (labels[pk] || pk) + '</div>';
                    if (pk === 'pd' && isC1C2) {
                        html += '<div class="proto-row-note">关闭PD协议后，PPS协议也将同时关闭</div>';
                    }
                    if ((pk === 'ufcs' || pk === 'scp') && !isC1C2) {
                        html += '<div class="proto-row-note">需重新插拔端口设备生效</div>';
                    }
                    html += '</div>';
                    html += '<label class="proto-toggle">';
                    html += '<input type="checkbox" ' + (on ? 'checked' : '') + ' ' + disabled + ' onchange="toggleProtocolCard(\'' + portKey + '\',\'' + pk + '\', this.checked)">';
                    html += '<span class="proto-toggle-slider"></span>';
                    html += '</label>';
                    html += '</div>';
                }
                html += '</div>';
            }
            grid.innerHTML = html;
        }

        async function toggleProtocolCard(port, proto, checked) {
            const action = checked ? 'on' : 'off';
            try {
                const res = await fetch(API_BASE + '/api/protocol', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ port: port, protocol: proto, action: action })
                });
                const data = await res.json();
                if (data.ok) {
                    if (protocolSwitches[port]) protocolSwitches[port][proto] = checked;
                    if (proto === 'pd' && !checked && protocolSwitches[port]) {
                        protocolSwitches[port].pps = false;
                    }
                    renderProtocolCard();
                    if (currentModalPort) renderModalProtocols();
                }
            } catch (e) { console.error('Protocol card toggle error:', e); }
        }
        function closeModal() {
            document.getElementById('portModal').classList.remove('show');
            currentModalPort = null;
            // 关闭弹窗时自动退出实时曲线模式
            if (modalRealTimePort !== null) {
                const btn = document.getElementById('modalRealTimeBtn');
                if (btn) { btn.classList.remove('active'); btn.textContent = I18N.t('modal.realtime'); }
                modalRealTimePort = null;
                if (modalRealTimeDebounce) { clearTimeout(modalRealTimeDebounce); modalRealTimeDebounce = null; }
                if (modalRealTimeTimer) { clearInterval(modalRealTimeTimer); modalRealTimeTimer = null; }
            }
        }

        function updateModalChart() {
            if (!currentModalPort || !modalChart) return;
            if (modalRealTimePort !== null) { _updateRealTimeModalChart(); return; }
            const h = portHistory[currentModalPort];
            modalChart.data.labels = [...powerChart.data.labels.slice(-h.voltage.length)];
            modalChart.data.datasets[0].data = [...h.voltage];
            modalChart.data.datasets[1].data = [...h.current];
            modalChart.data.datasets[2].data = [...h.power];
            modalChart.update('none');
            // Use real-time data if chart history is empty
            const rt = latestPorts[currentModalPort];
            document.getElementById('modalVoltage').textContent = (rt ? rt.voltage : (h.voltage[h.voltage.length - 1] || 0)).toFixed(1);
            document.getElementById('modalCurrent').textContent = (rt ? rt.current : (h.current[h.current.length - 1] || 0)).toFixed(2);
            document.getElementById('modalPower').textContent = (rt ? rt.power : (h.power[h.power.length - 1] || 0)).toFixed(1);
            const protocolEl = document.getElementById('modalProtocol');
            if (protocolEl) {
                const portData = latestPorts[currentModalPort];
                const lastProtocol = portData ? portData.protocol : 'idle';
                protocolEl.textContent = lastProtocol;
                protocolEl.style.color = lastProtocol !== 'idle' ? 'var(--accent)' : 'var(--text-dim)';
            }
        }

        document.getElementById('portModal').addEventListener('click', function(e) { if (e.target === this) closeModal(); });
        document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeModal(); });

        async function fetchStatus() {
            try {
                const res = await fetch(`${API_BASE}/api/status`);
                const data = await res.json();
                updateUI(data);
            } catch (e) { console.error('Fetch error:', e); }
        }

        function updateUI(data) {
            bleConnected = data.connected && data.authenticated;
            latestPorts = data.ports || {};
            if (data.protocol_switches) protocolSwitches = data.protocol_switches;
            if (data.protocol_extend !== undefined) protocolExtend = data.protocol_extend;
            updateStatusBadge(data.connected, data.authenticated, data.mqtt_connected);
            updateBleButton();
            renderPorts(data.ports);
            updateDeviceContainer(data.ports);
            updateSettingsUI(data.settings || {});
            renderProtocolCard();
            renderCountdown(data.settings || {});
            updateSummary(data.ports);
            if (data.firmware_version) {
                const fwEl = document.getElementById('firmwareVersion');
                if (fwEl) {
                    fwEl.dataset.firmware = data.firmware_version;
                    fwEl.textContent = I18N.t('common.firmware', { version: data.firmware_version });
                }
            }
            if (currentModalPort) updateModalChart();
        }

        function updateSummary(ports) {
            let totalPower = 0, activeCount = 0, maxV = 0;
            for (const [id, port] of Object.entries(ports || {})) {
                if ((port.current > 0 || port.power > 0) && port.enabled !== false) {
                    totalPower += port.power;
                    activeCount++;
                    maxV = Math.max(maxV, port.voltage);
                }
            }
            document.getElementById('totalPower').textContent = totalPower.toFixed(1);
            const apEl = document.getElementById('activePorts');
            if (apEl) apEl.textContent = activeCount;
            document.getElementById('maxVoltage').textContent = maxV.toFixed(1);
        }

        // ── Incremental port DOM update (no innerHTML rebuild) ──
        function updatePortDOM(portId, portData) {
            const key = String(portId);
            // Merge with existing data to preserve fields not in SSE event
            latestPorts[key] = { ...(latestPorts[key] || {}), ...portData };
            const card = document.getElementById(`port-${portId}`);
            if (!card) return renderPorts(latestPorts);
            const merged = latestPorts[key];
            // Update stats text directly
            const vals = card.querySelectorAll('.port-stat-value');
            if (vals[0]) vals[0].textContent = merged.voltage.toFixed(1);
            if (vals[1]) vals[1].textContent = merged.current.toFixed(1);
            if (vals[2]) vals[2].textContent = merged.power.toFixed(1);
            // Update protocol label
            const protoEl = card.querySelector('.port-protocol');
            if (protoEl) {
                protoEl.textContent = merged.protocol;
                protoEl.style.color = merged.protocol !== 'idle' ? 'var(--accent)' : 'var(--text-dim)';
            }
            // Update active class (enabled comes from PIID 16, not BLE data)
            card.classList.toggle('active', merged.enabled !== false);
            // Update toggle checkbox
            const toggle = document.getElementById(`toggle-${PORT_KEY_MAP[portId]}`);
            if (toggle) toggle.checked = merged.enabled !== false;
            // Update summary totals
            updateSummary(latestPorts);
            // Update modal if open for this port
            if (String(currentModalPort) === key) updateModalChart();
        }

        let _mqttConnected = false;
        function updateStatusBadge(connected, authenticated, mqttConnected) {
            const badge = document.getElementById('statusBadge');
            badge.className = (connected && authenticated) ? 'status-badge connected' : 'status-badge disconnected';

            if (mqttConnected !== undefined) _mqttConnected = mqttConnected;
            const mqttBadge = document.getElementById('mqttBadge');
            mqttBadge.className = _mqttConnected ? 'status-badge connected' : 'status-badge disconnected';
        }

        function updateBleButton() {
            const btn = document.getElementById('bleToggle');
            if (!btn) return;
            if (bleConnected) {
                btn.textContent = I18N.t('common.disconnect');
                btn.dataset.state = 'disconnect';
                btn.className = 'btn btn-danger';
            } else {
                btn.textContent = I18N.t('common.connect');
                btn.dataset.state = 'connect';
                btn.className = 'btn btn-primary';
            }
        }

        function renderPorts(ports) {
            const grid = document.getElementById('portGrid');
            // Save current toggle states during recent-change window
            const savedChecks = {};
            if (isRecent()) {
                for (const [id] of Object.entries(PORT_MAP)) {
                    const key = PORT_KEY_MAP[id];
                    const t = document.getElementById(`toggle-${key}`);
                    if (t) savedChecks[key] = t.checked;
                }
            }
            let html = '';
            for (const [id, name] of Object.entries(PORT_MAP)) {
                const port = ports[id] || { voltage: 0, current: 0, power: 0, enabled: false, protocol: 'idle' };
                const key = PORT_KEY_MAP[id];
                const protocolColor = port.protocol !== 'idle' ? 'var(--accent)' : 'var(--text-dim)';
                const checked = (isRecent() && savedChecks.hasOwnProperty(key)) ? savedChecks[key] : port.enabled;
                html += `
                    <div class="port-card ${checked ? 'active' : ''}" id="port-${id}" onclick="handlePortClick(event, ${id})">
                        <div class="port-header">
                            <span class="port-name ${key}">${name}</span>
                            <label class="port-toggle" onclick="event.stopPropagation()">
                                <input type="checkbox" id="toggle-${key}" ${checked ? 'checked' : ''} onchange="togglePort('${key}', this.checked)">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        <div class="port-stats">
                            <div class="port-stat"><div class="port-stat-value">${port.voltage.toFixed(1)}</div><div class="port-stat-label">${I18N.t('power.voltage')}</div></div>
                            <div class="port-stat"><div class="port-stat-value">${port.current.toFixed(1)}</div><div class="port-stat-label">${I18N.t('power.current')}</div></div>
                            <div class="port-stat"><div class="port-stat-value">${port.power.toFixed(1)}</div><div class="port-stat-label">${I18N.t('power.power')}</div></div>
                        </div>
                        ${port.protocol !== 'idle' ? `<div class="port-protocol" style="text-align:center;margin-top:8px;font-size:11px;color:${protocolColor}">${port.protocol}</div>` : ``}
                    </div>`;
            }
            grid.innerHTML = html;
        }

        function handlePortClick(event, portId) {
            if (event.target.closest('.port-toggle')) return;
            openModal(portId);
        }

        
        // ── 充电记录时间段下拉 ──
        function toggleChargePeriodMenu() {
            const sw = document.getElementById('chargePeriodSwitcher');
            const wasOpen = sw.classList.contains('open');
            document.getElementById('themeMenu')?.classList.remove('show');
            document.getElementById('logLevelMenu')?.classList.remove('show');
            document.querySelectorAll('.setting-switcher.open').forEach(s => s.classList.remove('open'));
            if (!wasOpen) sw.classList.add('open');
        }
        function setChargePeriod(value) {
            const label = document.querySelector('#chargePeriodMenu .dropdown-option[data-value="' + value + '"]').textContent;
            document.getElementById('chargePeriodLabel').textContent = label;
            document.querySelectorAll('#chargePeriodMenu .dropdown-option').forEach(o => o.classList.remove('active'));
            document.querySelector('#chargePeriodMenu .dropdown-option[data-value="' + value + '"]').classList.add('active');
            document.getElementById('chargePeriodSwitcher').classList.remove('open');
            startChargeHistoryAutoRefresh('chargeSessionList', 'chargeStats', value, 30000);
        }

function buildSettingsHtml(settings) {
            let html = '';
            SETTINGS_CONFIG.forEach(s => {
                const val = settings[String(s.piid)] ?? s.options[0].value;
                const name = I18N.t(s.nameKey);
                const cur = s.options.find(o => o.value === val);
                const curLabel = cur ? I18N.t(cur.labelKey || cur.label) : '';
                const opts = s.options.map(o =>
                    `<div class="dropdown-option${o.value === val ? ' active' : ''}" data-value="${o.value}" onclick="setSettingValue(${s.piid}, ${o.value}, this)">${I18N.t(o.labelKey || o.label)}</div>`
                ).join('');
                html += `<div class="setting-item" data-piid="${s.piid}"><span class="setting-label">${name}</span><div class="dropdown-switcher setting-switcher"><button class="dropdown-btn" onclick="toggleSettingMenu(this)"><span class="setting-dropdown-value">${curLabel}</span><span class="dropdown-arrow">▾</span></button><div class="dropdown-menu">${opts}</div></div></div>`;
            });
            return html;
        }

        function toggleSettingMenu(btn) {
            const switcher = btn.closest('.dropdown-switcher');
            const wasOpen = switcher.classList.contains('open');
            document.querySelectorAll('.setting-switcher.open').forEach(s => s.classList.remove('open'));
            if (!wasOpen) switcher.classList.add('open');
        }

        function setSettingValue(piid, value, optionEl) {
            const switcher = optionEl.closest('.dropdown-switcher');
            switcher.querySelector('.setting-dropdown-value').textContent = optionEl.textContent;
            switcher.querySelectorAll('.dropdown-option').forEach(o => o.classList.remove('active'));
            optionEl.classList.add('active');
            switcher.classList.remove('open');
            setSetting(piid, value);
        }



        // ── Scene Mode (独立卡片) ──
        const SCENE_MODES = [
            { value: 1, labelKey: 'scene.ai', icon: '<span class="scene-ai-text">AI</span>' },
            { value: 2, labelKey: 'scene.eco', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="13" height="9" rx="1.5"/><path d="M2 15h13"/><rect x="16.5" y="8" width="4.5" height="9" rx="1"/><path d="M18.5 15h.5"/></svg>' },
            { value: 3, labelKey: 'scene.single', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L5 13h6l-1 9 8-11h-6l1-9z"/><path d="M3 6.5h2.5M3 10.5h2.5M3 14.5h2"/></svg>' },
            { value: 4, labelKey: 'scene.balanced', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12c2.5-5 5-5 7.5 0s5 5 7.5 0 2.5-5 3-5"/></svg>' }
        ];
        let sceneRendered = false;

        function renderSceneMode(settings) {
            const container = document.getElementById('sceneOptions');
            if (!container) return;
            const val = settings ? (settings['5'] ?? 1) : 1;
            let html = '';
            SCENE_MODES.forEach(m => {
                const active = m.value === val ? ' active' : '';
                html += '<div class="scene-option' + active + '" data-value="' + m.value + '" onclick="setSceneMode(' + m.value + ')">'
                    + '<div class="scene-icon">' + m.icon + '</div>'
                    + '<div class="scene-label">' + I18N.t(m.labelKey) + '</div>'
                    + '</div>';
            });
            container.innerHTML = html;
            const cur = SCENE_MODES.find(m => m.value === val);
            const curEl = document.getElementById('sceneCurrent');
            if (curEl && cur) curEl.textContent = I18N.t(cur.labelKey);
            sceneRendered = true;
        }

        function updateSceneModeUI(settings) {
            if (isRecent()) return;
            if (!sceneRendered) { renderSceneMode(settings); return; }
            const val = settings ? (settings['5'] ?? 1) : 1;
            
            // SSE回传值与当前显示一致时跳过，避免重复渲染动画
            const activeEl = document.querySelector('.scene-option.active');
            if (activeEl && parseInt(activeEl.dataset.value, 10) === val) return;
document.querySelectorAll('.scene-option').forEach(el => {
                el.classList.toggle('active', parseInt(el.dataset.value, 10) === val);
            });
            const cur = SCENE_MODES.find(m => m.value === val);
            const curEl = document.getElementById('sceneCurrent');
            if (curEl && cur) curEl.textContent = I18N.t(cur.labelKey);
        }

        async function setSceneMode(value) {
            markLocal();
            // 快速连续点击时禁用CSS过渡动画，避免重叠
            const now = Date.now();
            const sceneContainer = document.getElementById('sceneOptions');
            if (sceneContainer) {
                if (now - (window._lastSceneClick || 0) < 300) {
                    sceneContainer.classList.add('rapid-switch');
                    clearTimeout(window._sceneSwitchTimer);
                }
                window._lastSceneClick = now;
                window._sceneSwitchTimer = setTimeout(() => {
                    sceneContainer.classList.remove('rapid-switch');
                }, 400);
            }
            document.querySelectorAll('.scene-option').forEach(el => {
                el.classList.toggle('active', parseInt(el.dataset.value, 10) === value);
            });
            const cur = SCENE_MODES.find(m => m.value === value);
            const curEl = document.getElementById('sceneCurrent');
            if (curEl && cur) curEl.textContent = I18N.t(cur.labelKey);
                        // 同步更新设备设置中的场景模式下拉
            const settingItem = document.querySelector('.setting-item[data-piid="5"]');
            if (settingItem) {
                const valueEl = settingItem.querySelector('.setting-dropdown-value');
                if (valueEl && cur) valueEl.textContent = I18N.t(cur.labelKey);
                settingItem.querySelectorAll('.dropdown-option').forEach(o => {
                    const ov = parseInt(o.dataset.value, 10);
                    o.classList.toggle('active', ov === value);
                });
            }
fetch(API_BASE + '/api/set', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ piid: 5, value: value }) }).catch(e => console.error('Set scene mode error:', e));
        }
        function updateSettingsUI(settings) {
            const grid = document.getElementById('settingsGrid');
            if (Object.keys(lastSettings).length === 0) {
                grid.innerHTML = buildSettingsHtml(settings);
            } else {
                SETTINGS_CONFIG.forEach(s => {
                    const select = grid.querySelector(`select[onchange*="${s.piid}"]`);
                    if (select && !isRecent()) { const newVal = settings[String(s.piid)] ?? s.options[0].value; if (select.value != newVal) select.value = newVal; }
                });
            }
            lastSettings = settings;
        }

        async function togglePort(port, on) {
            markLocal();
            const toggle = document.getElementById(`toggle-${port}`);
            if (toggle) toggle.disabled = true;
            try {
                const res = await fetch(`${API_BASE}/api/port`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ port, action: on ? 'on' : 'off' }) });
                const result = await res.json();
                if (!result.ok) {
                    if (toggle) toggle.checked = !on;
                }
            } catch (e) {
                console.error('Port toggle error:', e);
                if (toggle) toggle.checked = !on;
            } finally {
                if (toggle) toggle.disabled = false;
                // SSE port_update will update UI automatically
            }
        }

        async function setSetting(piid, value) {
            markLocal();
                        // 反向同步：从设备设置切换场景模式时更新场景卡片
            if (piid === 5) {
                document.querySelectorAll('.scene-option').forEach(el => {
                    el.classList.toggle('active', parseInt(el.dataset.value, 10) === value);
                });
                const cur = SCENE_MODES.find(m => m.value === value);
                const curEl = document.getElementById('sceneCurrent');
                if (curEl && cur) curEl.textContent = I18N.t(cur.labelKey);
            }
try { await fetch(`${API_BASE}/api/set`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ piid, value }) }); } catch (e) { console.error('Set setting error:', e); }
        }

        let countdownRendered = false;

        function renderCountdown(settings) {
            const grid = document.getElementById('countdownGrid');
            if (!grid) return;
            if (!countdownRendered) {
                let html = '';
                for (const [id, name] of Object.entries(PORT_MAP)) {
                    const key = PORT_KEY_MAP[id];
                    html += `
                        <div class="countdown-item">
                            <div class="countdown-port-name ${key}">${name}</div>
                            <div class="countdown-row">
                                <div class="countdown-row-left">
                                    <span class="countdown-row-label">延时关闭</span>
                                    <label class="proto-toggle">
                                        <input type="checkbox" id="countdown-enable-${key}" onchange="toggleCountdownEnable('${key}', this.checked)">
                                        <span class="proto-toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="countdown-row-right">
                                    <input type="number" class="countdown-input" id="countdown-${key}" min="1" max="1440" placeholder="未设置" onkeydown="if(event.key==='Enter'){handleCountdownAction('${key}')}">
                                    <span class="countdown-unit">分钟</span>
                                </div>
                            </div>
                            <div class="countdown-quick">
                                ${QUICK_MINUTES.map(m => `<button class="countdown-quick-btn" onclick="setCountdown('${key}', ${m})">${m}分</button>`).join('')}
                            </div>
                            <div class="countdown-actions">
                                <button class="countdown-toggle-btn set" id="countdown-btn-${key}" onclick="handleCountdownAction('${key}')">设置</button>
                            </div>
                        </div>`;
                }
                grid.innerHTML = html;
                countdownRendered = true;
            }
            for (const [id, name] of Object.entries(PORT_MAP)) {
                const piid = COUNTDOWN_PIIDS[id];
                const currentVal = settings[String(piid)] || 0;
                const key = PORT_KEY_MAP[id];
                const enabled = currentVal > 0;
                const toggle = document.getElementById('countdown-enable-' + key);
                if (toggle) toggle.checked = enabled;
                const input = document.getElementById('countdown-' + key);
                if (input) {
                    input.placeholder = enabled ? '分钟' : '未设置';
                    if (document.activeElement !== input) input.value = enabled ? currentVal : '';
                }
                const btn = document.getElementById('countdown-btn-' + key);
                if (btn && !btn.disabled) {
                    if (enabled) { btn.textContent = '清除'; btn.className = 'countdown-toggle-btn clear'; }
                    else { btn.textContent = '设置'; btn.className = 'countdown-toggle-btn set'; }
                }
            }
        }

        function toggleCountdownEnable(port, enabled) {
            if (enabled) {
                const input = document.getElementById('countdown-' + port);
                const val = (input && input.value && parseInt(input.value) > 0) ? parseInt(input.value) : 60;
                if (input) input.value = val;
                setCountdown(port, val);
            } else {
                setCountdown(port, 0);
            }
        }

        const countdownPending = {};

        async function setCountdown(port, minutes) {
            if (countdownPending[port]) return;
            countdownPending[port] = true;
            markLocal();
            const id = PORT_KEY_TO_ID[port];
            const btn = document.getElementById('countdown-btn-' + port);
            const input = document.getElementById('countdown-' + port);
            const toggle = document.getElementById('countdown-enable-' + port);
            const isClear = minutes === 0;
            // 乐观更新: 立即反映UI, 不等待API
            if (toggle) toggle.checked = !isClear;
            if (input && document.activeElement !== input) {
                input.value = isClear ? '' : minutes;
                input.placeholder = isClear ? '未设置' : '分钟';
            }
            if (btn) {
                btn.disabled = true;
                btn.textContent = isClear ? '清除中...' : '设置中...';
            }
            const piid = COUNTDOWN_PIIDS[id];
            if (!piid) { countdownPending[port] = false; if (btn) btn.disabled = false; return; }
            try {
                await fetch(API_BASE + '/api/set', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ piid, value: minutes }) });
                countdownPending[port] = false;
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = isClear ? '设置' : '清除';
                    btn.className = 'countdown-toggle-btn ' + (isClear ? 'set' : 'clear');
                }
            } catch (e) {
                console.error('Set countdown error:', e);
                countdownPending[port] = false;
                if (btn) { btn.disabled = false; btn.textContent = '重试'; }
            }
        }

        function setCountdownFromInput(port) {
            const input = document.getElementById('countdown-' + port);
            const minutes = parseInt(input.value) || 0;
            setCountdown(port, minutes);
        }

        function handleCountdownAction(port) {
            const btn = document.getElementById('countdown-btn-' + port);
            if (btn && btn.classList.contains('clear')) {
                setCountdown(port, 0);
            } else {
                const input = document.getElementById('countdown-' + port);
                const val = parseInt(input.value);
                setCountdown(port, (val && val > 0) ? val : 60);
            }
        }
        async function bleToggle() {
            const btn = document.getElementById('bleToggle');
            if (btn.disabled) return;
            btn.disabled = true;
            try {
                const enable = btn.dataset.state === 'connect';
                await fetch(`${API_BASE}/api/enable`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: enable }) });
                // SSE status event will update UI when connection state changes
            } catch (e) { console.error('BLE toggle error:', e); }
            finally { btn.disabled = false; }
        }

        async function bleRestart() {
            const btn = document.getElementById('bleToggle');
            if (btn.disabled) return;
            btn.disabled = true;
            try {
                await fetch(`${API_BASE}/api/enable`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: false }) });
                await new Promise(r => setTimeout(r, 2000));
                await fetch(`${API_BASE}/api/enable`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: true }) });
                // SSE status event will update UI when connection state changes
            } catch (e) { console.error('BLE restart error:', e); }
            finally { btn.disabled = false; }
        }

        async function fetchBemfaStatus() {
            try {
                const resp = await fetch(`${API_BASE}/api/bemfa`);
                const data = await resp.json();
                const badge = document.getElementById('bemfaBadge');
                if (!badge) return;
                if (data.enabled && data.connected) {
                    badge.className = 'status-badge connected';
                } else if (data.enabled) {
                    badge.className = 'status-badge connecting';
                } else {
                    badge.className = 'status-badge disconnected';
                }
            } catch (e) { console.error('Bemfa status error:', e); }
        }

        // Set initial active button
        document.querySelectorAll('.time-btn').forEach(btn => {
            const btnMinutes = parseInt(btn.dataset.minutes, 10);
            if (!isNaN(btnMinutes)) btn.classList.toggle('active', btnMinutes === parseInt(localStorage.getItem('cuktech-chart-hours') || '60'));
        });

        function initApp() {
            try {
                initChart();
                fetchChartData();
                initSSE();
                fetchBemfaStatus();
                // 安全兜底：每 30s 轮询 /api/status 校正因 SSE 队列丢事件导致的连接状态偏差
                setInterval(async () => {
                    try {
                        const res = await fetch(`${API_BASE}/api/status`);
                        const data = await res.json();
                        const realConn = data.connected && data.authenticated;
                        if (realConn !== bleConnected) {
                            updateUI(data);
                        }
                    } catch (e) {}
                }, 30000);
            } catch (e) {
                console.error('Init error:', e);
                // Fallback to polling if SSE fails
                pollStatus();
            }
        }

        // ── SSE (Server-Sent Events) — replaces 2s polling ──
        let evtSource = null;
        let sseChartTimer = null;

        // Fallback polling — used when SSE init fails
        async function pollStatus() {
            await fetchStatus();
            setTimeout(pollStatus, 2000);
        }

        function initSSE() {
            if (evtSource) { evtSource.close(); evtSource = null; }
            evtSource = new EventSource(`${API_BASE}/api/events`);
            evtSource.onopen = () => {
                console.log('SSE connected');
                document.getElementById('statusBadge').className = 'status-badge connected';
                // SSE init event handles state sync; no fetchStatus needed
            };
            evtSource.onmessage = (e) => {
                try {
                    const msg = JSON.parse(e.data);
                    switch (msg.type) {
                        case 'init':
                            updateUI(msg);
                            break;
                        case 'port_update':
                            _accumulateRealTimeData(msg.port_id, msg.data);
                            updatePortDOM(msg.port_id, msg.data);
                            updateDeviceContainer(latestPorts);
                            break;
                        case 'status':
                            bleConnected = msg.connected && msg.authenticated;
                            latestPorts = latestPorts || {};
                            updateStatusBadge(msg.connected, msg.authenticated, msg.mqtt_connected);
                            updateBleButton();
                            if (msg.firmware_version) {
                                const fwEl = document.getElementById('firmwareVersion');
                                if (fwEl) {
                                    fwEl.dataset.firmware = msg.firmware_version;
                                    fwEl.textContent = I18N.t('common.firmware', { version: msg.firmware_version });
                                }
                            }
                            if (!bleConnected) {
                                // Disconnect: clear port data
                                for (const id of Object.keys(PORT_MAP)) {
                                    latestPorts[id] = { voltage: 0, current: 0, power: 0, active: false, protocol: 'idle', enabled: true };
                                }
                                renderPorts(latestPorts);
                                updateDeviceContainer(latestPorts);
                                updateSummary(latestPorts);
                            } else if (msg.ports) {
                                // Reconnect: apply full state
                                latestPorts = msg.ports;
                                renderPorts(msg.ports);
                                updateDeviceContainer(msg.ports);
                                updateSummary(msg.ports);
                            }
                            if (msg.settings) {
                                updateSettingsUI(msg.settings);
                                updateSceneModeUI(msg.settings);
                                renderCountdown(msg.settings);
                            }
                            if (msg.protocol_switches) { protocolSwitches = msg.protocol_switches; renderProtocolCard(); }
                            if (msg.protocol_extend !== undefined) protocolExtend = msg.protocol_extend;
                            break;
                        case 'settings':
                            if (msg.settings) {
                                updateSettingsUI(msg.settings);
                                updateSceneModeUI(msg.settings);
                                renderCountdown(msg.settings);
                            }
                            break;
                        case 'protocol':
                            if (msg.switches) { protocolSwitches = msg.switches; renderProtocolCard(); }
                            if (msg.protocol_extend !== undefined) protocolExtend = msg.protocol_extend;
                            if (currentModalPort) renderModalProtocols();
                            break;
                        case 'session_end':
                            window.dispatchEvent(new CustomEvent('sse-session-end', { detail: msg }));
                            break;
                        case 'quality':
                            renderQuality(msg);
                            break;
                    }
                } catch (err) { console.error('SSE parse error:', err); }
            };
            evtSource.onerror = () => {
                console.warn('SSE disconnected, will auto-reconnect');
                document.getElementById('statusBadge').className = 'status-badge disconnected';
            };
            // bfcache: close on leave, reopen on return
            window.addEventListener('pagehide', () => { if (evtSource) { evtSource.close(); evtSource = null; } });
            window.addEventListener('pageshow', () => { if (!evtSource) initSSE(); });
            // Chart refresh every 30s (decoupled from status)
            sseChartTimer = setInterval(fetchChartData, 30000);
        }

        let _lastQuality = null;
        function renderQuality(q) {
            _lastQuality = q;
            renderBleQuality(q.ble || {});
            renderMqttQuality(q.mqtt || {});
            renderBemfaQuality(q.bemfa || {});
        }
        function formatDuration(sec) {
            if (!sec) return '0s';
            const h = Math.floor(sec / 3600);
            const m = Math.floor((sec % 3600) / 60);
            const s = sec % 60;
            return h > 0 ? `${h}h${m}m` : m > 0 ? `${m}m${s}s` : `${s}s`;
        }
        function scoreColor(score) {
            return score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)';
        }
        function qualityBar(score) {
            const c = scoreColor(score);
            return `<div class="quality-bar"><div class="quality-bar-fill" style="width:${score}%;background:${c}"></div></div>`;
        }
        function renderBleQuality(ble) {
            const el = document.getElementById('qualityTooltip');
            if (!el) return;
            const uptimeText = ble.uptime > 0 ? formatDuration(ble.uptime) : I18N.t('quality.notConnected');
            const lastPushText = ble.last_push_age != null ? I18N.t('quality.secondsAgo', { count: ble.last_push_age }) : I18N.t('quality.none');
            const pushColor = ble.last_push_age != null && ble.last_push_age > 10 ? 'color:var(--warning)' : '';
            const delayText = ble.next_reconnect_delay != null ? I18N.t('quality.secondsLater', { count: Math.round(ble.next_reconnect_delay) }) : null;
            el.innerHTML = `<div style="font-weight:600;margin-bottom:2px;">BLE <span style="color:${scoreColor(ble.score)}">${ble.score}</span>/100</div>
                ${qualityBar(ble.score)}
                <div class="quality-row"><span class="quality-label">${I18N.t('quality.connectionDuration')}</span><span>${uptimeText}</span></div>
                <div class="quality-row"><span class="quality-label">${I18N.t('quality.lastPush')}</span><span style="${pushColor}">${lastPushText}</span></div>
                ${delayText ? `<div class="quality-row"><span class="quality-label">${I18N.t('quality.nextReconnect')}</span><span style="color:var(--warning)">${delayText}</span></div>` : ''}
                <div class="quality-row"><span class="quality-label">${I18N.t('quality.decryptSuccess')}</span><span>${ble.decrypt}%</span></div>
                <div class="quality-row"><span class="quality-label">${I18N.t('quality.notifyResponse')}</span><span>${ble.notify}%</span></div>
                <div class="quality-row"><span class="quality-label">${I18N.t('quality.connectionStable')}</span><span>${ble.reconnect_score}%</span></div>
                <div class="quality-row"><span class="quality-label">${I18N.t('quality.reconnect5m')}</span><span>${I18N.t('quality.times', { count: ble.reconnect_count_5m })}</span></div>`;
        }
        function renderMqttQuality(mqtt) {
            const el = document.getElementById('mqttTooltip');
            if (!el) return;
            el.innerHTML = `<div style="font-weight:600;margin-bottom:2px;">MQTT <span style="color:${scoreColor(mqtt.score)}">${mqtt.score}</span>/100</div>
                ${qualityBar(mqtt.score)}
                <div class="quality-row"><span class="quality-label">${I18N.t('quality.runtime')}</span><span>${formatDuration(mqtt.uptime)}</span></div>
                <div class="quality-row"><span class="quality-label">${I18N.t('quality.disconnects')}</span><span>${mqtt.disconnects}</span></div>
                <div class="quality-row"><span class="quality-label">${I18N.t('quality.publishFailures')}</span><span>${mqtt.publish_failures}</span></div>`;
        }
        function renderBemfaQuality(bemfa) {
            const el = document.getElementById('bemfaTooltip');
            if (!el) return;
            el.innerHTML = `<div style="font-weight:600;margin-bottom:2px;">Bemfa <span style="color:${scoreColor(bemfa.score)}">${bemfa.score}</span>/100</div>
                ${qualityBar(bemfa.score)}
                <div class="quality-row"><span class="quality-label">${I18N.t('quality.runtime')}</span><span>${formatDuration(bemfa.uptime)}</span></div>
                <div class="quality-row"><span class="quality-label">${I18N.t('quality.pingLost')}</span><span>${bemfa.ping_lost}/3</span></div>
                <div class="quality-row"><span class="quality-label">${I18N.t('quality.reconnectCount')}</span><span>${bemfa.reconnect_count}</span></div>`;
        }
        // Hover tooltip for each badge
        function setupBadgeTooltip(badgeId, tooltipId) {
            const badge = document.getElementById(badgeId);
            const tooltip = document.getElementById(tooltipId);
            if (!badge || !tooltip) return;
            badge.addEventListener('mouseenter', (e) => {
                if (_lastQuality) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    tooltip.style.left = rect.left + 'px';
                    tooltip.style.top = (rect.bottom + 8) + 'px';
                    tooltip.style.display = 'block';
                }
            });
            badge.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        }
        setupBadgeTooltip('statusBadge', 'qualityTooltip');
        setupBadgeTooltip('mqttBadge', 'mqttTooltip');
        setupBadgeTooltip('bemfaBadge', 'bemfaTooltip');
        // Hide all tooltips on scroll or click outside
        function hideAllTooltips() {
            ['qualityTooltip', 'mqttTooltip', 'bemfaTooltip'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });
        }
        document.addEventListener('scroll', hideAllTooltips, true);
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.status-badge')) hideAllTooltips();
        });

        function updateDeviceContainer(ports) {
            const unconnected = document.getElementById('unconnectedImg');
            const charger = document.getElementById('deviceChargerAnim');
            const glow = document.getElementById('darkGlowAni');
            const badge = document.getElementById('sceneBadgeAni');
            if (!unconnected || !charger) return;

            let totalW = 0;
            for (const [id, port] of Object.entries(ports || {})) {
                if (port.enabled !== false && port.power > 0) totalW += port.power;
            }

            const wrapInner = document.querySelector('.device-wrap-inner');

            if (totalW > 0) {
                unconnected.classList.remove('show');
                if (wrapInner) wrapInner.classList.remove('idle');
                charger.classList.add('charging');
                glow.classList.add('active');
                if (badge) badge.classList.remove('show');

                const portKeys = ['c1','c2','c3','a'];
                for (const key of portKeys) {
                    const p = ports[String(PORT_KEY_TO_ID[key])] || { voltage:0, current:0, power:0, enabled:false, protocol:'idle' };
                    const mod = document.getElementById('usbMod' + key.toUpperCase());
                    const pval = document.getElementById('usbPval' + key.toUpperCase());
                    const active = p.enabled && p.power > 0;
                    if (mod) mod.classList.toggle('active', active);
                    if (pval) pval.textContent = active ? p.power.toFixed(1) + 'W' : '0W';
                }
            } else {
                unconnected.classList.add('show');
                if (wrapInner) wrapInner.classList.add('idle');
                charger.classList.remove('charging');
                glow.classList.remove('active');
                ['c1','c2','c3','a'].forEach(k => {
                    const m = document.getElementById('usbMod' + k.toUpperCase());
                    if (m) m.classList.remove('active');
                });
                if (badge) badge.classList.remove('show');
            }
        }

        // Initialize if Chart.js is ready, otherwise wait for CDN fallback
        if (typeof Chart !== 'undefined') {
            initApp();
        } else {
            window.onChartReady = initApp;
        }

        // Charge History auto-refresh
        if (typeof startChargeHistoryAutoRefresh === 'function') {
            startChargeHistoryAutoRefresh('chargeSessionList', 'chargeStats', 'today', 2000);
        }

        // ── Locale change: re-render JS-built (dynamic) content ──
        // Static DOM text is re-translated by I18N.applyTranslations() automatically.
        function rerenderDynamic() {
            updateBleButton();
            renderPorts(latestPorts);
            if (Object.keys(lastSettings).length > 0) {
                const sg = document.getElementById('settingsGrid');
                if (sg) sg.innerHTML = buildSettingsHtml(lastSettings);
                renderSceneMode(lastSettings);
            }
            countdownRendered = false;
            renderCountdown(lastSettings);
            const fwEl = document.getElementById('firmwareVersion');
            if (fwEl && fwEl.dataset.firmware) fwEl.textContent = I18N.t('common.firmware', { version: fwEl.dataset.firmware });

            if (currentModalPort) {
                const rtBtn = document.getElementById('modalRealTimeBtn');
                if (rtBtn) rtBtn.textContent = modalRealTimePort !== null ? I18N.t('modal.realtimeStop') : I18N.t('modal.realtime');
                initModalChart();
                updateModalChart();
                renderModalProtocols();
            }
            if (_lastQuality) renderQuality(_lastQuality);
        }
        if (typeof I18N !== 'undefined' && typeof I18N.onChange === 'function') {
            I18N.onChange(rerenderDynamic);

        }
