"""Tests for ha_server.py - HTTP API endpoints."""
import asyncio
import sys
import json
import time
import tempfile
import pytest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

sys.path.insert(0, str(Path(__file__).parent.parent))

from history import PortHistory


@pytest.fixture
def real_history():
    """Create a real PortHistory with temporary database."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name
    h = PortHistory(db_path=db_path, retention_days=2)
    h.connect()
    # Insert some test data
    for i in range(5):
        h.record_port_data(1, {
            "voltage": 20.0 + i,
            "current": 2.0 + i * 0.1,
            "power": (20.0 + i) * (2.0 + i * 0.1),
            "active": True,
            "protocol": "PD",
        })
    yield h
    h.close()
    Path(db_path).unlink(missing_ok=True)

    def close(self):
        pass


class TestHandleChart:
    """Test chart API endpoint using real handler."""

    @pytest.fixture
    def server(self, real_history):
        """Create a Server instance with real history."""
        from ha_server import Server
        s = Server.__new__(Server)
        s.history = real_history
        s._chart_cache = {}
        s._chart_cache_ttl = 10
        s._chart_cache_max = 50
        return s

    @pytest.mark.asyncio
    async def test_chart_returns_ok(self, server):
        """Test that chart endpoint returns ok=True."""
        from aiohttp import web
        request = AsyncMock()
        request.query = {"hours": "1", "interval": "20"}
        request.headers = {}

        result = await server.handle_chart(request)
        assert isinstance(result, web.Response)
        body = json.loads(result.body)
        assert body["ok"] is True
        assert "labels" in body
        assert "datasets" in body

    @pytest.mark.asyncio
    async def test_chart_caching(self, server):
        """Test that chart data is cached."""
        from aiohttp import web
        request = AsyncMock()
        request.query = {"hours": "1", "interval": "20"}
        request.headers = {}

        await server.handle_chart(request)
        assert len(server._chart_cache) == 1

        await server.handle_chart(request)
        assert len(server._chart_cache) == 1

    @pytest.mark.asyncio
    async def test_chart_etag_304(self, server):
        """Test ETag 304 response."""
        from aiohttp import web
        request = AsyncMock()
        request.query = {"hours": "1", "interval": "20"}
        request.headers = {}

        result1 = await server.handle_chart(request)
        etag = result1.headers.get("ETag")

        request2 = AsyncMock()
        request2.query = {"hours": "1", "interval": "20"}
        request2.headers = {"If-None-Match": etag}

        result2 = await server.handle_chart(request2)
        assert result2.status == 304


class TestHandleStatistics:
    """Test statistics API endpoint."""

    @pytest.mark.asyncio
    async def test_statistics_returns_data(self, real_history):
        from ha_server import Server
        s = Server.__new__(Server)
        s.history = real_history

        request = AsyncMock()
        request.match_info = {"port": "1"}
        request.query = {"hours": "24"}

        result = await s.handle_statistics(request)
        body = json.loads(result.body)
        assert body["ok"] is True

    @pytest.mark.asyncio
    async def test_statistics_invalid_port(self):
        from ha_server import Server
        s = Server.__new__(Server)
        s.history = PortHistory()

        request = AsyncMock()
        request.match_info = {"port": "abc"}
        request.query = {"hours": "24"}

        result = await s.handle_statistics(request)
        assert result.status == 400


class TestHandleExport:
    """Test CSV export endpoint."""

    @pytest.mark.asyncio
    async def test_export_returns_csv(self, real_history):
        from ha_server import Server
        s = Server.__new__(Server)
        s.history = real_history

        request = AsyncMock()
        request.match_info = {"port": "1"}
        request.query = {"hours": "24"}

        result = await s.handle_export(request)
        assert result.content_type == "text/csv"


class TestHandleLogLevel:
    """Test log level API endpoint."""

    @pytest.mark.asyncio
    async def test_get_log_level(self):
        from ha_server import Server
        s = Server.__new__(Server)

        request = AsyncMock()
        request.method = "GET"

        result = await s.handle_log_level(request)
        body = json.loads(result.body)
        assert "level" in body
        assert body["level"] in ["debug", "info", "warning", "error"]

    @pytest.mark.asyncio
    async def test_set_log_level(self, monkeypatch):
        from ha_server import Server
        import logging
        s = Server.__new__(Server)

        # 隔离持久化路径：handle_log_level 会把级别写回 config.yaml，
        # 不隔离会改写项目真实配置（历史测试污染 bug 的回归防护）
        with tempfile.NamedTemporaryFile(
                "w", suffix=".yaml", delete=False, encoding="utf-8") as f:
            f.write("server:\n  log_level: info\n")
            cfg_path = f.name
        monkeypatch.setenv("CUKTECH_CONFIG_PATH", cfg_path)

        request = AsyncMock()
        request.method = "POST"
        request.json = AsyncMock(return_value={"level": "debug"})

        try:
            result = await s.handle_log_level(request)
            body = json.loads(result.body)
            assert body["ok"] is True
            # 级别持久化进了隔离的临时 config.yaml
            import yaml
            with open(cfg_path, encoding="utf-8") as f:
                assert yaml.safe_load(f)["server"]["log_level"] == "debug"
        finally:
            Path(cfg_path).unlink(missing_ok=True)
            # 恢复根日志级别，避免影响同一会话内的后续测试
            logging.getLogger().setLevel(logging.INFO)

    @pytest.mark.asyncio
    async def test_set_invalid_log_level(self):
        from ha_server import Server
        s = Server.__new__(Server)

        request = AsyncMock()
        request.method = "POST"
        request.json = AsyncMock(return_value={"level": "invalid"})

        result = await s.handle_log_level(request)
        assert result.status == 400


class TestHandleProtocol:
    """Test /api/protocol endpoint."""

    @pytest.fixture
    def server(self):
        """Create a Server instance with mocked BLE state."""
        from ha_server import Server
        from state import ChargerState

        s = Server.__new__(Server)
        s.ble = MagicMock()
        s.ble.state = ChargerState()

        async def init_state():
            # Start with all protocols ON (c1/c2: 0x0F each, c3: 0x03, a: 0x03)
            await s.ble.state.update_protocol_extend(0x03030F0F)

        asyncio.run(init_state())
        s.ble.send_command = AsyncMock(return_value={"ok": True})
        return s

    @pytest.mark.asyncio
    async def test_protocol_toggle(self, server):
        """Test toggling a protocol switch."""
        request = AsyncMock()
        request.json = AsyncMock(return_value={"port": "c1", "protocol": "pd"})

        result = await server.handle_protocol(request)
        body = json.loads(result.body)
        assert body["ok"] is True
        # PD was ON, now should be OFF (state synced locally)
        assert server.ble.state.protocol_switches["c1"]["pd"] is False

    @pytest.mark.asyncio
    async def test_protocol_turn_on(self, server):
        """Test explicitly turning on a protocol switch."""
        # First turn it off
        await server.ble.state.update_protocol_extend(0x03030F0F & ~(1 << 0))

        request = AsyncMock()
        request.json = AsyncMock(return_value={"port": "c1", "protocol": "pd", "action": "on"})

        result = await server.handle_protocol(request)
        body = json.loads(result.body)
        assert body["ok"] is True
        assert server.ble.state.protocol_switches["c1"]["pd"] is True

    @pytest.mark.asyncio
    async def test_protocol_turn_off(self, server):
        """Test explicitly turning off a protocol switch."""
        request = AsyncMock()
        request.json = AsyncMock(return_value={"port": "c2", "protocol": "pps", "action": "off"})

        result = await server.handle_protocol(request)
        body = json.loads(result.body)
        assert body["ok"] is True
        assert server.ble.state.protocol_switches["c2"]["pps"] is False

    @pytest.mark.asyncio
    async def test_protocol_invalid_port(self, server):
        """Test invalid port returns error."""
        request = AsyncMock()
        request.json = AsyncMock(return_value={"port": "c5", "protocol": "pd"})

        result = await server.handle_protocol(request)
        assert result.status == 400
        body = json.loads(result.body)
        assert body["ok"] is False

    @pytest.mark.asyncio
    async def test_protocol_invalid_protocol(self, server):
        """Test invalid protocol returns error."""
        request = AsyncMock()
        request.json = AsyncMock(return_value={"port": "c1", "protocol": "invalid"})

        result = await server.handle_protocol(request)
        assert result.status == 400

    @pytest.mark.asyncio
    async def test_protocol_missing_params(self, server):
        """Test missing parameters returns error."""
        request = AsyncMock()
        request.json = AsyncMock(return_value={})

        result = await server.handle_protocol(request)
        assert result.status == 400

    @pytest.mark.asyncio
    async def test_protocol_value_mode(self, server):
        """Test setting raw value."""
        request = AsyncMock()
        request.json = AsyncMock(return_value={"value": 0})

        result = await server.handle_protocol(request)
        body = json.loads(result.body)
        assert body["ok"] is True
        assert server.ble.state.protocol_switches["c1"]["pd"] is False

    @pytest.mark.asyncio
    async def test_protocol_switches_mode(self, server):
        """Test bulk switch setting."""
        request = AsyncMock()
        request.json = AsyncMock(return_value={
            "switches": {
                "c1": {"pd": False, "pps": False, "ufcs": False},
                "c2": {"pd": False, "pps": False, "ufcs": False},
                "c3": {"ufcs": False, "scp": False},
                "a":  {"ufcs": False, "scp": False},
            }
        })

        result = await server.handle_protocol(request)
        body = json.loads(result.body)
        assert body["ok"] is True

    @pytest.mark.asyncio
    async def test_protocol_bad_json(self, server):
        """Test invalid JSON returns error."""
        import json as _json
        request = AsyncMock()
        request.json = AsyncMock(side_effect=_json.JSONDecodeError("bad", "", 0))

        result = await server.handle_protocol(request)
        assert result.status == 400


class TestSessionRecordingAPI:
    """/api/session-recording 开关接口（DB meta 持久化，即时生效）。"""

    @pytest.fixture
    def server(self, real_history):
        """Create a Server instance with real history and mock ble."""
        from ha_server import Server
        s = Server.__new__(Server)
        s.history = real_history
        s.ble = MagicMock()
        s.ble.record_sessions = True
        s._status_cache_valid = False
        s._status_cache_bytes = None
        return s

    @pytest.mark.asyncio
    async def test_get_enabled(self, server):
        """GET 返回当前开关状态。"""
        request = AsyncMock()
        request.method = "GET"
        result = await server.handle_session_recording(request)
        body = json.loads(result.body)
        assert body["ok"] is True
        assert body["enabled"] is True

    @pytest.mark.asyncio
    async def test_post_disables_and_persists(self, server):
        """POST 关闭后即时生效并持久化到 DB meta。"""
        request = AsyncMock()
        request.method = "POST"
        request.json = AsyncMock(return_value={"enabled": False})
        result = await server.handle_session_recording(request)
        body = json.loads(result.body)
        assert body["ok"] is True
        assert body["enabled"] is False
        assert server.ble.record_sessions is False
        assert server.history.get_session_recording() is False  # 重启后仍生效
        assert server._status_cache_valid is False              # 状态缓存已失效

    @pytest.mark.asyncio
    async def test_post_requires_boolean(self, server):
        """enabled 非布尔值时拒绝。"""
        request = AsyncMock()
        request.method = "POST"
        request.json = AsyncMock(return_value={"enabled": "yes"})
        result = await server.handle_session_recording(request)
        assert result.status == 400

    @pytest.mark.asyncio
    async def test_post_enable_resumes_fake_sessions(self, server):
        """从关闭切换到打开时，触发正在充电端口立即转正记录。"""
        server.ble.record_sessions = False
        server.ble.resume_recording_sessions = MagicMock()
        request = AsyncMock()
        request.method = "POST"
        request.json = AsyncMock(return_value={"enabled": True})
        result = await server.handle_session_recording(request)
        body = json.loads(result.body)
        assert body["enabled"] is True
        server.ble.resume_recording_sessions.assert_called_once()

    @pytest.mark.asyncio
    async def test_post_enable_same_state_no_resume(self, server):
        """已是开启状态再次开启时，不应重复触发转正。"""
        server.ble.resume_recording_sessions = MagicMock()
        request = AsyncMock()
        request.method = "POST"
        request.json = AsyncMock(return_value={"enabled": True})
        await server.handle_session_recording(request)
        server.ble.resume_recording_sessions.assert_not_called()

    @pytest.mark.asyncio
    async def test_status_includes_session_recording(self, server):
        """/api/status 响应包含 session_recording 字段。"""
        server.state = MagicMock()
        server.state.to_dict = AsyncMock(return_value={})
        server.mqtt_client = None
        request = AsyncMock()
        request.query = {}
        result = await server.handle_status(request)
        body = json.loads(result.body)
        assert body["session_recording"] is True

    @pytest.mark.asyncio
    async def test_post_without_history_ok(self):
        """history 未连接/不可用时 POST 开关不崩溃，内存开关照常生效。"""
        from ha_server import Server
        s = Server.__new__(Server)
        s.history = None
        s.ble = MagicMock()
        s.ble.record_sessions = True
        s.ble.resume_recording_sessions = MagicMock()
        request = AsyncMock()
        request.method = "POST"
        request.json = AsyncMock(return_value={"enabled": False})
        result = await s.handle_session_recording(request)
        body = json.loads(result.body)
        assert body["ok"] is True
        assert body["enabled"] is False
        assert s.ble.record_sessions is False
        s.ble.resume_recording_sessions.assert_not_called()


class TestWebLanguageAPI:
    """/api/web-language 界面语言接口（DB meta 持久化，config.html 为唯一设置入口）。"""

    @pytest.fixture
    def server(self, real_history):
        """Create a Server instance with real history."""
        from ha_server import Server
        s = Server.__new__(Server)
        s.history = real_history
        return s

    @pytest.mark.asyncio
    async def test_get_default_auto(self, server):
        """GET 返回当前语言偏好，默认 auto（跟随系统）。"""
        request = AsyncMock()
        request.method = "GET"
        result = await server.handle_web_language(request)
        body = json.loads(result.body)
        assert body["ok"] is True
        assert body["language"] == "auto"

    @pytest.mark.asyncio
    async def test_post_explicit_and_persists(self, server):
        """POST 显式语言后即时生效并持久化到 DB meta。"""
        request = AsyncMock()
        request.method = "POST"
        request.json = AsyncMock(return_value={"language": "en"})
        result = await server.handle_web_language(request)
        body = json.loads(result.body)
        assert body["ok"] is True
        assert body["language"] == "en"
        assert server.history.get_web_language() == "en"  # 重启后仍生效

    @pytest.mark.asyncio
    async def test_post_auto_resets(self, server):
        """切回 auto 后持久化为 auto。"""
        server.history.set_web_language("zh-CN")
        request = AsyncMock()
        request.method = "POST"
        request.json = AsyncMock(return_value={"language": "auto"})
        result = await server.handle_web_language(request)
        body = json.loads(result.body)
        assert body["language"] == "auto"
        assert server.history.get_web_language() == "auto"

    @pytest.mark.asyncio
    async def test_post_normalizes(self, server):
        """大小写/变体归一化为规范值。"""
        request = AsyncMock()
        request.method = "POST"
        request.json = AsyncMock(return_value={"language": "ZH-CN"})
        result = await server.handle_web_language(request)
        body = json.loads(result.body)
        assert body["language"] == "zh-CN"
        assert server.history.get_web_language() == "zh-CN"

    @pytest.mark.asyncio
    async def test_post_rejects_invalid_language(self, server):
        """不支持的语言值时拒绝。"""
        request = AsyncMock()
        request.method = "POST"
        request.json = AsyncMock(return_value={"language": "fr"})
        result = await server.handle_web_language(request)
        assert result.status == 400

    @pytest.mark.asyncio
    async def test_post_without_history_ok(self):
        """history 未连接/不可用时 POST 不崩溃。"""
        from ha_server import Server
        s = Server.__new__(Server)
        s.history = None
        request = AsyncMock()
        request.method = "POST"
        request.json = AsyncMock(return_value={"language": "en"})
        result = await s.handle_web_language(request)
        body = json.loads(result.body)
        assert body["ok"] is True
        assert body["language"] == "en"


class TestStaticCacheKeys:
    """静态缓存 key 的 Windows 路径兼容性（反斜杠 → 404 bug 回归测试）。"""

    def test_windows_separator_on_subdir_key(self):
        """Windows 上 Path.relative_to() 产出反斜杠，_static_cache_key 必须输出正斜杠，
        否则 /static/plugin_imgs/logo.png、/static/locales/zh-CN.js 会 404。"""
        import ha_server
        from pathlib import PureWindowsPath

        static = PureWindowsPath("C:/x/ble_server/web/static")
        files = [
            PureWindowsPath("C:/x/ble_server/web/static/app.js"),
            PureWindowsPath("C:/x/ble_server/web/static/plugin_imgs/logo.png"),
            PureWindowsPath("C:/x/ble_server/web/static/locales/zh-CN.js"),
        ]
        keys = {ha_server._static_cache_key(static, f) for f in files}
        assert "/static/app.js" in keys
        assert "/static/plugin_imgs/logo.png" in keys
        assert "/static/locales/zh-CN.js" in keys
        # 决不产生反斜杠 key（否则 request.path 精确匹配查不到）
        assert not any("\\" in k for k in keys)

    def test_cache_scan_subdir_files_present(self):
        """_cache_static_files 全量扫描包含子目录文件，且 key 无反斜杠。

        用测试目录旁的隐藏目录而非 tmp_path/TemporaryDirectory：前者依赖
        pytest 的 numbered-dir 符号链接机制，后者清理时的 chmod 在受限
        沙箱下被拒，两者在 Windows 受限环境都会 PermissionError。
        """
        import ha_server
        import shutil

        td = Path(__file__).parent / ".test_static_tree"
        shutil.rmtree(td, ignore_errors=True)
        try:
            web_dir = td / "web"
            static = web_dir / "static"
            (static / "plugin_imgs").mkdir(parents=True)
            (static / "locales").mkdir()
            (static / "app.js").write_text("var x = 1;", encoding="utf-8")
            (static / "plugin_imgs" / "logo.png").write_bytes(b"\x89PNG\r\n")
            (static / "locales" / "zh-CN.js").write_text("window.I18N_RESOURCES={};", encoding="utf-8")

            old_dir = ha_server.WEB_DIR
            old_cache = ha_server._static_cache
            try:
                ha_server.WEB_DIR = web_dir
                ha_server._static_cache = {}
                ha_server._cache_static_files()
                keys = set(ha_server._static_cache.keys())
            finally:
                ha_server.WEB_DIR = old_dir
                ha_server._static_cache = old_cache
        finally:
            shutil.rmtree(td, ignore_errors=True)

        assert "/static/app.js" in keys
        assert "/static/plugin_imgs/logo.png" in keys
        assert "/static/locales/zh-CN.js" in keys
        assert not any("\\" in k for k in keys)


class TestChartParamValidation:
    """/api/chart 参数校验与资源上限（桶数自动稀释、gzip 预压缩缓存）。"""

    @pytest.fixture
    def server(self, real_history):
        from collections import OrderedDict
        from ha_server import Server
        s = Server.__new__(Server)
        s.history = real_history
        s._chart_cache = OrderedDict()
        s._chart_cache_ttl = 30
        s._chart_cache_max = 10
        return s

    @pytest.mark.asyncio
    @pytest.mark.parametrize("bad", ["0", "-1", "abc", "nan", "10000"])
    async def test_chart_rejects_bad_hours(self, server, bad):
        request = AsyncMock()
        request.query = {"hours": bad}
        request.headers = {}
        result = await server.handle_chart(request)
        assert result.status == 400

    @pytest.mark.asyncio
    async def test_chart_rejects_bad_interval(self, server):
        request = AsyncMock()
        request.query = {"hours": "1", "interval": "abc"}
        request.headers = {}
        result = await server.handle_chart(request)
        assert result.status == 400

    @pytest.mark.asyncio
    async def test_chart_caps_bucket_count(self, server):
        """hours=720&interval=5（51 万桶）必须被自动稀释到 MAX_CHART_POINTS 以内。"""
        from ha_server import Server
        request = AsyncMock()
        request.query = {"hours": "720", "interval": "5"}
        request.headers = {}
        result = await server.handle_chart(request)
        assert result.status == 200
        body = json.loads(result.body)
        assert 0 < len(body["labels"]) <= Server.MAX_CHART_POINTS
        # 缓存 key 使用抬高后的 interval，而非原始 5s
        assert list(server._chart_cache.keys())[0] != "720.0:5"

    @pytest.mark.asyncio
    async def test_chart_serves_precompressed_gzip(self, server):
        """接受 gzip 时返回预压缩缓存体（不再每请求重复压缩）。"""
        import gzip as _gzip
        request = AsyncMock()
        request.query = {"hours": "1", "interval": "20"}
        request.headers = {"Accept-Encoding": "gzip, deflate, br"}
        result = await server.handle_chart(request)
        assert result.headers.get("Content-Encoding") == "gzip"
        assert result.headers.get("Vary") == "Accept-Encoding"
        assert json.loads(_gzip.decompress(result.body))["ok"] is True
        # 第二次请求命中缓存，仍是预压缩体
        result2 = await server.handle_chart(request)
        assert result2.headers.get("Content-Encoding") == "gzip"
        assert result2.body == result.body

    @pytest.mark.asyncio
    async def test_chart_no_gzip_client_gets_plain(self, server):
        request = AsyncMock()
        request.query = {"hours": "1", "interval": "20"}
        request.headers = {}
        result = await server.handle_chart(request)
        assert "Content-Encoding" not in result.headers
        assert json.loads(result.body)["ok"] is True


class TestStaticEtagCache:
    """静态资源 ETag 协商缓存（替代无指纹文件的 7 天 immutable 策略）。"""

    @staticmethod
    def _entry():
        import gzip as _gzip
        raw = b"body { color: red; }" * 100  # >1KB，会被预压缩
        return {
            "raw": raw,
            "gzipped": _gzip.compress(raw),
            "content_type": "text/css",
            "etag": '"deadbeef"',
        }

    def test_etag_match_yields_304(self):
        import ha_server
        request = MagicMock()
        request.headers = {"If-None-Match": '"deadbeef"', "Accept-Encoding": "gzip"}
        resp = ha_server._cached_response(self._entry(), request)
        assert resp.status == 304
        assert resp.headers["ETag"] == '"deadbeef"'
        assert resp.headers["Cache-Control"] == "no-cache"

    def test_miss_serves_gzip_with_etag(self):
        import ha_server
        entry = self._entry()
        request = MagicMock()
        request.headers = {"Accept-Encoding": "gzip, deflate, br"}
        resp = ha_server._cached_response(entry, request)
        assert resp.status == 200
        assert resp.headers["Content-Encoding"] == "gzip"
        assert resp.headers["Vary"] == "Accept-Encoding"
        assert resp.headers["ETag"] == '"deadbeef"'
        assert resp.headers["Cache-Control"] == "no-cache"
        assert resp.body == entry["gzipped"]

    def test_no_gzip_client_gets_raw(self):
        import ha_server
        entry = self._entry()
        request = MagicMock()
        request.headers = {}
        resp = ha_server._cached_response(entry, request)
        assert resp.status == 200
        assert "Content-Encoding" not in resp.headers
        assert resp.body == entry["raw"]

    def test_etag_match_weak_and_list(self):
        import ha_server
        assert ha_server._etag_match('W/"abc"', '"abc"')
        assert ha_server._etag_match('"x", "abc"', '"abc"')
        assert ha_server._etag_match('"abc"', '"abc"')
        assert not ha_server._etag_match('"def"', '"abc"')
        assert not ha_server._etag_match("", '"abc"')

    def test_cache_scan_computes_etag(self):
        """预载时为每个文件计算 ETag；>1KB 文本预压缩。"""
        import ha_server
        import shutil
        td = Path(__file__).parent / ".test_etag_tree"
        shutil.rmtree(td, ignore_errors=True)
        try:
            web_dir = td / "web"
            static = web_dir / "static"
            static.mkdir(parents=True)
            (static / "app.js").write_text("var x = 1;" * 300, encoding="utf-8")
            old_dir, old_cache = ha_server.WEB_DIR, ha_server._static_cache
            try:
                ha_server.WEB_DIR = web_dir
                ha_server._static_cache = {}
                ha_server._cache_static_files()
                entry = ha_server._static_cache["/static/app.js"]
            finally:
                ha_server.WEB_DIR, ha_server._static_cache = old_dir, old_cache
        finally:
            shutil.rmtree(td, ignore_errors=True)
        assert entry["etag"].startswith('"') and entry["etag"].endswith('"')
        assert entry["gzipped"] is not None


class TestQueryParamValidation:
    """非法查询参数应返回 400，而非未捕获异常导致的 500。"""

    @pytest.mark.asyncio
    async def test_sessions_bad_limit(self):
        from ha_server import Server
        s = Server.__new__(Server)
        request = AsyncMock()
        request.query = {"limit": "abc"}
        result = await s.handle_sessions(request)
        assert result.status == 400

    @pytest.mark.asyncio
    async def test_sessions_bad_page(self):
        from ha_server import Server
        s = Server.__new__(Server)
        request = AsyncMock()
        request.query = {"page": "x"}
        result = await s.handle_sessions(request)
        assert result.status == 400

    @pytest.mark.asyncio
    async def test_session_points_bad_id(self):
        from ha_server import Server
        s = Server.__new__(Server)
        request = AsyncMock()
        request.match_info = {"id": "abc"}
        request.query = {}
        result = await s.handle_session_points(request)
        assert result.status == 400

    @pytest.mark.asyncio
    async def test_session_points_bad_downsample(self):
        from ha_server import Server
        s = Server.__new__(Server)
        request = AsyncMock()
        request.match_info = {"id": "1"}
        request.query = {"downsample": "x"}
        result = await s.handle_session_points(request)
        assert result.status == 400

    @pytest.mark.asyncio
    @pytest.mark.parametrize("bad", ["abc", "0", "-5", "10000"])
    async def test_statistics_bad_hours(self, bad):
        from ha_server import Server
        s = Server.__new__(Server)
        request = AsyncMock()
        request.match_info = {"port": "1"}
        request.query = {"hours": bad}
        result = await s.handle_statistics(request)
        assert result.status == 400

    @pytest.mark.asyncio
    async def test_export_bad_hours(self):
        from ha_server import Server
        s = Server.__new__(Server)
        request = AsyncMock()
        request.match_info = {"port": "1"}
        request.query = {"hours": "abc"}
        result = await s.handle_export(request)
        assert result.status == 400


class TestSSELifecycle:
    """SSE 生命周期：关机哨兵与超时豁免。"""

    def test_close_all_pushes_sentinel(self):
        from ha_server import SSEEmitter
        em = SSEEmitter()
        q1 = asyncio.Queue(maxsize=SSEEmitter.MAX_QUEUE_SIZE)
        q2 = asyncio.Queue(maxsize=SSEEmitter.MAX_QUEUE_SIZE)
        em.add_client(q1)
        em.add_client(q2)
        em.close_all()
        assert q1.get_nowait() is None
        assert q2.get_nowait() is None

    def test_pending_status_not_dropped_by_close(self):
        """哨兵只入队，不影响 pending status 的 flush 路径。"""
        from ha_server import SSEEmitter
        em = SSEEmitter()
        q = asyncio.Queue(maxsize=SSEEmitter.MAX_QUEUE_SIZE)
        em.add_client(q)
        em.emit("status", {"connected": True})
        em.close_all()
        assert em.flush_status(q) is not None
        assert q.get_nowait() is None

    @pytest.mark.asyncio
    async def test_timeout_middleware_exempts_sse(self):
        """/api/events 不再被 wait_for 包裹（旧 120s 硬超时迫使客户端每 2 分钟重连）。"""
        import ha_server
        sentinel = object()

        async def handler(request):
            return sentinel

        request = MagicMock()
        request.path = "/api/events"
        result = await ha_server.request_timeout_middleware(request, handler)
        assert result is sentinel

    @pytest.mark.asyncio
    async def test_timeout_middleware_still_wraps_api(self):
        import ha_server
        from aiohttp import web

        async def handler(request):
            return web.Response(text="ok")

        request = MagicMock()
        request.path = "/api/status"
        result = await ha_server.request_timeout_middleware(request, handler)
        assert result.status == 200

    @pytest.mark.asyncio
    async def test_timeout_middleware_passes_static(self):
        import ha_server
        from aiohttp import web

        async def handler(request):
            return web.Response(text="css")

        request = MagicMock()
        request.path = "/static/app.js"
        result = await ha_server.request_timeout_middleware(request, handler)
        assert result.status == 200
