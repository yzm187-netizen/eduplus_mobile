import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Animated, View } from 'react-native';
import Swipeable from 'react-native-swipeable';

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
  onPanAnimatedValueRef?: (val: Animated.ValueXY) => void;
  onSwipeStart?: () => void;
  onSwipeRelease?: () => void;
  onRightButtonsOpenRelease?: () => void;
  onRightButtonsCloseRelease?: () => void;
  containerStyle?: any;
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
    },
    ref
  ) => {
    const swipeRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      recenter: () => {
        try {
          swipeRef.current?.recenter?.();
        } catch {}
      },
    }));

    return (
      <View style={[{ overflow: 'hidden' }, containerStyle]}>
        <Swipeable
          onRef={(r: any) => (swipeRef.current = r)}
          leftButtons={leftButtons}
          leftButtonWidth={leftButtonWidth}
          leftActionActivationDistance={leftActionActivationDistance}
          rightButtons={rightButtons}
          rightButtonWidth={rightButtonWidth}
          rightActionActivationDistance={rightActionActivationDistance}
          onSwipeStart={onSwipeStart}
          onSwipeRelease={onSwipeRelease}
          onRightButtonsOpenRelease={onRightButtonsOpenRelease}
          onRightButtonsCloseRelease={onRightButtonsCloseRelease}
          onPanAnimatedValueRef={(v: Animated.ValueXY) => onPanAnimatedValueRef && onPanAnimatedValueRef(v)}
        >
          {children}
        </Swipeable>
      </View>
    );
  }
);

export default SwipeableRow;
