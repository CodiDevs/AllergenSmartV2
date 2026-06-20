/**
 * AlergiMascot — SVG mascot component with 4 emotional states.
 * Animations:
 *   1. Floating (translateY loop)
 *   2. Blinking (ry of eye-white ellipses drops to 0 and back up)
 */
import React, { useEffect } from 'react';
import Svg, { Path, Circle, Ellipse, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';

// ── Animated SVG primitives ───────────────────────────────────────────────────
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

// ── Color palette per state ───────────────────────────────────────────────────
export type MascotState = 'blue' | 'green' | 'red' | 'amber';

interface AlergiMascotProps {
  state: MascotState;
  size?: number;
}

const MASCOT_COLORS = {
  blue:  { body: '#5A7BFA', highlight: '#8FABFF', eye: '#1A2D8C', cheek: '#7B9BFF' },
  green: { body: '#24C8A0', highlight: '#6FE2C8', eye: '#085041', cheek: '#3DCFB0' },
  red:   { body: '#E24B4A', highlight: '#FF9090', eye: '#791F1F', cheek: undefined  },
  amber: { body: '#EF9F27', highlight: '#FFD580', eye: '#633806', cheek: undefined  },
};

// Eye open radius per state (amber has bigger surprised eyes)
const EYE_OPEN_RY: Record<MascotState, number> = {
  blue: 5, green: 5, red: 5, amber: 6,
};

// ── Component ─────────────────────────────────────────────────────────────────
export function AlergiMascot({ state, size = 80 }: AlergiMascotProps) {
  const c = MASCOT_COLORS[state];
  const openRy = EYE_OPEN_RY[state];

  // ── 1. Floating animation ──────────────────────────────────────────────────
  const floatY = useSharedValue(0);

  // ── 2. Blink animation — shared value drives the eye-white vertical radius ─
  const eyeRy = useSharedValue(openRy);

  useEffect(() => {
    // Floating: loop up/down forever
    floatY.value = withRepeat(
      withTiming(-5, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // Blinking: wait 2.8s → close in 80ms → stay closed 60ms → open in 80ms → repeat
    // Using a second withRepeat so it fires independently of the float loop.
    eyeRy.value = withRepeat(
      withSequence(
        withDelay(2800, withTiming(0.3, { duration: 80, easing: Easing.out(Easing.quad) })),
        withTiming(openRy, { duration: 80, easing: Easing.in(Easing.quad) })
      ),
      -1,
      false
    );
  }, [openRy]);

  // ── Animated styles & props ───────────────────────────────────────────────
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  // Props for the left and right eye-white ellipses
  const leftEyeProps  = useAnimatedProps(() => ({ ry: eyeRy.value }));
  const rightEyeProps = useAnimatedProps(() => ({ ry: eyeRy.value }));

  // ── Eye Y positions per state ─────────────────────────────────────────────
  const eyeCy = state === 'green' ? 49 : 50;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Animated.View style={floatStyle}>
      <Svg width={size} height={size * 1.1} viewBox="0 0 80 88">

        {/* Body */}
        <Path
          d="M40 8 C40 8 14 32 14 50 C14 67 25 76 40 76 C55 76 66 67 66 50 C66 32 40 8 40 8Z"
          fill={c.body}
        />

        {/* Shine highlight */}
        <Ellipse
          cx={30} cy={34} rx={4} ry={7}
          fill={c.highlight} opacity={0.45}
          transform="rotate(-20 30 34)"
        />

        {/* ── BLUE state — happy ───────────────────────────────────────── */}
        {state === 'blue' && (
          <>
            {/* Eye whites (animated for blink) */}
            <AnimatedEllipse cx={33} cy={eyeCy} rx={5} animatedProps={leftEyeProps}  fill="white" />
            <AnimatedEllipse cx={47} cy={eyeCy} rx={5} animatedProps={rightEyeProps} fill="white" />
            {/* Pupils */}
            <Circle cx={34.5} cy={51} r={2.5} fill={c.eye} />
            <Circle cx={48.5} cy={51} r={2.5} fill={c.eye} />
            {/* Pupil shine */}
            <Circle cx={35.5} cy={50} r={1} fill="white" />
            <Circle cx={49.5} cy={50} r={1} fill="white" />
            {/* Happy smile */}
            <Path d="M34 57 Q40 63 46 57" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" />
            {/* Cheeks */}
            <Ellipse cx={29} cy={57} rx={3.5} ry={2} fill={c.cheek!} opacity={0.5} />
            <Ellipse cx={51} cy={57} rx={3.5} ry={2} fill={c.cheek!} opacity={0.5} />
          </>
        )}

        {/* ── GREEN state — very happy ─────────────────────────────────── */}
        {state === 'green' && (
          <>
            <AnimatedEllipse cx={33} cy={eyeCy} rx={5} animatedProps={leftEyeProps}  fill="white" />
            <AnimatedEllipse cx={47} cy={eyeCy} rx={5} animatedProps={rightEyeProps} fill="white" />
            <Circle cx={34.5} cy={50} r={2.5} fill={c.eye} />
            <Circle cx={48.5} cy={50} r={2.5} fill={c.eye} />
            <Circle cx={35.5} cy={49} r={1}   fill="white" />
            <Circle cx={49.5} cy={49} r={1}   fill="white" />
            {/* Big smile */}
            <Path d="M33 57 Q40 65 47 57" fill="none" stroke="white" strokeWidth={2.2} strokeLinecap="round" />
            {/* Cheeks */}
            <Ellipse cx={28} cy={57} rx={3.5} ry={2.2} fill={c.cheek!} opacity={0.55} />
            <Ellipse cx={52} cy={57} rx={3.5} ry={2.2} fill={c.cheek!} opacity={0.55} />
            {/* Waving arm */}
            <Path d="M66 46 C72 42 75 37 72 33 C69 30 65 33 63 38" fill={c.body} stroke="#1D9E75" strokeWidth={1} />
            <Ellipse cx={71} cy={33} rx={4.5} ry={4.5} fill={c.body} stroke="#1D9E75" strokeWidth={1} />
          </>
        )}

        {/* ── RED state — worried / danger ─────────────────────────────── */}
        {state === 'red' && (
          <>
            {/* Worried eyebrows */}
            <Line x1={29} y1={44} x2={37} y2={46} stroke="white" strokeWidth={1.8} strokeLinecap="round" />
            <Line x1={43} y1={46} x2={51} y2={44} stroke="white" strokeWidth={1.8} strokeLinecap="round" />
            {/* Eye whites (animated) */}
            <AnimatedEllipse cx={33} cy={eyeCy} rx={5} animatedProps={leftEyeProps}  fill="white" />
            <AnimatedEllipse cx={47} cy={eyeCy} rx={5} animatedProps={rightEyeProps} fill="white" />
            <Circle cx={33} cy={51} r={2.5} fill={c.eye} />
            <Circle cx={47} cy={51} r={2.5} fill={c.eye} />
            {/* Sad mouth */}
            <Path d="M34 60 Q40 55 46 60" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" />
            {/* Sweat drop */}
            <Path d="M58 28 C58 28 56 32 59 34 C62 32 60 28 58 28Z" fill={c.highlight} opacity={0.7} />
          </>
        )}

        {/* ── AMBER state — surprised / caution ───────────────────────── */}
        {state === 'amber' && (
          <>
            {/* Wide surprised eyes (bigger radius) */}
            <AnimatedEllipse cx={33} cy={eyeCy} rx={6} animatedProps={leftEyeProps}  fill="white" />
            <AnimatedEllipse cx={47} cy={eyeCy} rx={6} animatedProps={rightEyeProps} fill="white" />
            <Circle cx={33} cy={50} r={3}   fill={c.eye} />
            <Circle cx={47} cy={50} r={3}   fill={c.eye} />
            <Circle cx={34} cy={49} r={1.2} fill="white" />
            <Circle cx={48} cy={49} r={1.2} fill="white" />
            {/* Surprised "O" mouth */}
            <Ellipse cx={40} cy={60} rx={4} ry={3} fill="white" opacity={0.9} />
          </>
        )}

      </Svg>
    </Animated.View>
  );
}
