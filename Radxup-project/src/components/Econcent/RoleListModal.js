import { useEffect, useState } from 'react';
import { Button, Modal, Form, FormGroup, InputGroup, FormControl, FormCheck, Spinner } from 'react-bootstrap';
import Validation from '../../utils/validations';
import styles from '../../stylesheets/EConcent.module.scss';

const RoleListModal = ({ onContinue, setLoading }) => {
  return (
    <>
      <Modal.Header closeButton className="modal-header pb-0" onClick={() => setLoading(false)}>
        <Modal.Title className="title fw-bold">Who is Filling the Survey?</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <div className="d-flex flex-column mb-3 align-items-center">
            <div className={styles.whoIsFilling}>
              <Form.Group controlId="formBasicCheckbox1">
                <FormCheck
                  type="radio"
                  defaultChecked
                  className="mb-4"
                  name="whoIsFilling"
                  value="Participant"
                  label={'Participant'}
                />
              </Form.Group>

              <Form.Group controlId="formBasicCheckbox2">
                <FormCheck
                  type="radio"
                  className="mb-4"
                  name="whoIsFilling"
                  value="Coordinator Interview"
                  label={'Coordinator Interview'}
                />
              </Form.Group>
              <Form.Group controlId="formBasicCheckbox3">
                <FormCheck
                  type="radio"
                  name="whoIsFilling"
                  className="mb-4"
                  value="Coordinator From Paper Form"
                  label="Coordinator From Paper Form"
                />
              </Form.Group>
            </div>
            <button
              onClick={() => onContinue()}
              type="button"
              className={`btn px-4 d-inline-block text-white mt-4 ${styles.button}`}
            >
              Continue
            </button>
          </div>
        </Form>
      </Modal.Body>
    </>
  );
};

export default RoleListModal;
