import json
import logging
from pathlib import Path

import discord
from discord import app_commands
from discord.ext import commands

logger = logging.getLogger("deepwoken-bot.roles")

ROLE_MENU_FILE = Path(__file__).resolve().parent.parent / "data" / "role_menu.json"
MENU_CUSTOM_ID = "deepwoken_role_menu_select"


def _load_options() -> list[dict]:
    if not ROLE_MENU_FILE.exists():
        return []
    return json.loads(ROLE_MENU_FILE.read_text(encoding="utf-8"))


def _save_options(options: list[dict]) -> None:
    ROLE_MENU_FILE.parent.mkdir(parents=True, exist_ok=True)
    ROLE_MENU_FILE.write_text(json.dumps(options, indent=2, ensure_ascii=False), encoding="utf-8")


class RoleMenuSelect(discord.ui.Select):
    def __init__(self, options_data: list[dict]):
        select_options = [
            discord.SelectOption(label=o["label"], value=str(o["role_id"]), emoji=o.get("emoji") or None)
            for o in options_data
        ]
        super().__init__(
            placeholder="Choisis ton/tes archétype(s)...",
            min_values=0,
            max_values=len(select_options) if select_options else 1,
            options=select_options or [discord.SelectOption(label="Aucune option configurée", value="none")],
            custom_id=MENU_CUSTOM_ID,
        )

    async def callback(self, interaction: discord.Interaction):
        if interaction.guild is None:
            return

        selected_ids = {int(v) for v in self.values if v != "none"}
        all_role_ids = {int(o.value) for o in self.options if o.value != "none"}

        member = interaction.user
        added, removed = [], []
        for role_id in all_role_ids:
            role = interaction.guild.get_role(role_id)
            if role is None:
                continue
            has_role = role in member.roles
            wants_role = role_id in selected_ids
            try:
                if wants_role and not has_role:
                    await member.add_roles(role, reason="Menu de rôles")
                    added.append(role.name)
                elif not wants_role and has_role:
                    await member.remove_roles(role, reason="Menu de rôles")
                    removed.append(role.name)
            except discord.Forbidden:
                logger.warning("Impossible de modifier le rôle %s pour %s", role, member)

        parts = []
        if added:
            parts.append("ajouté(s) : " + ", ".join(added))
        if removed:
            parts.append("retiré(s) : " + ", ".join(removed))
        content = "Rôles mis à jour — " + " / ".join(parts) if parts else "Aucun changement."
        await interaction.response.send_message(content, ephemeral=True)


class RoleMenuView(discord.ui.View):
    def __init__(self, options_data: list[dict]):
        super().__init__(timeout=None)
        self.add_item(RoleMenuSelect(options_data))


class Roles(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_ready(self):
        options = _load_options()
        self.bot.add_view(RoleMenuView(options))

    @app_commands.command(name="role-menu-add", description="Ajoute une option au menu de rôles.")
    @app_commands.describe(label="Texte affiché", role="Le rôle à attribuer", emoji="Emoji optionnel")
    @app_commands.checks.has_permissions(administrator=True)
    async def role_menu_add(
        self,
        interaction: discord.Interaction,
        label: str,
        role: discord.Role,
        emoji: str = "",
    ):
        options = _load_options()
        if len(options) >= 25:
            await interaction.response.send_message(
                "Le menu est déjà plein (25 options max, limite Discord).", ephemeral=True
            )
            return
        options.append({"label": label, "role_id": role.id, "emoji": emoji or None})
        _save_options(options)
        self.bot.add_view(RoleMenuView(options))
        await interaction.response.send_message(
            f"Option \"{label}\" → {role.mention} ajoutée ({len(options)} option(s) au total). "
            "Utilise `/role-menu-post` pour (re)poster le menu avec les options à jour.",
            ephemeral=True,
        )

    @app_commands.command(name="role-menu-remove", description="Retire une option du menu de rôles.")
    @app_commands.describe(label="Le texte exact de l'option à retirer")
    @app_commands.checks.has_permissions(administrator=True)
    async def role_menu_remove(self, interaction: discord.Interaction, label: str):
        options = _load_options()
        new_options = [o for o in options if o["label"] != label]
        if len(new_options) == len(options):
            await interaction.response.send_message(f"Aucune option \"{label}\" trouvée.", ephemeral=True)
            return
        _save_options(new_options)
        self.bot.add_view(RoleMenuView(new_options))
        await interaction.response.send_message(
            f"Option \"{label}\" retirée. Utilise `/role-menu-post` pour republier le menu.", ephemeral=True
        )

    @app_commands.command(name="role-menu-post", description="Poste le menu de rôles dans ce salon.")
    @app_commands.checks.has_permissions(administrator=True)
    async def role_menu_post(self, interaction: discord.Interaction):
        options = _load_options()
        if not options:
            await interaction.response.send_message(
                "Aucune option configurée. Utilise `/role-menu-add` d'abord.", ephemeral=True
            )
            return

        embed = discord.Embed(
            title="Choisis tes rôles",
            description="Sélectionne ton/tes archétype(s) ou centre(s) d'intérêt Deepwoken ci-dessous.",
            color=discord.Color.blurple(),
        )
        await interaction.channel.send(embed=embed, view=RoleMenuView(options))
        await interaction.response.send_message("Menu de rôles posté.", ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(Roles(bot))
