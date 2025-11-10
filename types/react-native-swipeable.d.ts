declare module 'react-native-swipeable' {
  import * as React from 'react';
  import { Animated, ViewStyle } from 'react-native';

  export interface SwipeableProps {
    children?: React.ReactNode;
    leftContent?: React.ReactNode;
    rightContent?: React.ReactNode;
    leftButtons?: React.ReactNode[];
    rightButtons?: React.ReactNode[];
    leftActionActivationDistance?: number;
    rightActionActivationDistance?: number;
    leftButtonWidth?: number;
    rightButtonWidth?: number;
    onSwipeStart?: () => void;
    onSwipeRelease?: () => void;
    onLeftActionRelease?: () => void;
    onRightActionRelease?: () => void;
    onRightButtonsOpenRelease?: () => void;
    onRightButtonsCloseRelease?: () => void;
    onRef?: (ref: any) => void;
    onPanAnimatedValueRef?: (val: Animated.ValueXY) => void;
    style?: ViewStyle;
  }

  export default class Swipeable extends React.Component<SwipeableProps> {
    recenter(): void;
  }
}
