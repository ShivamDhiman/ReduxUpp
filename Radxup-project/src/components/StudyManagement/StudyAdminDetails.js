import { useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import Validation from '../../utils/validations';

const StudyAdminDetails = (props) => {
  const initialStudyAdminForm = [{ netId: '' }];
  // addStudyAmins;
  const { cancel, previous, next, styles, admins, study } = props;
  const [studyAdmins, setStudyAdmins] = useState(initialStudyAdminForm);
  const [showErrors, setShowErrors] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (admins?.length) {
      setStudyAdmins(admins);
    }
  }, [admins?.length]);

  const handleFormChange = (event) => {
    studyAdmins[event.target.name].netId = event.target.value;
    setStudyAdmins([...studyAdmins]);
  };

  const addAdmin = (index) => {
    studyAdmins.push({ netId: '' });
    setStudyAdmins([...studyAdmins]);
  };

  const removeAdmin = (index) => {
    const filteredAdmins = studyAdmins.filter((admin, i) => index !== i);
    setStudyAdmins(filteredAdmins);
  };

  const addStudyADminId = () => {
    let hasErrors = false;
    if (loading) {
      return;
    }
    studyAdmins.forEach((admin, index) => {
      if (admin.netId && (!Validation.email(admin.netId) || isDuplicate(admin.netId, index))) {
        hasErrors = true;
        setShowErrors(true);
      }
    });
    if (hasErrors) {
      return;
    }
    next(studyAdmins);
  };

  const isDuplicate = (item, itemIndex) => {
    let duplicate = false;
    studyAdmins.map((admin, index) => {
      if (item === admin.netId && index !== itemIndex) {
        duplicate = true;
      }
    });
    return duplicate;
  };

  return (
    <div>
      <div className="d-flex justify-content-center">
        <Form>
          {studyAdmins.map((admin, index) => (
            <div key={index} className="d-flex justify-content-center">
              <Form.Group className="mb-3 me-2">
                <Form.Label>Study Admin InCommon Net Id (Optional):</Form.Label>
                <Form.Control
                  type="text"
                  onChange={handleFormChange}
                  name={index}
                  isInvalid={
                    (showErrors && admin.netId && !Validation.email(admin.netId)) || isDuplicate(admin.netId, index)
                  }
                  value={admin.netId}
                />
                <Form.Control.Feedback type="invalid">
                  {showErrors && admin.netId && !Validation.email(admin.netId)
                    ? 'Valid Admin InCommon Net Id is required.'
                    : ''}
                  {admin.netId && isDuplicate(admin.netId, index) ? 'Duplicate Net Id not allowed' : ''}
                </Form.Control.Feedback>
              </Form.Group>
              {studyAdmins?.length - 1 > index && (
                <img
                  src={'/images/bigtrash.svg'}
                  className="mt-2"
                  onClick={() => removeAdmin(index)}
                  data-toggle="tooltip"
                  title="Remove"
                />
              )}
              {studyAdmins?.length - 1 == index && (
                <img
                  src={'/images/add.svg'}
                  className="mt-2"
                  data-toggle="tooltip"
                  title="Add"
                  onClick={() => addAdmin(index)}
                />
              )}
            </div>
          ))}
        </Form>
      </div>
      <div className="d-flex justify-content-end mt-5">
        <div className={`fw-bold ms-3 ${styles.sectionHeading}`}>
          <Button size="md" className="admin_panel_button primary" onClick={previous}>
            Previous
          </Button>
        </div>
        <div className={` fw-bold ms-3 ${styles.sectionHeading}`}>
          <Button size="md" className="admin_panel_button dark" onClick={() => cancel(study?.study_id)}>
            Cancel
          </Button>
        </div>
        <div className={`fw-bold ms-3 ${styles.sectionHeading} `}>
          <Button size="md" className="admin_panel_button secondary" onClick={addStudyADminId}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
export default StudyAdminDetails;
