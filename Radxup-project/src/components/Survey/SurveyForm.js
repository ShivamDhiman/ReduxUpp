import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import React, { useCallback, useMemo, useState, Fragment, useEffect, useRef } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import styles from '../../stylesheets/SurveyForm.module.scss';
import { setFormData, submitSurvey, updateAnswer, updateQuesFromStore } from '../../store/actions/survey';
import { decodeData, encodeData, isAuth } from '../../helpers/auth';
import { getFullName, isValidQuestion } from '../../utils/commonFunctions';
import RoleListModal from '../Econcent/RoleListModal';
import { ADMIN_ROLE, COORDINATOR_ROLE, SUPER_ADMIN_ROLE } from '../../constants/constant';
import _ from 'lodash';

const QuestionsComponent = dynamic(() => import('./QuestionsComponent'));
const ThankYouComponent = dynamic(() => import('../common/Thankyoufeedback'));

const SurveyForm = () => {
  const [step, setStep] = useState(0);
  const user = isAuth();
  const [lang, setLang] = useState('english');
  const [showError, setShowError] = useState({});
  const [isSubmitSuccess, setIsSubmitSuccess] = useState('english');
  const { questionData, submitSuccess } = useSelector((state) => state.survey);
  const [submitToken, setSubmitToken] = useState('');
  const [formSize, setFormSize] = useState('medium');
  const [openRoleListModal, setOpenRoleListModal] = useState(false);
  const [clearRoleListModal, setClearRoleListModal] = useState(false);
  const [fontStyle, setFontSize] = useState({ inputStyle: styles.smallInput, questionStyle: styles.smallQuestion });
  const totalSteps = useMemo(
    () => questionData?.surveyForm[0]?.FormsSections.filter((f) => f.isVisible)?.length - 1,
    [questionData]
  );
  const router = useRouter();
  const query = router?.query?.query;
  const tokenDetails = decodeData(query);
  const dispatch = useDispatch();

  useEffect(() => {
    setIsSubmitSuccess(submitSuccess);
  }, [submitSuccess]);

  useEffect(() => {
    // console.log(questionData?.surveyForm, tokenDetails);
    if (questionData && questionData.token) {
      setSubmitToken(questionData.token);
    } else {
      if (tokenDetails?.token) {
        setSubmitToken(tokenDetails?.token);
      }
    }
    if (!clearRoleListModal && questionData?.surveyForm?.length && questionData?.surveyForm[0]?.eICFList?.length === 0) {
      if (user && [ADMIN_ROLE, COORDINATOR_ROLE].includes(user.role_id)) {
        setOpenRoleListModal(true);
        setClearRoleListModal(true);
      }
    }
  }, [questionData]);

  /* populate data if available in localStorage */
  const isDataPopulated = useRef(true);
  useEffect(() => {
    if (questionData?.userProfile && questionData.surveyForm[0] && isDataPopulated.current) {
      isDataPopulated.current = false;
      const qDataFromLocalStorage = localStorage.getItem(
        `${questionData.surveyForm[0]?.form_code}${questionData.surveyForm[0]?.name}${questionData.surveyForm[0]?.version}`
      );
      if (qDataFromLocalStorage) {
        dispatch(updateQuesFromStore(JSON.parse(qDataFromLocalStorage)));
      }
    }
  }, [questionData]);

  /* handle direct close */
  useEffect(
    () => () => {
      if (questionData?.userProfile && questionData.surveyForm[0]) {
        localStorage.setItem(
          `${questionData.surveyForm[0]?.form_code}${questionData.surveyForm[0]?.name}${questionData.surveyForm[0]?.version}`,
          JSON.stringify(questionData)
        );
      }
    },
    []
  );

  /* handle user answers */
  useEffect(() => {
    if (questionData?.userProfile && questionData.surveyForm[0]) {
      _.debounce(() => {
        localStorage.setItem(
          `${questionData.surveyForm[0]?.form_code}${questionData.surveyForm[0]?.name}${questionData.surveyForm[0]?.version}`,
          JSON.stringify(questionData)
        );
      }, 500)();
    }
  }, [questionData]);

  useEffect(() => {
    if (query) {
      if (tokenDetails?.onlyICF) {
        setIsSubmitSuccess(true);
        return;
      }
      const encodedToken = encodeData({
        form_code: tokenDetails.form_code,
        form_name: tokenDetails.form_name,
        form_group: tokenDetails.form_group,
        personal_email: tokenDetails.personal_email,
        survey_id: tokenDetails.survey_id,
        id: tokenDetails.id || tokenDetails.user_id,
      });
      dispatch(setFormData(encodedToken));
    }
  }, [query]);

  useEffect(() => {
    if (formSize === 'small') {
      setFontSize({ inputStyle: styles.smallInput, questionStyle: styles.smallQuestion });
    } else if (formSize === 'medium') {
      setFontSize({ inputStyle: styles.mediamInput, questionStyle: styles.medialQuestion });
    } else {
      setFontSize({ inputStyle: styles.largeInput, questionStyle: styles.largeQuestion });
    }
  }, [formSize]);

  const handleChange = useCallback(
    (ans, questionIndex, key = 'answer', sectionIndex = step, choice_key) => {
      dispatch(updateAnswer(ans, questionIndex, key, sectionIndex || step, choice_key));
    },
    [step]
  );

  const isValid = () => {
    const survey = questionData?.surveyForm && questionData.surveyForm[lang === 'english' ? 0 : 1];
    const currentSection = survey && survey.FormsSections[step];
    const questions = currentSection && currentSection.FSQuestions;
    let unanswered = false;
    if (questions) {
      questions.forEach((que) => {
        if (!isValidQuestion(que)) {
          unanswered = true;
          // eslint-disable-next-line no-underscore-dangle
          const _errs = { ...new Array(survey.FormsSections.length).fill(false) };
          _errs[step] = true;
          setShowError(_errs);
        }
      });
    }
    return !unanswered;
  };
  // const handleStep = (value) => {
  //   if (value === 'forward') {
  //     if (isValid()) {
  //       setStep((prev) => prev + 1);
  //     }
  //   } else {
  //     setStep((prev) => prev - 1);
  //   }
  // };
  const handleStep = (value, isNextStep) => {
    if (value === 'forward') {
      if (isValid()) {
        let currentStep = isNextStep || step;
        let isVisible = questionData?.surveyForm[lang === 'english' ? 0 : 1]?.FormsSections[currentStep + 1].isVisible;
        if (isVisible) {
          setStep((prev) => prev + 1);
        } else {
          if (currentStep !== totalSteps) handleStep('forward', currentStep + 1);
        }
      }
    } else {
      let currentStep = isNextStep || step;
      let isVisible = questionData?.surveyForm[lang === 'english' ? 0 : 1]?.FormsSections[currentStep - 1].isVisible;
      if (isVisible) {
        setStep((prev) => prev - 1);
      } else {
        if (currentStep > 0) handleStep('backword', currentStep - 1);
      }
    }
  };

  const handleLang = (e) => {
    setLang(e.target.value);
  };

  const closeRoleListModal = () => {
    setOpenRoleListModal(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let _questionData = questionData?.surveyForm[lang === 'english' ? 0 : 1];
    let requestJson = {
      survey_id: tokenDetails?.survey_id,
      form_code: tokenDetails?.form_code,
      form_group: tokenDetails?.form_group,
      version: questionData?.surveyForm[0]?.version,
      study_id: questionData?.surveyForm[0]?.study_id,
      participant_id: tokenDetails?.id || questionData?.userProfile?.id,
    };
    let data = [];
    let error = false;
    const sectionLength = _questionData?.FormsSections?.length;
    for (let i = 0; i < sectionLength; i++) {
      //skip validation for hidden section
      if (_questionData.FormsSections[i]?.isVisible === false) {
        break;
      }
      let questionList = _questionData.FormsSections[i].FSQuestions;
      for (let j = 0; j < questionList.length; j++) {
        let question = questionList[j];
        if (isValidQuestion(question)) {
          let dataObj = {
            question_id: question.id,
            question: question.question,
            variable_name: question.variable_name,
            question_type: question.response_type,
            answer: question.answer,
            language: lang,
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
          let _errs = {
            ...new Array(questionData.surveyForm?.[lang === 'english' ? 0 : 1]?.FormsSections.length).fill(false),
          };
          _errs[step] = true;
          setShowError(_errs);
          // handleChange('Field is required', j, 'error', i);
          break;
        }
      }
    }
    if (!error) {
      requestJson = { ...requestJson, data: data };
      const draftDataName = `${questionData.surveyForm[0]?.form_code}${questionData.surveyForm[0]?.name}${questionData.surveyForm[0]?.version}`;
      dispatch(submitSurvey(encodeData(requestJson), submitToken, draftDataName));
    }
  };

  const sections = questionData?.surveyForm[lang === 'english' ? 0 : 1]?.FormsSections.length;
  const currentSurvey = questionData?.surveyForm[lang === 'english' ? 0 : 1];
  return isSubmitSuccess ? (
    <ThankYouComponent
      token={submitToken}
      userProfile={tokenDetails}
      survey_id={tokenDetails?.survey_id}
      study_id={questionData?.surveyForm[0]?.study_id || tokenDetails?.study_id}
    />
  ) : (
    <Fragment>
      <div className="ifEconsentSkipShowWhoisFilling">
        <Modal
          className={`${'custom-modal'}`}
          show={openRoleListModal}
          onHide={() => closeRoleListModal()}
          backdrop="static"
          keyboard={false}
          centered
        >
          {openRoleListModal && (
            <RoleListModal onContinue={() => closeRoleListModal()} setLoading={() => closeRoleListModal()} />
          )}
        </Modal>
      </div>
      <div className={`${styles['head-section']} d-flex justify-content-between`}>
        <label>Survey Name : {currentSurvey?.name || '-'}</label>
        <div className="btn-group" role="group" aria-label="languages">
          <div className={'align-items-center d-flex mx-4'}>
            {['small', 'medium', 'large'].map((font, i) => (
              <span
                key={i}
                onClick={() => setFormSize(font)}
                className={`${
                  font === 'small' ? styles.sizeSmall : font === 'medium' ? styles.sizeMediam : styles.sizeLarge
                }  ${formSize === font && styles.active} mx-2`}
              >
                A
              </span>
            ))}
          </div>
          <Button
            onClick={handleLang}
            disabled={questionData?.surveyForm[0] ? false : true}
            value="english"
            className={`btn ${lang === 'english' ? 'btn-primary' : styles.inactive} mx-1`}
          >
            English
          </Button>
          <Button
            onClick={handleLang}
            disabled={questionData?.surveyForm[1] ? false : true}
            value="spanish"
            className={`btn ${lang === 'spanish' ? 'btn-primary' : styles.inactive}`}
          >
            Spanish
          </Button>
        </div>
      </div>
      <div className={`d-flex justify-content-start mb-2 ${styles.title}`}>
        <label>Participant Name :</label>
        <span className="ms-1 fw-bold">
          {getFullName(
            tokenDetails?.first_name || questionData?.userProfile?.first_name || '',
            tokenDetails?.last_name || questionData?.userProfile?.last_name || ''
          )}
        </span>
      </div>
      {questionData && (
        <div className={styles['question-container']}>
          <QuestionsComponent
            fontStyle={fontStyle}
            step={step}
            sections={totalSteps + 1}
            questions={questionData?.surveyForm[lang === 'english' ? 0 : 1]?.FormsSections}
            showError={showError[step]}
            handleAnswer={handleChange}
            onSectionChange={(event) => {
              setStep(Number(event.target.value));
            }}
          />
        </div>
      )}

      {questionData && (
        <div className={`${styles['controls-section']} d-flex justify-content-between `}>
          <Button
            className={`btn btn-primary ${step === 0 ? styles['disabled-btn'] : ''}`}
            disabled={step === 0}
            onClick={() => handleStep('backword')}
          >
            Back
          </Button>
          {step !== totalSteps ? (
            <Button className="btn btn-primary" onClick={() => handleStep('forward')}>
              Next
            </Button>
          ) : (
            <Button className={`${styles['success-btn']} btn btn-success`} onClick={handleSubmit}>
              Submit
            </Button>
          )}
        </div>
      )}
    </Fragment>
  );
};

export default SurveyForm;
