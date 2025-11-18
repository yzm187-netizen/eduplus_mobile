import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';
import { Swipeable as GhSwipeable } from 'react-native-gesture-handler';

export type SwipeableRowHandle = {
  recenter: () => void;
};

export type SwipeableRowProps = {
  children: React.ReactNode;
  leftButtons?: React.ReactNode[];
  leftButtonWidth?: number;
  leftActionActivationDistance?: number;
  rightButtons?: React.ReactNode[];
  rightButtonWidth?: number; // width for each right button
  rightActionActivationDistance?: number; // min distance to open actions
  // Expose pan animated value for upstream effects (e.g., fading icons)
  onPanAnimatedValueRef?: (val: any) => void;
  onSwipeStart?: () => void;
  onSwipeRelease?: () => void;
  onRightButtonsOpenRelease?: () => void;
  onRightButtonsCloseRelease?: () => void;
  containerStyle?: any;
  useNativeDriver?: boolean;
};

const SwipeableRow = forwardRef<SwipeableRowHandle, SwipeableRowProps>(
  (
    {
      children,
      leftButtons,
      leftButtonWidth = 64,
      leftActionActivationDistance = 80,
      rightButtons,
      rightButtonWidth = 64,
      rightActionActivationDistance = 80,
      onPanAnimatedValueRef,
      onSwipeStart,
      onSwipeRelease,
      onRightButtonsOpenRelease,
      onRightButtonsCloseRelease,
      containerStyle,
      useNativeDriver = true,
    },
    ref
  ) => {
    const swipeRef = useRef<GhSwipeable | null>(null);

    useImperativeHandle(ref, () => ({
      recenter: () => {
        try {
          swipeRef.current?.close?.();
        } catch {}
      },
    }));

    return (
      <View style={[{ overflow: 'hidden', width: '100%', alignSelf: 'stretch' }, containerStyle]}>
        <GhSwipeable
          ref={(r) => { swipeRef.current = r; }}
          friction={2}
          leftThreshold={leftActionActivationDistance}
          rightThreshold={rightActionActivationDistance}
          containerStyle={{ width: '100%' }}
          childrenContainerStyle={{ flex: 1, width: '100%', alignSelf: 'stretch' }}
          renderLeftActions={leftButtons && leftButtons.length ? () => (
            <View style={{ flexDirection: 'row', height: '100%' }}>
              {leftButtons.map((btn, i) => (
                <View key={i} style={{ width: leftButtonWidth, height: '100%', justifyContent: 'center' }}>
                  {btn}
                </View>
              ))}
            </View>
          ) : undefined}
          renderRightActions={rightButtons && rightButtons.length ? () => (
            <View style={{ flexDirection: 'row', height: '100%' }}>
              {rightButtons.map((btn, i) => (
                <View key={i} style={{ width: rightButtonWidth, height: '100%', justifyContent: 'center' }}>
                  {btn}
                </View>
              ))}
            </View>
          ) : undefined}
          onSwipeableWillOpen={() => { onSwipeStart?.(); }}
          onSwipeableOpen={(direction) => { if (direction === 'right') onRightButtonsOpenRelease?.(); }}
          onSwipeableWillClose={() => { onSwipeRelease?.(); }}
          onSwipeableClose={() => { onRightButtonsCloseRelease?.(); }}
        >
          <View style={{ flex: 1, width: '100%' }}>
            {children}
          </View>
        </GhSwipeable>
      </View>
    );
  }
);

export default SwipeableRow;
