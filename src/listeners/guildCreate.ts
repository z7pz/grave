import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import type { StoreRegistryValue } from '@sapphire/pieces';
import { blue, gray, green, magenta, magentaBright, white, yellow } from 'colorette';
import { GatewayDispatchEvents, Guild } from 'discord.js';


@ApplyOptions<Listener.Options>({ event: GatewayDispatchEvents.GuildCreate })
export class UserEvent extends Listener {
	public override run(guild: Guild) {
		console.log(guild);
	}
}
