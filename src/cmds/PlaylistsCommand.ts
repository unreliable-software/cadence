import { Message, MessageEmbed } from "discord.js";
import BaseCommand from "../api/Cadence.BaseCommand";
import Config from "../api/Cadence.Config";
import Db from "../api/Cadence.Db";
import CadenceDiscord from "../api/Cadence.Discord";
import EmbedHelper, { EmbedColor } from "../api/Cadence.Embed";
import CadenceLavalink from "../api/Cadence.Lavalink";
import CadenceMemory from "../api/Cadence.Memory";
import Cadence from "../Cadence";
import { LoopType } from "../types/ConnectedServer.type";

class PlaylistsCommand extends BaseCommand {
    public name: string;
    public description: string;
    public aliases: string[];
    public requireAdmin: boolean;

    constructor() {
        super();

        this.name = "playlists";
        this.description = "Displays the custom playlists in your server";
        this.aliases = [];
        this.requireAdmin = false;
    }

    public async run(message: Message, args: string[]): Promise<void> {
        const playlists = await Db.getInstance().getAllPlaylists(message.guild.id);

        if (playlists.length <= 0) {
            message.reply({ embeds: [ EmbedHelper.NOK("This server doesn't have custom playlists yet.") ]});
            return;
        }

        let desc = "";
        for (let i = 0; i < playlists.length; ++i) {
            desc += `**${i + 1})** ${playlists[i].name} (\`${CadenceDiscord.getInstance().getServerPrefix(message.guildId)}load ${playlists[i].id}\`)\n`;
        }

        message.reply({ embeds: [ EmbedHelper.generic(desc, EmbedColor.Info, message.guild.name + " custom playlists:") ]});
    }
}

export default new PlaylistsCommand();