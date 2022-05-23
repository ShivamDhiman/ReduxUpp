import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Form, FormCheck, Row } from 'react-bootstrap';
import API from '../../helpers/api';
import { decodeData, decodeJWT, encodeData } from '../../helpers/auth';
import { handleErrorMessage } from '../../utils/commonFunctions';
import Validation from '../../utils/validations';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { getPublicStudyDetails } from '../../store/actions/studyManagement';

const initializeRegistrationData = () => ({
  first_name: '',
  last_name: '',
  mobile_phone: '',
  personal_email: '',
  participant_id: '',
  id: '',
  form_id: '',
  isAnonymousUser: false,
});

const RegistrationComponent = ({ userInfo, handleUserInfo, eICFs, onSkip }) => {
  const authToken = userInfo?.token;
  const surveyForm = userInfo?.surveyForm;
  const router = useRouter();
  const { query } = router.query;
  const [registrationData, setRegistrationData] = useState(initializeRegistrationData());
  const [showErrors, setErrors] = useState(false);
  const [studyInfo] = useSelector((GState) => [GState.studyManagement?.studyDetails]);
  const dispatch = useDispatch();

  const formChangeHandler = (e) => {
    if (e.target.type == 'checkbox') {
      setRegistrationData((prev) => ({
        ...prev,
        [e.target.name]: e.target.checked,
      }));
    }
    if (e.target.type !== 'checkbox') {
      setRegistrationData((prev) => ({
        ...prev,
        [e.target.name]: e.target.value,
      }));
    }
  };

  useEffect(() => {
    if (userInfo) {
      const { id, first_name, last_name, mobile_phone, personal_email, participant_id } = userInfo;
      setRegistrationData({
        first_name,
        last_name,
        mobile_phone: mobile_phone?.toString(),
        personal_email,
        participant_id,
        id,
        isAnonymousUser: !!personal_email,
      });
    }
  }, [userInfo]);

  useEffect(() => {
    if (userInfo?.study_id) {
      dispatch(getPublicStudyDetails(userInfo.study_id?.toString()));
    }
  }, []);

  const { first_name, last_name, mobile_phone, personal_email, participant_id, isAnonymousUser } = registrationData;
  const register = () => {
    setErrors(true);
    if (
      (!Validation.empty(first_name) && !Validation.name(first_name)) ||
      (!Validation.empty(last_name) && !Validation.nameval(last_name)) ||
      (!Validation.empty(mobile_phone) && !Validation.numericPhone(mobile_phone)) ||
      (personal_email && !Validation.empty(personal_email) && !Validation.email(personal_email)) ||
      (personal_email && !isAnonymousUser && !Validation.email(personal_email))
    ) {
      return;
    }
    const study_id = surveyForm && surveyForm.length ? surveyForm[0].study_id : userInfo?.study_id;
    const payload = {
      ...registrationData,
      form_code: userInfo?.form_code,
      form_group: userInfo?.form_group,
      form_name: userInfo?.form_name,
      form_id: userInfo?.form_id,
      study_id,
      form_group: userInfo?.form_group || 'eICF',
    };

    if (!payload.last_name && !payload.first_name && !payload.personal_email && !payload.mobile_phone) {
      payload.isAnonymousUser = true;
    }
    const encodedPayload = encodeData(payload);
    if (!userInfo.personal_email) {
      registerParticipant(encodedPayload);
    } else {
      updateParticipant(encodedPayload);
    }
  };

  const headers = {
    version: 'v1',
    authorization: authToken,
  };

  const updateParticipant = (encodedPayload) => {
    API.apiPost('updateParticipant', { payload: encodedPayload }, { headers })
      .then((response) => {
        if (response.data && response.data.success === true) {
          toast.success(response.data.message);
          setRegistrationData(initializeRegistrationData());
          // router.push(`/e-consent/consent-sign?query=${query}`);
          if (isEICFPresent()) {
            router.push(`/e-consent/consent-sign?query=${encodedPayload}`);
          } else {
            const payload = {
              ...decodeData(encodedPayload),
              survey_id: userInfo.survey_id,
              form_group: 'Form',
            };
            onSkip(encodeData(payload));
          }
        }
      })
      .catch((err) => {
        console.log('err', err);
        handleErrorMessage(err);
      });
  };

  const isEICFPresent = () => {
    let list = [];
    // eICFs.forEach((form) => {
    //   console.log('form', form);
    //   if (form?.eICFList) {
    //     list = [...list, ...form.eICFList];
    //   }
    // });
    return !!eICFs.length;
  };
  const registerParticipant = (encodedPayload) => {
    API.apiPost('registerAnynomousParticipant', { payload: encodedPayload })
      .then((response) => {
        if (response.data && response.data.success === true) {
          toast.success(response.data.message);
          setRegistrationData(initializeRegistrationData());
          // const payload = { ...decodeData(query), id: response?.data?.user_id };
          // handleUserInfo({ token: response.data.token, user_id: response.data.user_id });

          const payload = {
            ...decodeData(query),
            id: response?.data?.user_id,
            survey_id: response.data.survey_id,
            form_group: userInfo?.form_group,
          };
          handleUserInfo({ token: response.data.token, user_id: response.data.user_id, survey_id: response.data.survey_id });
          if (isEICFPresent()) {
            router.push(`/e-consent/consent-sign?query=${encodeData(payload)}`);
          } else {
            onSkip(encodeData(payload));
          }
        }
      })
      .catch((err) => {
        console.log('err', err);
        handleErrorMessage(err);
      });
  };

  return (
    <>
      <label className="page_heading">Registration</label>
      <p className="page_paragraph mt-4 mb-4 text-break text-start ">{studyInfo?.registration_description}</p>
      <Form>
        <Row className="mb-3">
          <Form.Group className="col-md-3 offset-md-3" controlId="firstName">
            <Form.Label className="form-label">First Name</Form.Label>
            <Form.Control
              type="text"
              name="first_name"
              isInvalid={!Validation.empty(first_name) && showErrors && !Validation.name(first_name)}
              onChange={formChangeHandler}
              value={first_name}
            />
            <Form.Control.Feedback type="invalid">
              {!first_name ? 'First Name is required' : 'First Name must be in range of 2-30 characters'}
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="col-md-3" controlId="lastName">
            <Form.Label className="form-label">Last Name</Form.Label>
            <Form.Control
              type="text"
              name="last_name"
              isInvalid={!Validation.empty(last_name) && showErrors && !Validation.nameval(last_name)}
              onChange={formChangeHandler}
              value={last_name}
            />
            <Form.Control.Feedback type="invalid">
              {!last_name ? 'Last Name is required' : 'Last Name must be in range of 2-30 characters'}
            </Form.Control.Feedback>
          </Form.Group>
        </Row>
        <Row className="mb-3">
          <Form.Group className="col-md-3 offset-md-3" controlId="contactNO">
            <Form.Label className="form-label">Phone No.</Form.Label>
            <Form.Control
              type="number"
              name="mobile_phone"
              isInvalid={!Validation.empty(mobile_phone) && showErrors && !Validation.numericPhone(mobile_phone)}
              onChange={formChangeHandler}
              value={mobile_phone}
            />
            <Form.Control.Feedback type="invalid">
              {!mobile_phone ? 'Phone Number is required' : 'Please enter a valid Phone Number'}
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="col-md-3" controlId="Email">
            <Form.Label className="form-label">Email</Form.Label>
            <Form.Control
              type="email"
              name="personal_email"
              isInvalid={
                (personal_email && !Validation.empty(personal_email) && showErrors && !Validation.email(personal_email)) ||
                (personal_email && showErrors && !isAnonymousUser && !Validation.email(personal_email))
              }
              onChange={formChangeHandler}
              value={personal_email}
            />
            <Form.Control.Feedback type="invalid">
              {!personal_email ? 'Email is required' : 'Please enter a valid email'}
            </Form.Control.Feedback>
          </Form.Group>
        </Row>
        {!userInfo?.personal_email && (
          <Row className="mb-3">
            <Form.Group className="d-flex justify-content-start col-md-6 offset-md-3" controlId="firstName">
              <FormCheck
                type="checkbox"
                name="isAnonymousUser"
                className="isAnonymousUserChecknox"
                value={isAnonymousUser}
                label="User wants to continue as anonymous"
                onChange={formChangeHandler}
              />
            </Form.Group>
          </Row>
        )}
      </Form>
      <Button variant="primary" className="mt-4" size="md" onClick={register}>
        Continue
      </Button>
    </>
  );
};
export default RegistrationComponent;
