import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';
import { useAppStore, HistoryItem } from '@/store/appStore';
import { AlergiMascot } from '@/components/ui/AlergiMascot';

type FilterType = 'Todo' | 'Peligros' | 'Precaución' | 'Seguros';

export default function HistoryTab() {
  const router = useRouter();
  const { history, setActiveScan } = useAppStore();
  const [filter, setFilter] = useState<FilterType>('Todo');

  // Filter logic
  const filteredHistory = history.filter((item) => {
    if (filter === 'Todo') return true;
    if (filter === 'Peligros') return item.status === 'danger';
    if (filter === 'Precaución') return item.status === 'warning';
    if (filter === 'Seguros') return item.status === 'safe';
    return true;
  });

  // Calculate statistics from whole history
  const dangerCount = history.filter(h => h.status === 'danger').length;
  const warningCount = history.filter(h => h.status === 'warning').length;
  const safeCount = history.filter(h => h.status === 'safe').length;

  // Group by Date ('Hoy' and 'Ayer' etc)
  const groupedItems: { [key: string]: HistoryItem[] } = {};
  filteredHistory.forEach((item) => {
    if (!groupedItems[item.date]) {
      groupedItems[item.date] = [];
    }
    groupedItems[item.date].push(item);
  });

  const getStatusBadgeStyle = (status: 'safe' | 'warning' | 'danger') => {
    switch (status) {
      case 'danger':
        return {
          bg: Colors.dangerSurface,
          border: Colors.dangerBorder,
          text: Colors.dangerDark,
          badgeText: 'PELIGRO',
          mascotState: 'red' as const,
        };
      case 'warning':
        return {
          bg: Colors.warningSurface,
          border: Colors.warningBorder,
          text: Colors.warningDark,
          badgeText: 'PRECAUCIÓN',
          mascotState: 'amber' as const,
        };
      case 'safe':
      default:
        return {
          bg: Colors.successSurface,
          border: Colors.successBorder,
          text: Colors.successDark,
          badgeText: 'SEGURO',
          mascotState: 'green' as const,
        };
    }
  };

  const handleItemPress = (item: HistoryItem) => {
    setActiveScan({
      name: item.name,
      brand: item.brand,
      status: item.status,
      confidence: item.confidence ?? 100,
      allergens: item.allergens,
      rawIngredients: item.rawIngredients,
      warningType: item.warningType,
    });
    if (item.status === 'warning') {
      router.push('/warning');
    } else {
      router.push('/result');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Navbar */}
        <View style={styles.topnav}>
          <View>
            <Text style={styles.topnavTitle}>Historial</Text>
            <Text style={styles.topnavSub}>{history.length} escaneos · junio 2026</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} accessibilityLabel="Filtrar historial">
            <Svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth="2" strokeLinecap="round">
              <Path d="M4 6h16M8 12h8M11 18h2" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Filter Scroll Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {/* Todo */}
          <TouchableOpacity
            style={[styles.filterChip, filter === 'Todo' && styles.chipTodoActive]}
            activeOpacity={0.85}
            onPress={() => setFilter('Todo')}
          >
            <Text style={[styles.filterText, filter === 'Todo' && styles.textTodoActive]}>Todo</Text>
          </TouchableOpacity>
          {/* Peligros */}
          <TouchableOpacity
            style={[styles.filterChip, styles.chipDanger, filter === 'Peligros' && styles.chipDangerActive]}
            activeOpacity={0.85}
            onPress={() => setFilter('Peligros')}
          >
            <Text style={[styles.filterText, { color: Colors.dangerMid }, filter === 'Peligros' && styles.textDangerActive]}>Peligros</Text>
          </TouchableOpacity>
          {/* Precaución */}
          <TouchableOpacity
            style={[styles.filterChip, styles.chipWarning, filter === 'Precaución' && styles.chipWarningActive]}
            activeOpacity={0.85}
            onPress={() => setFilter('Precaución')}
          >
            <Text style={[styles.filterText, { color: Colors.warningMid }, filter === 'Precaución' && styles.textWarningActive]}>Precaución</Text>
          </TouchableOpacity>
          {/* Seguros */}
          <TouchableOpacity
            style={[styles.filterChip, styles.chipSuccess, filter === 'Seguros' && styles.chipSuccessActive]}
            activeOpacity={0.85}
            onPress={() => setFilter('Seguros')}
          >
            <Text style={[styles.filterText, { color: Colors.successMid }, filter === 'Seguros' && styles.textSuccessActive]}>Seguros</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Grouped List Content */}
        <View style={styles.listContainer}>
          {Object.keys(groupedItems).map((date) => (
            <View key={date}>
              <Text style={styles.dateHeader}>{date}</Text>
              
              {groupedItems[date].map((item) => {
                const cfg = getStatusBadgeStyle(item.status);
                
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.histCard, { backgroundColor: cfg.bg, borderColor: cfg.border }]}
                    activeOpacity={0.9}
                    onPress={() => handleItemPress(item)}
                  >
                    <View style={styles.mascotWrapper}>
                      <AlergiMascot state={cfg.mascotState} size={22} />
                    </View>
                    
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.itemName, { color: cfg.text }]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={[styles.itemDetail, { color: item.status === 'danger' ? Colors.dangerMid : item.status === 'warning' ? Colors.warningMid : Colors.successMid }]} numberOfLines={1}>
                        {item.detail.split(' · ')[0]} · {item.time}
                      </Text>
                    </View>

                    <View style={[styles.badge, { backgroundColor: cfg.border }]}>
                      <Text style={[styles.badgeText, { color: cfg.text }]}>
                        {cfg.badgeText}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Bottom Statistics Cards */}
        <View style={styles.statsSummary}>
          <View style={[styles.summaryCard, { backgroundColor: Colors.dangerSurface }]}>
            <Text style={[styles.summaryNum, { color: Colors.danger }]}>{dangerCount}</Text>
            <Text style={[styles.summaryLabel, { color: Colors.dangerMid }]}>Peligros</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: Colors.warningSurface }]}>
            <Text style={[styles.summaryNum, { color: Colors.warning }]}>{warningCount}</Text>
            <Text style={[styles.summaryLabel, { color: Colors.warningMid }]}>Precaución</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: Colors.successSurface }]}>
            <Text style={[styles.summaryNum, { color: Colors.success }]}>{safeCount}</Text>
            <Text style={[styles.summaryLabel, { color: Colors.successMid }]}>Seguros</Text>
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
    paddingHorizontal: 12,
  },
  chipTodoActive: {
    backgroundColor: '#5A7BFA',
    borderColor: '#5A7BFA',
  },
  chipDanger: {
    backgroundColor: Colors.dangerSurface,
    borderColor: Colors.dangerBorder,
  },
  chipDangerActive: {
    backgroundColor: Colors.danger,
    borderColor: Colors.danger,
  },
  chipWarning: {
    backgroundColor: Colors.warningSurface,
    borderColor: Colors.warningBorder,
  },
  chipWarningActive: {
    backgroundColor: Colors.warning,
    borderColor: Colors.warning,
  },
  chipSuccess: {
    backgroundColor: Colors.successSurface,
    borderColor: Colors.successBorder,
  },
  chipSuccessActive: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  filterText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7A99',
  },
  textTodoActive: {
    color: '#FFFFFF',
  },
  textDangerActive: {
    color: '#FFFFFF',
  },
  textWarningActive: {
    color: '#FFFFFF',
  },
  textSuccessActive: {
    color: '#04342C',
  },
  listContainer: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  dateHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B0BAD0',
    fontFamily: FontFamily.nunitoBold,
    paddingTop: 4,
    paddingBottom: 6,
  },
  histCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  mascotWrapper: {
    marginRight: 9,
    flexShrink: 0,
  },
  itemName: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '800',
    fontSize: 12,
  },
  itemDetail: {
    fontFamily: FontFamily.interRegular,
    fontSize: 10,
    marginTop: 1,
  },
  badge: {
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 7,
    marginLeft: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 9,
    fontWeight: '700',
  },
  statsSummary: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginVertical: 6,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryNum: {
    fontFamily: FontFamily.nunitoBlack,
    fontWeight: '900',
    fontSize: 18,
  },
  summaryLabel: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 9,
    fontWeight: '600',
  },
});
