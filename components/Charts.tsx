import React from 'react';
import { Dimensions, View } from 'react-native';
import { LineChart, ProgressChart, BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;
const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(0, 175, 200, ${opacity})`, // brand teal
  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`, // neutral-500
  decimalPlaces: 0,
  propsForBackgroundLines: { stroke: '#e5e7eb' },
};

export function GradeTrend({ data }: { data: number[] }) {
  return (
    <View>
      <LineChart
        data={{ labels: data.map((_, i) => `${i + 1}`), datasets: [{ data }] }}
        width={screenWidth - 32}
        height={180}
        chartConfig={chartConfig}
        bezier
        withInnerLines
        withOuterLines={false}
        style={{ borderRadius: 16 }}
      />
    </View>
  );
}

export function CompletionBar({ values }: { values: number[] }) {
  return (
    <View>
      <BarChart
        data={{ labels: values.map((_, i) => `${i + 1}`), datasets: [{ data: values }] }}
        width={screenWidth - 32}
        height={180}
        chartConfig={chartConfig}
        fromZero
        yAxisLabel=""
        yAxisSuffix="%"
        style={{ borderRadius: 16 }}
      />
    </View>
  );
}

export function StudyProgress({ ratio }: { ratio: number }) {
  // ratio expected 0..1
  return (
    <View>
      <ProgressChart
        data={{ data: [Math.max(0, Math.min(1, ratio))] }}
        width={screenWidth - 32}
        height={160}
        strokeWidth={12}
        radius={48}
        chartConfig={chartConfig}
        hideLegend
        style={{ borderRadius: 16 }}
      />
    </View>
  );
}
