import { ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AlertButton,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  captureWithCamera,
  pickFromLibrary,
} from '@/services/imagePicker';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/layout';

type Props = {
  uri?: string | null;
  onChange: (uri: string | null) => void;
  variant?: 'banner' | 'avatar';
  /** Diâmetro usado quando variant === 'avatar'. */
  size?: number;
  /** Conteúdo exibido no avatar quando ainda não há foto (ex.: iniciais). */
  fallback?: ReactNode;
};

export default function ImagePickerField({
  uri,
  onChange,
  variant = 'banner',
  size = 96,
  fallback,
}: Props) {
  const [busy, setBusy] = useState(false);

  async function runPicker(picker: () => Promise<string | null>) {
    setBusy(true);
    try {
      const newUri = await picker();
      if (newUri) onChange(newUri);
    } finally {
      setBusy(false);
    }
  }

  function openMenu() {
    if (busy) return;

    const buttons: AlertButton[] = [
      { text: 'Câmera', onPress: () => void runPicker(captureWithCamera) },
      { text: 'Galeria', onPress: () => void runPicker(pickFromLibrary) },
    ];

    if (uri) {
      buttons.push({
        text: 'Remover',
        style: 'destructive',
        onPress: () => onChange(null),
      });
    }

    buttons.push({ text: 'Cancelar', style: 'cancel' });

    Alert.alert('Foto', 'Escolha de onde quer adicionar a imagem.', buttons);
  }

  if (variant === 'avatar') {
    return (
      <Pressable
        onPress={openMenu}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.fill} />
        ) : (
          fallback ?? (
            <Ionicons name="person" size={size * 0.42} color={colors.surface} />
          )
        )}

        <View style={styles.cameraBadge}>
          {busy ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Ionicons name="camera" size={15} color={colors.surface} />
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={openMenu} style={styles.banner}>
      {uri ? (
        <Image source={{ uri }} style={styles.fill} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="camera-outline" size={28} color={colors.textSecondary} />
          <Text style={styles.placeholderText}>Adicionar foto</Text>
        </View>
      )}

      {uri ? (
        <View style={styles.editHint}>
          <Ionicons name="pencil" size={13} color={colors.surface} />
        </View>
      ) : null}

      {busy ? (
        <View style={styles.overlay}>
          <ActivityIndicator color={colors.surface} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: {
    width: '100%',
    height: '100%',
  },
  avatar: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  banner: {
    height: 168,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  placeholderText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  editHint: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(47, 42, 51, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(47, 42, 51, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
