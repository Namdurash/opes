import React from 'react';
import { View } from 'react-native';
import { Card } from '../../../domain/auth';
import { CardItem } from './CardItem';
import { useCardStackStyles } from './CardStack.styles';

interface CardStackProps {
  cards: Card[];
}

export function CardStack({ cards }: CardStackProps) {
  const styles = useCardStackStyles();
  const lastIndex = cards.length - 1;

  return (
    <View style={styles.container}>
      {cards.map((card, index) => (
        <View
          key={card.id}
          style={[
            styles.cardLayer,
            index > 0 ? styles.overlapLayer : null,
            { zIndex: index + 1 },
          ]}
        >
          <CardItem card={card} collapsed={index !== lastIndex} />
        </View>
      ))}
    </View>
  );
}
