import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Typography, Card, Badge } from '@design-system/components';
import { COLORS, SPACING, RADIUS } from '@design-system/theme';
import { RouteEntity } from '@domain/entities/Route';

interface SuggestedRoutesCardProps {
  routes: RouteEntity[];
  title?: string;
}

export const SuggestedRoutesCard: React.FC<SuggestedRoutesCardProps> = ({
  routes,
  title = '📍 Suggested Cycling Routes & POIs',
}) => {
  if (!routes || routes.length === 0) return null;

  const getDifficultyVariant = (diff: string) => {
    switch (diff) {
      case 'EASY':
        return 'available';
      case 'MODERATE':
        return 'primary';
      case 'HARD':
      case 'EXPERT':
        return 'reserved';
      default:
        return 'neutral';
    }
  };

  return (
    <Card style={styles.card}>
      <Typography variant="h3" color={COLORS.neutral.textPrimary} style={styles.title}>
        {title}
      </Typography>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {routes.map((route) => (
          <View key={route.id} style={styles.routeItem}>
            <View style={styles.routeHeader}>
              <Typography variant="subtitle" color={COLORS.primary.light} weight="bold" style={{ flex: 1 }}>
                {route.name}
              </Typography>
              <Badge
                label={route.difficulty}
                variant={getDifficultyVariant(route.difficulty)}
              />
            </View>

            {route.props.description && (
              <Typography variant="caption" color={COLORS.neutral.textSecondary} numberOfLines={2} style={styles.desc}>
                {route.props.description}
              </Typography>
            )}

            <View style={styles.metaRow}>
              <Typography variant="caption" color={COLORS.secondary.light} weight="bold">
                📏 {route.distanceKm} km  •  ⏱️ {route.durationMin} min
              </Typography>
            </View>

            {route.pois.length > 0 && (
              <View style={styles.poisContainer}>
                <Typography variant="caption" color={COLORS.neutral.textSecondary} weight="bold" style={styles.poiTitle}>
                  {route.pois.length} POINTS OF INTEREST
                </Typography>
                {route.pois.slice(0, 3).map((poi) => (
                  <View key={poi.id} style={styles.poiRow}>
                    <Typography variant="caption" color={COLORS.neutral.textPrimary}>
                      📍 {poi.name}
                    </Typography>
                    {poi.audioGuideUrl && (
                      <Typography variant="caption" color={COLORS.primary.light} weight="bold">
                        🎧 Audio
                      </Typography>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: SPACING.sm,
    padding: SPACING.md,
  },
  title: {
    marginBottom: SPACING.sm,
  },
  scroll: {
    gap: SPACING.md,
  },
  routeItem: {
    width: 260,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  desc: {
    marginBottom: SPACING.xs,
  },
  metaRow: {
    marginVertical: SPACING.xs,
  },
  poisContainer: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  poiTitle: {
    fontSize: 10,
    marginBottom: SPACING.xs,
  },
  poiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
});
