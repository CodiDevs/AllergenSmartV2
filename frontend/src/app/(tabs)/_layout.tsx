import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Svg, { Path, Polyline, Rect, Line, Circle } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';

interface CustomTabButtonProps {
  label: string;
  selected: boolean;
  onPress?: (e: any) => void;
  icon: (color: string) => React.ReactNode;
}

function CustomTabButton({ label, selected, onPress, icon }: CustomTabButtonProps) {
  const activeColor = Colors.primary;
  const inactiveColor = Colors.textQuaternary;
  const textColor = selected ? activeColor : inactiveColor;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.tabButtonContainer}
    >
      <View style={[styles.tabButton, selected && styles.tabButtonActive]}>
        {icon(textColor)}
        <Text style={[styles.tabLabel, { color: textColor }]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarButton: (props) => (
            <CustomTabButton
              label="Inicio"
              selected={props.accessibilityState?.selected ?? false}
              onPress={props.onPress ?? (() => {})}
              icon={(color) => (
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <Polyline points="9 22 9 12 15 12 15 22" />
                </Svg>
              )}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Escanear',
          tabBarButton: (props) => (
            <CustomTabButton
              label="Escanear"
              selected={props.accessibilityState?.selected ?? false}
              onPress={props.onPress ?? (() => {})}
              icon={(color) => (
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Rect x="2" y="6" width="6" height="6" rx="1" />
                  <Rect x="16" y="6" width="6" height="6" rx="1" />
                  <Rect x="2" y="16" width="6" height="6" rx="1" />
                  <Path d="M16 16h2v2h2v2M20 16h2M16 20v2" />
                </Svg>
              )}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favoritos',
          tabBarButton: (props) => (
            <CustomTabButton
              label="Favoritos"
              selected={props.accessibilityState?.selected ?? false}
              onPress={props.onPress ?? (() => {})}
              icon={(color) => (
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M20 12V22H4V12" />
                  <Path d="M22 7H2v5h20V7z" />
                  <Path d="M12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
                </Svg>
              )}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historial',
          tabBarButton: (props) => (
            <CustomTabButton
              label="Historial"
              selected={props.accessibilityState?.selected ?? false}
              onPress={props.onPress ?? (() => {})}
              icon={(color) => (
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <Polyline points="14 2 14 8 20 8" />
                  <Line x1="16" y1="13" x2="8" y2="13" />
                  <Line x1="16" y1="17" x2="8" y2="17" />
                </Svg>
              )}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarButton: (props) => (
            <CustomTabButton
              label="Perfil"
              selected={props.accessibilityState?.selected ?? false}
              onPress={props.onPress ?? (() => {})}
              icon={(color) => (
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <Circle cx="12" cy="7" r="4" />
                </Svg>
              )}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8ECF5',
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 8,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    elevation: 8,
    shadowColor: '#1A2340',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 10,
  },
  tabButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: '#EEF3FF',
  },
  tabLabel: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 9,
    fontWeight: '700',
  },
});
