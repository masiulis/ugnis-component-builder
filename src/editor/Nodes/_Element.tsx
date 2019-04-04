import * as React from 'react'
import RootAtom from './Root'
import ImageAtom from './Image'
import BoxAtom from './Box'
import InputAtom from './Input'
import TextAtom from './Text'
import { Node, NodeTypes } from '@src/interfaces'
import state from '@state'

interface Props {
  component: Node
  parent: Node | null
}
function Element({ component, parent }: Props) {
  if (component.type === NodeTypes.Root) {
    return (
      <RootAtom component={component}>
        {component.children.map(node => (
          <Element component={node} parent={component} />
        ))}
      </RootAtom>
    )
  }
  if (component.type === NodeTypes.Element) {
    const element = { ...state.elements[component.elementType][component.elementId], position: component.position }
    return <Element component={element} parent={component} />
  }
  if (component.type === NodeTypes.Box) {
    return <BoxAtom component={component} parent={parent} />
  }
  if (component.type === NodeTypes.Text) {
    return <TextAtom component={component} parent={parent} />
  }
  if (component.type === NodeTypes.Input) {
    return <InputAtom component={component} parent={parent} />
  }
  if (component.type === NodeTypes.Image) {
    return <ImageAtom component={component} parent={parent} />
  }
}

export default Element
