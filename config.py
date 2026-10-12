import os

from dotenv import load_dotenv

load_dotenv()


def _int_env(name: str) -> int:
    value = os.getenv(name, "0")
    return int(value) if value else 0


DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
GUILD_ID = _int_env("GUILD_ID")
VERIFIED_ROLE_ID = _int_env("VERIFIED_ROLE_ID")
VERIFICATION_CHANNEL_ID = _int_env("VERIFICATION_CHANNEL_ID")
MOD_LOG_CHANNEL_ID = _int_env("MOD_LOG_CHANNEL_ID")
LINK_EXEMPT_CATEGORY_ID = _int_env("LINK_EXEMPT_CATEGORY_ID")
SHOWCASE_CHANNEL_ID = _int_env("SHOWCASE_CHANNEL_ID")
