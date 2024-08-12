import { HttpCodes, methods, MimeTypes, Route, type ApiRequest, type ApiResponse } from '@sapphire/plugin-api';
import { authenticated } from '../lib/api/utils/utils';
import { OAuth2Routes, RESTPostOAuth2AccessTokenResult } from 'discord.js';
import { FetchResultTypes, fetch } from '@sapphire/fetch';
import { Time } from '@sapphire/time-utilities';

export class UserRoute extends Route {
	public constructor(context: Route.LoaderContext, options: Route.Options) {
		super(context, {
			...options,
			route: 'user'
		});
	}
	@authenticated()
	public async [methods.GET](request: ApiRequest, response: ApiResponse) {

		if (!request.auth) return response.error(HttpCodes.Unauthorized);

		const auth = this.container.server.auth!;
		let authToken = request.auth.token;
		if (Date.now() + Time.Day >= request.auth.expires) {
			const body = await this.refreshToken(request.auth.id, request.auth.refresh);
			if (body !== null) {
				const authentication = auth.encrypt({
					id: request.auth.id,
					token: body.access_token,
					refresh: body.refresh_token,
					expires: Date.now() + body.expires_in * 1000
				});

				response.cookies.add(auth.cookie, authentication, { maxAge: body.expires_in });
				authToken = body.access_token;
			}
		}
		try {
			return response.json(await auth.fetchData(authToken));
		} catch (error) {
			this.container.logger.fatal(error);
			return response.error(HttpCodes.InternalServerError);
		}
	}
	private async refreshToken(id: string, refreshToken: string) {
		const { logger, server } = this.container;
		try {
			logger.debug(`Refreshing Token for ${id}`);
			return await fetch<RESTPostOAuth2AccessTokenResult>(
				OAuth2Routes.tokenURL,
				{
					method: 'POST',
					body: JSON.stringify({
						client_id: server.auth!.id,
						client_secret: server.auth!.secret,
						grant_type: 'refresh_token',
						refresh_token: refreshToken,
						redirect_uri: server.auth!.redirect,
						scope: server.auth!.scopes
					}),
					headers: {
						'Content-Type': MimeTypes.ApplicationFormUrlEncoded
					}
				},
				FetchResultTypes.JSON
			);
		} catch (error) {
			logger.fatal(error);
			return null;
		}
	}
}
