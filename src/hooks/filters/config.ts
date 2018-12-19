
import * as minimatch from 'minimatch';

const isNotEmpty = (list?: string[]): list is string[] =>
  list != null && list.length !== 0;

const isIn = (path: string, list: string[]) =>
  list.some((pattern) => minimatch(path, pattern));

/**
 * include: must include
 * exclude: must exclude, overrides include
 * files: must include, overrides exclude
 */
const config: {
  include?: string[];
  exclude?: string[];
  files?: string[];
} = {};

/**
 * Default exclude
 */
const defaultExclude = [
  '**/node_modules',
];

// TODO: read config

if (!isNotEmpty(config.exclude)) {
  config.exclude = defaultExclude;
}

export default (path: string) => {
  if (isNotEmpty(config.files)) {
    if (isIn(path, config.files)) {
      return true;
    }
  }
  if (isNotEmpty(config.exclude)) {
    if (isIn(path, config.exclude)) {
      return false;
    }
  }
  if (isNotEmpty(config.include)) {
    if (!isIn(path, config.include)) {
      return false;
    }
  }
  return true;
};
