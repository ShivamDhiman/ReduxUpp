import { Button, Modal, Spinner } from 'react-bootstrap';
import styles from '../../stylesheets/Common.module.scss';

const ConfirmModal = ({ handleClose, isLoading }) => {
  return (
    <>
      <Modal.Header closeButton className="modal-header pb-0">
        <Modal.Title className="title fw-bold">Deregister Participant</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className={styles['confirm-modal-body']}>
          <h4>
            Are you sure,
            <br /> you want to deregister participant?
          </h4>
        </div>
      </Modal.Body>
      <Modal.Footer className="modal-footer mb-4">
        <Button className="mx-3" variant="secondary" size="md" onClick={() => handleClose(false)}>
          Cancel
        </Button>
        <Button variant="primary" size="md" onClick={() => handleClose(true)} disabled={isLoading}>
          {isLoading && <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" className="me-2" />}
          Deregister
        </Button>
      </Modal.Footer>
    </>
  );
};

export default ConfirmModal;
