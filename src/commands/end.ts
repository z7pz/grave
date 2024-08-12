import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { ApplicationCommandType, Message } from 'discord.js';
import { Giveaway } from '../lib/giveaway';

@ApplyOptions<Command.Options>({
	description: 'ping pong'
})
export class UserCommand extends Command {
	// Register Chat Input and Context Menu command
	public override registerApplicationCommands(registry: Command.Registry) {
		// Register Chat Input command
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription('Ping bot to see if it is alive')
				.addStringOption((c) => c.setName('giveaway_id').setDescription('This is duration').setRequired(true))
		);

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

	// Message command
	public override async messageRun(message: Message, args: Args) {
		let id = await args.pick('string');
		return this.end(message, id);
	}

	// Chat Input (slash) command
	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		let id = interaction.options.getString('giveaway_id', true);
		return this.end(interaction, id);
	}

	// Context Menu command
	public override async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
		// return this.delete(interaction);
	}
	get prisma() {
		return this.container.client.prisma;
	}
	private async end(msg: Message | Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction, id: string) {
		// TODO: check permissions
		try {
			let giveaway = await this.prisma.giveaway.update({
				where: {
					guildId: msg.guild!.id,
					id,
					isEnded: false
				},
				data: {
					isEnded: true
				}
			});
			await this.container.client.manager.end(Giveaway.from(giveaway));

			return msg.reply('Giveaway ended');
		} catch (err) {
			return msg.reply('Giveaway not found');
		}
	}
}
