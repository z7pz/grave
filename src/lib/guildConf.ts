import { PrismaClient } from '@prisma/client';
import { none, Option, some } from '@sapphire/result';

// export function getConfigOption(prisma: PrismaClient, id: string) {
// 	return Option.fromAsync(async () => getConfig(prisma, id));
// }

export async function getConfig(prisma: PrismaClient, id: string) {
	return prisma.guild.upsert({
		where: { id },
		update: {}, // No fields to update, as you're just creating if it doesn't exist
		create: { id } // create new conf
	});
}
