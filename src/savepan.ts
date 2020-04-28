
import * as superagent from 'superagent';
import { error, success, log } from './utils/logs';
import sql from './mysql';

const querySql = `SELECT pan_url, pan_code, id FROM pan_source WHERE is_pan = 0 AND pan_code != 'null'`;
let count = 0;
let panArr = [];
const baiduLoginCookie = `BDUSS=91eHRUeGdGZGN-MTAyT25ZYmNqdFZBYmtYbnNNUlp6YUJ3Vmk3eVV2WlZ4YzFlSUFBQUFBJCQAAAAAAAAAAAEAAABv6q6VaGh2OTc2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFU4pl5VOKZeeU;STOKEN=15744a5ff2d643a5e8e3a70d24047c938b60e79981689211e471675fd197bcd8;`
function getLogid() {
    const h = function (e) {
        var n = [0, 2, 1][e.length % 3],
            t = e.charCodeAt(0) << 16 | (e.length > 1 ? e.charCodeAt(1) : 0) << 8 | (e.length > 2 ? e.charCodeAt(2) : 0),
            o = [u.charAt(t >>> 18), u.charAt(t >>> 12 & 63), n >= 2 ? "=" : u.charAt(t >>> 6 & 63), n >= 1 ? "=" : u.charAt(63 & t)];
        return o.join("")
    };

    const m = function (e) {
        return e.replace(/[\s\S]{1,3}/g, h)
    }
    const p = function () {
        return m(g((new Date).getTime()))
    }
    const l = String.fromCharCode;
    const u = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/~！@#￥%……&";
    const d = function (e) {
        if (e.length < 2) {
            const n = e.charCodeAt(0);
            return 128 > n ? e : 2048 > n ? l(192 | n >>> 6) + l(128 | 63 & n) : l(224 | n >>> 12 & 15) + l(128 | n >>> 6 & 63) + l(128 | 63 & n)
        }
        const n = 65536 + 1024 * (e.charCodeAt(0) - 55296) + (e.charCodeAt(1) - 56320);
        return l(240 | n >>> 18 & 7) + l(128 | n >>> 12 & 63) + l(128 | n >>> 6 & 63) + l(128 | 63 & n)
    };
    const f = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;
    const g = function (e) {
        return (e + "" + Math.random()).replace(f, d)
    }
    return p();
}


function makePrivatePassword() {
    const e = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "m", "n", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
    const i = (e, i) => {
        return Math.round((i - e) * Math.random() + e)
    };
    const t = (t) => {
        const s = [];
        for (let a = 1; t >= a; a++) s.push(e[i(0, e.length - 1)]);
        return s.join('');
    };
    return t(4);
}


export async function savePan() {
    log('开始');
    const queryRes = await sql.query(querySql);
    // panArr = [queryRes[1]];
    panArr = queryRes.map(item => {
        item.pan_url = item.pan_url.trim();
        return item;
    });
    saveBaiduPan();

}


