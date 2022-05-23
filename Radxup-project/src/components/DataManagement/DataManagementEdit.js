import { LazyLoaderGeneral } from '../common/LazyLoaderComponent';
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import router, { useRouter } from 'next/router';
import { Button } from 'react-bootstrap';
import { CSVLink } from 'react-csv';
import styles from '../../stylesheets/DataMgt.module.scss';
import { decodeData, encodeData, isAuth } from '../../helpers/auth';
import API from '../../helpers/api';
import QuestionItemView from './QuestionItemView';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSurveyData, setFormData, submitSurvey, updateAnswer } from '../../store/actions/survey';
import QuestionsComponent from '../Survey/QuestionsComponent';
import { handleErrorMessage, isValidQuestion } from '../../utils/commonFunctions';
import { COORDINATOR_ROLE } from '../../constants/constant';
import { toast } from 'react-toastify';
import { WithAuth } from '../common/WithAuth';
import moment from 'moment';

const DataManagementEditComponent = (props) => {
  const csvRef = useRef();
  const [heads, setHeads] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [formDetails, setFormDetails] = useState();
  const [showError, setShowError] = useState({});
  const [fileName, setFileName] = useState('');
  const [lang, setLang] = useState('english');
  const { questionData } = useSelector((state) => state.survey);
  const sections = questionData?.surveyForm[0]?.FormsSections.length;
  const totalSteps = useMemo(() => questionData?.surveyForm[0]?.FormsSections?.length - 1, [questionData]) || 0;
  const fontStyle = { inputStyle: styles.smallInput, questionStyle: styles.smallQuestion };
  const [onEditMode, setOnEditMode] = useState(false);
  const [isAnsFill, setIsAnsFill] = useState(false);
  const [step, setStep] = useState(0);
  const user = isAuth();
  const isCordinator = [COORDINATOR_ROLE].includes(user.role_id);
  const dispatch = useDispatch();
  const tokenDetails = decodeData(props.page);
  useEffect(() => {
    const query = {
      survey_id: tokenDetails?.survey_id,
      form_group: tokenDetails?.form_group,
      form_code: tokenDetails?.form_code,
    };
    const encodePayload = encodeData(query);
    API.apiGetByKey('surveyDetails', `?query=${encodePayload}`)
      .then((response) => {
        if (response?.data?.success) {
          setFormDetails(response?.data?.data);
        }
      })
      .catch((err) => {});
    const encodedToken = encodeData({
      form_code: tokenDetails?.form_code,
      form_name: tokenDetails?.form_name,
      form_group: tokenDetails?.form_group,
    });
    dispatch(setFormData(encodedToken));
  }, []);

  useEffect(() => {
    if (formDetails && questionData && !isAnsFill) {
      autoFillAanwer();
    }
  }, [formDetails, questionData]);

  const isValid = () => {
    let survey = questionData?.surveyForm && questionData?.surveyForm[lang === 'english' ? 0 : 1];
    let currentSection = survey?.FormsSections[step];
    let questions = currentSection?.FSQuestions;
    let unanswered = false;
    questions.forEach((que) => {
      if (!isValidQuestion(que)) {
        unanswered = true;
        let _errs = { ...new Array(survey?.FormsSections?.length).fill(false) };
        _errs[step] = true;
        setShowError(_errs);
      }
    });
    return !unanswered;
  };

  const handleStep = (value) => {
    if (value === 'forward') {
      if (isValid()) {
        setStep((prev) => prev + 1);
      }
    } else {
      setStep((prev) => prev - 1);
    }
  };

  const handleChange = useCallback(
    (ans, questionIndex, key = 'answer', sectionIndex = step, choice_key, not_to_ans) => {
      dispatch(updateAnswer(ans, questionIndex, key, sectionIndex ? sectionIndex : step, choice_key, not_to_ans));
    },
    [step]
  );

  const getAanswerOfQuestion = (variable_name) => {
    let index = formDetails.findIndex((e) => e.variable_name === variable_name);
    if (index !== -1) {
      return { answer: formDetails[index]?.answer, not_to_ans: formDetails[index]?.not_to_ans };
    } else {
      return '';
    }
  };

  const getRecordId = (variable_name) => {
    let index = formDetails.findIndex((e) => e.variable_name === variable_name);

    if (index !== -1) {
      return formDetails[index]?.id;
    } else {
      return null;
    }
  };

  const getChoiceKey = (question, answer) => {
    let choice_key = '';

    let qAttributes = question.FSQAttributes;
    for (let i = 0; i < qAttributes?.length; i++) {
      if (qAttributes[i].choice_label === answer) {
        choice_key = qAttributes[i].choice_value;
      }
    }
    return choice_key;
  };

  const autoFillAanwer = () => {
    let _questionData = questionData?.surveyForm[0];
    for (let i = 0; i < _questionData?.FormsSections.length; i++) {
      let questionList = _questionData?.FormsSections[i].FSQuestions;
      for (let j = 0; j < questionList?.length; j++) {
        let question = questionList[j];
        const { answer, not_to_ans } = getAanswerOfQuestion(question?.variable_name);
        const choice_key = getChoiceKey(question, answer);
        const record_id = getRecordId(question?.variable_name);
        handleChange(answer, j, 'answer', i, choice_key, not_to_ans);
        handleChange(record_id, j, 'record_id', i, choice_key);
      }
    }
    setIsAnsFill(true);
  };

  const handleClose = () => {
    router.back();
  };

  const handleParticipantClose = () => {
    router.push(`/participant-management`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let _questionData = questionData?.surveyForm[0];
    let requestJson = {
      survey_id: tokenDetails?.survey_id,
      form_code: tokenDetails?.form_code,
      study_id: tokenDetails?.study_id,
      participant_id: tokenDetails?.user_id,
    };
    let data = [];
    let error = false;
    for (let i = 0; i < _questionData.FormsSections.length; i++) {
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
            record_id: question.record_id,
            language: 'English',
            not_to_ans: question.not_to_ans,
          };
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
        }
      }
    }
    if (!error) {
      requestJson = { ...requestJson, data: data };
      API.apiPost('surveyResubmit', { payload: encodeData(requestJson) })
        .then((response) => {
          setOnEditMode(false);
          toast.success(response.data.message);
        })
        .catch((error) => {
          handleErrorMessage(error);
        });
    }
  };

  const downloadCSV = () => {
    let payload = {
      survey_id: tokenDetails?.survey_id,
      action: 'download',
      form_group: tokenDetails?.form_group,
      form_code: tokenDetails?.form_code,
    };
    let completed_at = moment(tokenDetails.completed_at).format('MM/DD/YYYY hh:mm');
    const { participant_id } = tokenDetails;
    const currentDate = moment(new Date()).format('DD/MM/YYYY');
    const participantID = participant_id ? `${participant_id}` : '';
    setFileName(`${participantID}_${currentDate || ''}`);
    const encodePayload = encodeData(payload);
    dispatch(fetchSurveyData(encodePayload)).then((surveyData) => {
      if (Array.isArray(surveyData)) {
        let tempData = {
          'RECORD ID': tokenDetails.survey_id,
        };
        surveyData.forEach((item) => {
          tempData[item.variable_name] = item.value || item.answer;
        });
        tempData = {
          ...tempData,
          sociodem_date_mdy: completed_at,
          housing_date_mdy: completed_at,
          work_ppe_date_mdy: completed_at,
          med_hx_date_mdy: completed_at,
          hlthstat_date_mdy: completed_at,
          vacc_date_mdy: completed_at,
          test_date_mdy: completed_at,
          sym_date_mdy: completed_at,
          alcohol_date_mdy: completed_at,
          iden_date_mdy: completed_at,
          consentdt_mdy: completed_at,
          covid_test_date_mdy: completed_at,
        };
        let heads = Object.keys(tempData).map((item) => ({ label: item?.toUpperCase(), key: item }));
        setHeads(heads);
        setCsvData([tempData]);
        csvRef?.current?.click();
      }
    });
  };

  return (
    <div className="eICF-form">
      {heads && heads.length ? (
        <CSVLink headers={heads} data={csvData} filename={`${fileName}.csv`}>
          <button ref={csvRef} className="d-none"></button>
        </CSVLink>
      ) : null}
      <div className="row mb-2 d-flex">
        <div className="d-flex justify-content-end align-items-end">
          <div>
            {onEditMode ? (
              <div>
                <button
                  onClick={() => setOnEditMode(false)}
                  className={`btn ${styles.buttonWidth} ${styles.buttonBackground} mx-1`}
                >
                  Cancel
                </button>
                <button className={`btn ${styles.buttonWidth} ${styles.saveButton} mx-1 btn-primary`} onClick={handleSubmit}>
                  Save
                </button>
              </div>
            ) : (
              <div>
                {tokenDetails?.participant_management_form && (
                  <button
                    onClick={handleParticipantClose}
                    className={`btn ${styles.buttonWidth} ${styles.buttonBackground} mx-1`}
                  >
                    Close
                  </button>
                )}
                {!tokenDetails?.participant_management_form && (
                  <>
                    <button onClick={handleClose} className={`btn ${styles.buttonWidth} ${styles.buttonBackground} mx-1`}>
                      Close
                    </button>
                    <button onClick={() => setOnEditMode(true)} className={`btn ${styles.buttonWidth} mx-1 btn-primary`}>
                      Edit
                    </button>
                    {!isCordinator && (
                      <button onClick={downloadCSV} className={`btn  ${styles.buttonWidth} mx-1 btn-primary`}>
                        Download CSV
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={'d-flex flex-column justify-content-start'}>
        <lable className={`${styles.greyLable}`}>Participant ID</lable>
        <lable className={`${styles.blackLable}`}>{tokenDetails?.participant_id || '-'}</lable>
        <div className={'my-3 d-flex flex-column'}>
          <lable className={`${styles.greyLable}`}>Form/Survey Name</lable>
          <lable className={`${styles.blackLable}`}>{tokenDetails?.form_name}</lable>
        </div>

        <div className={'my-1 d-flex flex-column'}>
          {questionData && questionData.surveyForm.length !== 0 && (
            <div className={styles['question-container']}>
              <QuestionsComponent
                fontStyle={fontStyle}
                step={step}
                showOnly={!onEditMode}
                sections={sections}
                questions={questionData?.surveyForm[0]?.FormsSections}
                showError={showError[step]}
                handleAnswer={handleChange}
                onSectionChange={(event) => {
                  setStep(Number(event.target.value));
                }}
              />
            </div>
          )}
          <div className={`${styles['controls-section']} d-flex justify-content-between`}>
            {step !== 0 && (
              <Button
                className={`btn btn-primary ${step === 0 ? styles['disabled-btn'] : ''}`}
                disabled={step === 0}
                onClick={() => handleStep('backword')}
              >
                Back
              </Button>
            )}
            {step !== totalSteps && totalSteps !== 0 ? (
              <Button className="btn btn-primary  ms-auto" onClick={() => handleStep('forward')}>
                Next
              </Button>
            ) : (
              onEditMode && (
                <Button className={`${styles['success-btn']} btn btn-success`} onClick={handleSubmit}>
                  Submit
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithAuth(DataManagementEditComponent);
