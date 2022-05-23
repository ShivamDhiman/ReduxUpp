import moment from 'moment';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { CSVLink } from 'react-csv';
import { decodeData, encodeData } from '../../helpers/auth';
import { getIcfDetails } from '../../store/actions/dataManagement';
import { fetchSurveyData } from '../../store/actions/survey';
import styles from '../../stylesheets/DataMgt.module.scss';
import QuestionsComponent from '../Survey/QuestionsComponent';

const IcfFormData = () => {
  const csvRef = useRef();
  const [icfData, seticfData] = useState({});
  const [currentLanguage, setCurrentLanguage] = useState('English');
  const fontStyle = { inputStyle: styles.smallInput, questionStyle: styles.smallQuestion };
  const [eicfDetails, setEicfDetails] = useState({});
  const [fileName, setFileName] = useState('');
  const [heads, setHeads] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const { name, User, study_id, version, language, description, disclaimer, created_at } = eicfDetails;
  const router = useRouter();
  const dispatch = useDispatch();
  const tokenDetails = decodeData(router.query?.id);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!!icfData?.eicfDetails) {
      let data = icfData.eicfDetails.find((item) => item.language === currentLanguage) || {};
      setEicfDetails(data);
    }
  }, [icfData, currentLanguage]);

  const changeLanguage = (lang) => {
    setCurrentLanguage(lang);
  };

  const fetchData = () => {
    let payload = {
      form_code: tokenDetails.form_code,
      form_group: tokenDetails.form_group,
      survey_id: tokenDetails.survey_id,
      user_id: tokenDetails.user_id,
      version: tokenDetails.version,
    };
    dispatch(getIcfDetails(payload))
      .then((data) => {
        let dataWithAns = prepareData(data);
        seticfData(dataWithAns);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  function prepareData(data) {
    if (data) {
      let { eicfDetails, surveyData } = data;
      let answers = {};
      surveyData.forEach((rcd) => {
        answers[rcd.variable_name] = rcd.answer;
        answers[`${rcd.variable_name}_not_to_ans`] = rcd.not_to_ans;
      });
      eicfDetails = eicfDetails.map((item) => {
        item.eICFFQuestions = item.eICFFQuestions.map((que) => ({ ...que, not_to_ans: answers[`${que.variable_name}_not_to_ans`], answer: answers[que.variable_name] }));
        return item;
      });
      data = { eicfDetails, surveyData };
    }
    return data;
  }
  // const handleCsvDownload = () => {
  //   let tokenDetails = decodeData(router.query?.id);
  //   const currentDate = moment(new Date()).format('DD/MM/YYYY');
  //   const participantID = User?.participant_id ? `${User?.participant_id}_` : '';
  //   let payload = {
  //     form_code: tokenDetails.form_code,
  //     form_group: tokenDetails.form_group,
  //     survey_id: tokenDetails.survey_id,
  //     action: 'download',
  //   };
  //   let completed_at = moment(tokenDetails.completed_at).format('MM/DD/YYYY hh:mm');
  //   setFileName(`${study_id || ''}_${name || ''}_${participantID}${currentDate || ''}`);
  //   const encodePayload = encodeData(payload);
  //   dispatch(fetchSurveyData(encodePayload)).then((list) => {
  //     if (Array.isArray(list) && list.length) {
  //       let tempData = {
  //         'RECORD ID': tokenDetails.survey_id,
  //       };
  //       list.forEach((item) => {
  //         tempData[item.variable_name] = item.value || item.answer;
  //       });
  //       tempData = {
  //         ...tempData,
  //         sociodem_date_mdy: completed_at,
  //         housing_date_mdy: completed_at,
  //         work_ppe_date_mdy: completed_at,
  //         med_hx_date_mdy: completed_at,
  //         hlthstat_date_mdy: completed_at,
  //         vacc_date_mdy: completed_at,
  //         test_date_mdy: completed_at,
  //         sym_date_mdy: completed_at,
  //         alcohol_date_mdy: completed_at,
  //         iden_date_mdy: completed_at,
  //         consentdt_mdy: completed_at,
  //         covid_test_date_mdy: completed_at,
  //       };
  //       let heads = Object.keys(tempData).map((item) => ({ label: item?.toUpperCase(), key: item }));
  //       setHeads(heads);
  //       setCsvData([tempData]);
  //       csvRef?.current?.click();
  //     }
  //   });
  // };

  return (
    <div className="eICF-form">
      {heads && heads.length ? (
        <CSVLink headers={heads} data={csvData} filename={`${fileName}.csv`}>
          <button ref={csvRef} className="d-none"></button>
        </CSVLink>
      ) : null}
      <div className={'d-flex flex-column justify-content-start'}>
        <lable className={`${styles.greyLable}`}>Participant ID</lable>
        <lable className={`${styles.blackLable}`}>{tokenDetails?.participant_id || '-'}</lable>
        <div className="d-flex justify-content-between align-items-center">
          <div className={'my-3 d-flex flex-column'}>
            <lable className={`${styles.greyLable}`}>Form/Survey Name</lable>
            <lable className={`${styles.blackLable}`}>{name}</lable>
          </div>
          <div>
            <button
              className={`btn mx-1 ${language === 'English' ? 'btn-secondary' : 'btn-gray'}`}
              onClick={() => changeLanguage('English')}
            >
              English
            </button>
            <button
              className={`btn mx-1 ${language === 'Spanish' ? 'btn-secondary' : 'btn-gray'}`}
              onClick={() => changeLanguage('Spanish')}
            >
              Spanish
            </button>
          </div>
        </div>
      </div>
      <h4 className={styles.icfHeading}>
        {name} Version {version} : {moment(created_at).format('MM-DD-YYYY')}
      </h4>
      <div className={`text-left col-md-12 ${styles.previewBody}`} dangerouslySetInnerHTML={{ __html: description }}></div>
      <div className={'my-1 d-flex flex-column'}>
        {!!eicfDetails?.eICFFQuestions?.length && (
          <div className={styles['question-container']}>
            <QuestionsComponent
              fontStyle={fontStyle}
              step={0}
              showOnly={false}
              sections={0}
              questions={eicfDetails?.eICFFQuestions}
              isICF={true}
              handleAnswer={() => {}}
            />
          </div>
        )}
      </div>
      <div>
        {eicfDetails?.signatureUrl ? <img src={eicfDetails.signatureUrl} className="mb-4" width="100" height="70" /> : ''}
      </div>
      <div>
        {disclaimer && <small className={`fw-bold ${styles.icfHeading}`}>Disclaimer</small>}
        <p>{disclaimer}</p>
      </div>
    </div>
  );
};

export default IcfFormData;
