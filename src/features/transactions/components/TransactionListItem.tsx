import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import type { Transaction } from '../../../domain/transactions';
import type { Category } from '../../../domain/categorization';
import { useTheme } from '../../../shared/theme';
import { formatAmount, formatTransactionTime } from '../utils';
import { useTransactionListItemStyles } from './TransactionListItem.styles';

const SPRING_CONFIG = { stiffness: 300, damping: 30, mass: 0.8 };

const FALLBACK_CATEGORY: Pick<Category, 'emoji' | 'color' | 'bgColor' | 'label'> = {
  emoji: '🔘',
  color: '#9E9E9E',
  bgColor: '#F4F4F5',
  label: 'Інше',
};

interface TransactionListItemProps {
  transaction: Transaction;
  category: Category | null;
  onPress?: () => void;
  cashback?: number;
}

export const TransactionListItem = ({
  transaction,
  category,
  onPress,
  cashback,
}: TransactionListItemProps) => {
  const styles = useTransactionListItemStyles();
  const { theme } = useTheme();

  const isIncome = transaction.amount >= 0;
  const isDonation = category?.id === 'donations';
  const isPending = transaction.hold;

  const cat = category ?? FALLBACK_CATEGORY;
  const time = formatTransactionTime(transaction.occurredAtIso);
  const meta = `${cat.label} • ${time}`;

  const scale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);

  const [borderColor, setBorderColor] = useState(() => {
    if (isIncome) return 'rgba(34,197,94,0.22)';
    if (isDonation) return 'rgba(139,92,246,0.2)';
    return theme.colors.border;
  });

  useEffect(() => {
    if (!isPending) return;
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1400 }),
        withTiming(1, { duration: 1400 }),
      ),
      -1,
    );
  }, [isPending, pulseOpacity]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.975, SPRING_CONFIG);
    setBorderColor('#D3C8FF');
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIG);
    setBorderColor(() => {
      if (isIncome) return 'rgba(34,197,94,0.22)';
      if (isDonation) return 'rgba(139,92,246,0.2)';
      return theme.colors.border;
    });
  };

  const cardBackground = isIncome
    ? ['rgba(34,197,94,0.04)', 'rgba(34,197,94,0.04)']
    : isDonation
      ? ['rgba(139,92,246,0.035)', 'rgba(139,92,246,0.035)']
      : [theme.colors.background, theme.colors.background];

  return (
    <Pressable
      style={styles.pressable}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={animatedCardStyle}>
        <LinearGradient
          colors={cardBackground}
          style={[styles.card, { borderColor }]}
        >
          {(isIncome || isDonation) && (
            <LinearGradient
              colors={
                isDonation
                  ? ['#8B5CF6', '#3B82F6']
                  : [theme.colors.success, theme.colors.success]
              }
              style={styles.accentStripe}
            />
          )}

          <View style={styles.row}>
            <View style={styles.iconBlock}>
              <View style={[styles.iconGlow, { backgroundColor: cat.bgColor, shadowColor: cat.color }]} />
              <View style={[styles.iconSurface, { backgroundColor: cat.bgColor }]}>
                <Text style={styles.emoji}>{cat.emoji}</Text>
              </View>
            </View>

            <View style={styles.content}>
              <View style={styles.topRow}>
                <Text
                  style={[styles.title, isIncome && styles.titleIncome]}
                  numberOfLines={1}
                >
                  {transaction.title}
                </Text>
                <Text style={[styles.amount, isIncome && styles.amountIncome]}>
                  {formatAmount(transaction.amount, transaction.currencySymbol)}
                </Text>
              </View>

              <View style={styles.bottomRow}>
                <Text style={styles.meta} numberOfLines={1}>
                  {meta}
                </Text>
                {cashback != null && cashback > 0 && (
                  <View style={styles.cashbackPill}>
                    <Text style={styles.cashbackText}>
                      ✓ +{cashback.toFixed(2)} {transaction.currencySymbol}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <Text style={styles.chevron}>›</Text>
          </View>

          {isPending && (
            <View style={styles.pendingBadge}>
              <Animated.Text style={[styles.pendingText, animatedPulseStyle]}>
                В обробці
              </Animated.Text>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};
