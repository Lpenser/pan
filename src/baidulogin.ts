import * as superagent from 'superagent';
import analytic from './analytic';
const NodeRSA = require('node-rsa');

let gid, callback, token, pubkey, key, traceid;
let panCookie = '';


function getBaiDuCookie() {
    (async () => {
        try {
            // 测试百度接口
            //    const res =  await superagent.post('https://pan.baidu.com/share/verify?surl=cGnYIiKexe5X9_zWoaYRzA&t=1586397242222')
            //         .set('Cookie', 'PANWEB=1; BAIDUID=F77A4D8FE2EA6CDBB2820FFE21F54B6D:FG=1; Hm_lvt_7a3960b6f067eb0085b7f96ff5e660b0=1586351647; Hm_lpvt_7a3960b6f067eb0085b7f96ff5e660b0=1586351947; BIDUPSID=F77A4D8FE2EA6CDBB2820FFE21F54B6D; PSTM=1586352175; H_PS_PSSID=30972_1432_31122_21082_31186_30823_26350_31163_22160; delPer=0; PSINO=1; BDORZ=B490B5EBF6F3CD402E515D22BCDA1598; PANWEB=1; BAIDUID=723EF5C49F30D658CA31238C713C1FCE:FG=1; BDORZ=B490B5EBF6F3CD402E515D22BCDA1598; BIDUPSID=723EF5C49F30D658CA31238C713C1FCE; PSTM=1586394254; ZD_ENTRY=baidu; delPer=0; PSINO=3; BDUSS=294cmJvWkJpZ0xQbzlQaH5RTHhyWGFRWURwYjg2blI3NE5aa3YteEdNRlFDN1plSVFBQUFBJCQAAAAAAAAAAAEAAACLGto-Y2hhb3NlbWUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFB-jl5Qfo5ed; STOKEN=4c72a3810027d48178dbb75461d473703c217b27439f0a11f981674e8cdfdeb7; SCRC=6f77c046347e63237d9c7357af5a5b6c; H_PS_PSSID=30973_1446_31169_21080_31253_31187_31051_30823_31163_31196; PANPSC=10365388925777948880%3Arz3504DrAO4VkTQr%2FX4TgBby31e29g38PuZFBfVARssI5%2BB0eenXjyUf8E4M40Pj84gEdMg%2F6H6d1e8XZsxFcYl7IIUreBOuZP8wreJm86ihq8RWJA48DeEzL6yRI9KfX2XlUsKRi0awbthkud9n5a%2F6Ni0tMxHeQjQ1mFHTd8W55I5Cval%2Bkn1t8VXlRfZV; Hm_lvt_7a3960b6f067eb0085b7f96ff5e660b0=1586351647; Hm_lpvt_7a3960b6f067eb0085b7f96ff5e660b0=1586397222')
            //         .set('Referer', 'https://pan.baidu.com/share/init?surl=SRQW5HICjIOsMuuBHDq9gg')
            //         // .set('Host', 'pan.baidu.com')
            //         // .set('Origin', 'https://pan.baidu.com')
            //         .type('form').send('pwd=nqom&vcode=&vcode_str=')
            //         console.log(res.header);

            /**
             * 百度登录
             * gid
             * token
             */
            gid = (() => {
                return "xxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (e) => {
                    const t = 16 * Math.random() | 0, n = "x" === e ? t : 3 & t | 8;
                    return n.toString(16)
                }).toUpperCase()
            })();
            callback = (() => {
                return "bd__cbs__" + Math.floor(2147483648 * Math.random()).toString(36)
            })();
            traceid = (() => {
                const random = (new Date).getTime() + parseInt(90 * Math.random() + 10, 10).toString(),
                stringR = Number(random).toString(16),
                stringRLength = stringR.length;
                return stringR.slice(stringRLength - 6, stringRLength).toUpperCase() + '01';
            })();
            console.log(gid, callback);

            const panCookieRes = await superagent.get('https://pan.baidu.com/');
            const panCookieArr = panCookieRes.header['set-cookie'];
            if (panCookieArr.length) {
                panCookieArr.forEach(itm => {
                    panCookie += `${itm.split(';')[0]};`;
                });
            }
            // 获取 token
            global[callback] = (res) => {
                token = token ? token : res.data.token;
                pubkey = res.pubkey || null;
                key = res.key || null;
            }
            superagent.get(`https://passport.baidu.com/v2/api/?getapi&token=&gid=${gid}&tt=${new Date().getTime()}&apiver=v3&subpro=netdisk_web&tpl=netdisk&logintype=basicLogin&callback=${callback}`)
                .set('Cookie', panCookie)
                .set({
                    'Accept': '*/*',
                    'Connection': 'keep-alive',
                    'Host': 'passport.baidu.com',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:72.0) Gecko/20100101 Firefox/72.0',
                    'Referer': 'https://pan.baidu.com/'
                })
                .catch((err) => {
                    const tokenRes = err.rawResponse.replace(/'/g, '"');
                    // console.log(tokenRes);
                    eval(tokenRes);
                    getPubkey();
                });
        } catch (err) {
            if (err) {
                // 如果访问失败或者出错，会这行这里
                console.error(`百度登录失败 - ${err}`)
            }
        }
    })();
}


