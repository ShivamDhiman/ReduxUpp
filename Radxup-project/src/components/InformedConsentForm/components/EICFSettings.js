import { useEffect, useState } from 'react';
import { Form, FormCheck, FormGroup, InputGroup, FormControl, Spinner } from 'react-bootstrap';
import { emailTemplates } from '../../../store/actions/studyManagement';
import { useSelector, useDispatch } from 'react-redux';
import Validation from '../../../utils/validations';

const initialFormSettings = () => ({
  form_expire: false,
  reminder: false,
  days_reminder: false,
  days: '',
  hours_reminder: false,
  hours: '',
  email_reminder_code: '',
  email_reminder_version: '',
  email_code: '',
  email_version: '',
  emailReminderTemplate: '',
  emailTemplate: '',
});

const EICFSettingCard = (props) => {
  const { styles, forwordFormSettingsData, data, showErrors } = props;
  const [formSettings, setFormSettings] = useState(initialFormSettings());
  const { days_reminder, days, hours_reminder, hours, emailReminderTemplate, emailTemplate, reminder } = formSettings;
  const [emailTemplateData] = useSelector((Gstate) => [Gstate.studyManagement?.emailTemplate]);
  const userData = useSelector(({ user }) => user.userData) || isAuth();
  const dispatch = useDispatch();

  useEffect(() => {
    if (userData?.study_id) {
      dispatch(emailTemplates(userData?.study_id));
    }
  }, [userData?.study_id]);

  const handleFormSettingsChange = (e) => {
    if (e.target?.type === 'radio') {
      if (e.target?.value === 'No') {
        setFormSettings((prev) => ({
          ...prev,
          [e.target.name]: true,
          days_reminder: false,
          hours_reminder: false,
          emailReminderTemplate: '',
          email_reminder_code: '',
          email_reminder_version: '',
          days: '',
          hours: '',
        }));
      }
      if (e.target?.value === 'Day') {
        setFormSettings((prev) => ({
          ...prev,
          days_reminder: true,
          hours_reminder: false,
          reminder: false,
          hours: '',
        }));
      }
      if (e.target?.value === 'Hour') {
        setFormSettings((prev) => ({
          ...prev,
          days_reminder: false,
          hours_reminder: true,
          reminder: false,
          days: '',
        }));
      }
    } else {
      const obj =
        emailTemplateData.find(function (item) {
          return item.email_code == e.target?.value;
        }) || {};
      if (e.target?.name === 'emailReminderTemplate') {
        setFormSettings((prev) => ({
          ...prev,
          [e.target.name]: e.target?.value,
          email_reminder_code: obj?.email_code,
          email_reminder_version: obj?.version,
        }));
      }

      if (e.target?.name === 'emailTemplate') {
        setFormSettings((prev) => ({
          ...prev,
          [e.target.name]: e.target?.value,
          email_version: obj?.version,
          email_code: obj?.email_code,
        }));
      }

      if (!['emailReminderTemplate', 'emailTemplate'].includes(e.target?.name)) {
        setFormSettings((prev) => ({
          ...prev,
          [e.target.name]: parseInt(e.target?.value) < 1 ? 1 : e.target?.value,
        }));
      }
    }
  };
  useEffect(() => {
    if (Object.keys(data).length) {
      const {
        days_reminder,
        hours_reminder,
        days,
        reminder = false,
        participant_facing,
        email_code,
        email_version,
        email_reminder_code,
        email_reminder_version,
        hours,
      } = data;
      let emailTemplate = emailTemplateData.find((item) => item.email_code == email_code);
      let emailReminderTemplate = emailTemplateData.find((item) => item.email_code == email_reminder_code);

      setFormSettings({
        reminder,
        days_reminder,
        emailTemplate: emailTemplate?.email_code,
        emailReminderTemplate: emailReminderTemplate?.email_code,
        hours_reminder,
        days: days || '',
        participant_facing,
        email_code,
        email_version,
        email_reminder_code,
        email_reminder_version,
        hours,
      });
    }
  }, [data]);

  useEffect(() => {
    forwordFormSettingsData(formSettings);
  }, [formSettings]);

  const hoursData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

  return (
    <>
      <div className={`${styles.sectionHeader} row`}>
        <div className="col-md-6 d-flex align-items-end p-0 mb-2">
          <span className={`${styles.defaultBoldText}`}>e-ICF Setting</span>
        </div>
      </div>
      <div className="row">
        <div className="col-12 ps-0">
          <div className={`d-flex align-items-center  form-mgt  mb-1 ${styles.radiolabel}`}>
            <Form.Group className="col-md-2 pe-0 " controlId="formBasicCheckbox1">
              <Form.Label>Set Reminder Interval</Form.Label>
            </Form.Group>
            <Form.Group controlId="formBasicCheckbox1" className="me-3">
              <FormCheck
                checked={days_reminder === true}
                type="radio"
                name="reminder"
                value={'Day'}
                onChange={handleFormSettingsChange}
                className="formsetting-mgt me-1"
              />
            </Form.Group>
            <Form.Group className="mb-4 me-4" controlId="numberInput1">
              <Form.Label>Days</Form.Label>
              <Form.Control
                type="number"
                max="23"
                name="days"
                onKeyDown={(e) => (e.key == 'e' || e.key == 'E') && e.preventDefault()}
                isInvalid={showErrors && !reminder && days_reminder && Validation.empty(days)}
                value={days}
                disabled={days_reminder === false}
                onChange={handleFormSettingsChange}
                min="0"
              />
              <Form.Control.Feedback type="invalid">{!days ? 'Days Field is required' : ''}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="formBasicCheckbox1" className="me-3 ms-1">
              <FormCheck
                checked={hours_reminder === true}
                type="radio"
                name="reminder"
                // name="hours_reminder"
                value={'Hour'}
                onChange={handleFormSettingsChange}
                className="formsetting-mgt me-1"
              />
            </Form.Group>
            <Form.Group className="mb-4 me-4" controlId="numberInput1">
              <Form.Label>Hours</Form.Label>
              <Form.Select
                name="hours"
                value={hours}
                onChange={handleFormSettingsChange}
                className="form-select"
                disabled={hours_reminder === false}
                aria-label="Default select form"
                isInvalid={showErrors && !reminder && hours_reminder && !hours}
              >
                <option hidden>Hours</option>
                {hoursData?.map((item, i) => (
                  <option key={i} value={item}>
                    {item}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{!hours ? 'Hours Field is required' : ''}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="formBasicCheckbox2" className=" col-md-4 mt-2">
              <FormCheck
                checked={days_reminder == false && hours_reminder == false}
                name="reminder"
                type="radio"
                className="formsetting-mgt ms-2"
                value={'No'}
                onChange={handleFormSettingsChange}
                label={'Never'}
              />
            </Form.Group>
          </div>
        </div>
        <div className="col-12 ps-0">
          <div className={`d-flex align-items-center  form-mgt  mb-1 ${styles.radiolabel}`}>
            <Form.Group className="col-md-3 pe-0 " controlId="formBasicCheckbox1">
              <Form.Label>Select E-mail Template</Form.Label>
            </Form.Group>
            <Form.Group
              className="col-md-4 pe-0  d-flex justify-content-between  flex-column"
              controlId="formBasicCheckbox1"
            >
              <Form.Select
                value={emailTemplate}
                name="emailTemplate"
                onChange={handleFormSettingsChange}
                isInvalid={showErrors && !emailTemplate}
                className="form-select"
                aria-label="Default select form"
              >
                <option hidden>Please select E-mail Template </option>
                {emailTemplateData?.map((item, i) => (
                  <option key={i} value={item.email_code}>
                    {item?.name.substring(0, 22)}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {!emailTemplate ? 'Email Template is required' : ''}
              </Form.Control.Feedback>
            </Form.Group>
          </div>
        </div>
        <div className="col-12 ps-0 mt-4">
          <div className={`d-flex align-items-center  form-mgt  mb-1 ${styles.radiolabel}`}>
            <Form.Group className="col-md-3 pe-0 " controlId="formBasicCheckbox1">
              <Form.Label>Select Reminder E-mail Template</Form.Label>
            </Form.Group>
            <Form.Group
              className="col-md-4 pe-0  d-flex justify-content-between  flex-column"
              controlId="formBasicCheckbox1"
            >
              <Form.Select
                value={emailReminderTemplate}
                name="emailReminderTemplate"
                onChange={handleFormSettingsChange}
                disabled={!days_reminder && !hours_reminder}
                isInvalid={showErrors && (days_reminder || hours_reminder) && !emailReminderTemplate}
                className="form-select"
                aria-label="Default select form"
              >
                <option hidden>Please select E-mail Reminder Template </option>
                {emailTemplateData?.map((item, i) => (
                  <option key={i} value={item.email_code}>
                    {item?.name.substring(0, 22)}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {!emailReminderTemplate ? 'Email Reminder Template is required' : ''}
              </Form.Control.Feedback>
            </Form.Group>
          </div>
        </div>
      </div>
    </>
  );
};

export default EICFSettingCard;
