import React from 'react';
import { ImageBackground, View } from 'react-native';
import { Card } from '../../../domain/cards';
import { AppText } from '../../../shared/ui';
import { useCardItemStyles } from './CardItem.styles';

interface CardItemProps {
  card: Card;
  collapsed?: boolean;
}

const formatMoneyAmount = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);

const canRenderImage = (image: string | null): image is string =>
  Boolean(image && /^(https?:|file:|data:|content:)/.test(image));

export const CardItem = ({ card, collapsed = false }: CardItemProps) => {
  const styles = useCardItemStyles();
  const hasImage = canRenderImage(card.image);
  const imageUri: string | undefined = hasImage ? card.image ?? undefined : undefined;
  const content = (
    <View style={styles.containerContent}>
      <View style={styles.header}>
        <AppText numberOfLines={1} style={styles.title}>
          {card.title}
        </AppText>
        <AppText numberOfLines={1} variant={collapsed ? 'body' : 'h2'} style={styles.amount}>
          {formatMoneyAmount(card.moneyAmount)}
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
