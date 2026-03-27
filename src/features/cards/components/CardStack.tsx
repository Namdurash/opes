import React, { useCallback, useRef, useState } from 'react';
import { PanResponder, Pressable, View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Card } from '../../../domain/cards';
import { useCardsStore } from '../state/useCardsStore';
import { CardItem } from './CardItem';
import { CARD_STEP, useCardStackStyles } from './CardStack.styles';

const SPRING_CONFIG = { stiffness: 300, damping: 30, mass: 0.8 };

interface DraggableCardItemProps {
  card: Card;
  index: number;
  collapsed: boolean;
  draggingFromIndex: SharedValue<number>;
  draggingTargetIndex: SharedValue<number>;
  dragOffsetY: SharedValue<number>;
  onLongPress: (index: number) => void;
}

function DraggableCardItem({
  card,
  index,
  collapsed,
  draggingFromIndex,
  draggingTargetIndex,
  dragOffsetY,
  onLongPress,
}: DraggableCardItemProps) {
  const shiftY = useSharedValue(0);

  useAnimatedReaction(
    () => {
      const from = draggingFromIndex.value;
      const to = draggingTargetIndex.value;

      if (from === -1 || index === from) {
        return 0;
      }

      if (from < to && index > from && index <= to) {
        return -CARD_STEP;
      }

      if (from > to && index >= to && index < from) {
        return CARD_STEP;
      }

      return 0;
    },
    (nextShift, prevShift) => {
      if (nextShift !== prevShift) {
        if (draggingFromIndex.value === -1) {
          shiftY.value = nextShift;
        } else {
          shiftY.value = withSpring(nextShift, SPRING_CONFIG);
        }
      }
    },
  );

  const animatedStyle = useAnimatedStyle(() => {
    if (draggingFromIndex.value !== -1 && index === draggingFromIndex.value) {
      return {
        transform: [{ translateY: dragOffsetY.value }, { scale: 1.02 }],
      };
    }

    return {
      transform: [{ translateY: shiftY.value }],
    };
  });

  return (
    <Pressable onLongPress={() => onLongPress(index)} delayLongPress={400}>
      <Animated.View style={animatedStyle}>
        <CardItem card={card} collapsed={collapsed} />
      </Animated.View>
    </Pressable>
  );
}

interface CardStackProps {
  cards: Card[];
  onDragStateChange?: (isDragging: boolean) => void;
}

export function CardStack({ cards, onDragStateChange }: CardStackProps) {
  const styles = useCardStackStyles();
  const reorderCards = useCardsStore(state => state.reorderCards);

  const lastIndex = cards.length - 1;
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const cardsRef = useRef(cards);
  cardsRef.current = cards;

  const onDragStateChangeRef = useRef(onDragStateChange);
  onDragStateChangeRef.current = onDragStateChange;

  const draggingIndexRef = useRef<number | null>(null);
  const longPressActiveRef = useRef(false);

  const dragOffsetY = useSharedValue(0);
  const draggingFromIndex = useSharedValue(-1);
  const draggingTargetIndex = useSharedValue(-1);

  const handleLongPress = useCallback(
    (index: number) => {
      draggingIndexRef.current = index;
      longPressActiveRef.current = true;
      dragOffsetY.value = 0;
      draggingFromIndex.value = index;
      draggingTargetIndex.value = index;
      setDraggingIndex(index);
      onDragStateChangeRef.current?.(true);
    },
    [dragOffsetY, draggingFromIndex, draggingTargetIndex],
  );

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: () => longPressActiveRef.current,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, gs) => {
        const from = draggingIndexRef.current;
        if (from === null) return;

        dragOffsetY.value = gs.dy;

        const newTarget = Math.max(
          0,
          Math.min(
            cardsRef.current.length - 1,
            from + Math.trunc(gs.dy / CARD_STEP),
          ),
        );

        if (newTarget !== draggingTargetIndex.value) {
          draggingTargetIndex.value = newTarget;
        }
      },
      onPanResponderRelease: (_, gs) => {
        longPressActiveRef.current = false;
        if (draggingIndexRef.current === null) return;

        const fromIndex = draggingIndexRef.current;
        const targetIndex = Math.max(
          0,
          Math.min(
            cardsRef.current.length - 1,
            fromIndex + Math.trunc(gs.dy / CARD_STEP),
          ),
        );

        dragOffsetY.value = 0;
        draggingFromIndex.value = -1;
        draggingTargetIndex.value = -1;
        draggingIndexRef.current = null;
        setDraggingIndex(null);
        onDragStateChangeRef.current?.(false);

        if (targetIndex !== fromIndex) {
          const next = [...cardsRef.current];
          const [moved] = next.splice(fromIndex, 1);
          next.splice(targetIndex, 0, moved);
          void reorderCards(next);
        }
      },
      onPanResponderTerminate: () => {
        dragOffsetY.value = 0;
        draggingFromIndex.value = -1;
        draggingTargetIndex.value = -1;
        longPressActiveRef.current = false;
        draggingIndexRef.current = null;
        setDraggingIndex(null);
        onDragStateChangeRef.current?.(false);
      },
    }),
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {cards.map((card, index) => {
        const isDragging = draggingIndex === index;
        return (
          <View
            key={card.id}
            style={[
              styles.cardLayer,
              index > 0 ? styles.overlapLayer : null,
              { zIndex: isDragging ? 100 : index + 1 },
              isDragging ? styles.draggingLayer : null,
            ]}
          >
            <DraggableCardItem
              card={card}
              index={index}
              collapsed={index !== lastIndex}
              draggingFromIndex={draggingFromIndex}
              draggingTargetIndex={draggingTargetIndex}
              dragOffsetY={dragOffsetY}
              onLongPress={handleLongPress}
            />
          </View>
        );
      })}
    </View>
  );
}
