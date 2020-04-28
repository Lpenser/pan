import * as cheerio from 'cheerio';
import * as superagent from 'superagent';
import sql from './mysql';
import * as async from 'async';
import { error, log } from './utils/logs';
import { initPanSource } from './pan';
function analytic(urlArr: string[]) {
    if (urlArr.length) {
        async.mapLimit(urlArr, 5, getHtmlData.bind(this), saveSql.bind(this))
    }
}
async function getHtmlData(option, callBack) {
        const startTime =  new Date().getTime();
        const contentHtml = await superagent.get(option);
        const c$ = cheerio.load(contentHtml.text);
        const title = c$('h1.entry-title').text();
        let content = '';
        c$('.single-content p').each((i, txt) => {
            content += `${c$(txt).text().replace(/"/g, '“').replace(/"/g, '”')}\n`;
        });
        const pageView = c$('.begin-single-meta .views').text().replace(/次浏览/g, '');
        const htmlId = option.split('/').pop().replace(/.html/g ,'');
        const creatDate = c$('.begin-single-meta .my-date').text().replace(/年|月/g, '-').replace(/日/g, ' ');
        const uploadUrl = c$('.down-form span.down a').attr('href') || null;
        let panUrl = null;
        if (uploadUrl) {
            const sourceHtml = await superagent.get(uploadUrl);
            const s$ = cheerio.load(sourceHtml.text);
            panUrl = s$('.down-but a').attr('href') || null;
        }
        log('耗时:'+ (new Date().getTime() - startTime) + '毫秒' + ' ' + option);
        callBack(null, {title, content, panUrl, pageView, htmlId, creatDate});
}


function saveSql(err, result) {
    if (err) {
        error(err);
    }
    const resLength = result.length;
    result.forEach(async (item, idx) => {
        const {title, content, panUrl, pageView, htmlId, creatDate} = item;
        const querySql = `SELECT * FROM content_table WHERE html_id IN (${htmlId})`;
        const queryRes = await sql.query(querySql);
        if (queryRes && queryRes.length) {
            const updateSql = `UPDATE content_table SET
            page_view="${pageView}", upload_url="${panUrl}"
            WHERE html_id='${htmlId}'`;
            const updateRes = await sql.query(updateSql);
            log(htmlId + ':'+ '更新成功');
            if (idx === resLength - 1) {
                error('爬取完成');
                initPanSource();
            }
            return;
        }
        // 存储数据库
        const insertSql = `INSERT INTO content_table(
                title,content,upload_url, html_id, create_date, page_view
            )
            VALUES(
                "${title}", "${content}","${panUrl}", "${htmlId}", "${creatDate}", "${pageView}"
            )`
        await sql.query(insertSql);
        log(htmlId + ':' + '插入成功');
        if (idx === resLength - 1) {
            error('爬取完成');
            initPanSource();
        }
    });
}
/*
let contentHtml = await superagent.get(a.attr('href'));
        const c$ = cheerio.load(contentHtml.text);
        const title = a.text();
        let content = '';
        c$('.single-content p').each((i, txt) => {
            content += `${c$(txt).text().replace(/"/g, '“').replace(/"/g, '”')}\n`;
        });
        const uploadUrl = c$('.down-form span.down a').attr('href') || null;
        const pageView = c$('.begin-single-meta .views').text().replace(/次浏览/g, '');
        const htmlId = a.attr('href').split('/').pop().replace(/.html/g ,'');
        const creatDate = c$('.begin-single-meta .my-date').text().replace(/年|月/g, '-').replace(/日/g, ' ');
        // let panUrl = null;
        if (uploadUrl) {
            // const sourceHtml = await superagent.get(uploadUrl);
            // const s$ = cheerio.load(sourceHtml.text);
            // panUrl = s$('.down-but a').attr('href');
            const panKeyResult = await getPanKey(panUrl) as {access_url: string, access_code: string, status: boolean};
            console.log(panKeyResult);
            if (panKeyResult.status) {
                console.log(panKeyResult, panUrl);
                // const panCookieRes = await superagent.get(panUrl);
                // const panCookieArr = panCookieRes.header['set-cookie'];
                // let panCookie = '';
                // if (panCookieArr.length) {
                //     panCookieArr.forEach(itm => {
                //         panCookie += `${itm.split(';')[0]};`;
                //     });
                // }
                const surl = panKeyResult.access_url.split('/').pop().slice(1);
                const baiduIdCookieRes = await superagent.post(`https://pan.baidu.com/share/verify?surl=${surl}&t=${new Date().getTime()}`)
                                            .set('Cookie', global['panCookie'])
                                            .set('Content-Type', 'application/x-www-form-urlencoded')
                                            .set('Referer', `https://pan.baidu.com/share/init?surl=${surl}`)
                                            .send(`pwd=${panKeyResult.access_code}&vcode=&vcode_str=`);
                const baiduIdCookieArr = baiduIdCookieRes.header['set-cookie'];
                if (baiduIdCookieArr.length) {
                    baiduIdCookieArr.forEach(it => {
                        global['panCookie'] += `${it.split(';')[0]};`;
                    });
                }
                const bdstokenRes = await superagent.get(panUrl).set('Cookie', global['panCookie']);
                console.log(bdstokenRes.text);
                // BDUSS，STOKEN 登录cookie  bdstoken
                // const panSourceRes = await superagent.post(panKeyResult.access_url).set('Cookie', panCookie);
                // const p$ = cheerio.load(panSourceRes.text);
                // console.log(p$.html());
            }
            
        }
        const querySql = `SELECT * FROM content_table WHERE html_id IN (${htmlId})`;
        const queryRes = await sql.query(querySql);
        if (queryRes && queryRes.length) {
            // title="${title}" upload_url="${panUrl}"
            const updateSql = `UPDATE content_table SET
            page_view="${pageView}", upload_url="${uploadUrl}"
            WHERE html_id='${htmlId}'`;
            const updateRes = await sql.query(updateSql);
            console.log(htmlId + '更新成功');
            return;
        }
        // 存储数据库
        const insertSql = `INSERT INTO content_table(
                title,content,upload_url, html_id, create_date, page_view
            )
            VALUES(
                "${title}", "${content}","${uploadUrl}", "${htmlId}", "${creatDate}", "${pageView}"
            )`
        await sql.query(insertSql);
        console.log(htmlId + ':' +idx + '插入成功');
*/
export default analytic;