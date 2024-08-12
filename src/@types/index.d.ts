import type { GiveawayManager } from '../lib/giveaway';
import type { PrismaClient } from '@prisma/client';
declare module 'discord.js' {
	interface Client {
		manager: GiveawayManager;
		prisma: PrismaClient;
	}
}
