import { useEffect, useState } from 'react';
import { Button, Modal, Form, FormGroup, InputGroup, FormControl, FormCheck, Spinner } from 'react-bootstrap';
import Validation from '../../utils/validations';
import styles from '../../stylesheets/Common.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import { isAuth } from '../../helpers/auth';
import { setArmList } from '../../store/actions/armList';
import { getFullName } from '../../utils/commonFunctions';

const initialState = () => ({
  first_name: '',
  last_name: '',
  mobile_phone: '',
  personal_email: '',
  surveyLink: '',
  participant_id: '',
  form_name: '',
  survey_status: '',
  form_code: '',
  isAnonymousUser: false,
  assignee: '',
  sendEmailNow: true,
  arm_id: '',
});

const ParticipantModal = (props) => {
  const {
    handleClose,
    userData,
    actionType,
    isLoading,
    formLists,
    showAnynomousCheck,
    isCoordinator,
    managersList = [],
  } = props;

  const user = isAuth();
  const dispatch = useDispatch();
  const [armListLoading, reduxArmList] = useSelector((Gstate) => [Gstate.armList?.loading, Gstate.armList?.armList]);
  const [data, setData] = useState(initialState());
  const [isEdit, setIsEdit] = useState(true);
  const [showErrors, setShowErrors] = useState(false);
  const [isEmailDisabled, setIsEmailDisabled] = useState(false);

  const {
    first_name,
    last_name,
    mobile_phone,
    personal_email,
    participant_id,
    isAnonymousUser,
    form_name,
    survey_status,
    form_code,
    form_group,
    assignee,
    sendEmailNow,
    arm_id,
  } = data;

  useEffect(() => {
    if (user.study_id) {
      dispatch(setArmList(user.study_id));
    }
  }, [user.study_id]);

  const addParticipant = (type) => {
    const { first_name, last_name, mobile_phone, personal_email, participant_id, form_name } = data;
    setShowErrors(true);
    /* email is not required for isAnonymousUser */
    if (
      (first_name && !Validation.nameval(first_name)) ||
      (last_name && !Validation.nameval(last_name)) ||
      (mobile_phone && !Validation.numericPhone(mobile_phone)) ||
      (!isAnonymousUser && !isCoordinator && !Validation.email(personal_email)) ||
      form_name === '' ||
      (participant_id && !Validation.name(participant_id))
      // (Validation.empty(participant_id))
    ) {
      return;
    }

    handleClose({ type, data });
  };

  const onChangeHandler = (e) => {
    if (e.target.name === 'form_code') {
      const obj =
        formLists.find(function (item) {
          return item.form_code == e.target.value;
        }) || {};
      setData((prev) => ({
        ...prev,
        form_code: obj.form_code,
        form_name: obj.name,
        form_id: obj.id,
        form_group: obj?.form_group,
      }));

      if (obj.hasOwnProperty('participant_facing')) {
        setIsEmailDisabled(!obj.participant_facing);
      }
    }
    if (e.target.type == 'radio') {
      setData((prev) => ({
        ...prev,
        [e.target.name]: e.target.value,
      }));
    }
    if (!['isAnonymousUser', 'form_code'].includes(e.target.name)) {
      setData({ ...data, [e.target.name]: e.target.value });
    }
    if (isEdit) {
      setIsEdit(false);
    }
  };

  useEffect(() => {
    if (actionType.edit) {
      const {
        first_name,
        last_name,
        assignee,
        mobile_phone,
        personal_email,
        participant_id,
        id,
        survey_status,
        form_name,
        form_code,
        form_group,
        status,
        arms,
        is_anonymous_user,
      } = userData;
      setData({
        first_name,
        last_name,
        assignee,
        mobile_phone,
        personal_email,
        participant_id,
        id,
        survey_status,
        form_code,
        form_group,
        form_name,
        isAnonymousUser: is_anonymous_user == true ? true : false,
        arm_id: arms?.id,
      });
    }
  }, []);

  return (
    <>
      <Modal.Header closeButton className="modal-header pb-0">
        {actionType.add && <Modal.Title className="title fw-bold">Add Participant</Modal.Title>}
        {actionType.edit && !isCoordinator && <Modal.Title className="title fw-bold">Edit Participant</Modal.Title>}
        {actionType.edit && isCoordinator && (
          <Modal.Title className="title fw-bold">Confirm Participant Details</Modal.Title>
        )}
      </Modal.Header>
      <Modal.Body>
        <Form>
          <div className="container">
            <div className="row mb-3">
              <Form.Group className="col" controlId="formBasicEmail">
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  type="text"
                  name="first_name"
                  isInvalid={showErrors && first_name && !Validation.nameval(first_name)}
                  onChange={onChangeHandler}
                  value={first_name}
                  required
                  maxLength="31"
                  disabled={isAnonymousUser && showAnynomousCheck}
                />
                <Form.Control.Feedback type="invalid">
                  {first_name && (first_name.length > 30 || first_name.length < 2)
                    ? 'First Name must be in range of 2-30 characters'
                    : 'First Name should be Alphabet'}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="col" controlId="formBasicPassword">
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  type="text"
                  name="last_name"
                  isInvalid={showErrors && last_name && !Validation.nameval(last_name)}
                  onChange={onChangeHandler}
                  value={last_name}
                  required
                  maxLength="31"
                  disabled={isAnonymousUser && showAnynomousCheck}
                />
                <Form.Control.Feedback type="invalid">
                  {last_name && (last_name.length > 30 || last_name.length < 2)
                    ? 'Last Name must be in range of 2-30 characters'
                    : 'Last Name should be Alphabet'}
                </Form.Control.Feedback>
              </Form.Group>
            </div>
            <div className="row mb-3">
              <Form.Group className="col" controlId="formBasicEmail">
                <Form.Label>Participant ID</Form.Label>
                <Form.Control
                  type="text"
                  name="participant_id"
                  maxLength="10"
                  isInvalid={showErrors && participant_id && !Validation.name(participant_id)}
                  onChange={onChangeHandler}
                  value={participant_id}
                  disabled={isAnonymousUser && showAnynomousCheck}
                />
                <Form.Control.Feedback type="invalid">Participant ID is invalid</Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="col" controlId="formBasicPassword">
                <Form.Label>Phone No.</Form.Label>

                <InputGroup>
                  <InputGroup.Text id="basic-addon1">+1</InputGroup.Text>
                  <FormControl
                    type="number"
                    name="mobile_phone"
                    maxLength="10"
                    className={styles['mobile-input']}
                    isInvalid={showErrors && mobile_phone && !Validation.numericPhone(mobile_phone)}
                    onChange={onChangeHandler}
                    value={mobile_phone}
                    disabled={isAnonymousUser && showAnynomousCheck}
                  />
                  <Form.Control.Feedback type="invalid">
                    {mobile_phone ? 'Please enter a valid Phone Number' : ''}
                  </Form.Control.Feedback>
                </InputGroup>
              </Form.Group>
            </div>
            {actionType.takeSurvey && (
              <div className="row mb-3">
                <Form.Group className="col" controlId="formBasicEmail">
                  <Form.Label>Form Name</Form.Label>
                  <Form.Control type="text" name="form_name" value={form_name} />
                </Form.Group>
              </div>
            )}
            <div className="row mb-3">
              <Form.Group className="col" controlId="formBasicEmail">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="personal_email"
                  isInvalid={showErrors && !isAnonymousUser && !isCoordinator && !Validation.email(personal_email)}
                  onChange={onChangeHandler}
                  value={personal_email}
                  disabled={
                    (isAnonymousUser && showAnynomousCheck) ||
                    (actionType.edit && !(survey_status == 'CONSENTED') && !isCoordinator)
                  }
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {!personal_email ? 'Email is required' : 'Please enter a valid email'}
                </Form.Control.Feedback>
              </Form.Group>
            </div>
            <div className="row mb-3">
              <FormGroup className="col">
                <Form.Label>Assignee (Study Admin/Coordinator) </Form.Label>
                <Form.Select
                  value={assignee}
                  name="assignee"
                  onChange={onChangeHandler}
                  // isInvalid={showErrors && assignee === ''}
                  className="form-select"
                  aria-label="Default select form"
                >
                  <option hidden>Please select Assignee </option>
                  {managersList?.map((item, i) => (
                    <option key={i} value={item.id}>
                      {item?.status !== 'Active' ? '⃠ ' : ''} {getFullName(item?.first_name || '', item?.last_name || '')}{' '}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{!assignee ? 'Assign Person is required' : ''}</Form.Control.Feedback>
              </FormGroup>
            </div>
            {/* {showAnynomousCheck && (
              <div className="row mt-4">
                <Form.Group className={styles.checkBox} controlId="firstName">
                  <FormCheck
                    type="checkbox"
                    name="isAnonymousUser"
                    checked={isAnonymousUser}
                    className="mb-4"
                    value={isAnonymousUser}
                    label="Participant wants to stay anonymous"
                    onChange={onChangeHandler}
                  />
                </Form.Group>
              </div>
            )} */}
            <div className="row mt-3">
              <FormGroup className="col">
                <Form.Label>Select Arm</Form.Label>
                <Form.Select
                  value={arm_id}
                  name="arm_id"
                  onChange={onChangeHandler}
                  // isInvalid={showErrors && arm_id === ''}
                  className="form-select"
                  aria-label="Default select form"
                >
                  <option hidden>Please select Arm </option>
                  {reduxArmList?.map((item, i) => (
                    <option key={i} value={item.id}>
                      {`${item?.name}`}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{!assignee ? 'Arm Person is required' : ''}</Form.Control.Feedback>
              </FormGroup>
              <FormGroup className="col">
                <Form.Label>Select Form </Form.Label>
                <Form.Select
                  value={form_code}
                  name="form_code"
                  onChange={onChangeHandler}
                  isInvalid={showErrors && form_code === ''}
                  className="form-select"
                  aria-label="Default select form"
                  disabled={actionType.edit}
                >
                  <option hidden>Please select Form</option>
                  {formLists?.map((item, i) => (
                    <option key={i} value={item.form_code}>
                      {item.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{!form_name ? 'Form Name is required' : ''}</Form.Control.Feedback>
              </FormGroup>
            </div>
            {/* <div className="row mt-4">
              {actionType.edit && (
                <FormGroup>
                  <Form.Label>Select Form</Form.Label>
                  <Form.Select
                    value={form_code}
                    name="form_code"
                    onChange={onChangeHandler}
                    isInvalid={showErrors && form_code === ''}
                    className="form-select"
                    aria-label="Default select form"
                  >
                    <option hidden>Please select Form</option>
                    {formLists.map((item, i) => (
                      <option key={i} value={item.form_code}>
                        {item.name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{!form_name ? 'Form Name is required' : ''}</Form.Control.Feedback>
                </FormGroup>
              )}
            </div> */}
            <div className={`row d-flex   mt-4 mb-4 ${styles.radiolabel}`}>
              <Form.Group className="col-md-4 pe-0" controlId="formBasicCheckbox1">
                <FormCheck
                  defaultChecked={sendEmailNow === true}
                  type="radio"
                  name="sendEmailNow"
                  value={true}
                  onChange={onChangeHandler}
                  label={'Send Link Now'}
                  disabled={actionType.edit || isEmailDisabled}
                />
              </Form.Group>
              <Form.Group controlId="formBasicCheckbox2" className=" col-md-4">
                <FormCheck
                  defaultChecked={sendEmailNow === false}
                  type="radio"
                  name="sendEmailNow"
                  value={false}
                  onChange={onChangeHandler}
                  label={"Don't Send Link"}
                  disabled={actionType.edit || isEmailDisabled}
                />
              </Form.Group>
            </div>
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer className="modal-footer">
        {!isCoordinator && (
          <Button variant="secondary" size="md" onClick={handleClose}>
            Cancel
          </Button>
        )}
        {actionType.edit && (
          <Button
            variant="primary"
            size="md"
            disabled={actionType.edit && isEdit && !isCoordinator}
            onClick={() => {
              addParticipant(actionType.edit);
            }}
          >
            {isLoading && <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" className="me-2" />}
            {isCoordinator ? 'Continue Survey' : 'Save'}
          </Button>
        )}
        {actionType.add && (
          <Button
            variant="primary"
            size="md"
            disabled={isLoading}
            onClick={() => {
              addParticipant(actionType.add);
            }}
          >
            {isLoading && <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" className="me-2" />}
            Add
          </Button>
        )}
      </Modal.Footer>
    </>
  );
};

export default ParticipantModal;
