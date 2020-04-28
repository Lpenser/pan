import * as superagent from 'superagent';
import analytic from './analytic';
import * as cheerio from 'cheerio';
import { log, error } from './utils/logs';
const inster$ = null;
const contentUrlArr = [];
function init() {
    (async () => {
        try {
            // const inster$ = setInterval( async _ => {
            //     if (inster$) {
            //         clearInterval(inster$);
            //     }
            //     if (global['panCookie']) {
            //         console.log(global['panCookie']);
                    log('开始爬取');
                    const startTime = new Date().getTime();
                    const html = await superagent.get('https://www.maomp.com/wzjc/');
                    const $ = cheerio.load(html.text);
                    $('main#main article').each((idx, ele) => {
                        const a = $(ele).find('.entry-header .entry-title a');
                        contentUrlArr.push(a.attr('href'));
                    });
                    const total = $('.next.page-numbers').prev().text().replace(/第|页/g, '');
                    for (let i = 2; i<= total * 1; i++) {
                        const cHtml = await superagent.get('https://www.maomp.com/wzjc/page/'+i+'/');
                        const $c = cheerio.load(cHtml.text);
                        $c('main#main article').each((idx, ele) => {
                            const a = $(ele).find('.entry-header .entry-title a');
                            contentUrlArr.push(a.attr('href'));
                        });
                    }
                    log('抓取列表页耗时: ' + (new Date().getTime() - startTime) + ' 毫秒');
                    analytic(contentUrlArr);
            //     }
            // }, 3000)
        } catch (err) {
            if (err) {
                // 如果访问失败或者出错，会这行这里
                error(`抓取失败 - ${err}`)
            }
        }
    })();
}

export default init;