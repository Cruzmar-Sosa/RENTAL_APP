import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Card, Loading, EmptyState } from '@design-system/components';
import { COLORS, SPACING, RADIUS } from '@design-system/theme';
import { useStations } from '../hooks/useStations';
import { Station } from '@domain/entities/Station';
import { BikeProps } from '@domain/entities/Bike';

export const StationBrowserScreen: React.FC = () => {
  const router = useRouter();
  const { stations, isLoading, error, refresh } = useStations();
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  if (isLoading && stations.length === 0) {
    return <Loading message="Loading rental stations..." />;
  }

  if (error && stations.length === 0) {
    return (
      <EmptyState
        title="Could not load stations"
        description={error}
        actionTitle="Retry"
        onAction={refresh}
      />
    );
  }

  const renderStationCard = ({ item }: { item: Station }) => {
    const isSelected = selectedStation?.id === item.id;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setSelectedStation(isSelected ? null : item)}
      >
        <Card
          variant={isSelected ? 'outlined' : 'elevated'}
          style={[styles.card, ...(isSelected ? [styles.cardSelected] : [])]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.titleBox}>
              <Typography variant="h3" color={COLORS.neutral.textPrimary}>
                {item.name}
              </Typography>
              {item.props.address ? (
                <Typography variant="caption" color={COLORS.neutral.textSecondary}>
                  {item.props.address}
                </Typography>
              ) : null}
            </View>
            <View style={styles.badgeBox}>
              <Typography
                variant="caption"
                weight="bold"
                color={item.hasAvailableBikes() ? COLORS.status.available : COLORS.status.maintenance}
              >
                {item.availableBikeCount} bikes
              </Typography>
            </View>
          </View>

          <View style={styles.detailsRow}>
            <Typography variant="caption" color={COLORS.neutral.textSecondary}>
              Capacity: {item.capacity} docks
            </Typography>
            <Typography variant="caption" color={COLORS.neutral.textSecondary}>
              Free Docks: {item.availableDockCount}
            </Typography>
          </View>

          {isSelected && (
            <View style={styles.bikeListContainer}>
              <Typography variant="subtitle" style={styles.bikeListTitle}>
                Available Bikes
              </Typography>
              {item.availableBikes.length === 0 ? (
                <Typography variant="caption" color={COLORS.neutral.textSecondary}>
                  No available bikes at this station right now.
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

  const renderBikeItem = (bike: BikeProps) => (
    <View key={bike.id} style={styles.bikeItem}>
      <View>
        <Typography variant="body" weight="medium">
          Bike #{bike.code} {bike.model ? `(${bike.model})` : ''}
        </Typography>
        <Typography variant="caption" color={COLORS.neutral.textSecondary}>
          Battery: {bike.batteryLevel}%
        </Typography>
      </View>
      <TouchableOpacity
        style={styles.reserveBtn}
        onPress={() => router.push({ pathname: '/(app)/reservation/new', params: { bikeId: bike.id, bikeCode: String(bike.code) } })}
      >
        <Typography variant="caption" color={COLORS.primary.contrast} weight="bold">
          Reserve
        </Typography>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h1" color={COLORS.neutral.textPrimary}>
          Stations Map
        </Typography>
        <Typography variant="caption" color={COLORS.neutral.textSecondary}>
          Select a station to view available bikes
        </Typography>
      </View>

      <FlatList
        data={stations as Station[]}
        keyExtractor={(item) => item.id}
        renderItem={renderStationCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
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
    paddingTop: SPACING.xl,
    backgroundColor: COLORS.neutral.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral.border,
  },
  listContent: {
    padding: SPACING.md,
  },
  card: {
    marginBottom: SPACING.md,
  },
  cardSelected: {
    borderColor: COLORS.primary.main,
    borderWidth: 2,
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
  badgeBox: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral.border,
  },
  bikeListContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral.border,
  },
  bikeListTitle: {
    marginBottom: SPACING.xs,
  },
  bikeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  reserveBtn: {
    backgroundColor: COLORS.primary.main,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
});
