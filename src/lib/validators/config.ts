import z from 'zod';
const configSchema = z.object({
	prefix: z.string().default('g!'),
	role: z.string().nullable().optional(),
	webhookToggle: z.boolean().default(false),
	webhookId: z.string().nullable().optional(),
	webhookToken: z.string().nullable().optional(),
	buttonORreaction: z.string().default('reaction'),
	reaction: z.string().default('1210959350718398464'),
	messagesWin: z.string().default('Congratulations, {winners}! You won **{prize}**!'),
	messagesNoWinner: z.string().default('Giveaway cancelled, no valid participations.'),
	titleStart: z.string().default('<:give:1210959350718398464> **GIVEAWAY STARTED** <:give:1210959350718398464>'),
	titleEnd: z.string().default('<:give:1210959350718398464> **GIVEAWAY ENDED** <:give:1210959350718398464>'),
	startMessage: z.string().default('React with <:give:1210959350718398464> to participate!\nWill ended: {timestamp}\nHosted by: {hostedBy}'),
	startColor: z.string().default('#b19361'),
	endMessage: z.string().default('Winner(s): {winners}\nHosted by: {hostedBy}'),
	endColor: z.string().default('#b8a88e'),
	thumbnail: z.string().nullable().optional(),
	image: z.string().nullable().optional(),
	separatorImage: z.string().nullable().optional()
});
export default configSchema;
