
import * as fs from 'fs';
import * as path from 'path';

import * as R from 'ramda';

import config from './hooks/filters/config';
import dotfile from './hooks/filters/dotfile';
import logger from './logger';
import { TenkiFile } from './types/tenki';

const readTenkiFile = async (
  root: string,
  relativePath: string = '.',
  stats?: fs.Stats | fs.Dirent,
): Promise<TenkiFile | null> => {

  logger.verbose(`Reading '${relativePath}'...`);

  const absolutePath = path.resolve(root, relativePath);

  if (stats == null) {
    logger.debug(`'${relativePath}' provided no stats, read stats.`);
    stats = fs.statSync(absolutePath);
  }

  const base = {
    name: path.basename(absolutePath),
    path: relativePath,
  };

  if (stats.isFile()) {

    logger.verbose('...as a file.');

    // TODO: read file?

    return {
      ...base,
      type: 'regular',
    };

  } else if (stats.isDirectory()) {

    logger.verbose('...is a directory.');

    const file: TenkiFile = {
      ...base,
      type: 'directory',
      subdirectories: [],
      subfiles: [],
    };

    type Filter = (path: string, name: string, dirent: fs.Dirent) => boolean;

    const mkFilter =
      (fn: Filter) =>
        R.filter<fs.Dirent, 'array'>(
          (drt) => fn(path.join(relativePath, drt.name), drt.name, drt),
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

    const list = filter(fs.readdirSync(absolutePath, {
      withFileTypes: true,
    }));

    // add subfiles and subdirectories
    await Promise.all(R.map(async (dirent) => {
      const sub = await readTenkiFile(
        root,
        path.join(relativePath, dirent.name),
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

    return file;

  } // if isDirectory()

  logger.verbose('...is neither a file nor a directory.');

  return null;

}; // readTenkiFile

const writeTenkiFile = async (
  root: string,
  file: TenkiFile,
) => {

  logger.verbose(`Writing '${file.name}'...`);

  const absolutePath = path.resolve(root, file.path);

  logger.verbose(`...to '${absolutePath}'`);

  if (file.type === 'regular') {

    logger.verbose('...as a regular file...');

    // TODO: write file

  } else if (file.type === 'directory') {

    logger.verbose('...as a directory...');

    fs.mkdirSync(path.join(root, file.path));

    const write = writeTenkiFile.bind(null, root);

    await Promise.all(R.map(write, file.subdirectories));

    await Promise.all(R.map(write, file.subfiles));

  } else { /** Unreachable */ }

  logger.verbose(`...done with ${file.name}`);

}; // writeTenkiFile

const build = async ({
  verbose = false,
  debug = false,
  src = '.',
  dest = '_site',
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

  /** Reading Src */

  const absoluteSrc = path.resolve(src);

  const srcRoot = await readTenkiFile(absoluteSrc);

  // type guard
  if (srcRoot == null || srcRoot.type === 'regular') {
    logger.error('Unknown Error!');
    throw new Error();
  }

  /** Processing */

  // TODO: process files
  const destRoot = srcRoot;

  /** Writing Dest */

  const absoluteDest = path.resolve(dest);

  await writeTenkiFile(absoluteDest, destRoot);

};

export default build;
