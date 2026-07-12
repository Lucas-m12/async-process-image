export const extractFileInfo = (filePath: string) => {
  const pathParts = filePath.split('/');
  const fullFilename = pathParts.pop() ?? '';
  const filenameParts = fullFilename.split('.');
  const extension = filenameParts.length > 1 ? filenameParts.pop() ?? '' : '';
  return {
    path: pathParts.join('/'),
    filename: filenameParts.join('.'),
    extension,
  }
}
