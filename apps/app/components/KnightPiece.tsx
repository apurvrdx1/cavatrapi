import Svg, {
  Defs,
  Path,
  Rect,
  G,
  Filter,
  FeOffset,
  FeComposite,
  FeFlood,
  FeMerge,
  FeMergeNode,
  Ellipse,
  Circle,
} from 'react-native-svg'

const KNIGHT_BODY_D =
  'M 28,72 L 72,72 C 72,45 62,22 48,18 C 45,14 43,6 39,8 C 36,9 34,14 31,21 C 26,26 24,35 21,45 C 15,48 16,58 24,56 C 30,55 34,50 36,44 C 36,55 42,65 28,72 Z'

interface KnightPieceProps {
  color: string
  size?: number
}

export function KnightPiece({ color, size = 160 }: KnightPieceProps) {
  // Unique filter ID per color to avoid conflicts when multiple pieces are on screen
  const filterId = `ks-${color.replace('#', '')}`

  return (
    <Svg viewBox="0 0 100 100" width={size} height={size}>
      <Defs>
        <Filter id={filterId}>
          <FeOffset dx={-2} dy={-5} in="SourceAlpha" result="shifted" />
          <FeComposite operator="out" in="SourceAlpha" in2="shifted" result="bottom-sliver" />
          <FeFlood floodColor="#000000" floodOpacity={0.25} result="color" />
          <FeComposite operator="in" in="color" in2="bottom-sliver" result="shadow" />
          <FeMerge>
            <FeMergeNode in="SourceGraphic" />
            <FeMergeNode in="shadow" />
          </FeMerge>
        </Filter>
      </Defs>

      {/* Drop shadow */}
      <G
        transform="translate(6, 6)"
        fill="#0f172a"
        stroke="#0f172a"
        strokeWidth={4.5}
        strokeLinejoin="round"
        opacity={0.3}
      >
        <Rect x={20} y={75} width={60} height={15} rx={2} />
        <Path d={KNIGHT_BODY_D} />
      </G>

      {/* Filled shape with inset shadow */}
      <G fill={color} filter={`url(#${filterId})`}>
        <Rect x={20} y={75} width={60} height={15} rx={2} />
        <Path d={KNIGHT_BODY_D} />
      </G>

      {/* Dark outline */}
      <G fill="none" stroke="#1e293b" strokeWidth={4.5} strokeLinejoin="round">
        <Rect x={20} y={75} width={60} height={15} rx={2} />
        <Path d={KNIGHT_BODY_D} />
      </G>

      {/* Shine highlights */}
      <G fill="white" opacity={0.65}>
        <Ellipse cx={26} cy={34} rx={3} ry={9} transform="rotate(-20 26 34)" />
        <Rect x={24} y={77.5} width={14} height={3} rx={1.5} />
        <Circle cx={23} cy={51} r={1.5} opacity={0.4} />
      </G>
    </Svg>
  )
}

export const PLAYER_COLORS = [
  { name: 'Golden Yellow', hex: '#facc15', badgeBg: '#fefce8', badgeText: '#ca8a04' },
  { name: 'Royal Purple',  hex: '#a855f7', badgeBg: '#faf5ff', badgeText: '#9333ea' },
  { name: 'Ruby Red',      hex: '#ef4444', badgeBg: '#fef2f2', badgeText: '#dc2626' },
  { name: 'Emerald Green', hex: '#22c55e', badgeBg: '#f0fdf4', badgeText: '#16a34a' },
  { name: 'Cobalt Blue',   hex: '#3b82f6', badgeBg: '#eff6ff', badgeText: '#2563eb' },
] as const
