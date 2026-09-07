import { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, fontFamily } from '../theme/theme';

function initialsOf(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '');
  return letters.join('') || '?';
}

export default function Avatar({
  name,
  uri,
  size = 28,
  color = colors.primary,
  background = colors.primary50,
  style,
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(uri) && !failed;

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background, borderColor: color },
        style,
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri }}
          onError={() => setFailed(true)}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.4, color }]}>{initialsOf(name)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  initials: {
    fontFamily: fontFamily.semiBold,
  },
});
