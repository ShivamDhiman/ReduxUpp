import Spinner from 'react-bootstrap/Spinner';

export const LazyLoaderGeneral = (props) => {
  return (
    <div className="lazy-loader">
      {/* <span> Loading...</span>
      <Spinner animation="grow" variant="primary" />
      <Spinner animation="grow" variant="secondary" />
      <Spinner animation="grow" variant="success" />
      <Spinner animation="grow" variant="danger" />
      <Spinner animation="grow" variant="warning" />
      <Spinner animation="grow" variant="info" /> */}
      <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" className="mt-4 me-2" />
    </div>
  );
};
