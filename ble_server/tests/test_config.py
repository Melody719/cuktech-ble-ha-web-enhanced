"""Tests for config.py - Configuration management."""
import os
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).parent.parent))

from config import load_config, BLEConfig, MQTTConfig, ServerConfig, Config


class TestBLEConfig:
    """Test BLE configuration."""

    def test_valid_config(self):
        """Test valid BLE config."""
        config = BLEConfig(mac="AA:BB:CC:DD:EE:FF", token="aabbccddeeff")
        assert config.mac == "AA:BB:CC:DD:EE:FF"
        assert config.token == "aabbccddeeff"

    @patch.dict(os.environ, {"CUKTECH_DEVICE_MAC": ""})
    def test_missing_mac_raises(self):
        """Test that missing MAC does not crash (graceful warning)."""
        cfg = BLEConfig(mac="", token="aabbccddeeff")
        assert cfg.mac == ""

    @patch.dict(os.environ, {"CUKTECH_DEVICE_MAC": "XX:XX:XX:XX:XX:XX"})
    def test_placeholder_mac_raises(self):
        """Test that placeholder MAC does not crash (graceful warning)."""
        cfg = BLEConfig(mac="XX:XX:XX:XX:XX:XX", token="aabbccddeeff")
        assert cfg.mac == "XX:XX:XX:XX:XX:XX"

    @patch.dict(os.environ, {"CUKTECH_DEVICE_TOKEN": ""})
    def test_missing_token_raises(self):
        """Test that missing token does not crash (graceful warning)."""
        cfg = BLEConfig(mac="AA:BB:CC:DD:EE:FF", token="")
        assert cfg.token == ""


class TestMQTTConfig:
    """Test MQTT configuration."""

    def test_default_values(self):
        """Test default MQTT config values."""
        config = MQTTConfig()
        assert config.host == "localhost"
        assert config.port == 1883
        assert config.username == ""
        assert config.password == ""
        assert config.keepalive == 60
        assert config.topic_prefix == "cuktech/charger"


class TestServerConfig:
    """Test Server configuration."""

    def test_default_values(self):
        """Test default server config values."""
        config = ServerConfig()
        assert config.host == "0.0.0.0"
        # Windows 默认 18199（避开常见占用），其他平台 8199
        expected_port = 18199 if sys.platform == "win32" else 8199
        assert config.port == expected_port
        assert config.log_level == "info"
        assert config.history_retention_days == 2
        assert config.reconnect_base_delay == 1.0
        assert config.reconnect_max_delay == 300.0


class TestHistoryDbPathFallback:
    """history_db_path 空值必须回退默认文件名。

    空字符串会让 sqlite3.connect("") 创建"连接关闭即删除"的临时库，
    充电历史/会话数据在每次重启后全部丢失（线上真实踩过的坑）。
    """

    def test_empty_yaml_value_falls_back(self):
        with tempfile.NamedTemporaryFile(
                "w", suffix=".yaml", delete=False, encoding="utf-8") as f:
            f.write("server:\n  history_db_path: ''\n")
            cfg_path = f.name
        try:
            with patch.dict(os.environ, {"CUKTECH_CONFIG_PATH": cfg_path}):
                config = load_config()
            assert config.server.history_db_path == "port_history.db"
        finally:
            os.unlink(cfg_path)

    def test_empty_env_value_falls_back(self):
        with tempfile.NamedTemporaryFile(
                "w", suffix=".yaml", delete=False, encoding="utf-8") as f:
            f.write("server:\n  history_db_path: ''\n")
            cfg_path = f.name
        try:
            with patch.dict(os.environ, {
                    "CUKTECH_CONFIG_PATH": cfg_path,
                    "CUKTECH_HISTORY_DB_PATH": ""}):
                config = load_config()
            assert config.server.history_db_path == "port_history.db"
        finally:
            os.unlink(cfg_path)


class TestConfig:
    """Test Config class."""

    @patch.dict(os.environ, {
        "CUKTECH_DEVICE_MAC": "AA:BB:CC:DD:EE:FF",
        "CUKTECH_DEVICE_TOKEN": "aabbccddeeff",
    })
    def test_topic_properties(self):
        """Test topic property generation."""
        config = load_config()
        assert config.topic_port == "cuktech/charger/port"
        assert config.topic_settings == "cuktech/charger/settings"
        assert config.topic_status == "cuktech/charger/status"


class TestLoadConfig:
    """Test config loading."""

    @patch.dict(os.environ, {
        "CUKTECH_DEVICE_MAC": "AA:BB:CC:DD:EE:FF",
        "CUKTECH_DEVICE_TOKEN": "aabbccddeeff",
    })
    def test_load_from_env(self):
        """Test loading config from environment variables."""
        config = load_config()
        assert config.ble.mac == "AA:BB:CC:DD:EE:FF"
        assert config.ble.token == "aabbccddeeff"

    @patch.dict(os.environ, {
        "CUKTECH_DEVICE_MAC": "AA:BB:CC:DD:EE:FF",
        "CUKTECH_DEVICE_TOKEN": "aabbccddeeff",
        "CUKTECH_LOG_LEVEL": "debug",
    })
    def test_log_level_from_env(self):
        """Test log level from environment variable."""
        config = load_config()
        assert config.server.log_level == "debug"

    @patch.dict(os.environ, {
        "CUKTECH_DEVICE_MAC": "AA:BB:CC:DD:EE:FF",
        "CUKTECH_DEVICE_TOKEN": "aabbccddeeff",
        "CUKTECH_HISTORY_RETENTION_DAYS": "7",
    })
    def test_retention_days_from_env(self):
        """Test history retention days from environment variable."""
        config = load_config()
        assert config.server.history_retention_days == 7
