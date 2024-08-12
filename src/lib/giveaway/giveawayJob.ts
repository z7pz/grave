import { CronJob } from 'cron';
import { Giveaway } from '.';

export class GiveawayJob {
	constructor(
		public giveaway: Giveaway,
		public cron: CronJob
	) {

	}
}