async function saveBaiduPan() {
    if (count === panArr.length) {
        log('存盘完成');
        return;
    }
    const { pan_url, pan_code, id } = panArr[count];
    log('开始保存:' + pan_url);
    // nextSavePan();
    // return;
    let baiduCookie = '';
    const surl = pan_url.split('/').pop().slice(1);
    const panCookieRes = await superagent.get(pan_url);
    const panCookieArr = panCookieRes.header['set-cookie'];
    if (panCookieArr.length) {
        panCookieArr.forEach(itm => {
            baiduCookie += `${itm.split(';')[0]};`;
        });
    }
    // console.log(baiduCookie + baiduLoginCookie)
    const bdstokenRes = await superagent.get(`https://pan.baidu.com/share/init?surl=${surl}`)
        .set('Cookie', baiduCookie + baiduLoginCookie)
        .set({
            'Host': 'pan.baidu.com',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36'
        });
    const bdstoken = bdstokenRes.text.match(/"bdstoken":"(\S*)","is_v/) && bdstokenRes.text.match(/"bdstoken":"(\S*)","is_v/)[1] || '';
    if (bdstoken.length < 10) {
        // console.log(bdstokenRes.text);
        error('bdstoken获取不到, 进行下一个');
        const updateSql = `UPDATE pan_source SET is_pan=${2} WHERE id='${id}'`;
        await sql.query(updateSql);
        nextSavePan();
        return;
    }

    const baiduIdCookieRes = await superagent.post(`https://pan.baidu.com/share/verify?surl=${surl}&t=${new Date().getTime()}`)
        .set('Cookie', baiduCookie)
        .set({
            'Accept': '*/*',
            'Host': 'pan.baidu.com',
            'Origin': 'https://pan.baidu.com',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36',
            'Referer': `https://pan.baidu.com/share/init?surl=${surl}`
        })
        .type('form')
        .send({ pwd: pan_code, vcode: '', vcode_str: '' });
    const baiduIdCookieArr = baiduIdCookieRes.header['set-cookie'];
    // console.log(baiduIdCookieRes.text, baiduIdCookieArr);
    if (!baiduIdCookieArr) {
        error('提交分享码失败！');
        nextSavePan();
        return;
    }
    baiduIdCookieArr.forEach(it => {
        baiduCookie += `${it.split(';')[0]};`;
    });

    const panRes = await superagent.get(pan_url).set('Cookie', baiduCookie);
    const shareid = panRes.text.match(/"shareid":(\S*),"sign/) && panRes.text.match(/"shareid":(\S*),"sign/)[1] || null;
    const fs_id = panRes.text.match(/"fs_id":(\S*),"isde/) && panRes.text.match(/"fs_id":(\S*),"isde/)[1] || null;
    const from = panRes.text.match(/"uk":(\S*),"task_key/) && panRes.text.match(/"uk":(\S*),"task_key/)[1] || null;
    if (!shareid || !fs_id || !from) {
        console.log(panRes.text);
        log('获取shareid、fs_id、from 失败, 进行下一个');
        nextSavePan();
        return;
    }
    // console.log(pan_url, bdstoken);
    // log(shareid);
    // log(fs_id);
    // log(from);
    // console.log(`https://pan.baidu.com/share/transfer?
    // shareid=${shareid}&from=${from}&ondup=newcopy&async=1&channel=chunlei&web=1
    // &app_id=250528&bdstoken=${bdstoken}
    // &logid=${logid}&clienttype=0`);
    // console.log(baiduCookie + baiduLoginCookie);
    const saveSourceRes = await superagent.post(`https://pan.baidu.com/share/transfer?shareid=${shareid}&from=${from}&ondup=newcopy&async=1&channel=chunlei&web=1&app_id=250528&bdstoken=${bdstoken}&logid=${getLogid()}&clienttype=0`)
        .set('Cookie', baiduCookie + baiduLoginCookie)
        .set({
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Host': 'pan.baidu.com',
            'Origin': 'https://pan.baidu.com',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36',
            'Referer': `${pan_url}`
        })
        .type('form')
        .send({ fsidlist: `[${fs_id}]`, path: '/make-money' })
    const saveSourceData = JSON.parse(saveSourceRes.text);
    if (saveSourceData.errno === 0) {
        const fidListRes = await superagent.get(`https://pan.baidu.com/api/list?dir=%2Fmake-money&bdstoken=${bdstoken}&logid=MTU4Nzg3MTU0NDIxNzAuODg2NDkxNzAxNDQyODk2NA==&num=100&order=time&desc=1&clienttype=0&showempty=0&web=1&page=1&channel=chunlei&web=1&app_id=250528`)
            .set('Cookie', baiduCookie + baiduLoginCookie)
            .set({
                'Host': 'pan.baidu.com',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36'
            });
        const fidList = JSON.parse(fidListRes.text);
        const pwd = makePrivatePassword();
        if (fidList.errno === 0) {
            // console.log(fidList.list);
            const linkRes = await superagent.post(`https://pan.baidu.com/share/set?channel=chunlei&clienttype=0&web=1&channel=chunlei&web=1&app_id=250528&bdstoken=${bdstoken}&logid=MTU4Nzg2NjMxNzI2MDAuODQ2OTAyNTAzODMyMzU3Mg==&clienttype=0`)
                .type('form')
                .send({
                    schannel: 4,
                    pwd: pwd,
                    channel_list: '[]',
                    fid_list: `[${fidList.list[0].fs_id}]`,
                    period: 0
                })
                .set('Cookie', baiduCookie + baiduLoginCookie)
                .set({
                    'Host': 'pan.baidu.com',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36'
                });
            const link = JSON.parse(linkRes.text);
            if (link.errno === 0) {
                const updateSql = `UPDATE pan_source SET is_pan=${1}, n_pan_url="${link.link}", n_pan_code="${pwd}" WHERE id='${id}'`;
                await sql.query(updateSql);
                success('保存网盘成功:' + pan_url);
            }
        }
    } else {
        error('转存失败,请重试');
    }
    nextSavePan();
}

function nextSavePan() {
    count++;
    setTimeout(saveBaiduPan, 20000);
}


