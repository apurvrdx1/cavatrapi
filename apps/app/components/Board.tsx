import { View, Text, Pressable, StyleSheet } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { KnightPiece } from './KnightPiece'
import type { BoardState } from '@cavatrapi/engine'
import type { Square } from '@cavatrapi/shared'

const P1_COLOR = '#8b5cf6'
const P2_COLOR = '#facc15'
const P1_CLAIMED = '#a78bfa'
const P2_CLAIMED = '#fde047'

interface BoardProps {
  state: BoardState
  validMoves: Square[]
  onMove: (sq: Square) => void
  cellSize: number
}

function squareEq(a: Square, b: Square) {
  return a.row === b.row && a.col === b.col
}

export function Board({ state, validMoves, onMove, cellSize }: BoardProps) {
  const { claimed, positions } = state

  function cellBg(row: number, col: number): object {
    const owner = claimed[row]![col]
    const isP1Pos = squareEq(positions.P1, { row, col })
    const isP2Pos = squareEq(positions.P2, { row, col })
    const isLegal = validMoves.some((sq) => squareEq(sq, { row, col }))
    const light = (row + col) % 2 === 0

    if (isP1Pos) return light ? styles.cellLight : styles.cellDark
    if (isP2Pos) return light ? styles.cellLight : styles.cellDark
    if (owner === 'P1') return styles.cellP1
    if (owner === 'P2') return styles.cellP2
    if (isLegal) return styles.cellLegal
    return light ? styles.cellLight : styles.cellDark
  }

  function renderCellContent(row: number, col: number) {
    const sq = { row, col }
    const isP1Pos = squareEq(positions.P1, sq)
    const isP2Pos = squareEq(positions.P2, sq)
    const isLegal = validMoves.some((s) => squareEq(s, sq))
    const pieceSize = cellSize * 0.92

    if (isP1Pos) return <KnightPiece color={P1_COLOR} size={pieceSize} />
    if (isP2Pos) return <KnightPiece color={P2_COLOR} size={pieceSize} />
    if (isLegal) {
      return (
        <MaterialCommunityIcons
          name="check-bold"
          size={cellSize * 0.46}
          color="#16a34a"
        />
      )
    }
    return null
  }

  const boardSize = cellSize * 8

  return (
    <View style={[styles.boardBorder, { width: boardSize, height: boardSize }]}>
      {Array.from({ length: 8 }, (_, row) => (
        <View key={row} style={{ flexDirection: 'row' }}>
          {Array.from({ length: 8 }, (_, col) => {
            const sq = { row, col }
            const isLegal = validMoves.some((s) => squareEq(s, sq))
            return (
              <Pressable
                key={col}
                style={[styles.cell, cellBg(row, col), { width: cellSize, height: cellSize }]}
                onPress={() => isLegal && onMove(sq)}
              >
                {renderCellContent(row, col)}
              </Pressable>
            )
          })}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  boardBorder: {
    borderWidth: 3,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellLight: { backgroundColor: '#eef3f8' },
  cellDark:  { backgroundColor: '#b8cfe0' },
  cellP1: { backgroundColor: P1_CLAIMED },
  cellP2: { backgroundColor: P2_CLAIMED },
  cellLegal:  { backgroundColor: 'rgba(74, 222, 128, 0.28)' },
})
