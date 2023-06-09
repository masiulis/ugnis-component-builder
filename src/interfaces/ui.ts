import { EditableNodes, Nodes, RootNode } from '@src/interfaces/nodes'
import { ElementType } from '@src/interfaces/elements'

export enum DragDirection {
  N = 'N',
  NE = 'NE',
  NW = 'NW',
  W = 'W',
  E = 'E',
  S = 'S',
  SW = 'SW',
  SE = 'SE',
}

export type ComponentStateMenu = string

export interface AddingAtom {
  node: Nodes
  x: number
  y: number
  width: number
  height: number
}

export interface HoveredCell {
  rowIndex: number
  colIndex: number
}

export interface UI {
  editingColorId: string
  editingTextNode: Nodes
  addingElement: ElementType | null
  showAddComponentMenu: boolean
  showExportMenu: boolean
  showGrid: boolean
  selectedNode: EditableNodes
  selectedNodeToOverride: Nodes
  expandingNode: {
    node: Nodes
    parent: RootNode
    direction: DragDirection
  }
  draggingNode: AddingAtom
  addingAtom: AddingAtom
  hoveredCell: HoveredCell
  selectedCell: HoveredCell
  stateManager: ComponentStateMenu
  zoom: number
  tilted: boolean
}
