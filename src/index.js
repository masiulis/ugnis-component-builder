import ugnis from './ugnis'
import editor, {onlyEditor} from './editor'

// import devtoolsApp from '../ugnis_components/devtools.js'
// const app = ugnis(document.getElementById('app'), devtoolsApp)
// editor(app)

// const emptyApp = {
//     nodes: {
//         _rootNode: {
//             _type: 'vNode',
//             nodeType: 'box',
//             styleId: '_rootStyle',
//             childrenIds: [],
//         },
//     },
//     styles: {
//         _rootStyle: {
//             padding: '10px',
//             background: '#f5f5f5',
//         },
//     },
//     state: {
//         _rootState: {
//             title: 'root state',
//             stateType: 'nameSpace',
//             childrenIds: [],
//         },
//     },
//     mutators: {},
//     actions: {},
// }
// const app = ugnis(document.getElementById('app'), emptyApp)
// editor(app)

onlyEditor()