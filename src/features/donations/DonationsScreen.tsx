import React, { useEffect, useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useShallow } from 'zustand/shallow';
import type { DonationsScreenNavigationProp } from '../../app/navigation';
import type { MoneyCurrency } from '../../shared/utils';
import {
  AppText,
  EmptyState,
  HeaderBackButton,
  HeaderTitle,
  LoadingOverlay,
  Screen,
} from '../../shared/ui';
import { formatMoney } from '../../shared/utils';
import { DonationJar } from './components/DonationJar';
import { useDonationsStore } from './state/useDonationsStore';
import { computeDonationStats } from './utils';
import { useDonationsScreenStyles } from './DonationsScreen.styles';

// Below this many donations the jar grows with each one; above it, it reads full.
const JAR_FULL_AT = 12;

const formatDonationDate = (isoString: string): string =>
  new Date(isoString).toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export const DonationsScreen = () => {
  const styles = useDonationsScreenStyles();
  const navigation = useNavigation<DonationsScreenNavigationProp>();

  const { donations, isLoading, loadDonations } = useDonationsStore(
    useShallow(state => ({
      donations: state.donations,
      isLoading: state.isLoading,
      loadDonations: state.loadDonations,
    })),
  );

  useEffect(() => {
    loadDonations();
  }, [loadDonations]);

  const stats = useMemo(() => computeDonationStats(donations), [donations]);
  const currency: MoneyCurrency = {
    code: donations[0]?.currencyCode ?? null,
    symbol: donations[0]?.currencySymbol ?? null,
  };

  return (
    <Screen
      headerLeft={<HeaderBackButton onPress={() => navigation.goBack()} />}
      headerCenter={<HeaderTitle>Donations</HeaderTitle>}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <DonationJar fillRatio={stats.count / JAR_FULL_AT} />
          <AppText variant="caption" tone="secondary">
            Total donated
          </AppText>
          <AppText variant="h1" style={styles.heroAmount}>
            {formatMoney(stats.total, currency)}
          </AppText>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <AppText variant="h2">{String(stats.count)}</AppText>
            <AppText variant="caption" tone="secondary">
              Donations
            </AppText>
          </View>
          <View style={styles.statCard}>
            <AppText variant="h2">{formatMoney(stats.average, currency)}</AppText>
            <AppText variant="caption" tone="secondary">
              Average
            </AppText>
          </View>
        </View>

        {donations.length === 0 ? (
          <EmptyState message="No donations yet. Donation-category transactions will show up here." />
        ) : (
          <View style={styles.listSection}>
            <AppText variant="h2">History</AppText>
            {donations.map(donation => (
              <View key={donation.id} style={styles.donationRow}>
                <View style={styles.donationInfo}>
                  <AppText numberOfLines={1}>{donation.title}</AppText>
                  <AppText variant="caption" tone="secondary">
                    {formatDonationDate(donation.occurredAtIso)}
                  </AppText>
                </View>
                <AppText style={styles.donationAmount}>
                  {formatMoney(Math.abs(donation.amount), {
                    code: donation.currencyCode,
                    symbol: donation.currencySymbol,
                  })}
                </AppText>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      {isLoading ? <LoadingOverlay /> : null}
    </Screen>
  );
};
