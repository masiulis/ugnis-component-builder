import * as React from 'react'
import styled from 'styled-components'
import state from '@state'
import { Border, ComponentView } from '@src/interfaces'

const TopBarBox = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 8px 22px;
  background: rgb(248, 248, 248);
  box-shadow: inset 0 -1px 0 0 rgb(0, 0, 0, 0.113);
  flex: 0 0 50px;
  display: flex;
  align-items: center;
  font-size: 24px;
  user-select: none;
`

const Divider = styled.div`
  width: 3px;
  height: 85%;
  flex: 0 0 2px;
  background: #dfdfdf;
  border-radius: 5px;
  margin: 0 4px;
`

const ColorBox = styled.div`
  width: 24px;
  height: 24px;
  background: ${({ color }: any) => color};
  cursor: pointer;
`

const BorderBox = styled.div`
  border: ${({ border }) => border.style};
  border-radius: ${({ border }) => border.radius};
  width: 25px;
  height: 25px;
`


const selectComponentView = (view: ComponentView) => () => {
  state.ui.componentView = view
}

const showAddComponentMenu = () => {
  state.ui.showAddComponentMenu = !state.ui.showAddComponentMenu
}

const changeBackground = (colorId: string) => () => {
  state.ui.selectedNode.background.colorId = colorId
}

const changeBorder = (border: Border) => () => {
  state.ui.selectedNode.border = border.id
}

const TopBar = () => (
  <TopBarBox>
    <i className="material-icons" onClick={showAddComponentMenu}>
      {state.ui.showAddComponentMenu ? 'remove_circle_outline' : 'add_circle_outline'}
    </i>

    <Divider />

    <i
      className="material-icons"
      style={{
        fontSize: '28px',
        color: state.ui.componentView === ComponentView.Center ? ' rgb(83, 212, 134)' : 'black',
      }}
      onClick={selectComponentView(ComponentView.Center)}
    >
      stop
    </i>
    <i
      className="material-icons"
      style={{
        fontSize: '24px',
        marginLeft: '-2px',
        marginRight: '2px',
        transform: 'rotateZ(40deg)',
        color: state.ui.componentView === ComponentView.Tilted ? ' rgb(83, 212, 134)' : 'black',
      }}
      onClick={selectComponentView(ComponentView.Tilted)}
    >
      layers
    </i>
    <Divider />

    {state.ui.selectedNode && (
      <>
        <Divider />
        {Object.keys(state.colors).map(colorIndex => (
          <ColorBox color={state.colors[colorIndex].hex} onClick={changeBackground(state.colors[colorIndex].id)} />
        ))}
        <Divider />
        {state.border.map(border => (
          <BorderBox border={border} onClick={changeBorder(border)} />
        ))}
      </>
    )}
  </TopBarBox>
)

export default TopBar
