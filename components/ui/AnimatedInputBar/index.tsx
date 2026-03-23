import React, { useState, useEffect, memo, useMemo } from "react";
import {
  TextInput,
  View,
  StyleSheet,
  TextStyle,
  ViewStyle,
  StyleProp,
} from "react-native";
import Animated, {
  withDelay,
  withSpring,
  withTiming,
  Easing,
  LinearTransition,
  useAnimatedProps,
  useSharedValue,
  interpolate,
  withSequence,
} from "react-native-reanimated";
import { BlurView, type BlurViewProps } from "expo-blur";
import { fonts, radius, spacing, type ColorTokens } from "@/constants/tokens";
import { useTheme } from '@/hooks/useTheme';
import type { ICharacter, IAnimatedInput } from "./types";

export type { IAnimatedInput, ICharacter } from "./types";

const AnimatedBlurView =
  Animated.createAnimatedComponent<BlurViewProps>(BlurView);

const Character: React.FC<ICharacter> & React.FunctionComponent<ICharacter> = ({
  char,
  index,
  enterDuration,
  exitDuration,
  delayIncrement,
  style,
}: ICharacter) => {
  const animationDelay = index * delayIncrement;

  const enteringAnimation = () => {
    "worklet";

    return {
      initialValues: {
        opacity: 0,
        transform: [{ translateY: 20 }, { scale: 0.5 }],
      },
      animations: {
        opacity: withDelay<number>(
          animationDelay,
          withTiming<number>(1, { duration: enterDuration }),
        ),
        transform: [
          {
            translateY: withDelay<number>(
              animationDelay,
              withSpring<number>(0, {
                damping: 15,
                stiffness: 150,
                mass: 0.9,
              }),
            ),
          },
          {
            scale: withDelay<number>(
              animationDelay,
              withSpring<number>(1, {
                damping: 15,
                stiffness: 150,
                mass: 0.9,
              }),
            ),
          },
        ],
      },
    };
  };

  const exitingAnimation = () => {
    "worklet";

    return {
      initialValues: {
        opacity: 1,
        transform: [{ translateY: 0 }, { scale: 1 }],
      },
      animations: {
        opacity: withDelay(
          animationDelay,
          withTiming(0, { duration: exitDuration }),
        ),
        transform: [
          {
            translateY: withDelay<number>(
              animationDelay,
              withTiming<number>(-5, { duration: exitDuration }),
            ),
          },
          {
            scale: withDelay<number>(
              animationDelay,
              withTiming<number>(0.5, { duration: exitDuration }),
            ),
          },
        ],
      },
    };
  };

  return (
    <Animated.Text
      entering={enteringAnimation}
      exiting={exitingAnimation}
      layout={LinearTransition.duration(180).easing(
        Easing.bezier(0.25, 0.1, 0.25, 1),
      )}
      style={style}
    >
      {char}
    </Animated.Text>
  );
};

const StaggeredPlaceholder: React.FC<{
  text: string;
  enterDuration: number;
  exitDuration: number;
  delayIncrement: number;
  style?: StyleProp<TextStyle>;
  wrapperStyle?: StyleProp<ViewStyle>;
}> = ({ text, enterDuration, exitDuration, delayIncrement, style, wrapperStyle }) => {
  const characters = Array.from(text);

  return (
    <Animated.View
      style={wrapperStyle}
      layout={LinearTransition.duration(300).easing(
        Easing.bezier(0.25, 0.1, 0.25, 1),
      )}
    >
      {characters.map((char, index) => (
        <Character
          key={`${char}-${index}-${text}`}
          char={char}
          index={index}
          enterDuration={enterDuration}
          exitDuration={exitDuration}
          delayIncrement={delayIncrement}
          style={style as TextStyle}
        />
      ))}
    </Animated.View>
  );
};

const AnimatedInput: React.FC<IAnimatedInput> &
  React.FunctionComponent<IAnimatedInput> = memo<IAnimatedInput>(
  ({
    placeholders,
    animationInterval = 3000,
    value,
    onChangeText,
    containerStyle = {
      width: "100%",
    },
    inputWrapperStyle,
    inputStyle,
    placeholderStyle,
    characterEnterDuration = 300,
    characterExitDuration = 200,
    characterDelayIncrement = 30,
    blurAnimationDuration = 400,
    blurIntensityRange = [0, 2.5, 4.5],
    blurProgressRange = [0, 0.2, 1],
    ...props
  }: IAnimatedInput): React.ReactNode &
    React.JSX.Element &
    React.ReactElement => {
    const { colors, isDark } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [isFocused, setIsFocused] = useState<boolean>(false);
    const [inputValue, setInputValue] = useState<string>(value || "");
    const [currentIndex, setCurrentIndex] = useState<number>(0);

    const blurProgress = useSharedValue<number>(0);

    useEffect(() => {
      if (isFocused || inputValue) return;

      blurProgress.value = withSequence<number>(
        withTiming<number>(1, {
          duration: blurAnimationDuration,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
        withTiming<number>(0, {
          duration: blurAnimationDuration,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
      );
    }, [currentIndex, blurAnimationDuration]);

    useEffect(() => {
      if (isFocused || inputValue) return;
      const timeout = setTimeout<[]>(() => {
        setCurrentIndex((prev) => (prev + 1) % placeholders.length);
      }, animationInterval);

      return () => clearTimeout(timeout);
    }, [
      currentIndex,
      isFocused,
      inputValue,
      placeholders.length,
      animationInterval,
    ]);

    const handleChangeText = (text: string) => {
      setInputValue(text);
      onChangeText?.(text);
    };

    const animatedBlurViewProps = useAnimatedProps(() => {
      const intensity = withSpring(
        interpolate(blurProgress.value, blurProgressRange, blurIntensityRange),
      );
      return {
        intensity,
      };
    });

    return (
      <View style={[styles.wrapper, containerStyle]}>
        <View style={[styles.inputWrapper, inputWrapperStyle]}>
          {!isFocused && !inputValue && (
            <StaggeredPlaceholder
              text={placeholders[currentIndex]}
              enterDuration={characterEnterDuration}
              exitDuration={characterExitDuration}
              delayIncrement={characterDelayIncrement}
              style={[styles.character, placeholderStyle] as any}
              wrapperStyle={styles.placeholderWrapper}
            />
          )}
          <AnimatedBlurView
            tint={isDark ? 'dark' : 'light'}
            style={[
              StyleSheet.absoluteFillObject,
              {
                overflow: "hidden",
              },
            ]}
            animatedProps={animatedBlurViewProps}
          />
          <TextInput
            style={[styles.input, inputStyle]}
            value={inputValue}
            onChangeText={handleChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholderTextColor="transparent"
            {...props}
          />
        </View>
      </View>
    );
  },
);

export default memo<
  React.FC<IAnimatedInput> & React.FunctionComponent<IAnimatedInput>
>(AnimatedInput);

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  wrapper: {
    marginVertical: spacing[2],
  },
  inputWrapper: {
    backgroundColor: colors["surface-container-low"],
    borderRadius: radius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    position: "relative",
    minHeight: 56,
    justifyContent: "center",
  },
  placeholderWrapper: {
    position: "absolute",
    left: spacing[4],
    flexDirection: "row",
    flexWrap: "wrap",
    pointerEvents: "none",
  },
  character: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors["outline-variant"],
  },
  input: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors["on-surface"],
    paddingVertical: 0,
  },
});
