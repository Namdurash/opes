import React from 'react';
import { ImageBackground, Pressable, View } from 'react-native';
import { Card } from '../../../domain/cards';
import { AppText } from '../../../shared/ui';
import { showBottomSheet } from '../../../shared/ui/bottom-sheet';
import { formatMoney } from '../../../shared/utils';
import { useCardItemStyles } from './CardItem.styles';

interface CardItemProps {
  card: Card;
  collapsed?: boolean;
  /** The card is a tombstone: greyed, badged, and carrying the delete control. */
  inactive?: boolean;
  onDelete?: () => void;
}

const canRenderImage = (image: string | null): image is string =>
  Boolean(image && /^(https?:|file:|data:|content:)/.test(image));

export const CardItem = ({
  card,
  collapsed = false,
  inactive = false,
  onDelete,
}: CardItemProps) => {
  const styles = useCardItemStyles();
  const hasImage = canRenderImage(card.image);
  const imageUri: string | undefined = hasImage ? card.image ?? undefined : undefined;

  const confirmDelete = () => {
    showBottomSheet({
      variant: 'error',
      title: 'Delete card?',
      message: `"${card.title}" will be permanently removed. This cannot be undone.`,
      actions: [
        { label: 'Delete', variant: 'danger', onPress: () => onDelete?.() },
        { label: 'Cancel', variant: 'secondary', onPress: () => {} },
      ],
    });
  };

  const content = (
    <View style={styles.containerContent}>
      {/* First child so the badge and the delete control below paint above the wash. */}
      {inactive ? (
        <View testID="card-inactive" pointerEvents="none" style={styles.inactiveOverlay} />
      ) : null}

      <View style={styles.header}>
        <AppText numberOfLines={1} style={styles.title}>
          {card.title}
        </AppText>
        <AppText numberOfLines={1} variant={collapsed ? 'body' : 'h2'} style={styles.amount}>
          {formatMoney(card.moneyAmount, { code: card.currencyCode, symbol: card.currencySymbol })}
        </AppText>
      </View>

      {collapsed ? null : !hasImage ? (
        <View style={styles.body}>
          <View style={styles.placeholder}>
            <AppText variant="caption" tone="inverse">
              {card.type.slice(0, 1).toUpperCase()}
            </AppText>
          </View>

          <View style={styles.details}>
            <AppText tone="secondary">{card.type}</AppText>
          </View>
        </View>
      ) : (
        <View style={styles.imageContent}>
          <View style={styles.typeBadge}>
            <AppText tone="inverse">{card.type}</AppText>
          </View>
        </View>
      )}

      {inactive ? (
        <>
          <View style={styles.disconnectedBadge}>
            <AppText testID="card-disconnected-badge" variant="caption" tone="tertiary">
              Disconnected
            </AppText>
          </View>

          <Pressable
            testID="card-delete"
            accessibilityLabel="Delete card"
            style={styles.deleteControl}
            onPress={confirmDelete}
          >
            <AppText variant="caption">Delete</AppText>
          </Pressable>
        </>
      ) : null}
    </View>
  );

  if (hasImage) {
    return (
      <ImageBackground
        source={{ uri: imageUri }}
        style={[styles.container, styles.imageBackground]}
        imageStyle={styles.image}
      >
        {content}
      </ImageBackground>
    );
  }

  return <View style={styles.container}>{content}</View>;
};
