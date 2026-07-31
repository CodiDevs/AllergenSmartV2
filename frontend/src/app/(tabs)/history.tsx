import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';
import { useAppStore, HistoryItem } from '@/store/appStore';
import { HistoryCardSkeleton } from '@/components/ui/skeleton';
import { AlergiMascot } from '@/components/ui/AlergiMascot';
import { getUserScanHistory, mapAlertLevelToStatus } from '@/services/api';

type FilterType = 'Todo' | 'Peligros' | 'Precaución' | 'Seguros';

// Map route param → FilterType
const paramToFilter: Record<string, FilterType> = {
  all: 'Todo',
  danger: 'Peligros',
  warning: 'Precaución',
  safe: 'Seguros',
};

// Formatea el mes y año actual en español
const getCurrentMonthYear = (): string => {
  const now = new Date();
  return now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
};


export default function HistoryTab() {
  const router = useRouter();
  const params = useLocalSearchParams<{ filter?: string }>();
  const { history, setActiveScan, setHistory, removeHistoryItem, clearHistory } = useAppStore();
  const [filter, setFilter] = useState<FilterType>(
    paramToFilter[params.filter || ''] || 'Todo'
  );
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Si el param cambia (por ej. al tocar otra stat card desde home), actualizar el filtro
  useEffect(() => {
    if (params.filter && paramToFilter[params.filter]) {
      setFilter(paramToFilter[params.filter]);
    }
  }, [params.filter]);

  // Cargar historial del backend al montar
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoadingHistory(true);
    try {
      const response = await getUserScanHistory(50, 0);
      const now = new Date();
      const today = now.toDateString();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      const mappedItems: HistoryItem[] = response.items.map((item) => {
        const scannedDate = new Date(item.scanned_at);
        let dateLabel: string;
        if (scannedDate.toDateString() === today) {
          dateLabel = 'Hoy';
        } else if (scannedDate.toDateString() === yesterdayStr) {
          dateLabel = 'Ayer';
        } else {
          dateLabel = scannedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
        }

        return {
          id: item.id,
          backendId: item.id,
          name: item.product_name || 'Producto escaneado',
          brand: item.brand || '',
          detail:
            item.allergens_found.length > 0
              ? `${item.allergens_found.length} alérgeno${item.allergens_found.length > 1 ? 's' : ''} detectado${item.allergens_found.length > 1 ? 's' : ''}`
              : 'Sin alérgenos detectados',
          time: scannedDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          date: dateLabel,
          dateRaw: scannedDate,
          status: mapAlertLevelToStatus((item.result_status || item.alert_level || 'safe') as any),
          confidence: item.confidence ? Math.round(item.confidence * 100) : 100,
          allergens: item.allergens_found || [],
          rawIngredients: item.raw_ingredients || '',
        };
      });

      setHistory(mappedItems);
    } catch (err: any) {
      console.warn('[History] No se pudo cargar el historial:', err?.message);
      // Mantenemos el historial local si hay error de red
    } finally {
      setLoadingHistory(false);
      setRefreshing(false);
    }
  };

  // Filter logic
  const filteredHistory = history.filter((item) => {
    const st = (item.status || '').toLowerCase();
    if (filter === 'Todo') return true;
    if (filter === 'Peligros') return st === 'danger';
    if (filter === 'Precaución') return st === 'warning';
    if (filter === 'Seguros') return st === 'safe';
    return true;
  });

  // Calculate statistics from whole history
  const dangerCount = history.filter(h => (h.status || '').toLowerCase() === 'danger').length;
  const warningCount = history.filter(h => (h.status || '').toLowerCase() === 'warning').length;
  const safeCount = history.filter(h => (h.status || '').toLowerCase() === 'safe').length;

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

  const handleDeleteItem = (id: string, name: string) => {
    Alert.alert(
      'Eliminar registro',
      `¿Deseas eliminar "${name}" del historial?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => removeHistoryItem(id) },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Vaciar historial',
      '¿Estás seguro de que quieres eliminar todos los registros del historial?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Vaciar todo', style: 'destructive', onPress: () => clearHistory() },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchHistory(true)}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Top Navbar */}
        <View style={styles.topnav}>
          <View>
            <Text style={styles.topnavTitle}>Historial</Text>
            <Text style={styles.topnavSub}>{history.length} escaneos · {getCurrentMonthYear()}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {history.length > 0 && (
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: '#FEE2E2' }]}
                activeOpacity={0.8}
                accessibilityLabel="Vaciar historial"
                onPress={handleClearAll}
              >
                <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={Colors.danger} strokeWidth="2" strokeLinecap="round">
                  <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </Svg>
              </TouchableOpacity>
            )}
            {loadingHistory ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <TouchableOpacity
                style={styles.iconBtn}
                activeOpacity={0.8}
                accessibilityLabel="Actualizar historial"
                onPress={() => fetchHistory(true)}
              >
                <Svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth="2" strokeLinecap="round">
                  <Path d="M4 6h16M8 12h8M11 18h2" />
                </Svg>
              </TouchableOpacity>
            )}
          </View>
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
          {loadingHistory && history.length === 0 ? (
            <View style={{ paddingTop: 8 }}>
              <HistoryCardSkeleton />
              <HistoryCardSkeleton />
              <HistoryCardSkeleton />
              <HistoryCardSkeleton />
            </View>
          ) : Object.keys(groupedItems).length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ color: '#8896B0', fontSize: 15, fontFamily: FontFamily.interMedium }}>No hay escaneos que mostrar.</Text>
            </View>
          ) : (
            Object.keys(groupedItems).map((date) => (
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

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={[styles.badge, { backgroundColor: cfg.border }]}>
                        <Text style={[styles.badgeText, { color: cfg.text }]}>
                          {cfg.badgeText}
                        </Text>
                      </View>
                      <TouchableOpacity
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        activeOpacity={0.7}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id, item.name);
                        }}
                        style={{ padding: 4 }}
                      >
                        <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round">
                          <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </Svg>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )))}
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
