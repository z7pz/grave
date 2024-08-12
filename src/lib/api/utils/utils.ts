import { createFunctionPrecondition } from '@sapphire/decorators';
import { ApiRequest, ApiResponse, HttpCodes, type LoginData } from '@sapphire/plugin-api';
import { RateLimitManager } from '@sapphire/ratelimits';
import { hasAtLeastOneKeyInMap } from '@sapphire/utilities';
import {
	PermissionFlagsBits,
	type GuildMember,
} from 'discord.js';

function isAdmin(member: GuildMember, roles: readonly string[]): boolean {
	return roles.length === 0 ? member.permissions.has(PermissionFlagsBits.ManageGuild) : hasAtLeastOneKeyInMap(member.roles.cache, roles);
}

export const authenticated = () =>
	createFunctionPrecondition(
		(request: ApiRequest) => Boolean(request.auth?.token),
		(_request: ApiRequest, response: ApiResponse) => response.error(HttpCodes.Unauthorized)
	);

/**
 * @param time The amount of milliseconds for the ratelimits from this manager to expire.
 * @param limit The amount of times a {@link RateLimit} can drip before it's limited.
 * @param auth Whether or not this should be auth-limited
 */
export function ratelimit(time: number, limit = 1, auth = false) {
	const manager = new RateLimitManager(time, limit);
	const xRateLimitLimit = time;
	return createFunctionPrecondition(
		(request: ApiRequest, response: ApiResponse) => {
			const id = (auth ? request.auth!.id : request.headers['x-forwarded-for'] || request.socket.remoteAddress) as string;
			const bucket = manager.acquire(id);

			response.setHeader('Date', new Date().toUTCString());
			if (bucket.limited) {
				response.setHeader('Retry-After', bucket.remainingTime.toString());
				return false;
			}

			try {
				bucket.consume();
			} catch {}

			response.setHeader('X-RateLimit-Limit', xRateLimitLimit);
			response.setHeader('X-RateLimit-Remaining', bucket.remaining.toString());
			response.setHeader('X-RateLimit-Reset', bucket.remainingTime.toString());

			return true;
		},
		(_request: ApiRequest, response: ApiResponse) => {
			response.error(HttpCodes.TooManyRequests);
		}
	);
}
