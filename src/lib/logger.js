import chalk from 'chalk';

class Logger {
  log(...params) {
    if (this.shouldLog()) {
      console.log(chalk.bold.white(...params));
    }
  }

  header(...params) {
    if (this.shouldLog()) {
      console.log(chalk.bold.blue(...params));
    }
  }

  error(...params) {
    if (this.shouldLog()) {
      console.log(chalk.bold.red(...params));
    }
  }

  connection(...params) {
    if (this.shouldLog()) {
      console.log(chalk.bold.yellow(...params));
    }
  }

  success(...params) {
    if (this.shouldLog()) {
      console.log(chalk.bold.green(...params));
    }
  }

  shouldLog() {
    return process.env.NODE_HIDE_LOG === undefined;
  }
}

export default new Logger();
