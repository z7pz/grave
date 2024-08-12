import { GiveawayArgs } from '.';
import { Giveaway as PrismaGiveaway } from '@prisma/client';
export class Giveaway {
	messageId: string;
	channelId: string;
	guildId: string;
	args: GiveawayArgs;
	host: string;
	endsAt: number;
	startsAt: number;
	entries: Set<string>;

	constructor(
		{
			messageId,
			channelId,
			guildId,
			args,
			host,
			endsAt,
			entries,
			startsAt
		}: {
			messageId: string;
			channelId: string;
			guildId: string;
			args: GiveawayArgs;
			host: string;
			endsAt: number;
			startsAt: number;
			entries: Set<string>;
		} // Initialize entries as an empty set by default
	) {
		this.messageId = messageId;
		this.channelId = channelId;
		this.guildId = guildId;
		this.args = args;
		this.host = host;
		this.endsAt = endsAt;
		this.startsAt = startsAt;
		this.entries = entries;
	}

	// You can add methods specific to the Giveaway class here
	addEntry(userId: string) {
		this.entries.add(userId);
	}
	static from(giveaway: PrismaGiveaway) {
		return new Giveaway({
			channelId: giveaway.channelId,
			messageId: giveaway.id,
			guildId: giveaway.guildId,
			args: {
				duration: giveaway.duration,
				winners: giveaway.winners,
				prize: giveaway.prize
			},
			endsAt: giveaway.endsAt,
			startsAt: giveaway.startsAt,
			host: giveaway.host,
			entries: new Set(giveaway.entries)
		})
	}
}
