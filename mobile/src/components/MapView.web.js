import React from 'react';
import { View } from 'react-native';

// Mock komponen react-native-maps khusus untuk Web agar bundler Metro tidak error
export default function MapView({ children, style }) {
  return <View style={style}>{children}</View>;
}

export const Marker = ({ children }) => <View>{children}</View>;
export const Callout = ({ children }) => <View>{children}</View>;
