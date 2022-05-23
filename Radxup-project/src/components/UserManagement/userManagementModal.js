import { useEffect, useState } from 'react';
import { Button, Modal, Form, FormGroup, InputGroup, FormControl, FormCheck, Spinner } from 'react-bootstrap';
import Validation from '../../utils/validations';
import { ADMIN_ROLE, COORDINATOR_ROLE } from '../../constants/constant';

const initialState = () => ({
  email: '',
  role_id: '',
});

const roleList = [
  {
    label: 'Study Admin',
    value: ADMIN_ROLE,
  },
  {
    label: 'Study Coordinator',
    value: COORDINATOR_ROLE,
  },
];

const UserManagementModal = (props) => {
  const { handleClose, isLoading } = props;
  const [data, setData] = useState(initialState());
  const [showErrors, setShowErrors] = useState(false);
  const { email, role_id } = data;
  data.role_id = parseInt(role_id) || '';

  const addParticipant = (key) => {
    setShowErrors(true);
    if (!Validation.email(email) || !role_id) {
      return;
    }
    let type = key;
    handleClose({ type, data });
  };

  const onChangeHandler = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  return (
    <>
      <Modal.Header closeButton className="modal-header pb-0">
        <Modal.Title className="title fw-bold">Add User</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <div className="container">
            <div className="row mb-3">
              <Form.Group className="col" controlId="formBasicEmail">
                <Form.Label>Enter InCommon Id</Form.Label>
                <Form.Control
                  type="text"
                  name="email"
                  isInvalid={showErrors && !Validation.email(email)}
                  onChange={onChangeHandler}
                  value={email}
                  required
                  placeholder="Enter InCommon Id"
                />
                <Form.Control.Feedback type="invalid">
                  {email ? (Validation.email(email) ? '' : 'Please Enter valid email Id') : 'please enter email Id'}
                </Form.Control.Feedback>
              </Form.Group>
              <FormGroup className="col">
                <Form.Label>Select Role </Form.Label>
                <Form.Select
                  value={role_id}
                  name="role_id"
                  onChange={onChangeHandler}
                  isInvalid={showErrors && role_id === ''}
                  className="form-select"
                  aria-label="Default select form"
                >
                  <option hidden>Select Role </option>
                  {roleList?.map((item, i) => (
                    <option key={i} value={item.value}>
                      {item?.label}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{!role_id ? 'Please Select role' : ''}</Form.Control.Feedback>
              </FormGroup>
            </div>
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer className="modal-footer">
        <Button variant="secondary" size="md" onClick={() => handleClose('cancel')}>
          Cancel
        </Button>
        <Button variant="primary" size="md" disabled={isLoading} onClick={() => addParticipant('add')}>
          {isLoading && <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" className="me-2" />}
          Add
        </Button>
      </Modal.Footer>
    </>
  );
};

export default UserManagementModal;
