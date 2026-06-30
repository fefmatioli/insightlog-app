import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

const imagesDir = FileSystem.documentDirectory + 'images/';

async function ensureImagesDir() {
  const info = await FileSystem.getInfoAsync(imagesDir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(imagesDir, { intermediates: true });
  }
}

/**
 * Copia a imagem escolhida para o diretório do app, garantindo que ela
 * sobreviva à limpeza de cache do sistema. Se a cópia falhar por qualquer
 * motivo, retorna o URI original em vez de quebrar o fluxo da câmera/galeria.
 */
async function persistImage(sourceUri: string): Promise<string> {
  try {
    await ensureImagesDir();
    const rawExt = sourceUri.split('.').pop()?.split('?')[0];
    const extension = rawExt && rawExt.length <= 5 ? rawExt : 'jpg';
    const filename = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${extension}`;
    const destination = imagesDir + filename;
    await FileSystem.copyAsync({ from: sourceUri, to: destination });
    return destination;
  } catch (error) {
    console.warn(
      'Não foi possível salvar a imagem no app; usando o arquivo original.',
      error
    );
    return sourceUri;
  }
}

const pickerOptions: ImagePicker.ImagePickerOptions = {
  allowsEditing: true,
  quality: 0.6,
};

export async function captureWithCamera(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      'Permissão necessária',
      'Permita o acesso à câmera para tirar uma foto.'
    );
    return null;
  }

  const result = await ImagePicker.launchCameraAsync(pickerOptions);
  if (result.canceled || !result.assets[0]) return null;

  return persistImage(result.assets[0].uri);
}

export async function pickFromLibrary(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      'Permissão necessária',
      'Permita o acesso à galeria para escolher uma imagem.'
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
  if (result.canceled || !result.assets[0]) return null;

  return persistImage(result.assets[0].uri);
}

/**
 * Remove um arquivo de imagem salvo localmente. Usado ao excluir uma
 * atividade para não deixar imagens órfãs ocupando espaço.
 */
export async function deleteStoredImage(uri?: string | null) {
  if (!uri || !uri.startsWith(imagesDir)) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Falhas de limpeza não devem interromper o fluxo do app.
  }
}
