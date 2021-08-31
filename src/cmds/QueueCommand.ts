import { Message, MessageActionRow, MessageButton } from "discord.js";
import BaseCommand from "../api/Cadence.BaseCommand";
import EmbedHelper from "../api/Cadence.Embed";
import CadenceLavalink from "../api/Cadence.Lavalink";
import CadenceMemory from "../api/Cadence.Memory";
import { LoopType } from "../types/ConnectedServer.type";

class HelpCommand extends BaseCommand {
    public name: string;
    public description: string;
    public aliases: string[];
    public requireAdmin: boolean;

    constructor() {
        super();

        this.name = "queue";
        this.description = "Displays the current queue";
        this.aliases = ["q"];
        this.requireAdmin = false;
    }

    public async run(message: Message, args: string[]): Promise<void> {
        const server = CadenceMemory.getInstance().getConnectedServer(message.guildId);
        if (!server) {
            message.reply({ embeds: [ EmbedHelper.NOK("There's nothing playing!") ]});
            return;
        }

        // console.log(server.getQueue());

        const player = CadenceLavalink.getInstance().getPlayerByGuildId(message.guildId);
        if (!player) {
            message.reply({ embeds: [ EmbedHelper.NOK("There's nothing playing!") ]});
            return;
        }

        if (server.isQueueEmpty()) {
            message.reply({ embeds: [ EmbedHelper.NOK("There's nothing in the queue!") ]});
            return;
        }

        let page = (server.getCurrentQueueIndex() / 10 | 0) + 1;

        const requiredPages = Math.ceil(server.getQueue().length / 10);
        const embed = EmbedHelper.queue(server.getQueue(), page, requiredPages, server.loop == LoopType.QUEUE);

        if (requiredPages <= 1) {
            message.reply({ embeds: [ embed ] });
        } else {
            const btnRow = new MessageActionRow()
                .addComponents(
                    [
                        new MessageButton()
                            .setStyle('SECONDARY')
                            .setLabel('Previous')
                            .setCustomId('list-prev'),
                        new MessageButton()
                            .setStyle('SECONDARY')
                            .setLabel('Next')
                            .setCustomId('list-next')
                    ]
            );

            const reply = await message.reply({ embeds: [ embed ], components: [ btnRow ] });

            const filter = b => b.user.id === message.author.id;
            const collector = reply.createMessageComponentCollector({
                filter,
                time: 30 * 1000
            });

            collector.on('collect', (interaction) => {
                interaction.deferUpdate().then(async () => {
                    switch (interaction.customId) {
                        case 'list-prev':
                            page--;
                            if (page < 1)
                                page = requiredPages;
                            break;
                        case 'list-next':
                            page++;
                            if (page > requiredPages)
                                page = 1;
                            break;
                    }
    
                    await interaction.editReply({
                        embeds: [ EmbedHelper.queue(server.getQueue(), page, requiredPages, server.loop == LoopType.QUEUE) ]
                    });
                }).catch(e => {
                    console.log(e);
                });
            });
        }
    }
}

export default new HelpCommand();