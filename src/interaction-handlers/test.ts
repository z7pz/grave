import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ButtonInteraction, EmbedBuilder } from 'discord.js';

// Debounce utility function
function debounce(func: (...args: any[]) => void, wait: number) {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
        clearTimeout(timeout);
		//@ts-ignore
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

export class ParseExampleInteractionHandler extends InteractionHandler {
    private debouncedEdits: Map<string, (interaction: ButtonInteraction, embed: EmbedBuilder) => void> = new Map();

    public constructor(ctx: InteractionHandler.LoaderContext) {
        super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
    }

    public async run(interaction: ButtonInteraction) {
        let giveaway = interaction.client.manager.giveaways[interaction.message.id];
        if (!giveaway) {
            console.log('no giveaway!');
            return;
        }
        if (!giveaway.entries.has(interaction.user.id)) {
            giveaway.entries.add(interaction.user.id);
        }

        const embed = new EmbedBuilder()
            .setTimestamp()
            .setTitle(giveaway.args.prize)
            .setColor('DarkGrey')
            .setDescription(
                [
                    `Ends: <t:${Math.floor(giveaway.endsAt / 1000)}:R>`,
                    `Hosted by: <@${giveaway.host}>`,
                    `Entries: ${giveaway.entries.size}`,
                    `Winners: ${giveaway.args.winners}`
                ].join('\n')
            );

        // Retrieve or create a debounced function for the specific message ID
        let debouncedEdit = this.debouncedEdits.get(interaction.message.id);
        if (!debouncedEdit) {
            debouncedEdit = debounce(this.editMessage.bind(this), 4000);
            this.debouncedEdits.set(interaction.message.id, debouncedEdit);
        }

        // Use the debounced function for this specific message ID
        await debouncedEdit(interaction, embed);
    }

    private async editMessage(interaction: ButtonInteraction, embed: EmbedBuilder) {
        await interaction.message.edit({ embeds: [embed] });
    }

    public override parse(interaction: ButtonInteraction) {
        if (!interaction.customId.startsWith('giveaway')) return this.none();
        return this.some();
    }
}
