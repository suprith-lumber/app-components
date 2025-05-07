export type ImageMimeType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/gif'
  | 'image/bmp'
  | 'image/svg+xml';

export type DocumentMimeType =
  | 'application/pdf' // PDF
  | 'application/msword' // .doc (Microsoft Word 97-2003)
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx (Microsoft Word)
  | 'application/vnd.ms-excel' // .xls (Excel 97-2003)
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx (Excel)
  | 'application/vnd.ms-powerpoint' // .ppt (PowerPoint 97-2003)
  | 'application/vnd.openxmlformats-officedocument.presentationml.presentation' // .pptx (PowerPoint)
  | 'text/plain' // .txt
  | 'application/rtf' // .rtf
  | 'application/json' // .json
  | 'application/zip' // .zip files
  | 'application/x-rar-compressed'; // .rar files

export type MediaPickerConfig = {
  image?: 'ANY' | undefined | ImageMimeType[];
  document?: 'ANY' | undefined | DocumentMimeType[]; // MIME types
  cropImage?: boolean; // for image
  documentToCroppedImage?: boolean; // for document
  numberOfItems?: number; // number of items to be selected
};
