import { useEffect, useState } from 'react';
import { Form, Spinner } from 'react-bootstrap';
import { Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import API from '../../helpers/api';
import { encodeData } from '../../helpers/auth';
import { handleErrorMessage } from '../../utils/commonFunctions';
import Validation from '../../utils/validations';

const StudyDetails = (props) => {
  const initialStudyFormState = {
    study_id: '',
    name: '',
    description: '',
    awardee_org: '',
    arms: [],
  };
  const [studyForm, setStudyForm] = useState({ ...initialStudyFormState });
  const { cancel, next, styles, study } = props;
  const [loading, setLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const { study_id, name, awardee_org, description, arms = [] } = studyForm;
  const allowEdit = study?.status === 'Onboarding' || !study.id;

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    const armData = name ? name.split('.') : [];
    if (armData?.length === 2) {
      arms[armData[0]][armData[1]] = value;
      setStudyForm({ ...studyForm, arms: [...arms] });
    } else {
      setStudyForm({ ...studyForm, [name]: value });
    }
  };

  const addArm = () => {
    studyForm.arms.push({ name: '', description: '' });
    setStudyForm({ ...studyForm });
  };

  const removeArm = (index) => {
    const filteredArms = studyForm.arms.filter((arm, i) => index !== i);
    studyForm.arms.push({ name: '', description: '' });
    setStudyForm({ ...studyForm, arms: filteredArms });
  };

  useEffect(() => {
    if (Object.keys(study).length) {
      setStudyForm(study);
    }
  }, [study]);

  const submitStudyDetails = () => {
    if (loading) {
      return;
    }
    setShowErrors(true);
    if (
      !Validation.namevalue(name) ||
      (awardee_org && !Validation.namevalue(awardee_org)) ||
      !Validation.isCharAndNum(study_id)
      // !Validation.description(description)
    ) {
      return;
    }
    if (arms?.length) {
      arms.forEach((arm) => {
        if (Validation.empty(arm?.description) || !Validation.name(arm?.name)) {
          return;
        }
      });
    }

    next(studyForm);
    // if(allowEdit){
    //   next();
    // }
  };

  return (
    <>
      <div className="col-md-6">
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Study ID</Form.Label>
            <Form.Control
              type="text"
              onChange={handleFormChange}
              name="study_id"
              isInvalid={showErrors && !Validation.isCharAndNum(study_id)}
              value={study_id}
              disabled={!allowEdit}
              maxLength="35"
            />
            <Form.Control.Feedback type="invalid">
              {study_id && !Validation.isCharAndNum(study_id) ? 'Please enter a valid format' : 'Study id is required'}
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Study Name</Form.Label>
            <Form.Control
              type="text"
              onChange={handleFormChange}
              name="name"
              isInvalid={showErrors && !Validation.namevalue(name)}
              value={name}
              disabled={!allowEdit}
              maxLength="50"
            />
            <Form.Control.Feedback type="invalid">
              {name && !Validation.namevalue(name) ? 'Please enter a valid format' : 'Study name is required'}
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Awardee Organization</Form.Label>
            <Form.Control
              type="text"
              onChange={handleFormChange}
              isInvalid={showErrors && awardee_org && !Validation.namevalue(awardee_org)}
              name="awardee_org"
              value={awardee_org}
              disabled={!allowEdit}
              maxLength="50"
            />
            <Form.Control.Feedback type="invalid">
              {awardee_org && !Validation.namevalue(awardee_org)
                ? 'Please enter a valid format'
                : 'Awardee Organization id is required'}
            </Form.Control.Feedback>
          </Form.Group>
        </Form>
      </div>
      <div className="col-md-6">
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Description (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              placeholder="Add description here..."
              name="description"
              onChange={handleFormChange}
              value={description}
              disabled={!allowEdit}
              // isInvalid={showErrors && description && Validation.empty(description)}
              rows={8}
              maxLength="500"
            />
            {/* <Form.Control.Feedback type="invalid">
              {description && Validation.empty(description) ? 'please enter Description id in valid format' : ''}
            </Form.Control.Feedback> */}
          </Form.Group>
        </Form>
      </div>
      {arms?.map((arm, index) => (
        <>
          {allowEdit && (
            <div key={index} className="d-flex justify-content-start">
              <Form.Group className="mb-3 me-3 col-md-6 ">
                <Form.Label>Arm Name:</Form.Label>
                <Form.Control
                  name={`${index}.name`}
                  type="text"
                  onChange={handleFormChange}
                  isInvalid={showErrors && arm.name && !Validation.namevalue(arm.name)}
                  value={arm.name}
                  disabled={arm?.id}
                  maxLength="50"
                />
                <Form.Control.Feedback type="invalid">
                  {arm.name && !Validation.namevalue(arm.name)
                    ? 'Please enter a valid format'
                    : 'Valid Arm name is required'}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3 me-2 col-md-5">
                <Form.Label>Arm Description:</Form.Label>
                <Form.Control
                  name={`${index}.description`}
                  type="text"
                  onChange={handleFormChange}
                  disabled={arm?.id}
                  // isInvalid={showErrors && arm.description && !Validation.description(arm.description)}
                  value={arm.description}
                  maxLength="500"
                />
                {/* <Form.Control.Feedback type="invalid">
                  {arm.description && !Validation.description(arm.description) ? 'Valid Arm description is required.' : ''}
                </Form.Control.Feedback> */}
              </Form.Group>
              {arms?.length && !arm?.id && (
                <img
                  src={'/images/bigtrash.svg'}
                  className="mt-2 cursor-pointer"
                  onClick={() => removeArm(index)}
                  data-toggle="tooltip"
                  title="Remove"
                />
              )}
            </div>
          )}
          {!allowEdit && (
            <div key={index} className="d-flex justify-content-start">
              <Form.Group className="mb-3 me-2 col-6">
                <Form.Label>Arm Name:</Form.Label>
                <Form.Control name={`${index}.name`} type="text" disabled value={arm.name} />
              </Form.Group>
              <Form.Group className="mb-3 me-2 col-6">
                <Form.Label>Arm Description:</Form.Label>
                <Form.Control name={`${index}.description`} type="text" disabled value={arm.description} />
              </Form.Group>
            </div>
          )}
        </>
      ))}
      {!!allowEdit && (
        <div className="d-flex align-items-center cursor-pointer">
          <img src={'/images/add.svg'} className="mt-2" data-toggle="tooltip" height={38} title="Add" onClick={addArm} />
          <span className="ms-2 mt-2 font-weight-bold">Add Arm</span>
        </div>
      )}
      <div className="d-flex justify-content-end mt-5 cursor-pointer">
        <div className={` fw-bold ms-3 ${styles.sectionHeading}`}>
          <Button size="md" disabled={loading} className="admin_panel_button dark" onClick={() => cancel(study?.study_id)}>
            Cancel
          </Button>
        </div>
        <div className={`fw-bold ms-3 ${styles.sectionHeading} `}>
          <Button size="md" disabled={loading} className="admin_panel_button secondary" onClick={submitStudyDetails}>
            {loading && <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" className="me-2" />}
            Next
          </Button>
        </div>
      </div>
    </>
  );
};
export default StudyDetails;
