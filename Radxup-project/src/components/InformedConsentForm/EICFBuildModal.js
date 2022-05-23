import { useState } from 'react';
import { Button, Modal, Form, FormGroup } from 'react-bootstrap';

const EICFBuildModal = ({ open, handleClose }) => {
  const [icfType, setIcfType] = useState(null);
  const [showErrors, setShowErrors] = useState(false);

  const onChangeHandler = (e) => {
    const { value } = e.target;
    setIcfType(value);
  };

  const submitIcfType = () => {
    setShowErrors(true);
    if (icfType === null || icfType === undefined) {
      return;
    }
    handleClose(icfType);
  };

  const handleModalClose = () => {
    handleClose(false);
  };
  return (
    <>
      <Modal className={`custom-modal`} show={open} onHide={handleModalClose} backdrop="static" keyboard={false} centered>
        <Modal.Header closeButton className="modal-header pb-0">
          <Modal.Title className="title fw-bold">Build New e-ICF</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row mb-3">
            <FormGroup className="col">
              <Form.Label>Select e-ICF Type</Form.Label>
              <Form.Select
                value={icfType}
                name="icfType"
                onChange={onChangeHandler}
                isInvalid={showErrors && (icfType === null || icfType === undefined)}
                className="form-select"
                aria-label="Default select form"
              >
                <option hidden>Select e-ICF type </option>
                <option value="Pediatric">Pediatric e-ICF </option>
                <option value="Adult">Adult e-ICF </option>
              </Form.Select>
              <Form.Control.Feedback type="invalid">{!icfType ? 'e-ICF Type is required' : ''}</Form.Control.Feedback>
            </FormGroup>
          </div>
        </Modal.Body>
        <Modal.Footer className="modal-footer mb-4">
          <Button className="mx-3" variant="secondary" size="md" onClick={handleModalClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={submitIcfType}>
            Add
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EICFBuildModal;