function getPubkey() {
    // 获取 pubkey
    superagent.get(`https://passport.baidu.com/v2/getpublickey`)
        .query({
            token,
            tpl: 'netdisk',
            subpro: 'netdisk_web',
            apiver: 'v3',
            tt: new Date().getTime(),
            gid,
            callback
        })
        .set('Cookie', panCookie)
        .set({
            'Accept': '*/*',
            'Connection': 'keep-alive',
            'Host': 'passport.baidu.com',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:72.0) Gecko/20100101 Firefox/72.0',
            'Referer': 'https://pan.baidu.com/'
        })
        .then(res => {
            eval(res.body.toString());
            // nYpnCFlZqC67SIPn5tKqep1V9JJzq/Vpoj9mxN3w+HNLzsm9UBHIOkbtTtQi5TTmdgXgsiZV1lyx+Q2kPdQhh8MRcZlVEnN76L2qsNZOtRceLAq6w+MTdsD05n9Hme9DFtz/W7WuRN60OFiFkRef1WgyH0VGO+vu7HZp638SlLc=
            loginBaiduPan();
        })
        .catch((err) => {
            console.log(err);
        });
}



function loginBaiduPan() {
    const publicKey = new NodeRSA(pubkey);
    const password = publicKey.encrypt('liu785156268', 'base64');
    superagent.post(`https://passport.baidu.com/v2/api/?login`)
        .type('form')
        .send({
            staticpage: 'https://pan.baidu.com/res/static/thirdparty/pass_v3_jump.html',
            charset: 'UTF-8',
            username: '785156268@qq.com',
            password,
            logintype: 'basicLogin',
            token,
            tpl: 'netdisk',
            subpro: 'netdisk_web',
            apiver: 'v3',
            tt: new Date().getTime(),
            gid,
            u: 'https://pan.baidu.com/disk/home',
            rsakey: key,
            callback: `parent.${callback}`,
            mem_pass: 'on',
            safeflg: '0',
            codestring: '',
            isPhone: 'false',
            detect: '1',
            quick_user: '0',
            logLoginType: 'pc_loginBasic',
            idc: '',
            loginmerge: 'true',
            mkey: '',
            crypttype: '12',
            loginversion: 'v4',
            supportdv: '1',
            countrycode: '',
            dv: 'tk0.381149525683357361587348253676@kkv0vkA10yokqTNR7TNmdgAxqwAwdgs-ddonb~NndTAGAgsGvW5mdgonb~NndTAGA~sxvWA10yokqTNR7TNmdgskIl5EdgsQddonb~NndTAGFzA1uWrv0pq5kIgokD-smd-A1Fgs-gWA1qlokDlAmd-skqxA-gW5GOxokAgA-dxAGDgs-gDFDb6D2usE~ZFD~hKsuZKNH7SIU7-DnuxBygVIU7TKq__zqq8wqxMAFRPhxviA-dxokB~GvnMnTdo1AzAGpy5GD-sGIzAxA~sxAlAGDzsxAy5k0~AxIwsO__ivj86CyB6Aco-ZdIHziIUueJ6DiIlZSo-g~NUC3JU3iJHF_uvgAGpbokD~okpx5kDTsxpzokpyskqT5Gqdokpx5kDTAGAzstdzsxB_',
            ppui_logintime: '',
            traceid,
        })
        .set('Cookie', panCookie)
        .set({
            'Accept': '*/*',
            'Connection': 'keep-alive',
            'Host': 'passport.baidu.com',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:72.0) Gecko/20100101 Firefox/72.0',
            'Referer': 'https://pan.baidu.com/'
        })
        .then(res => {
            const loginCookieArr = res.header['set-cookie'];
            if (loginCookieArr.length) {
                loginCookieArr.forEach(itm => {
                    panCookie += `${itm.split(';')[0]};`;
                });
                global['panCookie'] = panCookie;
                // global['isLoginPan'] = true;
            }
        })
        .catch(err => {
            console.error('登录失败：'+ err);
        })
}
export default getBaiDuCookie;