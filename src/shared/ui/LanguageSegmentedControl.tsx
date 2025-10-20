import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, Pressable } from 'react-native';
import { XStack, Text, View } from 'tamagui';
import { LANGUAGE_OPTIONS, type LanguageCode } from '@/shared/config/languages';

interface LanguageSegmentedControlProps {
  value: LanguageCode;
  onChange: (code: LanguageCode) => void;
  // опционально: локализованные подписи
  getLabel?: (code: LanguageCode, fallback: string) => string;
}

export function LanguageSegmentedControl({
  value,
  onChange,
  getLabel,
}: LanguageSegmentedControlProps) {
  const options = LANGUAGE_OPTIONS;
  const selectedIndex = Math.max(0, options.findIndex((o) => o.code === value));

  // размеры контейнера / сегмента
  const [containerWidth, setContainerWidth] = useState(0);
  const count = options.length;
  const gap = 6;       // расстояние между сегментами
  const padding = 6;   // внутренние отступы контейнера
  const height = 40;   // высота сегмента
  const thumbAnim = useRef(new Animated.Value(0)).current;

  // ширина одного сегмента (равномерно)
  const segmentWidth = useMemo(() => {
    if (!containerWidth || count === 0) return 0;
    const totalGaps = gap * (count - 1);
    const inner = containerWidth - padding * 2 - totalGaps;
    return Math.max(0, inner / count);
  }, [containerWidth, count]);

  useEffect(() => {
    const toX = padding + selectedIndex * (segmentWidth + gap);
    Animated.spring(thumbAnim, {
      toValue: toX,
      useNativeDriver: true,
      friction: 10,
      tension: 140,
    }).start();
  }, [selectedIndex, segmentWidth, thumbAnim]);

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  return (
    <View>
      <XStack
        onLayout={onLayout}
        position="relative"
        ai="center"
        bg="$gray3"
        br="$10"
        padding={padding}
        height={height + padding * 2}
      >
        {/* thumb */}
        {segmentWidth > 0 && (
          <Animated.View
            style={{
              position: 'absolute',
              top: padding,
              height,
              width: segmentWidth,
              borderRadius: 999,
              backgroundColor: 'white',
              transform: [{ translateX: thumbAnim }],
              // тонкая рамка и тень для объёма
              borderWidth: 1,
              borderColor: '#D4D4D8',
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 2,
            }}
          />
        )}

        {/* кнопки */}
        {options.map((opt, idx) => {
          const active = idx === selectedIndex;
          const label = getLabel ? getLabel(opt.code, opt.shortLabel) : opt.shortLabel;
          return (
            <Pressable
              key={opt.code}
              onPress={() => {
                if (!active) onChange(opt.code);
              }}
              style={{
                height,
                width: segmentWidth || undefined,
                flex: segmentWidth ? undefined : 1, // до измерения ширины
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: idx < count - 1 ? gap : 0,
                zIndex: 1, // выше "пальца"
              }}
            >
              <Text
                fontSize={13}
                fontWeight="700"
                // цвета читаемые и контрастные
                color={active ? '$gray12' : '$gray11'}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </XStack>
    </View>
  );
}
