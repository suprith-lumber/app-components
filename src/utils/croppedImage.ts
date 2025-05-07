import { Platform } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import ImageEditor from '@react-native-community/image-editor';

export const getCroppedImage = async (
  uri: string,
  // TODO: add type
  options?: any
): Promise<string | null> => {
  try {
    // ✅ Wait for 500ms before opening cropper (with a promise)
    await new Promise((resolve) => setTimeout(resolve, 500));

    const croppedImage = await ImagePicker.openCropper({
      path: uri,
      mediaType: 'photo',
      ...options,
      // android
      cropperActiveWidgetColor: '#1573FE',
      cropperToolbarTitle: 'Select Edited Image',
      // ios
      cropperChooseColor: '#1573FE',
      cropperCancelColor: '#F04438',
    });

    if (Platform.OS === 'ios' && croppedImage.cropRect) {
      const { x, y, width, height } = croppedImage.cropRect;
      const cropData = {
        offset: { x, y },
        size: { width, height },
      };
      const result = await ImageEditor.cropImage(uri, cropData);
      return result.uri;
    }

    return croppedImage.path;
  } catch (error) {
    if ((error as any)?.code === 'E_PICKER_CANCELLED') {
      return null;
    }
    throw new Error(`Image cropping failed: ${(error as Error).message}`);
  }
};

// temp commit
