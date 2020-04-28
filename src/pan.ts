// import * as url from 'url';
// import * as https from 'https';
import * as superagent from 'superagent';
import sql from './mysql';
import * as async from 'async';
import { error, log, warning } from './utils/logs';
import { savePan } from './savepan';

//export default function getPanKey(link) {
//     return  new Promise((resolve, reject) => {
//         if (!/https?:\/\/pan\.baidu\.com\/s\/1([a-zA-Z0-9_\-]{5,22})/gi.exec(link) && !/https?:\/\/pan\.baidu\.com\/share\/init\?surl=([a-zA-Z0-9_\-]{5,22})/gi.exec(link)) {
//             resolve({messages: "参数不合法", status: false});
//         }
//         const api = 'https://node.pnote.net/public/pan?url=' + link;
//         //  合并对象
//         const param = Object.assign({"method": "GET"}, url.parse(api));
//         const req = https.request(param,  (res) => {
//             const chunks = [];
//             res.on("data",  (chunk) => {
//                 chunks.push(chunk);
//             });
//             res.on("end",  () => {
//                 const body = Buffer.concat(chunks).toString();
//                 resolve(JSON.parse(body));
//             });
//         });
//         req.on('error', (e) => {
//             reject(e);
//         });
//         req.end();
//     });
// }


async function getPanCode(option, callBack) {
    const { id, upload_url } = option;
    const querySql = `SELECT * FROM pan_source WHERE pan_url = '${upload_url}';`;
    const queryRes = await sql.query(querySql);
    if (queryRes && queryRes.length) {
        warning(upload_url + '存在提取码');
        callBack(null);
        return;
    }
    const startTime = new Date().getTime();
    const result = await superagent.post('http://tools.iknowyouask.com/pancode.do')
        .set('Cookie', 'Hm_lvt_f4b2b31ccf4086b94076fb26d81aadff=1587455995; Hm_lpvt_f4b2b31ccf4086b94076fb26d81aadff=1587455995')
        .set({
            'Accept': '*/*',
            'Host': 'tools.iknowyouask.com',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36',
            'Referer': 'http://tools.iknowyouask.com/pancode/'
        })
        .type('form').send({ url: upload_url });
    const resCode = JSON.parse(result.text);
    if (resCode.code === '0000' && resCode.result) {
        await saveCode({ cId: id, panCode: resCode.result.code, panUrl: upload_url });
        setTimeout(callBack, 1000, null);
        log('成功耗时:' + (new Date().getTime() - startTime) + '毫秒' + ' ' + upload_url);
        return;
    }
    setTimeout(callBack, 1000, null);
    error('error--耗时:' + (new Date().getTime() - startTime) + '毫秒' + ' ' + upload_url);

}
async function saveCode(res) {
    const { cId, panCode, panUrl } = res;
    const querySql = `SELECT * FROM pan_source WHERE c_id IN (${cId})`;
    const queryRes = await sql.query(querySql);
    if (queryRes && queryRes.length) {
        if (queryRes[0].pan_code !== 'null') {
            warning(panUrl + '存在提取码');
            return;
        }
        const updateSql = `UPDATE pan_source SET
            pan_url="${panUrl}", pan_code="${panCode}"
            WHERE c_id='${cId}'`;
        const updateRes = await sql.query(updateSql);
        log(cId + ':' + '更新成功');
        return;
    }
    // 存储数据库
    const insertSql = `INSERT INTO pan_source(
             c_id, pan_code, pan_url
            )
            VALUES(
                "${cId}", "${panCode}","${panUrl}"
            )`;
    await sql.query(insertSql);
    log(cId + ':' + '插入成功');
}
export async function initPanSource() {
    const querySql = `SELECT id, upload_url FROM content_table where upload_url != 'null'`;
    // const querySql = `SELECT * FROM pan_source where pan_code = 'null'`;
    const queryRes = await sql.query(querySql);
    if (queryRes.length) {
        async.mapLimit(queryRes, 3, getPanCode.bind(this), (err,result) => {
            if (err) {
                error(err);
            }
            if (result.length === queryRes.length) {
                savePan();
            }
        })
    }
}



