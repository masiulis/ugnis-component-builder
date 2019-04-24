import * as React from 'react'
import styled from 'styled-components'

const Container = styled.div`
  padding: 64px;
`

const HomePage = () => {
  return (
    <Container>
      <Container>Welcome to Ugnis</Container>
      <Container>Click on the left menu to start</Container>
    </Container>
  )
}

export default HomePage
