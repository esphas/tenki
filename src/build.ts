
import * as fs from 'fs';
import * as path from 'path';

import * as R from 'ramda';

import config from './hooks/filters/config';
import dotfile from './hooks/filters/dotfile';
import logger from './logger';
import { TenkiFile } from './types/tenki';

const readTenkiFile = async (
  root: string,
  filepath: string,
  name: string,
  stats?: fs.Stats | fs.Dirent,
): Promise<TenkiFile<'regular'> | TenkiFile<'directory'> | null> => {

  if (stats == null) {
    logger.debug(`'${filepath}' provided no stats, read stats.`);
    stats = fs.statSync(path.join(root, filepath));
  }

  logger.verbose(`Processing '${filepath}'...`);

  const file: TenkiFile<'regular' | 'directory'> = {
    name,
    path: filepath,
    subdirectories: [],
    subfiles: [],
    type: 'regular',
  };

  if (stats.isFile()) {

    logger.verbose('...is a file.');

    return file as TenkiFile<'regular'>;

  } else if (stats.isDirectory()) {

    logger.verbose('...is a directory.');

    file.type = 'directory';

    type Filter = (path: string, name: string, dirent: fs.Dirent) => boolean;

    const mkFilter =
      (fn: Filter) =>
        R.filter<fs.Dirent, 'array'>(
          (dirent) => fn(path.join(filepath, dirent.name), dirent.name, dirent),
        );

    // list of filters
    const filters: Filter[] = [
      dotfile,
      config,
    ];

    // upstream(@types/ramda): see github:types/npm-ramda issue #414
    const filter: (list: fs.Dirent[]) => fs.Dirent[] = (R.pipe as any)(
      ...R.map(mkFilter, filters),
    );

    const list = filter(fs.readdirSync(path.join(root, filepath), {
      withFileTypes: true,
    }));

    // add subfiles and subdirectories
    await Promise.all(R.map(async (dirent) => {
      const sub = await readTenkiFile(
        root,
        path.join(filepath, dirent.name),
        dirent.name,
        dirent,
      );
      if (sub == null) {
        return;
      } else if (sub.type === 'regular') {

        file.subfiles.push(sub);

      } else if (sub.type === 'directory') {

        file.subdirectories.push(sub);

      } else { /** Unreachable */ }
    }, list));

    // sort
    file.subfiles = R.sortBy(R.prop('name'), file.subfiles);
    file.subdirectories = R.sortBy(R.prop('name'), file.subdirectories);

    return file as TenkiFile<'directory'>;

  } // if isDirectory()

  logger.verbose('...is neither a file nor a directory.');

  return null;

}; // readTenkiFile

const build = async ({
  verbose = false,
  debug = false,
  src = '.',
} = {}) => {

  /** Global Configs */

  if (verbose) {
    logger.level = 'verbose';
  }

  if (debug) {
    logger.level = 'debug';
  }

  /** Command Specific */

  if (!fs.existsSync(src)) {
    logger.error('Specified src path must exist!');
    throw new Error();
  }

  if (!fs.statSync(src).isDirectory()) {
    logger.error('Specified src path must be a directory!');
    throw new Error();
  }

  const absolute = path.resolve(src);

  const root = await readTenkiFile(absolute, '.', path.basename(absolute));

  // type guard
  if (root == null || root.type === 'regular') {
    logger.error('Unknown Error!');
    throw new Error();
  }

  // TODO: process files

  // TODO: write files

};

export default build;
