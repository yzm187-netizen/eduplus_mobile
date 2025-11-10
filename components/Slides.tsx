import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';

type Deck = {
  title?: string;
  courseId?: string;
  theme?: { accent?: string };
  slides: Array<
    | { type: 'title'; title: string; subtitle?: string }
    | { type: 'bullets'; title?: string; items?: string[] }
  >;
};

function parseColor(hex?: string) {
  if (!hex) return '#0ea5e9';
  return hex;
}

export default function Slides({ deck }: { deck: Deck }) {
  const [idx, setIdx] = useState(0);
  const slide = deck.slides[idx];
  const accent = parseColor(deck.theme?.accent);

  const total = deck.slides.length;
  const prev = () => setIdx((i) => Math.max(0, i - 1));
  const next = () => setIdx((i) => Math.min(total - 1, i + 1));

  return (
    <View className="flex-1">
      {/* Accent bar */}
      <View style={{ height: 4, backgroundColor: accent }} />

      {/* Slide content */}
      <View className="flex-1 px-6 py-5">
        {slide?.type === 'title' ? (
          <View className="flex-1">
            <Text className="text-3xl font-extrabold mb-2">{slide.title}</Text>
            {slide.subtitle ? <Text className="text-lg text-neutral-500 dark:text-neutral-400 mb-4">{slide.subtitle}</Text> : null}
            {(deck.title || deck.courseId) ? (
              <Text className="mt-auto text-xs text-neutral-400">{[deck.courseId, deck.title].filter(Boolean).join(' • ')}</Text>
            ) : null}
          </View>
        ) : (
          <View className="flex-1">
            {('title' in slide) && slide.title ? (
              <Text className="text-2xl font-bold mb-3">{slide.title}</Text>
            ) : null}
            <View className="gap-2">
              {('items' in slide ? slide.items || [] : []).map((it, i) => (
                <View key={i} className="flex-row">
                  <Text className="text-xl mr-2">-</Text>
                  <Text className="text-xl flex-1">{it}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Controls */}
        <View className="mt-4 flex-row items-center justify-between">
          <Pressable onPress={prev} disabled={idx === 0} className={`px-4 py-2 rounded-xl ${idx === 0 ? 'bg-neutral-300' : 'bg-neutral-800'}`}>
            <Text className="text-white">Prev</Text>
          </Pressable>
          <Text className="text-neutral-500">{idx + 1} / {total}</Text>
          <Pressable onPress={next} disabled={idx === total - 1} className={`px-4 py-2 rounded-xl ${idx === total - 1 ? 'bg-neutral-300' : 'bg-[#00AFC8]'}`}>
            <Text className="text-white">Next</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
