import { Giveaway } from '@prisma/client';
import { ApplyOptions } from '@sapphire/decorators';
import { isGuildBasedChannel, isTextBasedChannel } from '@sapphire/discord.js-utilities';
import { Args, Command } from '@sapphire/framework';
import { ApplicationCommandType, EmbedBuilder, Message } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'List all active giveaways',
	requiredClientPermissions: ['SendMessages', 'ViewChannel']
})
export class UserCommand extends Command {
	// Register Chat Input and Context Menu command
	public override registerApplicationCommands(registry: Command.Registry) {
		// Register Chat Input command
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description
		});

		// Register Context Menu command available from any message
		registry.registerContextMenuCommand({
			name: this.name,
			type: ApplicationCommandType.Message
		});

		// Register Context Menu command available from any user
		registry.registerContextMenuCommand({
			name: this.name,
			type: ApplicationCommandType.User
		});
	}
	get prisma() {
		return this.container.client.prisma;
	}
	// Message command
	public override async messageRun(message: Message, args: Args) {
		return this.list(message);
	}

	// Chat Input (slash) command
	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.list(interaction);
	}

	// Context Menu command
	public override async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
		return this.list(interaction);
	}
	formatGiveaway(giveaway: Giveaway): string {
		return 'todo!';
	}
	private async list(msg: Message | Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction) {
		const giveaways = await this.prisma.giveaway.findMany({
			where: {
				guildId: msg.guild!.id,
				isEnded: false
			}
		});
		// TODO: create pagination for long list
		const embed = new EmbedBuilder({
			title: 'Active giveaways',
			description:
				giveaways.length !== 0
					? giveaways
							.map(
								(giveaway) =>
									`[[Go to message]](https://discord.com/channels/${giveaway.guildId}/${giveaway.channelId}/${giveaway.id}) - ${giveaway.prize} x${giveaway.winners}`
							)
							.join('\n')
					: '❌ No active giveaways'
		});
		return msg.reply({ embeds: [embed] });
	}
}
