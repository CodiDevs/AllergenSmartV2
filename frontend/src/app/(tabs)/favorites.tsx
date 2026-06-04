import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';
import { useAppStore, FavoriteItem } from '@/store/appStore';
import { AlergiMascot } from '@/components/ui/AlergiMascot';

type CategoryFilter = 'Todos' | 'Sin gluten' | 'Sin lácteos' | 'Cereales';

export default function FavoritesTab() {
  const router = useRouter();
  const { favorites, removeFavorite } = useAppStore();
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('Todos');

  const categories: CategoryFilter[] = ['Todos', 'Sin gluten', 'Sin lácteos', 'Cereales'];

  // Filter items
  const filteredFavorites = favorites.filter((item) => {
    if (activeFilter === 'Todos') return true;
    return item.category.toLowerCase().includes(activeFilter.toLowerCase()) || 
           item.name.toLowerCase().includes(activeFilter.toLowerCase());
  });

  const getFavoriteIcon = (type: string, color: string) => {
    switch (type) {
      case 'sprout':
        return (
          <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
            <Path d="M12 3c-1 3-4 5-4 8a4 4 0 008 0c0-3-3-5-4-8z" />
          </Svg>
        );
      case 'lock':
        return (
          <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
            <Rect x="3" y="11" width="18" height="10" rx="2" />
            <Path d="M7 11V7a5 5 0 0110 0v4" />
          </Svg>
        );
      case 'circle':
        return (
          <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
            <Circle cx="12" cy="12" r="8" />
            <Path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4" />
          </Svg>
        );
      case 'menu':
      default:
        return (
          <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
            <Path d="M4 19h16M4 5h16M4 12h16" />
          </Svg>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Navigation */}
        <View style={styles.topnav}>
          <View>
            <Text style={styles.topnavTitle}>Favoritos</Text>
            <Text style={styles.topnavSub}>{favorites.length} productos guardados</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} accessibilityLabel="Buscar favoritos">
            <Svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth="2" strokeLinecap="round">
              <Circle cx="11" cy="11" r="7" />
              <Path d="M21 21l-4.35-4.35" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Categories horizontal scrolling bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {categories.map((cat) => {
            const isSelected = activeFilter === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                activeOpacity={0.85}
                onPress={() => setActiveFilter(cat)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Favorites list */}
        <View style={styles.listContainer}>
          {filteredFavorites.map((item) => (
            <View key={item.id} style={styles.favItem}>
              <View style={styles.favIconWrapper}>
                {getFavoriteIcon(item.typeIcon, '#0F6E56')}
              </View>
              
              <View style={{ flex: 1, minWidth: 0, paddingLeft: 10 }}>
                <Text style={styles.favName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.favDetail} numberOfLines={1}>
                  {item.detail}
                </Text>
              </View>

              <View style={styles.favActions}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>SEGURO</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => removeFavorite(item.id)}
                >
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="#FAC775" stroke="#EF9F27" strokeWidth="1.5">
                    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </Svg>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Add New Product Card */}
          <TouchableOpacity
            style={styles.addCard}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/scanner')}
          >
            <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth="2.2" strokeLinecap="round">
              <Path d="M12 5v14M5 12h14" />
            </Svg>
            <Text style={styles.addCardText}>Escanear nuevo producto</Text>
          </TouchableOpacity>
        </View>

        {/* Mascot Banner */}
        <View style={styles.mascotBanner}>
          <View style={styles.mascotBannerWrapper}>
            <AlergiMascot state="blue" size={32} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.mascotBannerTitle}>Alergi dice</Text>
            <Text style={styles.mascotBannerDesc}>
              Tienes {favorites.length} productos seguros. ¡Sigue sumando!
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFF',
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  topnav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 40 : 12,
    paddingBottom: 10,
  },
  topnavTitle: {
    fontFamily: FontFamily.nunitoBlack,
    fontWeight: '900',
    fontSize: 17,
    color: '#1A2340',
  },
  topnavSub: {
    fontFamily: FontFamily.interRegular,
    fontSize: 11,
    color: '#8896B0',
    marginTop: 1,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EEF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterScroll: {
    paddingLeft: 16,
    paddingRight: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE3F0',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 13,
  },
  filterChipActive: {
    backgroundColor: '#5A7BFA',
    borderColor: '#5A7BFA',
  },
  filterChipText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7A99',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 16,
    flexDirection: 'column',
    gap: 8,
    marginBottom: 14,
  },
  favItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECF5',
    borderRadius: 16,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },
  favIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EAF7F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favName: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '800',
    fontSize: 12,
    color: '#1A2340',
  },
  favDetail: {
    fontFamily: FontFamily.interRegular,
    fontSize: 10,
    color: '#8896B0',
    marginTop: 1,
  },
  favActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
    marginLeft: 'auto',
    paddingLeft: 8,
  },
  badge: {
    backgroundColor: '#EAF7F2',
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  badgeText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 9,
    fontWeight: '700',
    color: '#085041',
  },
  addCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#DDE3F0',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addCardText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 11,
    fontWeight: '700',
    color: '#5A7BFA',
  },
  mascotBanner: {
    marginHorizontal: 16,
    backgroundColor: '#EEF3FF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mascotBannerWrapper: {
    flexShrink: 0,
  },
  mascotBannerTitle: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '800',
    fontSize: 11,
    color: '#185FA5',
  },
  mascotBannerDesc: {
    fontFamily: FontFamily.interRegular,
    fontSize: 10,
    color: '#0C447C',
    lineHeight: 14,
  },
});
