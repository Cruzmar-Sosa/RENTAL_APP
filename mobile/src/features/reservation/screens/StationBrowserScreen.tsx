import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Card, Loading, EmptyState, Badge } from '@design-system/components';
import { COLORS, SPACING, RADIUS } from '@design-system/theme';
import { useStations } from '../hooks/useStations';
import { Station } from '@domain/entities/Station';
import { BikeProps } from '@domain/entities/Bike';

export const StationBrowserScreen: React.FC = () => {
  const router = useRouter();
  const { stations, isLoading, error, refresh } = useStations();
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  if (isLoading && stations.length === 0) {
    return <Loading message="Loading e-bike stations near you..." />;
  }

  if (error && stations.length === 0) {
    return (
      <EmptyState
        title="Could not load stations"
        description={error}
        actionTitle="Retry Connection"
        onAction={refresh}
      />
    );
  }

  const renderStationCard = ({ item }: { item: Station }) => {
    const isSelected = selectedStation?.id === item.id;
    const hasBikes = item.hasAvailableBikes();
    const capacityRatio = item.capacity > 0 ? (item.availableDockCount / item.capacity) * 100 : 0;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setSelectedStation(isSelected ? null : item)}
      >
        <Card
          variant={isSelected ? 'glass' : 'elevated'}
          style={[styles.card, ...(isSelected ? [styles.cardSelected] : [])]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.titleBox}>
              <Typography variant="h3" color={COLORS.neutral.textPrimary}>
                📍 {item.name}
              </Typography>
              {item.props.address ? (
                <Typography variant="caption" color={COLORS.neutral.textSecondary} style={styles.address}>
                  {item.props.address}
                </Typography>
              ) : null}
            </View>
            <Badge
              label={`${item.availableBikeCount} Bikes`}
              variant={hasBikes ? 'available' : 'maintenance'}
              showDot
            />
          </View>

          <View style={styles.dockBarContainer}>
            <View style={styles.dockBarHeader}>
              <Typography variant="caption" color={COLORS.neutral.textSecondary}>
                Free Docks ({item.availableDockCount}/{item.capacity})
              </Typography>
              <Typography variant="caption" color={COLORS.primary.light} weight="bold">
                {Math.round(capacityRatio)}% Open
              </Typography>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(0, capacityRatio))}%` }]} />
            </View>
          </View>

          {isSelected && (
            <View style={styles.bikeListContainer}>
              <Typography variant="subtitle" color={COLORS.primary.light} style={styles.bikeListTitle}>
                Available Units at Station
              </Typography>
              {item.availableBikes.length === 0 ? (
                <Typography variant="caption" color={COLORS.neutral.textSecondary}>
                  No available bikes docked at this station right now.
                </Typography>
              ) : (
                item.availableBikes.map((bike) => renderBikeItem(bike))
              )}
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  const renderBikeItem = (bike: BikeProps) => {
    const batteryColor =
      bike.batteryLevel >= 70
        ? COLORS.status.available
        : bike.batteryLevel >= 30
        ? COLORS.status.reserved
        : COLORS.status.maintenance;

    return (
      <View key={bike.id} style={styles.bikeItem}>
        <View style={styles.bikeInfoLeft}>
          <View style={styles.bikeBadgeIcon}>
            <Typography variant="h3">🚲</Typography>
          </View>
          <View style={styles.bikeDetailsText}>
            <Typography variant="body" weight="bold" color={COLORS.neutral.textPrimary}>
              Unit #{bike.code} {bike.model ? `• ${bike.model}` : ''}
            </Typography>
            <View style={styles.batteryRow}>
              <View style={[styles.batteryIndicatorDot, { backgroundColor: batteryColor }]} />
              <Typography variant="caption" color={COLORS.neutral.textSecondary}>
                Battery {bike.batteryLevel}% • Rate ${bike.ratePerHour || 50}/hr
              </Typography>
            </View>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.reserveBtn}
          onPress={() =>
            router.push({
              pathname: '/(app)/reservation/new',
              params: {
                bikeId: bike.id,
                bikeCode: String(bike.code),
                ratePerHour: String(bike.ratePerHour || 50),
              },
            })
          }
        >
          <Typography variant="caption" color={COLORS.primary.contrast} weight="bold">
            Reserve
          </Typography>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Typography variant="caption" color={COLORS.primary.light} weight="bold" style={styles.brandBadge}>
            ⚡ RENT_APP MOBILITY
          </Typography>
          <Typography variant="caption" color={COLORS.status.available}>
            ● Live Network
          </Typography>
        </View>
        <Typography variant="h1" color={COLORS.neutral.textPrimary} style={styles.headerTitle}>
          Stations & Fleet
        </Typography>
        <Typography variant="caption" color={COLORS.neutral.textSecondary}>
          Select a docking hub to view and reserve available e-bikes
        </Typography>
      </View>

      <FlatList
        data={stations as Station[]}
        keyExtractor={(item) => item.id}
        renderItem={renderStationCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={COLORS.primary.light} />}
        ListEmptyComponent={
          <EmptyState
            title="No stations found"
            description="There are currently no active bike stations nearby."
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral.background,
  },
  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl + SPACING.sm,
    backgroundColor: COLORS.neutral.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral.border,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  brandBadge: {
    letterSpacing: 1,
  },
  headerTitle: {
    marginBottom: SPACING.xxs,
  },
  listContent: {
    padding: SPACING.md,
  },
  card: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.neutral.surface,
  },
  cardSelected: {
    borderColor: COLORS.primary.light,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleBox: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  address: {
    marginTop: SPACING.xxs,
  },
  dockBarContainer: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  dockBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xxs,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: RADIUS.full || 999,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary.light,
    borderRadius: RADIUS.full || 999,
  },
  bikeListContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral.border,
  },
  bikeListTitle: {
    marginBottom: SPACING.sm,
    fontWeight: '700',
  },
  bikeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  bikeInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bikeBadgeIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(15, 118, 110, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  bikeDetailsText: {
    flex: 1,
  },
  batteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xxs,
  },
  batteryIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: SPACING.xs,
  },
  reserveBtn: {
    backgroundColor: COLORS.primary.main,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.sm,
    marginLeft: SPACING.sm,
  },
});
