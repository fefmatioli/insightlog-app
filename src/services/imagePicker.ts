import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';

const imagesDir = new Directory(Paths.document, 'images');

function ensureImagesDir() {
  if (!imagesDir.exists) {
    imagesDir.create({ intermediates: true });
  }
}

/**
 * Copia a imagem escolhida para o diretório do app, garantindo que ela
 * sobreviva à limpeza de cache do sistema. Retorna o URI persistente.
 */
function persistImage(sourceUri: string): string {
  ensureImagesDir();
  const source = new File(sourceUri);
  const extension = source.extension || '.jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`;
  const destination = new File(imagesDir, filename);
  source.copy(destination);
  return destination.uri;
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
export function deleteStoredImage(uri?: string | null) {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Falhas de limpeza não devem interromper o fluxo do app.
  }
}
