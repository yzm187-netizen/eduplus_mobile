import React from 'react';
import { View, Text, Image } from 'react-native';

type Person = { id: string; name: string; role?: 'student' | 'teacher'; avatarUrl?: string };

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function hashColor(id: string) {
  // Simple deterministic pastel-ish colors from id
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 70% 40%)`;
}

export default function AvatarGroup({ people, max = 4, size = 20, overlap = 8 }: { people: Person[]; max?: number; size?: number; overlap?: number }) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <View className="flex-row items-center">
      {shown.map((p, i) => {
        const styleBase = { width: size, height: size, marginLeft: i === 0 ? 0 : -overlap } as const;
        if (p.avatarUrl) {
          return (
            <Image
              key={p.id}
              source={{ uri: p.avatarUrl }}
              style={[styleBase, { borderRadius: size / 2 }]}
              className="border border-white dark:border-black"
            />
          );
        }
        return (
          <View
            key={p.id}
            style={{ ...styleBase, backgroundColor: hashColor(p.id) }}
            className="rounded-full items-center justify-center border border-white dark:border-black"
          >
            <Text style={{ fontSize: size * 0.45 }} className="text-white font-semibold">
              {getInitials(p.name)}
            </Text>
          </View>
        );
      })}
      {extra > 0 && (
        <View
          style={{ width: size, height: size, marginLeft: shown.length === 0 ? 0 : -overlap }}
          className="rounded-full items-center justify-center bg-neutral-300 dark:bg-neutral-700 border border-white dark:border-black"
        >
          <Text style={{ fontSize: size * 0.45 }} className="text-neutral-800 dark:text-neutral-100 font-semibold">+{extra}</Text>
        </View>
      )}
    </View>
  );
}
