import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

function TabBarIcon(props: { name: React.ComponentProps<typeof FontAwesome>['name']; color: string }) {
  return <FontAwesome size={24} style={{ marginBottom: -2 }} {...props} />;
}

export default function TeacherTabsLayout() {
  return (
    <>
      <View style={{ position:'absolute', left:-60, top:100, width:220, height:220, borderRadius:110, backgroundColor:'rgba(0,175,200,0.18)' }} />
      <Tabs>
        <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color }) => <TabBarIcon name="line-chart" color={color} /> }} />
        <Tabs.Screen name="my-courses" options={{ title: 'Courses', tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color} /> }} />
        <Tabs.Screen name="calendar" options={{ title: 'Calendar', tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} /> }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} /> }} />
      </Tabs>
    </>
  );
}
