import { ApplyOptions } from '@sapphire/decorators';
import { isTextBasedChannel } from '@sapphire/discord.js-utilities';
import { Args, Command } from '@sapphire/framework';
import { ActionRowBuilder, ApplicationCommandType, EmbedBuilder, Message, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { GiveawayArgs } from '../lib/giveaway';
import ms from 'ms';
@ApplyOptions<Command.Options>({
	name: 'create',
	description: 'create a new giveaway!',
	options: ['prize', 'duration', 'winners']
})
export class UserCommand extends Command {
	// Register Chat Input and Context Menu command
	public override registerApplicationCommands(registry: Command.Registry) {
		console.log('command name: ' + this.name);
		// Register Chat Input command
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription('Ping bot to see if it is alive')
				.addStringOption((c) => c.setName('duration').setDescription('This is duration').setRequired(true))
				.addIntegerOption((c) => c.setName('winners').setDescription('This is winners').setRequired(true))
				.addStringOption((c) => c.setName('prize').setDescription('This is prize').setRequired(true))
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
		let duration = ms(await args.pick('string'));
		let winners = await args.pick('integer');
		let prize = await args.pick('string');
		return this.create(message, {
			winners,
			duration,
			prize
		});
	}

	// Chat Input (slash) command
	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		let winners = interaction.options.getInteger('winners', true);
		let duration = ms(interaction.options.getString('duration', true));
		let prize = interaction.options.getString('prize', true);
		return this.create(interaction, {
			winners,
			duration,
			prize
		});
	}

	// Context Menu command
	public override async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
		const modal = new ModalBuilder().setCustomId('myModal').setTitle('My Modal');

		const favoriteColorInput = new TextInputBuilder()
			.setCustomId('favoriteColorInput')
			// The label is the prompt the user sees for this input
			.setLabel("What's your favorite color?")
			// Short means only a single line of text
			.setStyle(TextInputStyle.Short);

		const hobbiesInput = new TextInputBuilder()
			.setCustomId('hobbiesInput')
			.setLabel("What's some of your favorite hobbies?")
			// Paragraph means multiple lines of text.
			.setStyle(TextInputStyle.Paragraph);

		// An action row only holds one text input,
		// so you need one action row per text input.
		const firstActionRow = new ActionRowBuilder().addComponents(favoriteColorInput);
		const secondActionRow = new ActionRowBuilder().addComponents(hobbiesInput);

		//@ts-ignore
		modal.addComponents(firstActionRow, secondActionRow);

		interaction.showModal(modal);
		// TODO create interaction handler that get winders, duration, prize and pass it into create method
		// return this.create(interaction);
	}

	private async create(msg: Message | Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction, args: GiveawayArgs) {
		// TODO: check permissions
		// TODO: validate args w/zod

		msg.client.manager.create(msg, args);
	}
}
