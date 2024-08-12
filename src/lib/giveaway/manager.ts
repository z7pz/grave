//? feature plan
//? 1. refactor: to event listner
//?	2. feature: create owned embed builder
//?	3. refactor: move jobs thing to GiveawayJobManager
//? 4. move memory cache into redis cache

import { isGuildBasedChannelByGuildKey, isTextBasedChannel } from '@sapphire/discord.js-utilities';
import { Command, SapphireClient } from '@sapphire/framework';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	Client,
	EmbedBuilder,
	Message,
	MessagePayload,
	MessagePayloadOption,
	Routes
} from 'discord.js';
import { CronJob } from 'cron';
import { getConfig } from '../guildConf';
import { Giveaway } from '.';
import { GiveawayJob } from './giveawayJob';
import { Giveaway as PrismaGiveaway } from '@prisma/client';
export interface GiveawayArgs {
	winners: number;
	duration: number;
	prize: string;
}

export class GiveawayManager {
	jobs: Record<string, GiveawayJob> = {};
	isReady = false;
	offset = 1000;
	constructor(public client: SapphireClient<boolean>) {
		console.log('giveaway manger is running!');
		this.#getReady();
	}

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
	async delete(giveaway: Giveaway | PrismaGiveaway) {
		if (!(giveaway instanceof Giveaway)) {
			giveaway = Giveaway.from(giveaway);
		}
		if (this.jobs[giveaway.messageId]) {
			this.jobs[giveaway.messageId].cron.stop();
			delete this.jobs[giveaway.messageId];
		}
		await this.client.rest.delete(Routes.channelMessage(giveaway.channelId, giveaway.messageId));
	}
	#getRandomWinners(entries: Set<string>, winnersCount: number): string[] {
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
		const giveaway = new Giveaway({
			args,
			messageId: giveawayMsg.id,
			channelId: giveawayMsg.channel.id,
			guildId: giveawayMsg.guild!.id,
			host: msg.member!.user.id,
			endsAt,
			startsAt: Date.now(),
			entries: new Set()
		});
		await this.#save(giveaway);
		this.#startJob(giveaway);
	}
	async #save(giveaway: Giveaway) {
		return await this.client.prisma.giveaway.create({
			data: {
				channelId: giveaway.channelId,
				guildId: giveaway.guildId,
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

	async end(giveaway: Giveaway) {
		try {
			const conf = await getConfig(this.client.prisma, giveaway.guildId);
			const winners = this.#getRandomWinners(giveaway.entries, giveaway.args.winners);
			// get random
			let embed = new EmbedBuilder()
				.setTimestamp()
				.setTitle(giveaway.args.prize)
				.setColor(conf.endColor as any)
				.setDescription(
					[
						conf.titleEnd,
						`Hosted by: <@${giveaway.host}>`,
						`Entries: ${giveaway.entries.size}`,
						`Winners: ${winners.length !== 0 ? winners.map((id) => `<@${id}>`).join(', ') : 'No winners'} `
					].join('\n')
				);
			delete this.jobs[giveaway.messageId];
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
		const job = new CronJob(new Date(giveaway.endsAt), async () => this.end(giveaway));
		job.start();
		this.jobs[giveaway.messageId] = new GiveawayJob(giveaway, job);
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
			let g = Giveaway.from(giveaway);
			if (g.endsAt <= Date.now()) {
				return this.end(g);
			}
			this.#startJob(g);
		}
		this.isReady = true;
	}
}
