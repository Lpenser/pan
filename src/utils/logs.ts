import * as chalk from 'chalk';
export function error(info: string) {
    console.log(chalk.red(info));
}
export function warning(message: string) {
    console.warn(chalk.yellow(`${message}`));
}
export function log(info: string) {
    console.log(chalk.blue(info));
}
export function success(info: string) {
    console.log(chalk.rgb(82,196,26)(info));
}

