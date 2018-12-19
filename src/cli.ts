
import yargs = require('yargs');

import build from './build';

const program = yargs

  .alias('V', 'version')
  .alias('h', 'help')

  .option('verbose', {
    alias: 'v',
    default: false,
    global: true,
  })

  .option('debug', {
    default: false,
    global: true,
  })

  .command({
    aliases: 'b',
    builder: (cmd) => {
      return cmd
        .positional('src', {
          default: '.',
          describe: 'source directory',
        })
        .option('dest', {
          alias: 'd',
          default: './_site',
          describe: 'destination directory',
        })
      ;
    },
    command: 'build [src]',
    handler: (argv) => {
      build(argv);
    },
  })

  .demandCommand()

;

export = () => program.argv;
