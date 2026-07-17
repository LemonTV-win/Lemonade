import { syncBilibiliVodSubscriptions } from '../../src/lib/server/data/bilibili-vod-sync';
import { syncYoutubeVodSubscriptions } from '../../src/lib/server/data/youtube-vod-sync';

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const targets = {
	bilibili: args.has('--bilibili'),
	youtube: args.has('--youtube')
};
if (!targets.bilibili && !targets.youtube) {
	targets.bilibili = true;
	targets.youtube = true;
}

let failed = false;

if (targets.bilibili) {
	const result = await syncBilibiliVodSubscriptions({
		dryRun,
		cookie: process.env.BILIBILI_COOKIE
	});
	console.log(JSON.stringify({ source: 'bilibili', ...result }));
	if (!result.ok) failed = true;
}

if (targets.youtube) {
	const result = await syncYoutubeVodSubscriptions({
		dryRun,
		apiKey: process.env.GOOGLE_API_KEY
	});
	console.log(JSON.stringify({ source: 'youtube', ...result }));
	if (!result.ok) failed = true;
}

process.exit(failed ? 1 : 0);
