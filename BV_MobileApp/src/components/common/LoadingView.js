import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';

export default function LoadingView({ color = Colors.rose }) {
  return (
    <View style={s.container}>
      <ActivityIndicator size="large" color={color} />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.ivory,
  },
});
