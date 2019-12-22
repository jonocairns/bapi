import { query, trans } from './db';
import { schema, Status, validate } from './schema';
import { go } from './scrapist';

console.log('initialising...');


const backoff = 4000;

const sleep = () => new Promise(resolve => setTimeout(resolve, backoff))

export const prepare = async () => {
    console.log('fetching existing status...');
    const res = await query('SELECT * FROM status', []);
    const page = 0, index = 0;
    if (res.rows.length !== 0) {
        const status = res.rows[0] as Status;
        console.log(`retrieved last status (page ${status.page}) (index ${status.index})`);
        return status;
    }
    return { page, index };
}

const cycle = async (seed: Status) => {
    let { page } = seed;
    while (true) {
        try {
            console.log(`scraping page ${page} of 8,000ish...`);
            await go(page, '*');
            await trans(async client => {
                const res = await client.query('SELECT * FROM status', []);

                if (res.rows.length === 0) {
                    client.query('INSERT INTO status(page,index) VALUES($1,$2)', [page, 0]);
                } else {
                    client.query('UPDATE status SET page = $1', [page]);
                }

            });
            console.log(`completed page... sleeping...`);
            page = page + 1;
            await sleep();
        } catch (e) {
            console.log(e);
        }
    }
}

const init = async () => {
    await validate();
    const status = await prepare();
    await cycle(status);
};

init();

