import styles from '../../stylesheets/EConcent.module.scss';
import Form from 'react-bootstrap/Form';
import { FormCheck, FormGroup, Modal, Spinner } from 'react-bootstrap';
import { useRouter } from 'next/router';
import API from '../../helpers/api';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import SignaturePad from 'react-signature-pad-wrapper';
import React, { useRef } from 'react';
import { handleErrorMessage, isValidQuestion } from '../../utils/commonFunctions';
import moment from 'moment-timezone';
import { decodeData, encodeData } from '../../helpers/auth';
import RoleListModal from './RoleListModal';
import _ from 'lodash';
import QuestionsComponent from './QuestionsComponent';
import { LANGUAGE_LIST } from '../../constants/constant';
function EConcent(props) {
  const [fontStyle, setFontSize] = useState({ inputStyle: styles.smallInput, questionStyle: styles.smallQuestion });

  const { userInfo, onSkip } = props;
  const { surveyForm, token } = userInfo;
  // const tokenInfo = decodeData(token);
  const initialState = {
    signature: false,
    digitalSignature: false,
    namedSignature: false,
  };
  const [signatureType, setsignatureType] = useState(initialState);
  const { signature, digitalSignature, namedSignature } = signatureType;
  const [openModal, setOpenModal] = useState(false);
  const [participantName, setParticipantName] = useState('');
  const [digitalSignUrl, setDegitalSignUrl] = useState(null);
  const [isUploaded, setUploaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatedToken, setUpdatedToken] = useState('');
  const [step, setStep] = useState(null);
  const [showError, setShowError] = useState(false);
  const [eICFS, seteICFS] = useState([]);
  const [currentLanguage, setCurrentLanguage] = useState('English');
  const [currentEICF, setCurrentEICF] = useState([]);
  const [languageList, setLanguageList] = useState(LANGUAGE_LIST);

  let sigPad = useRef({});
  const router = useRouter();
  const canvasRef = useRef();
  const nameRef = useRef();

  const updateLanguageList = (name) => {
    languageList.map((item) => {
      if (item.name === name) {
        item.selected = true;
      }
      return item;
    });
    setLanguageList([...languageList]);
  };
  const languageListPicked = languageList.reduce((res, acc) => {
    if (acc.selected) {
      res.push(acc.name);
    }
    return res;
  }, []);

  useEffect(() => {
    if (userInfo?.surveyForm) {
      if (userInfo?.isCoordinator) {
        setOpenModal(true);
      }
      if (userInfo?.eICFs?.length) {
        let eICFForms = JSON.stringify(userInfo?.eICFs);
        eICFForms = eICFForms.replace(/\"eICFFQAttributes\":/gi, '"FSQAttributes":');
        eICFForms = JSON.parse(eICFForms);
        eICFForms.map((form) => {
          form.map((f) => {
            f.eICFFQuestions.map((que) => {
              que.isVisible = true;
            });
          });
        });
        seteICFS([...eICFForms]);
        setStep(1);
      }
      if (!userInfo?.isCoordinator && userInfo?.survey_id && userInfo?.eICFs?.length === 0) {
        onSkip(); // this will be done in who is filling form if cordinator/admin
      }
      setLoading(false);
    }
  }, [userInfo]);

  useEffect(() => {
    const { signature, digitalSignature, namedSignature } = signatureType;
    if (!signature && sigPad && sigPad.current && sigPad.current.clear) sigPad.current.clear();
    if (!namedSignature && nameRef && nameRef.current) nameRef.current.value = '';
    if (!digitalSignature) setDegitalSignUrl(null);
  }, [signatureType]);

  useEffect(() => {
    if (step && eICFS?.length) {
      setCurrentEICF(eICFS[step - 1]);
      let current = eICFS[step - 1];
      let languages = current?.map((icf) => icf.language);
      languageList?.map((item) => {
        if (languages.includes(item.name)) {
          item.selected = true;
        } else {
          item.selected = false;
        }
        return item;
      });
      setLanguageList([...languageList]);
      setCurrentLanguage('English');
    }
  }, [step, eICFS]);

  const handleChange = (e) => {
    setParticipantName(e.target.value);
    if (e.target.value) {
      setsignatureType({ signature: false, digitalSignature: false, namedSignature: true });
    } else {
      setsignatureType({ signature: false, digitalSignature: false, namedSignature: false });
    }
  };

  const signaturePadChanges = () => {
    setsignatureType({ signature: true, digitalSignature: false, namedSignature: false });
  };

  const onContinue = () => {
    setLoading(true);
    const { signature, digitalSignature, namedSignature } = signatureType;
    if (signature) uploadFile(trim(), true);
    if (namedSignature) uploadFile(generateImageFromText(), true);
    if (digitalSignature) uploadFile(dataURItoBlob(digitalSignUrl), true);
    // router.push(`/survey?survey_id=${encodeData(surveyForm)}`);
  };

  const selectLanguage = ({ target }) => {
    // setHasSpanish(target.name === 'Spanish' ? true : false);
    setCurrentLanguage(target.name);
  };

  const generateImageFromText = () => {
    const context = canvasRef.current.getContext('2d');
    const textWidth = context.measureText(participantName).width;
    const canvasWidth = textWidth + 100;
    context.canvas.width = canvasWidth;
    context.textAlign = 'start';
    context.font = 20 + 'px Verdana';
    context.fillText(participantName, 10, 50);
    return dataURItoBlob(context.canvas.toDataURL());
  };

  const selectFile = (event) => {
    if (event?.target?.files && event?.target?.files?.length) {
      const file = event?.target?.files[0];
      const ext = file.name.split('.').pop();
      if (!['gif', 'png', 'bmp', 'jpeg', 'jpg'].includes(ext)) {
        toast.error('Only image allowed.');
        return;
      }
      setsignatureType({ signature: false, digitalSignature: true, namedSignature: false });
      setParticipantName('');
      var reader = new FileReader();
      reader.onload = function (e) {
        setDegitalSignUrl(e.target.result);
      };

      reader.readAsDataURL(event.target.files[0]);
    }
  };

  const uploadFile = (file, redirect) => {
    let _questionData = currentEICF?.find((icf) => icf.language === currentLanguage) || {};
    let questionList = _questionData.eICFFQuestions;
    let hasError = false;
    questionList.forEach((question) => {
      if (!isValidQuestion(question) && !hasError) {
        setShowError(true);
        setLoading(false);
        hasError = true;
      }
    });
    if (hasError) {
      return;
    }
    const formData = new FormData();
    formData.append('signature', file);
    formData.append('user_id', userInfo.id);
    formData.append('study_id', userInfo.study_id || currentEICF[0]?.study_id);
    formData.append('form_group', userInfo.form_group);
    formData.append('form_code', userInfo.form_code);
    formData.append('eICF_code', currentEICF[0]?.form_code || userInfo.form_code);
    formData.append('revisedEICF', currentEICF[0]?.revisedEICF || false);
    formData.append('form_group', userInfo.form_group);
    API.apiPost('signatureUpload', formData)
      .then((res) => {
        setDegitalSignUrl(res.data.fileUrl);
        // setUploaded(true);
        // toast.success(res.data.message);
        let user = userInfo;
        const data = {
          form_code: user.form_code,
          form_group: user.form_group,
          form_name: user.form_name,
          personal_email: user.personal_email,
          survey_id: res.data.survey_id,
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          token: token,
          study_id: currentEICFData?.study_id,
        };
        handleFormSubmission(data);
        // const updatedToken = encodeData(data);
        // setUpdatedToken(updatedToken);
        // if (step === eICFS.length) {
        //   router.push(`/survey?query=${updatedToken}`);
        // } else {
        //   setStep(step + 1);
        //   setHasSpanish(eICFS[step]?.language === 'Spanish');
        //   setLoading(false);
        //   // setDegitalSignUrl(null);
        //   // setsignatureType({ signature: false, digitalSignature: false, namedSignature: false });
        // }
      })
      .catch((err) => {
        handleErrorMessage(err);
        setLoading(false);
      });
  };

  const handleFormSubmission = (tokenDetails) => {
    let _questionData = currentEICF?.find((icf) => icf.language === currentLanguage) || {};
    const updatedToken = encodeData({ ...tokenDetails, onlyICF: !surveyForm?.length });
    setUpdatedToken(updatedToken);
    let requestJson = {
      survey_id: tokenDetails?.survey_id,
      form_code: _questionData?.form_code,
      form_group: 'eICF',
      version: currentEICF[0]?.version,
      revisedEICF: currentEICF[0]?.revisedEICF || false,
      study_id: currentEICF[0]?.study_id || userInfo?.study_id,
      participant_id: tokenDetails?.id,
    };
    let data = [];
    let error = false;
    let questionList = _questionData.eICFFQuestions;
    for (let j = 0; j < questionList.length; j++) {
      let question = questionList[j];
      question.isVisible = true;
      if (isValidQuestion(question)) {
        let dataObj = {
          question_id: question.id,
          question: question.question,
          variable_name: question.variable_name,
          question_type: question.response_type,
          answer: question.answer,
          language: currentLanguage,
          not_to_ans: question.not_to_ans,
        };

        if (['Radio Button', 'Dropdown', 'Multiple Choice'].includes(question.response_type) && question?.answer) {
          if (question.response_type === 'Multiple Choice') {
            let ansArray = question?.answer?.split(',');
            let choice_value = [];
            ansArray?.forEach((ans) => {
              let found = question?.FSQAttributes.find((attribute) => attribute?.choice_label == ans);
              if (found) {
                choice_value.push(found.choice_value);
              }
            });
            if (choice_value?.length) {
              dataObj.value = choice_value.join(',');
            }
          } else {
            let found = question?.FSQAttributes.find((attribute) => attribute?.choice_label == question?.answer);
            if (found) {
              dataObj.value = found.choice_value;
            }
          }
        }
        data.push(dataObj);
        // handleChange('', j, 'error', i);
      } else {
        error = true;
        setShowError(true);
        setLoading(false);
        // handleChange('Field is required', j, 'error', i);
      }
    }
    // console.log('data', data, 'requestJson', requestJson);

    if (!error) {
      requestJson = { ...requestJson, data: data };
      const draftDataName = `${_questionData?.form_code}${_questionData?.name}${_questionData?.version}`;
      const headers = {
        version: 'v1',
        authorization: userInfo?.token,
      };
      API.apiPost('surveySubmit', { payload: encodeData(requestJson) }, { headers })
        .then((response) => {
          if (response.data && response.data.success === true) {
            toast.success('eIcf submitted');
            if (step === eICFS.length) {
              router.push(`/survey?query=${updatedToken}`);
            } else {
              setStep(step + 1);
              setLoading(false);
              setShowError(false);
              // setDegitalSignUrl(null);
              // setsignatureType({ signature: false, digitalSignature: false, namedSignature: false });
            }
          }
        })
        .catch((error) => {
          handleErrorMessage(error);
        });
    }
  };

  const trim = () => {
    return dataURItoBlob(sigPad.current.toDataURL());
  };

  const dataURItoBlob = (dataURI) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const setWhoIsFillingSurvey = (e) => {
    setOpenModal(false);
    // after who is filling skip if no eicf
    if (userInfo?.survey_id && userInfo?.eICFs?.length === 0) {
      onSkip();
    }
    // router.push(`/survey?token=${updatedToken}`);
  };

  const handleQuestionAnswers = (ans, questionIndex, key, sectionIndex, choice_key) => {
    currentEICF.forEach((icf, icfIndex) => {
      if (key) {
        if (key == 'answer') {
          currentEICF[icfIndex].eICFFQuestions[questionIndex].answer = ans;
        }
        if (key == 'not_to_ans') {
          currentEICF[icfIndex].eICFFQuestions[questionIndex].not_to_ans = ans;
          currentEICF[icfIndex].eICFFQuestions[questionIndex].answer = '';
        }
      } else {
        currentEICF[icfIndex].eICFFQuestions[questionIndex].answer = ans;
      }
    });
    setCurrentEICF([...currentEICF]);
  };

  let currentEICFData = currentEICF?.find((icf) => icf.language === currentLanguage) || {};

  if (!eICFS.length) {
    return (
      <div className="d-flex justify-content-around ">
        <Modal
          className={`${'custom-modal'}`}
          show={openModal}
          onHide={() => {
            onSkip();
            setOpenModal(false);
          }}
          backdrop="static"
          keyboard={false}
          centered
        >
          <RoleListModal onContinue={setWhoIsFillingSurvey} setLoading={setLoading} />
        </Modal>
        <Spinner as="span" animation="grow" className="mt-15" size="sm" role="status" aria-hidden="true" />
      </div>
    );
  }
  return (
    <div className="container mb-4 text-start">
      <Modal
        className={`${'custom-modal'}`}
        show={openModal}
        onHide={() => setOpenModal(false)}
        backdrop="static"
        keyboard={false}
        centered
      >
        <RoleListModal onContinue={setWhoIsFillingSurvey} setLoading={setLoading} />
      </Modal>
      <div>
        <div className="d-flex align-items-baseline justify-content-between">
          <h4 className={`${styles.heading} float-start`}>
            {/* RADX-UP Informed Consent Data Sharing Template Language Version 1.0 : MM/DD/YYYY */}
            {currentEICFData?.name && (
              <div className="d-flex flex-column">
                <span>{`${currentEICFData?.name} `}</span>
                <span>{`Version ${currentEICFData?.version} : ${moment(currentEICFData?.updated_at).format(
                  'MM/DD/YYYY'
                )}  (${step} OF ${eICFS?.length})`}</span>
              </div>
            )}
          </h4>
          <div>
            {languageListPicked.map((langItem, index) => (
              <button
                key={index}
                name={langItem}
                className={`btn mx-1 ${currentLanguage === langItem ? 'btn-primary' : 'btn-gray'}`}
                onClick={selectLanguage}
              >
                {langItem}
              </button>
            ))}

            {/* <button
              onClick={selectLanguage}
              name="English"
              className={`btn px-4 d-inline-block text-white ${styles.button} ${!hasSpanish ? '' : 'bg-gray'} ${
                styles.outlineNone
              }`}
            >
              English
            </button>

            {currentEICF?.hasSpanish && (
              <button
                onClick={selectLanguage}
                name="Spanish"
                className={`btn px-4 d-inline-block text-white ms-1 ${styles.button}  ${hasSpanish ? '' : 'bg-gray'} ${
                  styles.outlineNone
                }`}
              >
                Spanish
              </button>
            )} */}
          </div>
        </div>
        {/* {!currentEICF?.name && `${hasSpanish} Version not available`} */}
        <div
          className={`col-md-12 ${styles.consent}`}
          dangerouslySetInnerHTML={{ __html: currentEICFData?.description }}
        ></div>
        {currentEICFData && currentEICFData?.eICFFQuestions?.length && (
          <div className={styles['question-container']}>
            <QuestionsComponent
              fontStyle={fontStyle}
              questions={currentEICFData?.eICFFQuestions || []}
              handleAnswer={handleQuestionAnswers}
              showError={showError}
            />
          </div>
        )}
      </div>
      <div className="row mt-5 align-items-center">
        <div className="col-md-3">
          <div className="d-flex flex-column">
            <div className={`mb-3 rounded w-100   text-center ${styles.dotBox}`}>
              <SignaturePad
                options={{ onBegin: signaturePadChanges }}
                canvasProps={{ className: styles.sigPad }}
                ref={sigPad}
              />
              {!signatureType.signature && <p className={` ${styles.para}`}>Sign here</p>}
            </div>
            {/* <Form>
              <canvas id="textCanvas" ref={canvasRef} className={styles.canvas} height="100" />
              <Form.Control
                placeholder="Enter Name"
                maxLength={30}
                ref={nameRef}
                value={participantName}
                onChange={handleChange}
              />
            </Form> */}
            {/* <button
              onClick={onContinue}
              size="md"
              disabled={loading || ![signature, digitalSignature, namedSignature].includes(true)}
              className={`btn px-4 d-inline-block text-white mt-5  ${styles.button}`}
            >
              Continue
            </button> */}
          </div>
        </div>

        <span className="align-self-center col-md-1 text-center p-4">OR</span>
        <div className="col-md-3">
          <Form>
            <canvas id="textCanvas" ref={canvasRef} className={styles.canvas} height="100" />
            <Form.Control
              placeholder="Enter Name"
              maxLength={30}
              ref={nameRef}
              value={participantName}
              onChange={handleChange}
            />
          </Form>
        </div>
        <span className="align-self-center col-md-1 text-center p-4">OR</span>
        <div className="col-md-3">
          <div className="d-flex flex-column align-items-center">
            <Form className={`mb-3 rounded px-3  text-center`}>
              <Form.Label htmlFor="upload-sign" className="m-0">
                <span className={`d-block `}>
                  <img
                    src={digitalSignUrl ? digitalSignUrl : '/images/ds-sign.svg'}
                    alt="sign"
                    className={`img-fluid ${styles.signIcon}`}
                  />
                </span>
              </Form.Label>
              <Form.Control accept="image/*" onChange={selectFile} type="file" id="upload-sign" className="d-none" />
            </Form>
            <p className="mt-2 m-0 text-center">{`${
              isUploaded ? 'Digital signature uploaded' : 'Upload digital signature'
            }`}</p>
          </div>
        </div>
      </div>
      <button
        onClick={onContinue}
        size="md"
        disabled={loading || ![signature, digitalSignature, namedSignature].includes(true)}
        className={`btn px-4 d-inline-block text-white mt-2  ${styles.button}`}
      >
        Continue
      </button>
      {currentEICFData?.disclaimer && <div className={`col-md-12 mt-5 fw-bold ${styles.disclaimerHeading}`}>Disclaimer</div>}
      <div className={`col-md-12 ${styles.consent}`}>{currentEICFData && currentEICFData?.disclaimer} </div>
    </div>
  );
}

export default EConcent;
