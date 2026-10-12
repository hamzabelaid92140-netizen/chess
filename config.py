import os

from dotenv import load_dotenv

load_dotenv()


def _int_env(name: str) -> int:
    value = os.getenv(name, "0")
    return int(value) if value else 0


def _int_set_env(name: str, default: str = "") -> set[int]:
    value = os.getenv(name, default)
    return {int(part) for part in value.split(",") if part.strip()}


DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
GUILD_ID = _int_env("GUILD_ID")
VERIFIED_ROLE_ID = _int_env("VERIFIED_ROLE_ID")
VERIFICATION_CHANNEL_ID = _int_env("VERIFICATION_CHANNEL_ID")
MOD_LOG_CHANNEL_ID = _int_env("MOD_LOG_CHANNEL_ID")
LINK_EXEMPT_CATEGORY_ID = _int_env("LINK_EXEMPT_CATEGORY_ID")
SHOWCASE_CHANNEL_ID = _int_env("SHOWCASE_CHANNEL_ID")
GIF_ALLOWED_CHANNEL_IDS = _int_set_env(
    "GIF_ALLOWED_CHANNEL_IDS", "1559175784378404894,1559174921542828042"
)
