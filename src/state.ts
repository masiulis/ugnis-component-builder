import { proxify } from 'lape'
import {
  FontSizeName,
  RouterPaths,
  SpacingSizeName,
  State,
  NodeTypes,
  ViewTypes,
  ComponentView,
  Node,
} from '@src/interfaces'

const defaultState: State = {
  router: {
    path: RouterPaths.component,
    componentId: 'abcd-1234',
  },
  components: {
    'abcd-1234': {
      name: 'Button',
      viewMode: ViewTypes.SingleCenter,
      root: {
        id: 'rootId',
        type: NodeTypes.Root,
        position: {
          top: 0,
          left: 0,
        },
        size: {
          width: 254,
          height: 254,
        },
        background: {
          color: '#49c67f',
        },
        children: [
          {
            id: '423423dsfs',
            type: NodeTypes.Box,
            position: {
              top: 0,
              left: 0,
            },
            size: {
              width: 50,
              height: 50,
            },
            background: {
              color: '#497fc6',
            },
            children: [],
          },
          {
            id: 'text1343',
            type: NodeTypes.Text,
            fontSize: FontSizeName.XL,
            text: 'Hello',
            size: {
              width: 254,
              height: 254,
            },
            position: {
              top: 0,
              left: 0,
            },
            children: [],
          },
        ],
      },
    },
    'ergefe-4356': {
      name: 'Link',
      viewMode: ViewTypes.SingleCenter,
      root: {
        id: 'rootId',
        type: NodeTypes.Root,
        position: {
          top: 0,
          left: 0,
        },
        size: {
          width: 254,
          height: 254,
        },
        background: {
          color: '#49c67f',
        },
        children: [
          {
            id: '423423dsfs',
            type: NodeTypes.Box,
            position: {
              top: 0,
              left: 0,
            },
            size: {
              width: 50,
              height: 50,
            },
            background: {
              color: '#497fc6',
            },
            children: [],
          },
        ],
      },
    },
    'wefwef-2344': {
      name: 'Icon',
      viewMode: ViewTypes.SingleCenter,
      root: {
        id: 'rootId',
        type: NodeTypes.Root,
        position: {
          top: 0,
          left: 0,
        },
        size: {
          width: 254,
          height: 254,
        },
        background: {
          color: '#49c67f',
        },
        children: [
          {
            id: 'text1343',
            type: NodeTypes.Text,
            fontSize: FontSizeName.XL,
            text: 'Hello',
            position: {
              top: 0,
              left: 0,
            },
            size: {
              width: 254,
              height: 254,
            },
            children: [],
          },
        ],
      },
    },
  },
  pages: {},
  colors: {
    'vava-1823': {
      name: 'Pink',
      hex: '#f78888',
    },
    'blas-9999': {
      name: 'Yellow',
      hex: '#f3d250',
    },
    'hhhh-1000': {
      name: 'Light grey',
      hex: '#ececec',
    },
    'aaaa-9994': {
      name: 'Light blue',
      hex: '#90ccf4',
    },
    'bbbb-9949': {
      name: 'Blue',
      hex: '#5da2d5',
    },
  },
  spacing: {
    [SpacingSizeName.XS]: '8px',
    [SpacingSizeName.S]: '16px',
    [SpacingSizeName.M]: '24px',
    [SpacingSizeName.L]: '48px',
    [SpacingSizeName.XL]: '64px',
  },
  font: {
    fontName: 'Roboto',
    fontUrl: 'https://fonts.googleapis.com/css?family=Roboto',
    sizes: {
      [FontSizeName.XS]: {
        fontSize: '12px',
        lineHeight: '1.2em',
      },
      [FontSizeName.S]: {
        fontSize: '16px',
        lineHeight: '1.2em',
      },
      [FontSizeName.M]: {
        fontSize: '24px',
        lineHeight: '1.2em',
      },
      [FontSizeName.L]: {
        fontSize: '38px',
        lineHeight: '1.2em',
      },
      [FontSizeName.XL]: {
        fontSize: '50px',
        lineHeight: '1.2em',
      },
    },
  },
  ui: {
    editingColorId: '',
    componentView: ComponentView.Center,
    editingTextNode: {} as Node,
    addingComponent: false,
    addingPage: false,
    showAddComponentMenu: false,
    selectedNode: {} as Node,
  },
}

export default proxify(defaultState)
