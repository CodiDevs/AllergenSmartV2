/**
 * AlergiMascot — SVG mascot component with 4 emotional states
 * Faithfully replicated from smartallergen_alergi_system.html
 */
import React, { useEffect } from 'react';
import Svg, { Path, Circle, Ellipse, Line, Text as SvgText } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

export type MascotState = 'blue' | 'green' | 'red' | 'amber';

interface AlergiMascotProps {
  state: MascotState;
  size?: number;
}

const MASCOT_COLORS = {
  blue: {
    body: '#5A7BFA',
    highlight: '#8FABFF',
    eye: '#1A2D8C',
    cheek: '#7B9BFF',
  },
  green: {
    body: '#24C8A0',
    highlight: '#6FE2C8',
    eye: '#085041',
    cheek: '#3DCFB0',
  },
  red: {
    body: '#E24B4A',
    highlight: '#FF9090',
    eye: '#791F1F',
    cheek: undefined,
  },
  amber: {
    body: '#EF9F27',
    highlight: '#FFD580',
    eye: '#633806',
    cheek: undefined,
  },
};

export function AlergiMascot({ state, size = 80 }: AlergiMascotProps) {
  const c = MASCOT_COLORS[state];
  const scale = size / 80;

  // Floating animation setup
  const floatValue = useSharedValue(0);

  useEffect(() => {
    floatValue.value = withRepeat(
      withTiming(-5, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      -1, // infinite
      true // reverse
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatValue.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Svg width={size} height={size * 1.1} viewBox="0 0 80 88">
        {/* Body */}
      <Path
        d="M40 8 C40 8 14 32 14 50 C14 67 25 76 40 76 C55 76 66 67 66 50 C66 32 40 8 40 8Z"
        fill={c.body}
      />
      {/* Highlight */}
      <Ellipse
        cx={30}
        cy={34}
        rx={4}
        ry={7}
        fill={c.highlight}
        opacity={0.45}
        transform="rotate(-20 30 34)"
      />

      {state === 'blue' && (
        <>
          {/* Happy eyes */}
          <Circle cx={33} cy={50} r={5} fill="white" />
          <Circle cx={47} cy={50} r={5} fill="white" />
          <Circle cx={34.5} cy={51} r={2.5} fill={c.eye} />
          <Circle cx={48.5} cy={51} r={2.5} fill={c.eye} />
          <Circle cx={35.5} cy={50} r={1} fill="white" />
          <Circle cx={49.5} cy={50} r={1} fill="white" />
          {/* Happy smile */}
          <Path
            d="M34 57 Q40 63 46 57"
            fill="none"
            stroke="white"
            strokeWidth={2}
            strokeLinecap="round"
          />
          {/* Cheeks */}
          <Ellipse cx={29} cy={57} rx={3.5} ry={2} fill={c.cheek} opacity={0.5} />
          <Ellipse cx={51} cy={57} rx={3.5} ry={2} fill={c.cheek} opacity={0.5} />
        </>
      )}

      {state === 'green' && (
        <>
          {/* Very happy eyes */}
          <Circle cx={33} cy={49} r={5} fill="white" />
          <Circle cx={47} cy={49} r={5} fill="white" />
          <Circle cx={34.5} cy={50} r={2.5} fill={c.eye} />
          <Circle cx={48.5} cy={50} r={2.5} fill={c.eye} />
          <Circle cx={35.5} cy={49} r={1} fill="white" />
          <Circle cx={49.5} cy={49} r={1} fill="white" />
          {/* Big smile */}
          <Path
            d="M33 57 Q40 65 47 57"
            fill="none"
            stroke="white"
            strokeWidth={2.2}
            strokeLinecap="round"
          />
          {/* Cheeks */}
          <Ellipse cx={28} cy={57} rx={3.5} ry={2.2} fill={c.cheek} opacity={0.55} />
          <Ellipse cx={52} cy={57} rx={3.5} ry={2.2} fill={c.cheek} opacity={0.55} />
          {/* Waving arm */}
          <Path
            d="M66 46 C72 42 75 37 72 33 C69 30 65 33 63 38"
            fill={c.body}
            stroke="#1D9E75"
            strokeWidth={1}
          />
          <Ellipse cx={71} cy={33} rx={4.5} ry={4.5} fill={c.body} stroke="#1D9E75" strokeWidth={1} />
        </>
      )}

      {state === 'red' && (
        <>
          {/* Worried eyebrows */}
          <Line x1={29} y1={44} x2={37} y2={46} stroke="white" strokeWidth={1.8} strokeLinecap="round" />
          <Line x1={43} y1={46} x2={51} y2={44} stroke="white" strokeWidth={1.8} strokeLinecap="round" />
          {/* Worried eyes */}
          <Circle cx={33} cy={50} r={5} fill="white" />
          <Circle cx={47} cy={50} r={5} fill="white" />
          <Circle cx={33} cy={51} r={2.5} fill={c.eye} />
          <Circle cx={47} cy={51} r={2.5} fill={c.eye} />
          {/* Sad mouth */}
          <Path
            d="M34 60 Q40 55 46 60"
            fill="none"
            stroke="white"
            strokeWidth={2}
            strokeLinecap="round"
          />
          {/* Sweat drop */}
          <Path
            d="M58 28 C58 28 56 32 59 34 C62 32 60 28 58 28Z"
            fill={c.highlight}
            opacity={0.7}
          />
        </>
      )}

      {state === 'amber' && (
        <>
          {/* Surprised wide eyes */}
          <Circle cx={33} cy={50} r={6} fill="white" />
          <Circle cx={47} cy={50} r={6} fill="white" />
          <Circle cx={33} cy={50} r={3} fill={c.eye} />
          <Circle cx={47} cy={50} r={3} fill={c.eye} />
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
