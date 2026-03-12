import React from "react";
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  G,
  Circle,
  Rect,
  Ellipse,
} from "react-native-svg";

interface MascotProps {
  size?: number;
}

/**
 * KaytiPic camera mascot – converted from the Figma SVG.
 * Original viewBox is 360×360; `size` scales it uniformly.
 */
export function Mascot({ size = 120 }: MascotProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 360 360" fill="none">
      {/* Camera body */}
      <Path
        d="M259.2 126H100.8C84.894 126 72 138.894 72 154.8V259.2C72 275.106 84.894 288 100.8 288H259.2C275.106 288 288 275.106 288 259.2V154.8C288 138.894 275.106 126 259.2 126Z"
        fill="url(#mascot_body)"
      />
      {/* Top bar */}
      <Path
        opacity={0.8}
        d="M255.6 90H104.4C96.447 90 90 96.447 90 104.4V118.8C90 126.753 96.447 133.2 104.4 133.2H255.6C263.553 133.2 270 126.753 270 118.8V104.4C270 96.447 263.553 90 255.6 90Z"
        fill="url(#mascot_bar)"
      />
      {/* Lens outer */}
      <Circle cx={180} cy={205.2} r={54} fill="url(#mascot_lens)" />
      {/* Lens inner */}
      <Circle cx={180} cy={205.2} r={36} fill="#1E293B" opacity={0.6} />
      {/* Lens glare */}
      <Circle cx={169.2} cy={194.4} r={10.8} fill="white" opacity={0.7} />
      {/* Flash (yellow rectangle) */}
      <Rect x={234} y={100.8} width={28.8} height={21.6} rx={7.2} fill="#FCD34D" />
      {/* Red indicator dot */}
      <Circle cx={144} cy={108} r={10.8} fill="#F87171" />
      {/* Ears (dark circles) */}
      <Circle cx={136.8} cy={72} r={10.8} fill="#1E293B" />
      <Circle cx={216} cy={72} r={10.8} fill="#1E293B" />
      {/* Ear highlights */}
      <Circle cx={140.4} cy={68.4} r={5.4} fill="white" />
      <Circle cx={219.6} cy={68.4} r={5.4} fill="white" />
      {/* Ear connector */}
      <Rect x={126} y={64.8} width={21.6} height={14.4} fill="url(#mascot_connector)" />
      {/* Feet base */}
      <Ellipse cx={180} cy={316.8} rx={28.8} ry={21.6} fill="#1E293B" />
      {/* Feet top */}
      <Ellipse cx={180} cy={309.6} rx={21.6} ry={14.4} fill="#F87171" />
      {/* Cheeks */}
      <G opacity={0.6}>
        <Circle cx={90} cy={198} r={18} fill="#F87171" opacity={0.4} />
        <Circle cx={270} cy={198} r={18} fill="#F87171" opacity={0.4} />
      </G>
      {/* Sparkle left */}
      <Path
        d="M54 108L57.6 115.2L64.8 118.8L57.6 122.4L54 129.6L50.4 122.4L43.2 118.8L50.4 115.2L54 108Z"
        fill="#FCD34D"
      />
      {/* Sparkle right */}
      <Path
        d="M306 144L309.6 151.2L316.8 154.8L309.6 158.4L306 165.6L302.4 158.4L295.2 154.8L302.4 151.2L306 144Z"
        fill="#FCD34D"
      />

      <Defs>
        <SvgGradient id="mascot_body" x1="72" y1="126" x2="288" y2="288" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#8B5CF6" />
          <Stop offset={0.5} stopColor="#EC4899" />
          <Stop offset={1} stopColor="#3B82F6" />
        </SvgGradient>
        <SvgGradient id="mascot_bar" x1="90" y1="90" x2="270" y2="133.2" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#8B5CF6" />
          <Stop offset={0.5} stopColor="#EC4899" />
          <Stop offset={1} stopColor="#3B82F6" />
        </SvgGradient>
        <SvgGradient id="mascot_lens" x1="126" y1="151.2" x2="234" y2="259.2" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#60A5FA" />
          <Stop offset={1} stopColor="#3B82F6" />
        </SvgGradient>
        <SvgGradient id="mascot_connector" x1="126" y1="64.8" x2="147.6" y2="79.2" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#8B5CF6" />
          <Stop offset={0.5} stopColor="#EC4899" />
          <Stop offset={1} stopColor="#3B82F6" />
        </SvgGradient>
      </Defs>
    </Svg>
  );
}
