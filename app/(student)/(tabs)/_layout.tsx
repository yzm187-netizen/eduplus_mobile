import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

function TabBarIcon(props: { name: React.ComponentProps<typeof FontAwesome>['name']; color: string }) {
  return <FontAwesome size={24} style={{ marginBottom: -2 }} {...props} />;
}

export default function StudentTabsLayout() {
  return (
    <>
      {/* Local glow in student tabs */}
      <View style={{ position:'absolute', right:-60, top:140, width:200, height:200, borderRadius:100, backgroundColor:'rgba(0,175,200,0.2)' }} />
      <Tabs>
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} /> }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar', tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} /> }} />
      <Tabs.Screen name="scanner" options={{ title: 'Scanner', tabBarIcon: ({ color }) => <TabBarIcon name="qrcode" color={color} /> }} />
      <Tabs.Screen name="inbox" options={{ title: 'Inbox', tabBarIcon: ({ color }) => <TabBarIcon name="envelope" color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} /> }} />
      </Tabs>
    </>
  );
}
