import { isDMChannel, isGuildBasedChannel, isGuildBasedChannelByGuildKey, isTextBasedChannel } from '@sapphire/discord.js-utilities';
import { Command, SapphireClient } from '@sapphire/framework';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	Client,
	EmbedBuilder,
	Message,
	MessageManager,
	MessagePayload,
	MessagePayloadOption,
	REST,
	Routes
} from 'discord.js';
import { CronJob } from 'cron';
import ms from 'ms';
import { PrismaClient } from '@prisma/client';
export interface GiveawayArgs {
	winners: number;
	duration: number;
	prize: string;
}

interface Giveaway {
	messageId: string;
	channelId: string;
	args: GiveawayArgs;
	host: string;
	endsAt: number;
	startsAt: number;
	entries: Set<string>;
}

export class GiveawayManager {
	giveaways: Record<string, Giveaway & { job: CronJob }> = {};
	isReady = false;
	offset = 1000;
	constructor(public client: SapphireClient<boolean>) {
		this.#getReady();
	}
	getRandomWinners(entries: Set<string>, winnersCount: number): string[] {
		if (winnersCount > entries.size) {
			return [...entries];
		}

		const entriesArray = Array.from(entries);
		const winners: string[] = [];

		while (winners.length < winnersCount) {
			const randomIndex = Math.floor(Math.random() * entriesArray.length);
			const winner = entriesArray[randomIndex];

			//? Check if the winner is already in the array to avoid duplicates
			if (!winners.includes(winner)) {
				winners.push(winner);
			}
		}

		return winners;
	}

	// create a new giveaway

	async create(msg: Message | Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction, args: GiveawayArgs) {
		if (!isTextBasedChannel(msg.channel) && !isGuildBasedChannelByGuildKey(msg.channel)) {
			console.log('not text based channel');
			return;
		}

		if (!msg.guild) {
			console.log('not guild channel');
			return;
		}
		if (!msg.member) {
			console.log('no member found');
			return;
		}

		this.#start(msg, args);
	}
	async #start(msg: Message | Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction, args: GiveawayArgs) {
		const endsAt = Date.now() + args.duration;
		const embed = new EmbedBuilder()
			.setTimestamp()
			.setTitle(args.prize)
			.setColor('DarkGrey')
			.setDescription(
				[`Ends: <t:${Math.floor(endsAt / 1000)}:R>`, `Hosted by: ${msg.member?.toString()}`, `Entries: 0`, `Winners: ${args.winners}`].join(
					'\n'
				)
			);
		const confirm = new ButtonBuilder().setCustomId('giveaway').setEmoji('🎉').setStyle(ButtonStyle.Primary);
		const row = new ActionRowBuilder().addComponents(confirm);
		const giveawayMsg = await msg.channel!.send({ embeds: [embed], components: [row as any] });
		const giveaway: Giveaway = {
			args,
			messageId: giveawayMsg.id,
			channelId: giveawayMsg.channel.id,
			host: msg.member!.user.id,
			endsAt,
			startsAt: Date.now(),
			entries: new Set()
		};
		await this.#save(giveaway, giveawayMsg.guild!.id);
		let job = this.#startJob(giveaway);
		this.giveaways[giveawayMsg.id] = { ...giveaway, job };
	}
	async #save(giveaway: Giveaway, guildId: string) {
		return await this.client.prisma.giveaway.create({
			data: {
				channelId: giveaway.channelId,
				guildId: guildId,
				host: giveaway.host,
				endsAt: giveaway.endsAt,
				startsAt: giveaway.startsAt,
				id: giveaway.messageId,
				prize: giveaway.args.prize,
				duration: giveaway.args.duration,
				winners: giveaway.args.winners
			}
		});
	}

	async #endGiveaway(giveaway: Giveaway) {
		try {
			const winners = this.getRandomWinners(giveaway.entries, giveaway.args.winners);
			// get random
			let embed = new EmbedBuilder()
				.setTimestamp()
				.setTitle(giveaway.args.prize)
				.setColor('DarkGrey')
				.setDescription(
					[
						`## Ended`,
						`Hosted by: <@${giveaway.host}>`,
						`Entries: ${giveaway.entries.size}`,
						`Winners: ${winners.map((id) => `<@${id}>`).join(', ')}`
					].join('\n')
				);

			await this.#edit(giveaway.channelId, giveaway.messageId, { embeds: [embed] });
			await this.client.prisma.giveaway.update({
				where: {
					id: giveaway.messageId
				},
				data: {
					isEnded: true
				}
			});
		} catch (err) {
			console.log(err);
		}
	}

	#startJob(giveaway: Giveaway) {
		const job = new CronJob(new Date(giveaway.endsAt), async () => this.#endGiveaway(giveaway));
		job.start();
		return job;
	}
	async #edit(channelId: string, messageId: string, options: MessagePayloadOption) {
		let message: Message = {
			client: this.client as Client<true>
		} as Message;
		const { body, files } = await MessagePayload.create(message, options).resolveBody().resolveFiles();

		await this.client.rest.patch(Routes.channelMessage(channelId, messageId), { body, files: files as any });
	}
	async #getReady() {
		const giveaways = await this.client.prisma.giveaway.findMany({
			where: {
				isEnded: false
			}
		});

		for (let giveaway of giveaways) {
			let g: Giveaway = {
				channelId: giveaway.channelId,
				messageId: giveaway.id,
				args: {
					duration: giveaway.duration,
					winners: giveaway.winners,
					prize: giveaway.prize
				},
				endsAt: giveaway.endsAt,
				startsAt: giveaway.startsAt,
				host: giveaway.host,
				entries: new Set(giveaway.entries)
			};
			if (g.endsAt <= Date.now()) {
				return this.#endGiveaway(g);
			}
			this.#startJob(g);
		}
		this.isReady = true;
	}
}
// create - create a new giveaway
// list - search for guild_id working giveaways
// remove - remove
//
