import './lib/setup';
import '@sapphire/plugin-api/register';

import { LogLevel, SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits, OAuth2Scopes } from 'discord.js';
import { Giveaway, GiveawayManager } from './lib/giveaway';
import { PrismaClient } from '@prisma/client';
import { GiveawayJob } from './lib/giveaway/giveawayJob';
import { CronJob } from 'cron';

const client = new SapphireClient({
	defaultPrefix: '!',
	caseInsensitiveCommands: true,
	// shards: 2,
	shardCount: 1,
	logger: {
		level: LogLevel.Debug
	},
	intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent],
	loadMessageCommandListeners: true,
	api: {
		auth: {
			domainOverwrite: '127.0.0.1',
			// The application/client ID of your bot
			// You can find this at https://discord.com/developers/applications
			id: process.env.DISCORD_ID!,
			// The client secret of your bot
			// You can find this at https://discord.com/developers/applications
			secret: process.env.DISCORD_SECRET!,
			// The name of the authentication cookie
			cookie: 'tk',
			// The URL that users should be redirected to after a successful authentication
			// redirect: '/oauth/callback',
			// The scopes that should be given to the authentication
			scopes: [OAuth2Scopes.Identify, OAuth2Scopes.Guilds],
			// Transformers to transform the raw data from Discord to a different structure.
			transformers: []
		},
		prefix: '',
		// The origin header to be set on every request at 'Access-Control-Allow-Origin.
		origin: '*',
		// Any options passed to the NodeJS "net" internal server.listen function
		// See https://nodejs.org/api/net.html#net_server_listen_options_callback
		listenOptions: {
			// The port the API will listen on
			port: 4000
		}
	}
});
const gen = () => {
	var randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
	var uniqid = randLetter + Date.now();
	return uniqid;
};
const main = async () => {
	client.prisma = new PrismaClient();
	client.manager = new GiveawayManager(client);
	try {
		client.logger.info('Logging in');
		await client.login();
		client.logger.info('logged in');
	} catch (error) {
		client.logger.fatal(error);
		await client.destroy();
		process.exit(1);
	}
};

void main();
