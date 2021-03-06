import { google } from 'googleapis';

type CSE = {
	kind: 'image' | 'web',
	key: string,
	id: string,
	query: string,
	nsfw: boolean
};

// Cache grows from the bottom, and deletes from the top.
//  i.e. old cached items get deleted, since they're unpopular.
const CACHE_SIZE = 40;
const CACHE = {
	'aaron obese': "https://assets3.thrillist.com/v1/image/2765017/size/tmg-article_tall;jpeg_quality=20.jpg\n>>> Aaron obese xD, shut up instgen...",
	'druggie': "https://vignette.wikia.nocookie.net/sausage-party-recipe-book/images/e/e7/Druggie.png/revision/latest/top-crop/width/360/height/450?cb=20170212165040\n>>> Hurr durr, arron's a shroomer lmao.",
	'aaron fish': "https://i.pinimg.com/280x280_RS/fa/b5/96/fab5962b97d464781f65952b6b63e4a0.jpg\n>>> arron fish? arron fish. Blub blub.",
	'sammy obese': "https://s3fs.bestfriends.org/s3fs-public/news/15/09/04/SIJenPettingSammy6919.jpg\n>>> sammy is a cute skinny twink, stfu.",
	'james obese': "https://i.dailymail.co.uk/i/pix/2014/02/18/article-2562421-1B9E557700000578-9_634x468.jpg\n>>> james very obese, yes, very original...",
	'aaron penis': "http://m.quickmeme.com/img/ea/eaf8c78ae55815cc7786b1596f9a9767fc3c42b60efff8a2455150e4d0eb37b0.jpg\n>>> aaron's schlong is actually huge. shroomer schlong."
};

// TODO: Reject results if they're from:
//      Urban Dictionary,
//      YouTube or Wikipedia.
//  These web-places already have commands given to them.

const web_search = (param : CSE) => new Promise((resolve, reject) => {
	let query = param.query;
	const cache_keys = Object.keys(CACHE);
	// Retrieve cached query.
	if (param.query in CACHE) {
		return resolve(`${CACHE[param.query]}  (cached response)`);
	} else if (cache_keys.length > CACHE_SIZE) {
		// Delete a few, so we can delete less frequently.
		delete CACHE[cache_keys[0]];
		delete CACHE[cache_keys[1]];
		delete CACHE[cache_keys[2]];
	}

	let num_match = param.query.trim().match(/[ ]+(\d+)$/);
	if (num_match)
		query = query.slice(0, -num_match[1].length).trim();
	
   const result_num : number = num_match ? Number(num_match[1]) : 1;
	
	if (result_num > 10)
		return reject("Can only query up to 10th result (API restriction).");

	const result_index = Math.abs(result_num - 1);
	const cs = google.customsearch('v1');

	cs.cse.list({
		auth: param.key,
		cx: param.id,
		q: query,
		searchType: (param.kind === 'web') ? undefined : param.kind,
		start: 0,
		num: result_index + 1,
		safe: param.nsfw ? 'off' : 'active'
	}).then(res => {
		if (!res.data || !res.data.items || res.data.items.length === 0)
			return reject('No such results found.');

		const item = res.data.items[result_index];
		const answer = `Search for ‘${query}’ (result no. ${result_num}) ${item.link}\n>>> ${item.title}`;
		// Cache this query (DO NOT CACHE NSFW)
		if (!param.nsfw)
			CACHE[param.query] = answer;
		return resolve(answer);
	}).catch(e =>
		reject(`No results, or API capped...\n\`\`\`\n${e}\n\`\`\``));
});

export default web_search;
