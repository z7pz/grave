import { HttpCodes, methods, Route, type ApiRequest, type ApiResponse } from '@sapphire/plugin-api';
import { authenticated } from '../../lib/api/utils/utils';
import { getConfig } from '../../lib/guildConf';
import configSchema from '../../lib/validators/config';

type Test = Zod.infer<typeof configSchema>;

export class UserRoute extends Route {
	public constructor(context: Route.LoaderContext, options: Route.Options) {
		super(context, {
			...options,
			route: 'servers/:id'
		});
	}

	get prisma() {
		return this.container.client.prisma;
	}

	@authenticated()
	public async [methods.GET](request: ApiRequest, response: ApiResponse) {
		const auth = this.container.server.auth!;
		const authToken = request.auth!.token;
		const id = request.params.id;

		try {
			const user = await auth.fetchData(authToken);
			const guild = user.guilds?.find((c) => c.id == id);
			if (!guild) return response.error(HttpCodes.BadRequest);
			console.log(guild.permissions);
			// TODO check for permissions

			const config = await getConfig(this.prisma, guild.id);

			return response.json({
				guild,
				config
			});
		} catch (error) {
			this.container.logger.fatal(error);
			return response.error(HttpCodes.InternalServerError);
		}
	}
	@authenticated()
	public async [methods.POST](request: ApiRequest, response: ApiResponse) {
		const body = (request.body as Test) ?? ({} as Test);
		const auth = this.container.server.auth!;
		const authToken = request.auth!.token;
		const id = request.params.id;
		try {
			configSchema.parse(body);
		} catch (err) {
			response.badRequest(err);
		}

		try {
			const user = await auth.fetchData(authToken);
			const guild = user.guilds?.find((c) => c.id == id);
			if (!guild) return response.error(HttpCodes.BadRequest);
			console.log(guild.permissions);
			// TODO check for permissions

			let config = await getConfig(this.prisma, guild.id);
			config = await this.prisma.guild.update({
				data: {
					// ...body,
					prefix: body.prefix,
					role: body.role,
					webhookToggle: body.webhookToggle,
					webhookId: body.webhookId,
					webhookToken: body.webhookToken,
					buttonORreaction: body.buttonORreaction,
					reaction: body.reaction,
					messagesWin: body.messagesWin,
					messagesNoWinner: body.messagesNoWinner,
					titleStart: body.titleStart,
					titleEnd: body.titleEnd,
					startMessage: body.startMessage,
					startColor: body.startColor,
					endMessage: body.endMessage,
					endColor: body.endColor,
					thumbnail: body.thumbnail,
					image: body.image,
					separatorImage: body.separatorImage,
				},
				where: {
					id
				}
			});
			return response.json({
				guild,
				config
			});
		} catch (error) {
			this.container.logger.fatal(error);
			return response.error(HttpCodes.InternalServerError);
		}
	}
}
