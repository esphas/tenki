
export interface TenkiFile<Type> {
  type: Type;
  name: string;
  path: string;
  subfiles: TenkiFile<'regular'>[];
  subdirectories: TenkiFile<'directory'>[];
}
