import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Form, FormCheck, FormGroup, InputGroup, OverlayTrigger, Popover, Spinner } from 'react-bootstrap';
import { Editor } from '@tinymce/tinymce-react';
import { toast } from 'react-toastify';
import API from '../../helpers/api';
import { decodeData, encodeData, isAuth } from '../../helpers/auth';
import Validation from '../../utils/validations';
import { handleErrorMessage } from '../../utils/commonFunctions';
import { WithAuth } from '../common/WithAuth';
import { eICFQuestions } from '../../constants/constant';
import dynamic from 'next/dynamic';
import { LANGUAGE_LIST } from '../../constants/constant';
import { useDispatch, useSelector } from 'react-redux';
import QuestionsComponent from './components/QuestionsComponent';
import moment from 'moment';
import { getICFData } from '../../store/actions/eicforms';
import _ from 'lodash';
const ICFDependencyForm = dynamic(() => import('./components/EICFDependencyForm'));
const EICFSettingCard = dynamic(() => import('./components/EICFSettings'));
const EICFQuestionForm = dynamic(() => import('./components/EICFQuestionForm'));

const EICaddEditComponent = (props) => {
  const user = isAuth();
  const [languageList, setLanguageList] = useState([
    { name: 'English', selected: true },
    { name: 'Spanish', selected: true },
    { name: 'German', selected: false },
    { name: 'French', selected: false },
  ]);
  const { styles, page } = props;
  const router = useRouter();
  const dispatch = useDispatch();
  const editorRef = useRef(null);
  const [questionData, setQuestionData] = useState([
    { language: 'English', FSQuestions: [] },
    { language: 'Spanish', FSQuestions: [] },
    { language: 'German', FSQuestions: [] },
    { language: 'French', FSQuestions: [] },
  ]);
  const [formsLoading, publishedForms] = useSelector((Gstate) => [Gstate.forms?.loading, Gstate.forms?.publishedForms]);

  //Common accross all languages
  const [state, setState] = useState({
    name: '',
    version: '',
    language: 'English',
    category: '',
    description: '',
    form_id: '',
    editStatus: '',
    disclaimer: ``,
    FormDependencyMapping: [],
    event_name: '',
  });

  const [editData, setEditData] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [createVersion, setCreateVersion] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [dependencyData, setDependencyState] = useState([]);
  const [formSettingsData, setFormSettingsState] = useState({});
  const [formSettingsTempData, setFormSettingsTempState] = useState({});
  //different accross all languages
  const [languageSpecificData, setLanguageSpecificData] = useState([]);

  const [cDEListLoading, CDEList] = useSelector((Gstate) => [Gstate.eicf?.loading, Gstate.eicf.ecifCdeList]);
  const { name, version, language, editStatus, disclaimer, category, FormDependencyMapping } = state;

  const handleEditorChange = (content, editor) => {
    languageSpecificData.map((data) => {
      if (language == data.language) {
        data.description = content;
      }
    });
    setLanguageSpecificData([...languageSpecificData]);
  };

  useEffect(() => {
    languageList.forEach((item, lIndex) => {
      if (item.selected) {
        if (!languageSpecificData[lIndex]) {
          languageSpecificData[lIndex] = { language: item.name, form_id: '', description: '' };
        }
      }
    });
    setLanguageSpecificData([...languageSpecificData]);
  }, []);

  useEffect(() => {
    if (CDEList.length) {
      setState({ ...state, category: CDEList[0]?.questions[0]?.category });
    }
  }, [CDEList]);

  const updateLanguageList = (e) => {
    languageList.map((item) => {
      if (item.name === e.target?.name) {
        item.selected = e.target?.checked;
      }
      return item;
    });
    setLanguageList([...languageList]);
  };

  const languageListPicked = languageList?.reduce((res, acc) => {
    if (acc.selected) {
      res.push(acc.name);
    }
    return res;
  }, []);

  const setDependencyData = (data) => {
    let dependencyData = [];
    if (data.length) {
      data.forEach((dapendency, index) => {
        let { condition, dependent_form_code, operator, question, values, variable_name, label, form_group, form_code } =
          dapendency;
        let formattedData = {
          order: index + 1,
          condition: index == 0 ? null : condition,
          dependent_form_code,
          response_type: question?.response_type,
          variable_name,
          operator,
          values,
          label: label,
          form_group,
          form_code,
        };
        if (question?.response_type === 'Multiple Choice' && formattedData.values && formattedData.values?.length) {
          let values = formattedData.values.map((ele) => ele.value);
          formattedData.values = values.join();
        }
        dependencyData.push(formattedData);
      });
    }
    setDependencyState(dependencyData);
  };

  const setFormSettingsData = (data) => {
    // formSettingsData = { ...data };
    setFormSettingsState({ ...data });
  };
  const publishAction = () => {
    const payload = { version, name, status: 'Published' };
    const encodePayload = encodeData(payload);
    API.apiPost('eICFUpdateStatus', { payload: encodePayload })
      .then((response) => {
        if (response.data && response.data.success === true) {
          setLoading(false);
          setShowErrors(false);
          toast.success(response.data.message);
          router.push('/informed-consent-form');
        }
      })
      .catch((err) => {
        console.log('err', err);
        setLoading(false);
        handleErrorMessage(err);
      });
  };

  const addUpdateEICFform = (isPublishing) => {
    if (loading) {
      return;
    }
    setShowErrors(true);

    let payload = [];
    const {
      email_code,
      email_version,
      email_reminder_code,
      email_reminder_version,
      days_reminder,
      days,
      hours_reminder,
      hours,
      id,
      emailTemplate,
      emailReminderTemplate,
      reminder,
    } = formSettingsData;
    // formSettingsData

    questionData.forEach((item) => {
      const isLanguageSelected = languageList.find((lang) => lang.selected && lang.name === item.language);

      if (isLanguageSelected) {
        const selectedLanguageData = languageSpecificData.find((data) => data.language === item.language);
        payload.push({
          category: state.category || CDEList[0]?.questions[0]?.category, //form type
          name,
          version,
          form_code: state.form_code,
          language: item.language,
          FormDependencyMapping: dependencyData || [],
          description: selectedLanguageData?.description, //body of icf
          has_dependency: !!dependencyData?.length,
          form_group: 'eICF' || item.form_group,
          FSQuestions: item.FSQuestions,
          email_code,
          email_version,
          email_reminder_code,
          email_reminder_version,
          days_reminder,
          days,
          hours_reminder,
          hours,
          participant_facing: true,
          disclaimer: disclaimer,
          emailTemplate,
          emailReminderTemplate,
          event_name: state?.event_name,
          reminder,
        });
      }
    });
    let isValidForm = true;
    payload.forEach((form) => {
      for (const property in form) {
        switch (property) {
          case 'name':
            if (!Validation.maxOf(form.name, 50)) {
              isValidForm = false;
              return;
            }
            break;
          case 'version':
            if (!Validation.maxOf(form.version, 15)) {
              isValidForm = false;
              return;
            }
            break;
          case 'language':
            if (Validation.empty(form.language)) {
              isValidForm = false;
              return;
            }
            break;
          case 'description':
            if (Validation.empty(form.description) && form.language == 'English') {
              isValidForm = false;
              return;
            }
            break;
          case 'emailTemplate':
            if (Validation.empty(form.emailTemplate)) {
              isValidForm = false;
              return;
            }
            break;
          case 'emailReminderTemplate':
            if ((form.days_reminder || form.hours_reminder) && Validation.empty(form.emailReminderTemplate)) {
              isValidForm = false;
              return;
            }
            break;
          case 'days':
            if (!form.reminder && form.days_reminder && Validation.empty(form.days)) {
              isValidForm = false;
              return;
            }
            break;
          case 'hours':
            if (!form.reminder && form.hours_reminder && Validation.empty(form.hours)) {
              isValidForm = false;
              return;
            }
            break;
          default:
            break;
        }
      }
    });
    payload.forEach((item) => {
      let hasCustomQuestion = item.FSQuestions.some(
        (q) => q.question_type == 'Custom Question' && q.question && q.language !== 'English'
      );
      if (item.language == 'English' || hasCustomQuestion) {
        if (!item.FSQuestions.length) {
          isValidForm = false;
          return;
        }
        item.FSQuestions.map((question, qindex) => {
          if (question.hasError) {
            isValidForm = false;
          }
          if (
            Validation.empty(question.question_type) ||
            Validation.empty(question.question) ||
            Validation.empty(question.response_type) ||
            Validation.empty(question.variable_name)
          ) {
            isValidForm = false;
          }

          question.FSQAttributes = question.FSQAttributes.map((attribute, attrIndex) => {
            attribute.order = attrIndex;
            if (!Object.keys(attribute).length) {
              isValidForm = false;
            }
            isValidForm = attributeValidation(attribute, isValidForm, question);
            attribute.order = attrIndex + 1;
            return cleanObject(attribute);
          });
          question.order = qindex;
        });
      }
    });

    if (!isValidForm) {
      toast.error('Form validation failed');
      return;
    }
    let sets = [];
    payload.forEach((item) => {
      let hasCompleteSet = item.FSQuestions.every((q) => q.question);
      if (hasCompleteSet) {
        sets.push(item.language);
      }
    });
    payload = payload.filter((item) => sets.includes(item.language));
    setLoading(true);
    let apiKey = page === 'add' ? 'eicfAdd' : 'eicfUpdate';
    if (createVersion) {
      apiKey = 'eicfAdd';
    }
    API.apiPost(apiKey, { payload })
      .then((response) => {
        if (response.data && response.data.success === true) {
          setLoading(false);
          setShowErrors(false);
          if (!isPublishing) {
            const data = 'Draft';
            const encoded = encodeData(data);
            router.push(`/informed-consent-form/?redirect=${encoded}`);
            toast.success(response.data.message);
          }
          if (isPublishing) {
            publishAction();
          }
        }
      })
      .catch((err) => {
        console.log('err', err);
        setLoading(false);
        handleErrorMessage(err);
        setLoading(false);
        return false;
      });
  };
  const getDateRangeError = (from, to) => {
    let min;
    let max;
    min = moment(from);
    max = moment(to);
    return !max.isSameOrAfter(min);
  };

  const attributeValidation = (attribute, isValidForm, question) => {
    switch (attribute.response_type) {
      case 'Radio Button':
        if (Validation.empty(attribute.choice_label) || Validation.empty(attribute.choice_value)) {
          isValidForm = false;
        }
        break;
      case 'Multiple Choice':
        if (Validation.empty(attribute.choice_label) || Validation.empty(attribute.choice_value)) {
          isValidForm = false;
        }
        break;
      case 'Dropdown':
        if (Validation.empty(attribute.choice_label) || Validation.empty(attribute.choice_value)) {
          isValidForm = false;
        }
        break;
      case 'DateTime':
        if (
          !Validation.empty(attribute.min_datetime) &&
          !Validation.empty(attribute.max_datetime) &&
          !attribute.max_current_datetime
        ) {
          if (
            getDateRangeError(attribute.min_datetime, attribute.max_datetime) &&
            question.question_type == 'Custom Question'
          ) {
            isValidForm = false;
          }
        }
        break;
      case 'Date':
        if (
          !Validation.empty(attribute.min_date) &&
          !Validation.empty(attribute.max_date) &&
          !attribute.max_current_datetime
        ) {
          if (getDateRangeError(attribute.min_date, attribute.max_date) && question.question_type == 'Custom Question') {
            isValidForm = false;
          }
        }
        break;

      // case 'Text Box':
      //   if (Validation.empty(attribute.text_min_char) || Validation.empty(attribute.text_max_char)) {
      //     isValidForm = false;
      //   }
      //   break;

      // case 'Number':
      //   if (
      //     Validation.empty(attribute.num_min_value) ||
      //     Validation.empty(attribute.num_max_value) ||
      //     Validation.empty(attribute.num_flot_max)
      //   ) {
      //     isValidForm = false;
      //   }
      //   break;

      // case 'Time':
      //   if (Validation.empty(attribute.min_time) || Validation.empty(attribute.max_time)) {
      //     isValidForm = false;
      //   }
      //   break;

      default:
        break;
    }
    return isValidForm;
  };
  const cleanObject = (obj) => {
    for (var propName in obj) {
      if (obj[propName] === '' || obj[propName] === undefined) {
        delete obj[propName];
      }
    }
    return obj;
  };
  const newPublishAction = () => {
    addUpdateEICFform('newPublishing');
  };

  const oldPublishAction = () => {
    addUpdateEICFform('oldPublishing');
  };

  const getEditFormData = (editInfo) => {
    const query = {
      name: editInfo.name,
      version: editInfo.version,
      study_id: user.study_id,
      dependent: true,
    };
    const encodePayload = encodeData(query);

    API.apiGetByKey('eicfInfo', `?query=${encodePayload}`)
      .then((response) => {
        if (response.data && response.data.success === true && response.data.data && response.data.data.length) {
          const list = response.data.data;
          const englishData = list.find((item) => item.language === 'English');
          const spanishData = list.find((item) => item.language === 'Spanish');
          languageList.map((item) => {
            let found = list.find((data) => data.language == item.name);
            if (found) {
              item.selected = true;
            }
          });
          setLanguageList([...languageList]);
          setLanguageSpecificData([..._.cloneDeep(list)]);
          setFormSettingsState({
            email_code: englishData.email_code,
            email_version: englishData.email_version,
            email_reminder_code: englishData.email_reminder_code,
            email_reminder_version: englishData.email_reminder_version,
            days_reminder: englishData.days_reminder,
            days: englishData.days,
            hours_reminder: englishData.hours_reminder,
            hours: englishData.hours,
            id: englishData.id,
          });
          setFormSettingsTempState({
            email_code: englishData.email_code,
            email_version: englishData.email_version,
            email_reminder_code: englishData.email_reminder_code,
            email_reminder_version: englishData.email_reminder_version,
            days_reminder: englishData.days_reminder,
            days: englishData.days,
            hours_reminder: englishData.hours_reminder,
            hours: englishData.hours,
            id: englishData.id,
          });
          languageList.forEach((item) => {
            let found = list.find((data) => data.language == item.name);
            if (item.selected && !found) {
              let FSQuestions = [];
              _.cloneDeep(englishData.FSQuestions).forEach((que) => {
                if (que.question_type == 'Custom Question') {
                  let FSQAttributes = [];
                  que.FSQAttributes.forEach((attr) => {
                    FSQAttributes.push({
                      ...attr,
                      choice_label: '',
                      language: item.language,
                    });
                  });
                  FSQuestions.push({
                    ...que,
                    question: '',
                    language: item.name,
                    hint: '',
                    FSQAttributes,
                  });
                } else {
                  let library = CDEList.find((library) => library.language === item.name);
                  if (library) {
                    let cdeQue = library.questions.find((lQue) => lQue.variable_name === que.variable_name);
                    if (cdeQue) {
                      FSQuestions.push({
                        ...que,
                        question: cdeQue.question,
                        language: item.name,
                        hint: cdeQue.hint,
                        FSQAttributes: cdeQue.FSQAttributes,
                      });
                    }
                  }
                }
              });
              list.push({
                language: item.name,
                FSQuestions,
              });
            }
          });

          setQuestionData([...list]);
          setDependencyState(englishData?.FormDependencyMapping || []);
          setState({
            ...state,
            name: englishData.name,
            study_id: englishData?.study_id,
            form_code: englishData?.form_code,
            category: englishData.category,
            version: editInfo.status === 'Published' && editInfo.preview === false ? '' : englishData.version,
            language: 'English',
            FormDependencyMapping: englishData?.FormDependencyMapping || [],
            editStatus: englishData.status,
            disclaimer: englishData?.disclaimer,
          });
          setLoading(false);
          setShowErrors(false);
        }
      })
      .catch((err) => {
        console.log('err', err);
        setLoading(false);
        router.push('/informed-consent-form');
        handleErrorMessage(err);
      });
  };

  useEffect(() => {
    if (page !== 'add') {
      const editInfo = decodeData(page);
      if (editInfo && editInfo.name) {
        const payload = encodeData({ category: editInfo.category });
        dispatch(getICFData(payload));
        setState((prev) => ({ ...prev, editStatus: editInfo.status }));
        getEditFormData(editInfo);
        setPreview(editInfo.preview);
        setCreateVersion(editInfo.createVersion);
      } else {
        router.push('/informed-consent-form');
      }
    }
    if (page === 'add') {
      const payload = decodeData(router?.query?.query);
      dispatch(getICFData(router?.query?.query));
      setPreview(false);
      setState({ ...state, language: 'English', category: payload.category });
    }
  }, [page]);

  useEffect(() => {
    setTimeout(() => {
      let data = languageSpecificData.find((data) => data.language === language);
      const content = data?.description || '';
      if (editorRef.current) {
        editorRef.current.setContent(content);
      }
    }, 400);
  }, [language, questionData]);

  const previewAction = () => {
    setFormSettingsTempState({ ...formSettingsData });
    // setShowErrors(true);
    // if (!Validation.maxOf(version, 15) || !Validation.maxOf(name, 50) || Validation.empty(bodyEnglish)) {
    //   return;
    // }
    // if (bodySpanish && language === 'Spanish') {
    //   setState({ ...state, language: 'English' });
    // }
    setPreview(!preview);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setState({ ...state, [name]: checked });
    } else {
      setState({ ...state, [name]: value });
    }
  };

  const changeLanguage = (e) => {
    const { name } = e.target;
    setState({ ...state, language: name });
  };

  const backToIcfTable = () => {
    router.push('/informed-consent-form');
  };

  const isButtonAction = createVersion || ['Published', 'Archive'].includes(editStatus) === false;
  const popover = (que) => (
    <Popover id="popover-basic">
      <Popover.Body className={styles.popoverText}>{que}</Popover.Body>
    </Popover>
  );

  const languageSelectBoxes = () => (
    <div className="row">
      <div className="col-md-4">
        <p className={`${styles.header}`}>Forms</p>
      </div>
      <div className="col-md-8 d-flex justify-content-end">
        {languageList?.map((lang, index) => (
          <div className="form-check me-2" key={index}>
            <input
              disabled={['English', 'Spanish'].includes(lang.name)}
              name={lang.name}
              className="form-check-input"
              checked={lang.selected}
              onChange={(e) => updateLanguageList(e)}
              type="checkbox"
              id={'flexCheckDefault' + lang}
            />
            {lang.name}
          </div>
        ))}
      </div>
    </div>
  );

  const renderLanguageButtons = () => (
    <>
      {languageListPicked && languageListPicked.length
        ? languageListPicked.map((langItem, index) => (
            <button
              key={index}
              onClick={changeLanguage}
              name={langItem}
              className={`btn px-4 d-inline-block text-white me-1 ${styles.button} ${styles.outlineNone}`}
            >
              {langItem}
            </button>
          ))
        : ''}
    </>
  );

  const setDisclaimer = (e) => {
    const { value } = e.target;
    setState({ ...state, disclaimer: value });
  };
  let currentLanguageData = languageSpecificData.find((data) => data.language == language);
  let currentLanguageQuestionData = questionData.find((data) => data.language == language);

  const isPreviewLanguageButton = (lang) => {
    return languageSpecificData.find((data) => data.language == lang);
  };

  return (
    <div className="eICF-form">
      {!preview ? (
        <div className="row mb-5">
          {/* <>{languageSelectBoxes()}</> */}
          <div className="col-md-6">
            <Form.Group className="col" controlId="formName">
              <Form.Label>e-ICF</Form.Label>
              <Form.Control
                type="text"
                name="name"
                className={`${styles.eicfInput}`}
                placeholder=""
                onChange={handleChange}
                value={name}
                isInvalid={showErrors && !Validation.maxOf(name, 50)}
                required
                readOnly={createVersion ? true : false}
              />
              <Form.Control.Feedback type="invalid">
                {name && !Validation.maxOf(name, 50) ? 'e-ICF name should be 0-50 length' : 'e-ICF name is Required'}
              </Form.Control.Feedback>
            </Form.Group>
          </div>
          <div className="col-md-3">
            <Form.Group className="col" controlId="formVersion">
              <Form.Label>IRB Version Number</Form.Label>

              <InputGroup>
                {/* <InputGroup.Text id="basic-addon1" className="bg-white">
                  IRB
                </InputGroup.Text> */}
                <Form.Control
                  // className={`${styles.versionInput}`}
                  type="text"
                  name="version"
                  placeholder=""
                  onChange={handleChange}
                  value={version}
                  isInvalid={showErrors && !Validation.maxOf(version, 15)}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {!version ? 'IRB version Number is missing' : 'Version should be 0-15 length'}
                </Form.Control.Feedback>
              </InputGroup>
            </Form.Group>
          </div>
          <div className="col-md-3 d-flex justify-content-end align-items-end">
            {languageListPicked.map((langItem, index) => (
              <button
                key={index}
                onClick={changeLanguage}
                name={langItem}
                className={`btn mx-1 ${langItem === state?.language ? 'btn-secondary' : 'btn-gray'}`}
              >
                {langItem}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="row mb-2 d-flex">
          <div className="d-flex justify-content-end align-items-end">
            {languageListPicked.map((langItem, index) => (
              <button
                key={index}
                disabled={!isPreviewLanguageButton(langItem)}
                onClick={changeLanguage}
                name={langItem}
                className={`btn mx-1 ${langItem === state?.language ? 'btn-secondary' : 'btn-gray'}`}
              >
                {langItem}
              </button>
            ))}
          </div>
          <div className={`${styles.eicfInput}`}>{name}</div>
          <div className={`${styles.versionLabel}`}>IRB Version {version}</div>
        </div>
      )}

      <div className="row mb-4">
        {preview && (
          <>
            <div
              className={`text-left col-md-12 ${styles.previewBody}`}
              dangerouslySetInnerHTML={{ __html: currentLanguageData?.description }}
            ></div>
            <div>
              <QuestionsComponent questionsData={currentLanguageQuestionData}></QuestionsComponent>
            </div>
            {disclaimer && <div className={`col-md-12 mt-2 mb-2 fw-bold ${styles.disclaimerHeading}`}>Disclaimer</div>}
            <div className={`col-md-12 ms-2 ${styles.consent}`}>{disclaimer || ''} </div>
          </>
        )}
        <div className={`col-md-12 ${preview && 'd-none'}`}>
          <label type="invalid" className="text-danger text-left">
            {showErrors && Validation.empty(currentLanguageData?.description) ? 'Form content is required' : ''}
          </label>
          <Editor
            tinymceScriptSrc="/js/tinymce/tinymce.min.js"
            onInit={(evt, editor) => (editorRef.current = editor)}
            initialValue=""
            onEditorChange={handleEditorChange}
            init={{
              height: 310,
              menubar: false,
              plugins: [
                'advlist autolink lists link image charmap print preview anchor',
                'searchreplace code fullscreen',
                'insertdatetime media table paste code',
              ],
              toolbar:
                'undo redo | fontsizeselect fontselect bold italic underline strikethrough blockquote forecolor alignment bullist numlist outdent indent | link image media',
              content_style: 'body { font-family: Roboto, sans-serif; font-size:14px }',
              menubar: false,
              statusbar: false,
              image_title: true,
              image_caption: true,
              image_description: false,
              image_dimensions: false,
              fontsize_formats: '12px 14px 16px 18px 20px 22px 24px 26px 28px',
              font_formats: 'Sans-serif=sans-serif;Roboto=roboto; Arial=arial; Helvetica=helvetica;',
            }}
          />
        </div>
        {!preview && (
          <>
            <div className={`${styles.sectionPadding} `}>
              <div className={`row ${styles.sectionWrapper} `}>
                <ICFDependencyForm
                  publishedForms={publishedForms}
                  formType={category}
                  setDependencyData={setDependencyData}
                  styles={styles}
                  showErrors={showErrors}
                  formDependencyMapping={FormDependencyMapping}
                />
                {/* {renderDependencyClause()} */}
              </div>
            </div>
            <div className={`${styles.sectionPadding} `}>
              <div className={`row ${styles.sectionWrapper}`}>
                <EICFSettingCard
                  forwordFormSettingsData={setFormSettingsData}
                  styles={styles}
                  data={formSettingsTempData}
                  showErrors={showErrors}
                />
              </div>
            </div>
            <div className={`${styles.sectionPadding} `}>
              <div className={`row ${styles.sectionWrapper}`}>
                <EICFQuestionForm
                  languageListPicked={languageListPicked}
                  changeLanguage={changeLanguage}
                  styles={styles}
                  languageList={languageList}
                  CDEList={CDEList}
                  language={language}
                  questionData={questionData}
                  showErrors={showErrors}
                  setQuestionData={setQuestionData}
                />
              </div>
            </div>
            <Form.Group className={`col ${styles.page_paragraph}`} controlId="formVersion">
              <Form.Label>ICF Disclaimer</Form.Label>
              <Form.Control
                type="text"
                as="textarea"
                value={disclaimer}
                onChange={setDisclaimer}
                className={`page_paragraph ${styles.disclaimer} `}
                rows={3}
                placeholder="ICF Disclaimer"
              />
            </Form.Group>
            {/* <div className={`${styles.sectionPadding} `}>
              <div className={`page_paragraph ${styles.disclaimer} `}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam eget augue non leo interdum imperdiet sed ac
                lacus. Cras a sapien quis tellus mollis vestibulum.
              </div>
            </div> */}
          </>
        )}
      </div>

      <div className="col-md-12 d-flex flex-row justify-content-end mb-4">
        {!createVersion && ['Published', 'Archive'].includes(editStatus) && (
          <button className="btn btn-primary mx-1" onClick={() => backToIcfTable()}>
            Back
          </button>
        )}
        {isButtonAction && (
          <div>
            {preview && (
              <button className="btn btn-primary mx-1" onClick={() => setPreview(false)}>
                Back
              </button>
            )}
            {!preview && (
              <>
                <button className="btn btn-primary mx-1" onClick={() => backToIcfTable()}>
                  Back
                </button>

                <button className="btn btn-primary mx-1" onClick={() => addUpdateEICFform(false)} disabled={loading}>
                  {loading && (
                    <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" className="me-2" />
                  )}
                  Save as Draft
                </button>
              </>
            )}
            {preview ? (
              <button
                className="btn btn-secondary mx-1"
                onClick={page === 'add' ? newPublishAction : oldPublishAction}
                disabled={loading}
              >
                {loading && (
                  <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" className="me-2" />
                )}
                {'Publish'}
              </button>
            ) : (
              <button className="btn btn-secondary mx-1" onClick={previewAction}>
                {'Preview'}
              </button>
            )}
          </div>
        )}
      </div>
      {!preview && (
        <div class="row mb-1">
          <div className={`col-md-12 d-flex justify-content-center ${styles.footer}`}>
            {/* <p>
              <span>Disclaimer</span> - Lorem Ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua.
            </p> */}
          </div>
        </div>
      )}
    </div>
  );
};

export default WithAuth(EICaddEditComponent);
