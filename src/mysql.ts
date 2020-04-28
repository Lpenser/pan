import * as mysql from 'mysql';
const sql = {
    query: null
};
export const connection = mysql.createConnection({
    // 主机地址 （默认：localhost）
    host: 'localhost',
    // 用户名
    user: 'root',
    // 密码
    password: 'liu785156268',
    // 在mysql中创建的数据库名
    database: 'earn_data'
});


sql.query = (sql, value?: any[]) =>  {
    return new Promise((resu, rej) => {
        connection.query(sql, value, (err, res) => {
            if (err) {
              console.error('[SELECT ERROR] - ', err);
              rej(err);
            }
            resu(res);
        });
    })
}
export default sql;