import * as express from 'express';
import {connection} from './src/mysql'
import init from './src/init'
import * as superagent from 'superagent';
import getBaiDuCookie from './src/baidulogin';
import { initPanSource } from './src/pan';
import { savePan } from './src/savepan';

const app = express(); // 用于声明服务器端所能提供的http服务
// 连接数据库
connection.connect((err) => {
    if (err) throw err;
    console.log('mysql连接成功');
});
// 声明一个处理get请求的服务
app.get('/', (req, resp) => {
    resp.send("Hello Express");
});

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});
process.on('uncaughtException',  (err) => {
    console.error(err.stack);
    console.log("Node NOT Exiting...");
});

init();


// initPanSource();
// setInterval(_ => {
//     initPanSource();
// }, 5 * 1000 * 60)

// savePan();
const server = app.listen(8080, "localhost", () => {
    console.log("服务器已启动, 地址是：http://localhost:8080");
});
server.on('error', (err) => {
    console.log(err);
});