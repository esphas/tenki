
interface TenkiFileBase {
  type: string;
  name: string;
  path: string;
}

interface TenkiFileRegular extends TenkiFileBase {
  type: 'regular';
}

interface TenkiFileDirectory extends TenkiFileBase {
  type: 'directory';
  subdirectories: TenkiFileDirectory[];
  subfiles: TenkiFileRegular[];
}

export type TenkiFile = TenkiFileRegular | TenkiFileDirectory;
