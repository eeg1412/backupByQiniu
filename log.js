const chalk = require('chalk');

module.exports = {
    info: (...args) => console.log(chalk.cyan(...args)),
    warning: (...args) => console.log(chalk.yellow(...args)),
    error: (...args) => console.log(chalk.red(...args))
};