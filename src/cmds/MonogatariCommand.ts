import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, GuildMember, Message } from "discord.js";
import BaseCommand from "../api/Cadence.BaseCommand";
import EmbedHelper from "../api/Cadence.Embed";
import CadenceLavalink from "../api/Cadence.Lavalink";
import CadenceMemory from "../api/Cadence.Memory";
import CadenceSpotify from "../api/Cadence.Spotify";
import CadenceTrack from "../types/CadenceTrack.type";
import { LavalinkResult, SpotifyPlaylistResult } from "../types/TrackResult.type";

export const Command: BaseCommand = {
    name: "monogatari",
    description: "Play a monogatari playlist with all the openings and endings!",
    requireAdmin: false,

    run: async (interaction: CommandInteraction): Promise<void> => {
        let linkOrKeyword: string = "https://www.youtube.com/watch?v=MPS1Ta1q7F4&list=PLAE4goQQe559aEqFB9rnUr7tujajmkt_l&index=1";

        if (!(interaction.member as GuildMember).voice?.channelId) {
            interaction.reply({ embeds: [ EmbedHelper.NOK("You must be connected to a voice channel!") ], ephemeral: true });
            return;
        }

        const oldServer = CadenceMemory.getInstance().getConnectedServer(interaction.guildId);

        if (oldServer && oldServer.voiceChannelId != (interaction.member as GuildMember).voice.channelId) {
            interaction.reply({ embeds: [ EmbedHelper.NOK("I'm already being used in another voice channel!") ], ephemeral: true });
            return;
        }

        await interaction.deferReply();

        if (!(await CadenceLavalink.getInstance().joinChannel(
            (interaction.member as GuildMember).voice.channelId,
            interaction.guildId,
            interaction.channel,
            interaction.guild.shardId
        ))) {
            interaction.editReply({ embeds: [ EmbedHelper.NOK("I can't join that voice channel! Do I have enough permissions?") ] });
            return;
        }

        let server = CadenceMemory.getInstance().getConnectedServer(interaction.guildId);

        let result: LavalinkResult = await CadenceLavalink.getInstance().resolveLinkIntoTracks(linkOrKeyword);
        
        const player = CadenceLavalink.getInstance().getPlayerByGuildId(interaction.guildId);

        if (result == null) {
            interaction.editReply({ embeds: [ EmbedHelper.NOK("I couldn't find anything with that link :(") ] });
            return;
        }

        switch (result.loadType) {
            case "LOAD_FAILED":
            case "NO_MATCHES":
                interaction.editReply({ embeds: [ EmbedHelper.NOK("I couldn't find anything with that link :(") ] });
                break;
            case "PLAYLIST_LOADED":
                for (let i = 0; i < result.tracks.length; ++i) {
                    server.addToQueue(new CadenceTrack(result.tracks[i].track, result.tracks[i].info, interaction.user.id));
                }

                server.shuffleQueue();

                let nowPlaying = false;

                if (!player.track) {
                    if (await CadenceLavalink.getInstance().playNextSongInQueue(player)) {
                        const m = await interaction.editReply({ embeds: [ EmbedHelper.np(server.getCurrentTrack(), player.position) ], components: server._buildButtonComponents()}) as Message;
                        server.setMessageAsMusicPlayer(m);
                        nowPlaying = true;
                    }
                } else {
                    // if there was any current player controller
                    // we update buttons (next/back changed?)
                    server.updatePlayerControllerButtonsIfAny();
                }

                if (!nowPlaying) {
                    interaction.editReply({ embeds: [ EmbedHelper.OK(`Added **${result.tracks.length}** songs to the queue`) ]})
                } else {
                    server.textChannel.send({ embeds: [ EmbedHelper.OK(`Added **${result.tracks.length}** songs to the queue`) ]})
                }
                break;
        }
    },

    slashCommandBody: new SlashCommandBuilder()
                        .setName("monogatari")
                        .setDescription("Play a monogatari playlist with all the openings and endings!")
                        .toJSON()
}