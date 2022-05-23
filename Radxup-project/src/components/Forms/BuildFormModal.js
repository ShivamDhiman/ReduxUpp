import { useState } from 'react';
import { Modal, Button, FormGroup, Form, FormCheck } from 'react-bootstrap';
import styles from '../../stylesheets/Forms.module.scss';

const BuildFormModal = ({ handleClose, addFormAction, forms }) => {
  const [state, setState] = useState({
    formCategory: 'Create from Scratch',
    formType: 'Adult',
    formCode: '',
    name: '',
    version: '',
  });
  const { formCategory, formType, formCode } = state;

  const addAction = () => {
    if (formCategory === 'Use Variables from existing form' && !formCode) {
      return false;
    } else {
      addFormAction(state);
    }
  };

  const changeHandler = (e) => {
    if (e.target.name === 'formCode') {
      const selectedForm = forms.find((form) => form.form_code === e.target.value);
      setState({
        ...state,
        [e.target.name]: e.target.value,
        version: selectedForm?.version,
        name: selectedForm?.name,
        category: selectedForm?.category,
        formType: selectedForm.type,
      });
    }
    if (e.target.name !== 'formCode') {
      setState({ ...state, [e.target.name]: e.target.value, version: null, name: null, formCode: null });
    }
  };

  return (
    <>
      <Modal.Header closeButton className="modal-header pb-0">
        <Modal.Title className="title fw-bold">Build New Form</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <FormGroup className="d-flex row justify-content-between px-4 mb-3">
          <FormCheck
            type="radio"
            className={`col-md-5 ${styles.textDark}`}
            label="Create from Scratch"
            name="formCategory"
            value="Create from Scratch"
            checked={formCategory === 'Create from Scratch'}
            id="radio1"
            onChange={changeHandler}
          />
          <FormCheck
            type="radio"
            className={`col-md-7 ${styles.textDark}`}
            label="Use Variables from existing form"
            name="formCategory"
            value="Use Variables from existing form"
            checked={formCategory === 'Use Variables from existing form'}
            id="radio2"
            onChange={changeHandler}
          />
          <FormCheck
            type="radio"
            className={`col-md-6 ${styles.textDark}`}
            label="Use Default CDE Template"
            name="formCategory"
            id="radio3"
            value="Use Default CDE Template"
            checked={formCategory === 'Use Default CDE Template'}
            onChange={changeHandler}
          />
        </FormGroup>
        {formCategory !== 'Use Variables from existing form' && (
          <FormGroup className="px-3">
            <label className="form-label text-dark fw-bold">Select Form Type</label>
            <Form.Select
              name="formType"
              className="form-select"
              value={formType}
              onChange={changeHandler}
              aria-label="Default select form"
            >
              <option value="Pediatric">Pediatric Form </option>
              <option value="Adult">Adult Form</option>
            </Form.Select>
          </FormGroup>
        )}
        {formCategory === 'Use Variables from existing form' && (
          <FormGroup className="px-3">
            <label className="form-label text-dark fw-bold">Select Form</label>
            <Form.Select
              name="formCode"
              className="form-select"
              value={formCode}
              onChange={changeHandler}
              aria-label="Default select form"
            >
              <option hidden>Please select Form</option>
              {forms?.map((form) => (
                <option key={form.form_code} value={form.form_code}>{`${form.name} ${form.version}`}</option>
              ))}
            </Form.Select>
          </FormGroup>
        )}
      </Modal.Body>
      <Modal.Footer className="modal-footer">
        <Button variant="secondary" size="md" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" size="md" onClick={addAction}>
          Add
        </Button>
      </Modal.Footer>
    </>
  );
};
export default BuildFormModal;
