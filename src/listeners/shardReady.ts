import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { Snowflake } from 'discord.js';

@ApplyOptions<Listener.Options>({ once: false })
export class ShardReady extends Listener {
	public override run(id: number, v: Set<Snowflake>) {
		console.log(v?.values())
		console.log(`shard: ${id}`)
	}
}
