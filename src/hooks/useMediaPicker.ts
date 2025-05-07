import { useActionSheet } from '@expo/react-native-action-sheet';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
import { DocumentMimeType, ImageMimeType, MediaPickerConfig } from '../types';

export type DocumentPickerResult = {
  uri: string;
  fileName?: string | null;
  type?: string;
  base64?: string | null;
};

export type ImagePickerResult = {
  base64?: string | null;
  uri: string;
  fileName?: string | null;
  width?: number;
  height?: number;
  type?: string;
};

export const useMediaPicker = (config: MediaPickerConfig) => {
  const { showActionSheetWithOptions } = useActionSheet();

  const _ensurePermission = async (
    checkFn: () => Promise<{ status: string; canAskAgain: boolean }>,
    requestFn: () => Promise<{ status: string }>,
    fallbackToSettings = true
  ): Promise<boolean> => {
    const { status, canAskAgain } = await checkFn();

    if (status === 'granted') return true;

    if (canAskAgain) {
      const { status: newStatus } = await requestFn();
      return newStatus === 'granted';
    }

    if (fallbackToSettings) await Linking.openSettings();
    return false;
  };

  const pickImage = async (
    mediaConfig?: MediaPickerConfig
  ): Promise<ImagePickerResult[] | null> => {
    const finalConfig = mediaConfig || config;

    await _ensurePermission(
      ImagePicker.getMediaLibraryPermissionsAsync,
      ImagePicker.requestMediaLibraryPermissionsAsync
    );

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      orderedSelection: true,
      selectionLimit: finalConfig.numberOfItems ?? 1,
      base64: true,
    });

    if (!result.assets) return null;

    // If specific types are passed, filter based on file extension
    if (Array.isArray(finalConfig.image) && finalConfig.image.length > 0) {
      return result.assets.filter((asset) => {
        return (finalConfig.image as ImageMimeType[]).includes(asset.type as ImageMimeType);
      });
    }

    return result.assets;
  };

  const takePhoto = async (
    mediaConfig?: MediaPickerConfig
  ): Promise<ImagePickerResult[] | null> => {
    const finalConfig = mediaConfig || config;
    await _ensurePermission(
      ImagePicker.getCameraPermissionsAsync,
      ImagePicker.requestCameraPermissionsAsync
    );

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
    });

    return result.assets ?? null;
  };

  const pickDocument = async (
    mediaConfig?: MediaPickerConfig
  ): Promise<DocumentPickerResult[] | null> => {
    const finalConfig = mediaConfig || config;

    const docType =
      finalConfig.document === 'ANY'
        ? '*/*'
        : Array.isArray(finalConfig.document) && finalConfig.document.length > 0
          ? finalConfig.document
          : undefined;

    // TODO
    // await _ensurePermission(
    //   DocumentPicker.getDocumentAsync,
    //   ImagePicker.requestMediaLibraryPermissionsAsync
    // );

    const result = await DocumentPicker.getDocumentAsync({
      type: docType,
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.assets && result.assets.length > 0) {
      const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return [
        {
          uri: result.assets[0].uri,
          fileName: result.assets[0].name,
          type: result.assets[0].mimeType,
          base64,
        },
      ];
    }

    return null;
  };

  const openMediaPickerSheet = async (
    onResult: (assets: DocumentPickerResult[] | ImagePickerResult[]) => void,
    mediaConfig?: MediaPickerConfig
  ) => {
    const finalConfig = mediaConfig || config;
    const options: string[] = [];
    const handlers: (() => Promise<DocumentPickerResult[] | null>)[] = [];

    if (finalConfig.image) {
      options.push('Choose Image');
      handlers.push(() => pickImage(finalConfig));

      options.push('Take Photo');
      handlers.push(() => takePhoto(finalConfig));
    }

    if (finalConfig.document) {
      options.push('Upload Document');
      handlers.push(() => pickDocument(finalConfig));
    }

    options.push('Cancel');
    const cancelButtonIndex = options.length - 1;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        useModal: true,
      },
      async (buttonIndex) => {
        if (buttonIndex === undefined || buttonIndex >= handlers.length) return;

        console.log('buttonIndex', buttonIndex);

        const result = await handlers[buttonIndex]();
        if (result && result.length > 0) {
          onResult(result);
        }
      }
    );
  };

  const handleWebFilePick = async (
    onResult: (assets: DocumentPickerResult[] | ImagePickerResult[]) => void,
    mediaConfig?: MediaPickerConfig
  ) => {
    const finalConfig = mediaConfig || config;
    const input = document.createElement('input');
    input.type = 'file';

    const acceptTypes = [
      ...(Array.isArray(finalConfig.image)
        ? finalConfig.image
        : finalConfig.image === 'ANY'
          ? ['image/*']
          : []),
      ...(Array.isArray(finalConfig.document)
        ? finalConfig.document
        : finalConfig.document === 'ANY'
          ? ['.pdf', '.docx', '.xlsx']
          : []),
    ];

    if (acceptTypes.length > 0) {
      input.accept = acceptTypes.join(',');
    }

    input.onchange = async () => {
      if (!input.files || input.files.length === 0) return;

      const file = input.files[0];
      const reader = new FileReader();

      reader.onloadend = () => {
        onResult([
          {
            uri: URL.createObjectURL(file),
            fileName: file.name,
            type: file.type,
            base64: (reader.result as string)?.split(',')[1],
          },
        ]);
      };

      reader.readAsDataURL(file);
    };

    input.click();
  };

  return {
    pickImage,
    takePhoto,
    pickDocument,
    openMediaPickerSheet,
    handleWebFilePick,
  };
};

// hello
