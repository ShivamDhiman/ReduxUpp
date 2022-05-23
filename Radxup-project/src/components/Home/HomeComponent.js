import React from 'react';
import styled from 'styled-components';
import Button from 'react-bootstrap/Button';
import { LazyLoaderGeneral } from '../common/LazyLoaderComponent';

const Title = styled.h1`
  font-size: 20px;
  color: ${({ theme }) => theme.colors.primary};
`;

const Home = () => {
  return (
    <React.Fragment>
      <h1 className="gap-top">Whoohu..</h1>
      <Title>My Home page</Title>
      <LazyLoaderGeneral />
      <Button variant="primary" size="lg" active>
        Primary button
      </Button>{' '}
      <Button variant="secondary" size="lg" active>
        Button
      </Button>
    </React.Fragment>
  );
};

export default Home;
