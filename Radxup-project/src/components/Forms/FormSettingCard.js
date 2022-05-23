import { useEffect, useState } from 'react';
import { Form, FormCheck } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { isAuth } from '../../helpers/auth';
import { emailTemplates } from '../../store/actions/studyManagement';

const initialFormSettings = {
  reminder: false,
  form_expire: false,
  reminderHours: '',
  reminderMinutes: '',
  form_expire_time: '',
  expiryMinutes: '',
  participant_facing: true,
  days_reminder: false,
  hours_reminder: false,
  days: '',
  hours: '',
  intervalReminder: false,
  emailTemplate: '',
  emailReminderTemplate: '',
  email_reminder_code: '',
  email_reminder_version: '',
};

const FormSettingCard = (props) => {
  const { styles, forwordFormSettingsData, data, showErrors, formSettingData } = props;
  const [formSettings, setFormSettings] = useState({ ...initialFormSettings });
  const [emailTemplateData] = useSelector((Gstate) => [Gstate.studyManagement?.emailTemplate]);
  const dispatch = useDispatch();
  const userData = useSelector(({ user }) => user.userData) || isAuth();

  const {
    form_expire,
    reminder,
    intervalReminder,
    expiryMinutes,
    form_expire_time,
    reminderHours,
    reminderMinutes,
    participant_facing,
    days_reminder,
    hours_reminder,
    days,
    hours,
    emailReminderTemplate,
    emailTemplate,
    email_reminder_code,
    email_reminder_version,
  } = formSettings;

  const handleFormSettingsChange = (e) => {
    let { name, value, min, max, type } = e.target;
    if (['reminder', 'form_expire', 'participant_facing'].includes(name)) {
      value = value === 'true' ? true : false;
      if (name === 'participant_facing' && value === false) {
        setFormSettings((prev) => ({
          ...prev,
          emailTemplate: '',
          emailReminderTemplate: '',
          email_reminder_code: '',
          email_reminder_version: '',
        }));
      }
      if (type === 'number') {
        value = Math.max(Number(min), Math.min(Number(max), Number(value)));
      }

      if (name === 'form_expire' && value === false) {
        formSettings.form_expire_time = '';
        setFormSettings({ ...formSettings });
      }
    }

    const obj = emailTemplateData.find((item) => item.email_code == e.target?.value);
    if (name === 'emailReminderTemplate') {
      setFormSettings((prev) => ({
        ...prev,
        [e.target.name]: value,
        email_reminder_code: obj?.email_code,
        email_reminder_version: obj?.version,
      }));
      return;
    }
    if (name === 'emailTemplate') {
      setFormSettings((prev) => ({
        ...prev,
        [e.target.name]: value,
        email_version: obj?.version,
        email_code: obj?.email_code,
      }));
      return;
    }
    if (type == 'radio' && ['Day', 'No', 'Hour'].includes(value)) {
      if (value === 'No') {
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
      if (value === 'Day') {
        setFormSettings((prev) => ({
          ...prev,
          days_reminder: true,
          hours_reminder: false,
          reminder: false,
          hours: '',
        }));
      }
      if (value === 'Hour') {
        setFormSettings((prev) => ({
          ...prev,
          days_reminder: false,
          hours_reminder: true,
          reminder: false,
          days: '',
        }));
      }
      return;
    } else {
      setFormSettings({ ...formSettings, [name]: value });
    }
  };
  useEffect(() => {
    if (userData?.study_id) {
      dispatch(emailTemplates(userData?.study_id));
    }
  }, [userData?.study_id]);

  useEffect(() => {
    if (
      data &&
      (data[0]?.days ||
        data[0]?.hours ||
        data[0]?.participant_facing ||
        data[0]?.email_code ||
        data[0]?.email_version ||
        data[0]?.email_reminder_code ||
        data[0]?.email_reminder_version)
    ) {
      const {
        form_expire = false,
        form_expire_time,
        reminder = false,
        participant_facing = false,
        days_reminder,
        hours_reminder,
        days,
        hours,
        email_code,
        email_version,
        email_reminder_code,
        email_reminder_version,
      } = data[0];
      let emailTemplate = emailTemplateData.find((item) => item.email_code == email_code);
      let emailReminderTemplate = emailTemplateData.find((item) => item.email_code == email_reminder_code);

      // let expiryHours = '';
      // let expiryMinutes = '';
      // if (form_expire) {
      //   let hourMinutes = form_expire_time.split(':');
      //   expiryHours = hourMinutes[0];
      //   expiryMinutes = hourMinutes[1];
      // }
      // expiryMinutes;
      setFormSettings({
        form_expire,
        form_expire_time: form_expire_time || '',
        emailTemplate: emailTemplate?.email_code,
        emailReminderTemplate: emailReminderTemplate?.email_code,
        reminder,
        //  expiryHours, expiryMinutes,
        days_reminder,
        hours_reminder,
        days: days || '',
        hours,
        participant_facing,
        email_code,
        email_version,
        email_reminder_code,
        email_reminder_version,
      });
      // let expire_time = `${expiryHours}:${expiryMinutes}`;
      // forwordFormSettingsData({
      //   ...formSettings,
      //   form_expire_time: form_expire_time,
      //   form_expire,
      //   reminder,
      //   // expiryHours,
      //   // expiryMinutes,
      //   participant_facing,
      //   days_reminder,
      //   hours_reminder,
      //   days,
      //   hours,
      // });
    }
    const {
      form_expire,
      form_expire_time,
      emailTemplate,
      emailReminderTemplate,
      reminder,
      //  expiryHours, expiryMinutes,
      days_reminder,
      hours_reminder,
      days,
      hours,
      participant_facing,
      email_code,
      email_version,
      email_reminder_code,
      email_reminder_version,
    } = formSettingData;
    if (
      formSettingData &&
      (days || hours || participant_facing || email_code || email_version || email_reminder_code || email_reminder_version)
    ) {
      setFormSettings({
        form_expire,
        form_expire_time: form_expire_time || '',
        emailTemplate,
        emailReminderTemplate,
        reminder,
        //  expiryHours, expiryMinutes,
        days_reminder,
        hours_reminder,
        days: days || '',
        hours,
        participant_facing,
        email_code,
        email_version,
        email_reminder_code,
        email_reminder_version,
      });
    }
  }, [data]);

  // useEffect(() => {
  //   if (!form_expire) {
  //     formSettings.form_expire_time = '';
  //     // formSettings.expiryMinutes = '';
  //   }
  //   // if (!reminder) {
  //   //   formSettings.reminderHours = '';
  //   //   formSettings.reminderMinutes = '';
  //   // }
  //   setFormSettings({ ...formSettings });
  // }, [form_expire, reminder]);

  useEffect(() => {
    // formSettings.form_expire_time = `${formSettings.expiryHours}:${formSettings.expiryMinutes}`;
    forwordFormSettingsData(formSettings);
  }, [formSettings]);

  const hoursData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

  return (
    <>
      <div className={`${styles.sectionHeader} row`}>
        <div className="col-md-6 d-flex align-items-end p-0">
          <span className={`${styles.defaultBoldText}`}>Form Settings</span>
        </div>
      </div>
      <div className="row">
        {/*  <div className="col mt-2 form-mgt ps-0">
           <div className={` d-flex  align-items-center  mt-4 mb-4 ${styles.radiolabel}`}>
             <Form.Group className="col-md-6 pe-0 mt-2" controlId="formBasicCheckbox1">
              <FormCheck
                checked={reminder === true}
                type="radio"
                name="reminder"
                value={true}
                onChange={handleFormSettingsChange}
                label={'Send Reminder Every Midnight'}
                className="formsetting-mgt"
              />
            </Form.Group>
          {/* <Form.Group className="mb-3 me-2" controlId="numberInput1">
              <Form.Label>HH</Form.Label>
              <Form.Control
                type="number"
                max="23"
                name="reminderHours"
                value={reminderHours}
                onChange={handleFormSettingsChange}
                disabled={!reminder}
                min="0"
                placeholder="HH"
              />
            </Form.Group>

            <Form.Group className="mb-3 me-2" controlId="numberInput2">
              <Form.Label>MM</Form.Label>
              <Form.Control
                type="number"
                name="reminderMinutes"
                value={reminderMinutes}
                onChange={handleFormSettingsChange}
                disabled={!reminder}
                max="59"
                min="0"
                placeholder="MM"
              />
            </Form.Group> 

           <Form.Group controlId="formBasicCheckbox2" className=" col-md-4 mt-2">
              <FormCheck
                checked={reminder == false}
                type="radio"
                className="formsetting-mgt ms-2"
                name="reminder"
                value={false}
                onChange={handleFormSettingsChange}
                label={'Never'}
              />
            </Form.Group>
          </div> 
        </div>
        */}
        <div className="col-12 ps-0">
          <div className={`d-flex align-items-center  form-mgt mt-2  ${styles.radiolabel}`}>
            <Form.Group className="col-2 pe-0 mt-2" controlId="formBasicCheckbox1">
              <Form.Label>Set Expiration Duration</Form.Label>
            </Form.Group>
            <Form.Group className=" pe-0 mt-2 me-3" controlId="formBasicCheckbox1">
              <FormCheck
                checked={form_expire === true}
                className="formsetting-mgt"
                type="radio"
                name="form_expire"
                value={true}
                onChange={handleFormSettingsChange}
              />
            </Form.Group>

            <Form.Group className="mb-3 col-2 me-2 days-input" controlId="numberInput1">
              <Form.Label className="formsetting-time fw-bold">Days</Form.Label>
              <Form.Control
                type="number"
                name="form_expire_time"
                onChange={handleFormSettingsChange}
                onKeyDown={(e) => (e.key == 'e' || e.key == 'E') && e.preventDefault()}
                disabled={!form_expire}
                value={form_expire_time}
                min="1"
                max="365"
                isInvalid={showErrors && form_expire && !form_expire_time}
                // placeholder="HH"
              />
              <Form.Control.Feedback type="invalid">
                {!form_expire_time ? 'Days field is required' : ''}
              </Form.Control.Feedback>
            </Form.Group>
            {/* 
            <Form.Group className="mb-3 me-2" controlId="numberInput2">
              <Form.Label className="formsetting-time">MM</Form.Label>
              <Form.Control
                type="number"
                name="expiryMinutes"
                onChange={handleFormSettingsChange}
                max="59"
                disabled={!form_expire}
                value={expiryMinutes}
                min="0"
                placeholder="MM"
              />
            </Form.Group> */}

            <Form.Group controlId="formBasicCheckbox2" className=" col-md-3 mt-2 ms-3">
              <FormCheck
                checked={form_expire === false}
                type="radio"
                name="form_expire"
                value={false}
                className="formsetting-mgt ms-2"
                onChange={handleFormSettingsChange}
                label={'Never'}
              />
            </Form.Group>
          </div>
        </div>
        {/* Interval Reminder Start here */}
        <div className="col-12 ps-0">
          <div className={`d-flex align-items-center  form-mgt  mb-1 ${styles.radiolabel}`}>
            <Form.Group className="col-md-2 pe-0 " controlId="formBasicCheckbox1">
              <Form.Label>Set Reminder Interval</Form.Label>
            </Form.Group>
            <Form.Group controlId="formBasicCheckbox1" className="me-3">
              <FormCheck
                checked={days_reminder === true}
                type="radio"
                name="intervalReminder"
                value={'Day'}
                onChange={handleFormSettingsChange}
                className="formsetting-mgt me-1"
              />
            </Form.Group>
            <Form.Group className="mb-4 me-4 days-input" controlId="numberInput1">
              <Form.Label>Days</Form.Label>
              <Form.Control
                type="number"
                max="23"
                name="days"
                onKeyDown={(e) => (e.key == 'e' || e.key == 'E') && e.preventDefault()}
                value={days}
                disabled={days_reminder === false}
                isInvalid={showErrors && days_reminder && !days}
                onChange={handleFormSettingsChange}
                min="0"
              />
              <Form.Control.Feedback type="invalid">{!days ? 'Days field is required' : ''}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="formBasicCheckbox1" className="me-3 ms-1">
              <FormCheck
                checked={hours_reminder === true}
                type="radio"
                name="intervalReminder"
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
                min={1}
                onChange={handleFormSettingsChange}
                className="form-select"
                disabled={hours_reminder === false}
                isInvalid={showErrors && hours_reminder && !hours}
                aria-label="Default select form"
              >
                <option hidden>Hours</option>
                {hoursData?.map((item, i) => (
                  <option key={i} value={item}>
                    {item}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{!hours ? 'Hours field is required' : ''}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="formBasicCheckbox2" className=" col-md-4 mt-2">
              <FormCheck
                checked={days_reminder == false && hours_reminder == false}
                name="intervalReminder"
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
            <Form.Group className="col-md-2 pe-0 " controlId="formBasicCheckbox1">
              <Form.Label>Participant Facing</Form.Label>
            </Form.Group>
            <Form.Group className="col-md-1 pe-0  d-flex justify-content-between " controlId="formBasicCheckbox1">
              <FormCheck
                checked={participant_facing === true}
                type="radio"
                name="participant_facing"
                value={true}
                className="formsetting-mgt mb-1"
                onChange={handleFormSettingsChange}
                label={'Yes'}
              />
              <FormCheck
                checked={participant_facing === false}
                type="radio"
                name="participant_facing"
                className="ms-3 formsetting-mgt mb-1"
                value={false}
                onChange={handleFormSettingsChange}
                label={'No'}
              />
            </Form.Group>
          </div>
        </div>
        {participant_facing && (
          <>
            <div className="col-12 ps-0">
              <div className={`d-flex align-items-center  form-mgt  mb-1 ${styles.radiolabel}`}>
                <Form.Group className="col-md-3 pe-0 " controlId="formBasicCheckbox1">
                  <Form.Label>Select E-mail Template</Form.Label>
                </Form.Group>
                <Form.Group className="col-md-4 pe-0" controlId="formBasicCheckbox1">
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
                        {item?.name.substring(0, 45)}
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
                <Form.Group className="col-md-4 pe-0" controlId="formBasicCheckbox1">
                  <Form.Select
                    value={emailReminderTemplate}
                    disabled={!days_reminder && !hours_reminder}
                    name="emailReminderTemplate"
                    onChange={handleFormSettingsChange}
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
          </>
        )}
      </div>
    </>
  );
};

export default FormSettingCard;
