import { useEffect, useState } from 'react';
import { Form, FormCheck } from 'react-bootstrap';

const initialFormSettings = {
  reminder: false,
  form_expire: false,
  reminderHours: '',
  reminderMinutes: '',
  expiryHours: '',
  expiryMinutes: '',
  participant_facing: false,
};

const FormSettingCard = (props) => {
  const { styles, forwordFormSettingsData, data } = props;
  const [formSettings, setFormSettings] = useState({ ...initialFormSettings });
  const { form_expire, reminder, expiryMinutes, expiryHours, reminderHours, reminderMinutes, participant_facing } =
    formSettings;

  const handleFormSettingsChange = (e) => {
    let { name, value, min, max, type } = e.target;
    if (['reminder', 'form_expire', 'participant_facing'].includes(name)) {
      value = value === 'true' ? true : false;
    }
    if (type === 'number') {
      value = Math.max(Number(min), Math.min(Number(max), Number(value)));
    }
    setFormSettings({ ...formSettings, [name]: value });
  };

  useEffect(() => {
    if (data && data.length) {
      const { form_expire = false, form_expire_time, reminder = false, participant_facing = false } = data[0];

      let expiryHours = '';
      let expiryMinutes = '';
      if (form_expire) {
        let hourMinutes = form_expire_time.split(':');
        expiryHours = hourMinutes[0];
        expiryMinutes = hourMinutes[1];
      }
      expiryMinutes;
      setFormSettings({ form_expire, reminder, expiryHours, expiryMinutes, participant_facing });
      let expire_time = `${expiryHours}:${expiryMinutes}`;
      forwordFormSettingsData({
        ...formSettings,
        form_expire_time: expire_time,
        form_expire,
        reminder,
        expiryHours,
        expiryMinutes,
        participant_facing,
      });
    }
  }, [data]);

  useEffect(() => {
    if (!form_expire) {
      formSettings.expiryHours = '';
      formSettings.expiryMinutes = '';
    }
    if (!reminder) {
      formSettings.reminderHours = '';
      formSettings.reminderMinutes = '';
    }
    setFormSettings({ ...formSettings });
  }, [form_expire, reminder]);

  useEffect(() => {
    formSettings.form_expire_time = `${formSettings.expiryHours}:${formSettings.expiryMinutes}`;
    forwordFormSettingsData(formSettings);
  }, [formSettings]);

  return (
    <>
      <div className={`${styles.sectionHeader} row`}>
        <div className="col-md-6 d-flex align-items-end p-0">
          <span className={`${styles.defaultBoldText}`}>Form Settings</span>
        </div>
      </div>
      <div className="row">
        <div className="col mt-2 form-mgt ps-0">
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
            </Form.Group> */}

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
        <div className="col">
          <div className={`d-flex align-items-center  form-mgt mt-2  ${styles.radiolabel}`}>
            <Form.Group className="col-md-5 pe-0 mt-2" controlId="formBasicCheckbox1">
              <FormCheck
                checked={form_expire === true}
                className="formsetting-mgt"
                type="radio"
                name="form_expire"
                value={true}
                onChange={handleFormSettingsChange}
                label={'Set Expiration Duration'}
              />
            </Form.Group>

            <Form.Group className="mb-3 me-2" controlId="numberInput1">
              <Form.Label className="formsetting-time">HH</Form.Label>
              <Form.Control
                type="number"
                name="expiryHours"
                onChange={handleFormSettingsChange}
                disabled={!form_expire}
                value={expiryHours}
                max="23"
                min="0"
                placeholder="HH"
              />
            </Form.Group>

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
            </Form.Group>

            <Form.Group controlId="formBasicCheckbox2" className=" col-md-3 mt-2">
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
      </div>
    </>
  );
};

export default FormSettingCard;
