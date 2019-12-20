import { trans } from "./db";
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as crypto from 'crypto';

const pageSize = 20;

export const go = async (page: number = 1, search: string = '*') => {
    const url = `https://www.audible.com/search?keywords=${search}&page=${page}&pageSize=${pageSize}`;
    console.log(`hitting ${url}`);
    const resp = await axios.get(url);
    const $ = cheerio.load(resp.data);
    const items = $('.productListItem');

    const findTarget = (node: CheerioElement, target: string) => {
        try {
            return $(node).find(target)[0].children.pop().data;
        } catch (e) {
            return '';
        }
    };
    const findMany = (node: CheerioElement, target: string) => $(node).find(target);

    const searchSchema = [
        { name: 'year', target: '.releaseDateLabel span', multi: false, translate: (item: string): string => new Date(item).toISOString() },
        { name: 'title', target: '.bc-list-item h3 a', multi: false },
        { name: 'subtitle', target: '.subtitle span', multi: false },
        { name: 'author', target: '.authorLabel span a', multi: true },
        { name: 'narrator', target: '.narratorLabel span a', multi: false },
        {
            name: 'runtime', target: '.runtimeLabel span', multi: false, translate: (searchItem: string): number => searchItem
                .split(' ')
                .filter(r => !isNaN(r as any))
                .map(a => Number(a))
                .map((a, i) => i === 0 ? a * 60 : a)
                .reduce((a, b) => a + b, 0) || 0
        },
        { name: 'language', target: '.languageLabel span', multi: false },
        { name: 'stars', target: '.ratingsLabel .bc-pub-offscreen', multi: false, translate: (item: string): number => Number(item.split(' ').shift()) || 0 },
        { name: 'ratings', target: '.ratingsLabel .bc-color-secondary', multi: false, translate: (item: string): number => Number(item.replace(/,/g, '').split(' ').shift()) || 0 },
    ];

    return await Promise.all(
        items.toArray().map(async (blah, i) => {

            const props: Array<{ prop: string, value: any }> = [];

            const img = $(blah).find('.responsive-product-square img')[0].attribs['src'];
            props.push({
                prop: 'image', value: img
            });

            const detailLink = $(blah).find('.bc-list-item h3 a')[0].attribs['href'].split('?').shift();
            const fullLink = `https://www.audible.com${detailLink}`;
            const id = crypto.createHash('md5').update(detailLink).digest('hex');

            props.push({
                prop: 'id', value: id
            });

            props.push({
                prop: 'link', value: fullLink
            });

            const detailResp = await axios.get(fullLink);
            const targeter = cheerio.load(detailResp.data);

            const description = targeter('.productPublisherSummary').find('.bc-text').html() || '';

            props.push({
                prop: 'description', value: description
            });

            searchSchema.forEach(ss => {
                if (!ss.multi) {
                    let item = findTarget(blah, ss.target).split(':').pop().trim();

                    if (ss.translate) {
                        const transLatedItem = ss.translate(item);
                        props.push({ prop: ss.name, value: transLatedItem });
                    } else {
                        props.push({ prop: ss.name, value: item });
                    }

                } else {
                    const i = findMany(blah, ss.target);
                    const arr = i.toArray().map(d => d.children.map(c => c.data)).reduce((acc, val) => acc.concat(val), []);
                    props.push({ prop: ss.name, value: arr.join(', ') });
                }
            });

            props.push({
                prop: 'lastUpdatedUtc', value: new Date().toISOString()
            });

            props.push({
                prop: 'dateCreatedUtc', value: new Date().toISOString()
            });

            if (id) {
                await trans(async (client) => {
                    const existsQuery = await client.query(`SELECT * FROM audiobook WHERE id = $1`, [id]);

                    if (existsQuery.rows.length === 0) {
                        console.log(`adding ${id}`)
                        const queryText = `INSERT INTO audiobook(${props.map(p => p.prop)}) VALUES(${props.map((p, i) => `$${i + 1}`)})`;
                        await client.query(queryText, props.map(p => p.value))
                    } else {
                        console.log(`item ${id} already exists... skipping`)
                    }
                });
            }
            const base: any = {};
            props.forEach(p => { base[p.prop] = p.value })
            return base;
        })
    )

}