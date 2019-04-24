import * as React from 'react'
import RootAtom from './Root'
import IconAtom from './Icon'
import BoxAtom from './Box'
import InputAtom from './Input'
import TextAtom from './Text'
import { ElementNode, Nodes, NodeTypes, RootNode } from '@src/Interfaces/nodes'
import state from '@state'

// element -> root node ->                       text node
//                                               ^       ^
//                                              /         \
//                            onDrag - change position  onclick - change style

const element = {
  id: 'button',
  name: 'button',
  root: {
    id: 'root',
    type: 'root',
    children: [
      {
        type: 'box',
        id: 'background',
      },
      {
        type: 'text',
        id: 'buttonText',
        text: 'hello',
      },
    ],
  },
}

// component -> root node ->                    element node           -> element -> root node -> text node
//                                               ^       ^
//                                              /         \
//                            onDrag - change position  onclick - add override

const component = {
  id: 'AppBar',
  name: 'App bar test',
  root: {
    type: 'root',
    children: [
      {
        id: '123213',
        type: 'element',
        elementId: 'button',
        overrides: {
          // overrides exposed by elements are also overrides exposed by component
          buttonText: { text: 'goodbye' }, // <- find by id and merge
        },
      },
      {
        id: '3232323',
        type: 'text',
        text: 'componentText',
      },
    ],
  },
}

// page -> rootNode ->                          componentNode          -> component -> root node -> element node -> element -> root node -> text node
//                                               ^       ^
//                                              /         \
//                            onDrag - change position  onclick - add override

const Page = {
  id: 'Page',
  name: 'Page page',
  root: {
    type: 'root',
    children: [
      {
        type: 'component',
        id: 'AppBar',
        overrides: {
          3232323: { text: 'goodbye' }, // <- find by id and merge
          buttonText: { text: 'goodbye' }, // <- find by id, if no id, look for elements and merge
        },
      },
      {
        type: 'element',
        id: 'button',
        overrides: {
          buttonText: { text: 'cancel' }, // <- find by id and merge
        },
      },
      {
        type: 'text',
        text: 'componentText',
      },
    ],
  },
}

interface Props {
  component: Nodes
  parent: ElementNode | null
}

function Element({ component, parent }: Props) {
  if (component.type === NodeTypes.Root) {
    // when clicked check if overridable, when dragged - reposition element
    return (
      <RootAtom component={component}>
        {component.children.map(node => (
          <Element component={node} parent={parent} />
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
  if (component.type === NodeTypes.Icon) {
    return <IconAtom component={component} parent={parent} />
  }
}

export default Element
