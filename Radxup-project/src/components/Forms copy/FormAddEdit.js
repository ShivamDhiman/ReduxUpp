import { LazyLoaderGeneral } from '../common/LazyLoaderComponent';
import React, { useRef, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import { Button, Modal, Form, InputGroup, Spinner, Dropdown } from 'react-bootstrap';

import { toast } from 'react-toastify';
import API from '../../helpers/api';
import { decodeData, encodeData, isAuth } from '../../helpers/auth';
import FormComponent from './FormComponent';
import Validation from '../../utils/validations';
import { getComparator, handleErrorMessage, stableSort } from '../../utils/commonFunctions';
import { setEicformsPublished } from '../../store/actions/eicforms';
import QuestionsComponent from './QuestionsComponent';
import { CDEListUpdater, setCDEQuestions, cleanCDEQUestions, setFormCDEQuestions } from '../../store/actions/CDEQuestions';
import { WithAuth } from '../common/WithAuth';

const FormAddEditComponent = (props) => {
  const user = isAuth();
  const { styles, page } = props;
  const router = useRouter();
  const dispatch = useDispatch();
  const formRef = useRef();
  const [state, setState] = useState({
    name: '',
    version: '',
    description: '',
    editStatus: '',
    form_expire: false,
    form_expire_time: '',
    has_dependency: false,
    reminder: false,
    category: '',
  });
  const [formType, setFormType] = useState({});
  const [editData, setEditData] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [isSelectedCDEUpdated, setIsSelectedCDEUpdated] = useState(false);
  const [previewFormData, setPreviewFormData] = useState('');
  const [createVersion, setCreateVersion] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [isPublishing, setPublishing] = useState(false);
  const [pendingRequiredCDE, setPendingRequiredCDE] = useState([]);
  const [selectedPreviewContent, setSelectedPreviewContent] = useState({});
  const eCIFlist = useSelector((state) => state.eicf.ecifPublished);
  const { name, version, description, editStatus } = state;
  const [CDEListLoading, cdeTemplate, CDEList] = useSelector((Gstate) => [
    Gstate.CDEList?.loading,
    Gstate.CDEList?.cdeTemplate,
    Gstate.CDEList?.CDEList,
  ]);

  const redirectToFormDraft = () => {
    const data = 'Draft';
    const encoded = encodeData(data);
    router.push(`/forms/?redirect=${encoded}`);
  };

  const publishAction = () => {
    const payload = { version, name, status: 'Published' };
    const encodePayload = encodeData(payload);
    API.apiPost('formUpdateStatus', { payload: encodePayload })
      .then((response) => {
        if (response.data && response.data.success === true) {
          setLoading(false);
          setShowErrors(false);
          toast.success(response.data.message);
          router.push('/forms');
        }
      })
      .catch((err) => {
        console.log('err', err);
        setLoading(false);
        handleErrorMessage(err);
      });
  };

  const cleanObject = (obj) => {
    for (var propName in obj) {
      if (obj[propName] === '' || obj[propName] === undefined) {
        delete obj[propName];
      }
    }
    return obj;
  };
  const isDuplicateVariableName = (data, dependencyClause) => {
    let found = dependencyClause.filter(
      (clause) => clause?.variable_name == data?.variable_name && clause?.dependent_form_code === data?.dependent_form_code
    );
    return found.length > 1 ? true : false;
  };
  const addUpdateForm = (isPublishing) => {
    const formData = preview ? previewFormData : formRef.current.getFormsData();
    // console.log('formData', formData);
    // return;

    if (loading) {
      return;
    }
    const { dependencyData, formSettingsData } = preview ? state : formData;
    const { reminder, form_expire, form_expire_time, participant_facing } = formSettingsData;
    const constructFormData = (item) => {
      return {
        ...item,
        name,
        version,
        description,
        category: formType.formType || state.category,
        max_cde_question: 0,
        FormDependencyMapping: dependencyData,
        has_dependency: !!dependencyData?.length,
        reminder,
        form_expire,
        form_expire_time,
        participant_facing,
      };
    };
    let payload = preview
      ? formData?.map((item) => constructFormData(item))
      : formData?.forms?.map((item) => constructFormData(item));

    // return;
    setShowErrors(true);
    for (const property in payload[0]) {
      switch (property) {
        case 'name':
          if (Validation.empty(name)) return;
          break;
        case 'version':
          if (Validation.empty(version) || version < 0) return;
          break;
        case 'description':
          if (Validation.empty(description)) return;
          break;
        case 'category':
          if (Validation.empty(formType.formType)) return;
          break;
        default:
          break;
      }
    }
    let isValidForm = '';

    payload[0]?.FormDependencyMapping.forEach((dependency) => {
      const { dependent_form_code, response_type, variable_name, operator, values } = dependency;
      for (const dependencyProp in dependency) {
        switch (dependencyProp) {
          case 'dependent_form_code':
            if (Validation.empty(dependent_form_code)) {
              isValidForm = false;
            }
            break;
          case 'response_type':
            if (Validation.empty(response_type) || version < 0) {
              isValidForm = false;
            }
            break;
          case 'variable_name':
            if (Validation.empty(variable_name)) {
              isValidForm = false;
            }
            break;
          case 'operator':
            if (Validation.empty(operator)) {
              isValidForm = false;
            }
            break;
          case 'values':
            if (Validation.empty(values)) {
              isValidForm = false;
            }
            break;
          default:
            if (isDuplicateVariableName(dependency, payload[0]?.FormDependencyMapping)) {
              isValidForm = false;
            }
            break;
        }
      }
    });

    let spanishNeeded = false;
    payload[1]?.FormsSections.forEach((entry, i) => {
      const hasAnyQuestionType = entry.FSQuestions.some(
        (question) =>
          ((question.question_type === 'Custom Question' || formType?.formCategory === 'Use Default CDE Template') &&
            !Validation.empty(question.question)) ||
          question.hasError
      );

      if (hasAnyQuestionType) {
        spanishNeeded = true;
      }

      // if (editData && editData.length && editData.find((ite) => ite.language === 'Spanish' && ite.FormsSections.length)) {
      //   spanishNeeded = true;
      // }
      if (spanishNeeded) {
        const hasVariableError = entry.FSQuestions.some((question) => {
          if (question.hasError) {
            // console.log(question);
          }
          return question.hasError;
        });
        if (hasVariableError) {
          isValidForm = false;
        }
      }
    });

    if (payload.length && payload[0].FormsSections) {
      payload[0].FormsSections = payload[0]?.FormsSections.map((entry, i) => {
        delete entry.expand;
        entry.order = i + 1;
        entry.language = 'English';
        let hasICFNameBlank = [
          Validation.empty(payload[0].eICFName1),
          Validation.empty(payload[0].eICFName2),
          Validation.empty(payload[0].eICFName3),
        ].every((icf) => icf);
        if (
          Validation.empty(entry.name) ||
          // hasICFNameBlank ||
          // Validation.empty(payload[0].eICFName1) ||
          entry.FSQuestions?.length === 0 ||
          (entry.FSQuestions[0]?.FSQAttributes?.length === 0 && entry.FSQuestions[0]?.response_type !== 'Descriptive')
        ) {
          isValidForm = false;
        }

        entry.FSQuestions = entry.FSQuestions.map((question, qIndex) => {
          question.order = qIndex + 1;

          if (
            Validation.empty(question.question_type) ||
            Validation.empty(question.question) ||
            Validation.empty(question.response_type) ||
            Validation.empty(question.variable_name)
          ) {
            isValidForm = false;
          }
          if (question.response_type === 'Descriptive') {
            delete question.FSQAttributes;
          } else {
            question.FSQAttributes = question.FSQAttributes.map((attribute, attrIndex) => {
              if (!Object.keys(attribute).length) {
                isValidForm = false;
              }
              isValidForm = attributeValidation(attribute, isValidForm);
              // console.log('english', isValidForm, i, qIndex, attribute);
              attribute.order = attrIndex + 1;
              return cleanObject(attribute);
            });
          }
          return question;
        });
        return entry;
      });

      // need to add spanish payload if one of spanish question_type added
      if (spanishNeeded) {
        // spanish
        const { eICFLanguages } = payload[0];
        // if (!(eICFLanguages.includes('English & Spanish') || eICFLanguages.includes('Spanish & English'))) {
        //   isValidForm = false;
        // }

        payload[1].FormsSections = payload[1]?.FormsSections.map((entry, i) => {
          delete entry.expand;
          entry.order = i + 1;
          entry.language = 'Spanish';

          if (Validation.empty(entry.name)) {
            isValidForm = false;
          }

          entry.FSQuestions = entry?.FSQuestions?.map((question, qIndex) => {
            question.order = qIndex + 1;

            if (
              Validation.empty(question.question_type) ||
              Validation.empty(question.question) ||
              Validation.empty(question.response_type) ||
              Validation.empty(question.variable_name)
            ) {
              isValidForm = false;
            }
            if (question.response_type === 'Descriptive') {
              delete question.FSQAttributes;
            } else {
              question.FSQAttributes = question?.FSQAttributes?.map((attribute, attrIndex) => {
                if (!Object.keys(attribute).length) {
                  isValidForm = false;
                }
                isValidForm = attributeValidation(attribute, isValidForm);
                // console.log('spanish', isValidForm, i, qIndex, attribute);
                attribute.order = attrIndex + 1;
                return cleanObject(attribute);
              });
            }

            return question;
          });
          return entry;
        });
      } else {
        payload = payload.splice(0, 1); // delete spanese object
      }
    }

    // if (requiredCDEList?.length && pendingRequiredCDE?.length) {
    //check validation
    // toast.error('Pending Agreed CDE question validation failed.');
    // return;
    // }

    if (isValidForm === false) {
      //check validation
      toast.error('Form validation failed.');
      return;
    }

    setTimeout(function () {
      setPublishing(!!isPublishing);
      setLoading(true);

      const sendData = payload;
      // console.log('sendData stringify', sendData);
      // return;
      const encodePayload = sendData; // encodeData(sendData);
      let apiKey = page === 'add' || formType?.useExistingForm ? 'addForm' : 'formUpdate';
      if (createVersion) {
        apiKey = 'addForm';
      }

      if (payload && payload[0]?.FormsSections.length === 0) {
        toast.error('Please add Question');
        setLoading(false);
        return;
      }
      API.apiPost(apiKey, { payload: encodePayload })
        .then((response) => {
          if (response.data && response.data.success === true) {
            setLoading(false);
            setShowErrors(false);
            if (!isPublishing) {
              // router.push('/forms');
              redirectToFormDraft();
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
          return false;
        });
    }, 600);
  };
  const attributeValidation = (attribute, isValidForm) => {
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

      // case 'DateTime':
      //   if (Validation.empty(attribute.min_datetime) || Validation.empty(attribute.max_datetime)) {
      //     isValidForm = false;
      //   }
      //   break;

      // case 'Date':
      //   if (Validation.empty(attribute.min_date) || Validation.empty(attribute.max_date)) {
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
  const newPublishAction = () => {
    addUpdateForm('newPublishing');
  };

  const oldPublishAction = () => {
    addUpdateForm('oldPublishing');
  };

  const getEditFormData = (editInfo) => {
    const query = {
      name: editInfo.name,
      version: editInfo.version,
    };
    const encodePayload = encodeData(query);

    API.apiGetByKey('formInfo', `?query=${encodePayload}`)
      .then((response) => {
        if (response.data && response.data.success === true && response.data.data) {
          if (!response.data.data.length) {
            router.push('/forms');
            toast.error('No data found');
            return;
          }
          const data = response.data.data;
          const listEnglish = data.find((ite) => ite.language === 'English');
          const listSpanish = data.find((ite) => ite.language === 'Spanish');
          const cdeQuery = {
            studyId: listEnglish?.study_id,
            category: listEnglish.category,
            template: false,
          };
          // dispatch(setFormCDEQuestions(cdeQuery));
          // console.log('list', listEnglish, listSpanish, response.data, 'editdata');

          const editDataList = [listEnglish];
          if (listSpanish) {
            editDataList.push(listSpanish);
          }
          if (editInfo?.formCategory == 'Use Variables from existing form') {
            setState({
              ...state,
              name: '',
              version: '',
              description: '',
            });
          }
          if (!editInfo?.formCategory || editInfo?.formCategory !== 'Use Variables from existing form') {
            const publishedVersion = editInfo.createVersion ? '' : editInfo?.version;
            setState({
              ...state,
              form_expire: listEnglish?.form_expire,
              form_expire_time: listEnglish?.form_expire_time,
              has_dependency: listEnglish?.has_dependency,
              participant_facing: listEnglish?.participant_facing,
              reminder: listEnglish?.reminder,
              category: listEnglish?.category,
              editStatus: editInfo.status || state.editStatus,
              name: listEnglish?.name,
              version: editInfo?.status === 'Published' ? publishedVersion : listEnglish?.version,
              description: listEnglish?.description,
            });
          }

          setEditData(editDataList);
          setPreviewFormData(editDataList);
          setLoading(false);
          setShowErrors(false);
        }
      })
      .catch((err) => {
        console.log('err', err);
        setLoading(false);
        router.push('/forms');
        handleErrorMessage(err);
      });
  };

  useEffect(() => {
    dispatch(setEicformsPublished());

    return () => {
      dispatch(cleanCDEQUestions());
    };
  }, []);

  useEffect(() => {
    if (CDEList.length && editData && editData.length && !isSelectedCDEUpdated) {
      const variableNames = CDEList.map((cdeQ) => cdeQ.variable_name);
      editData?.forEach((language) => {
        language.FormsSections.forEach((section) => {
          section.FSQuestions.forEach((question) => {
            if (question.question_type == 'CDE Question' && variableNames.includes(question.variable_name)) {
              let index = CDEList.findIndex(
                (cdeQ) => cdeQ?.variable_name === question.variable_name //&& cdeQ?.language === question.language
              );
              CDEList[index].selected = true;
            }
          });
        });
      });

      setIsSelectedCDEUpdated(true);
      dispatch(CDEListUpdater([...CDEList]));
    }
  }, [CDEList, editData]);

  useEffect(() => {
    const formType = decodeData(router.query.type);
    if (cdeTemplate && cdeTemplate.length && formType?.formCategory === 'Use Default CDE Template') {
      // console.log(cdeTemplate);
      setEditData(cdeTemplate);
      setPreviewFormData(cdeTemplate);
      setIsSelectedCDEUpdated(false);
    }
  }, [cdeTemplate]);

  useEffect(() => {
    const pendingRequiredCDE = CDEList.filter((cde) => cde.selected == false);
    setPendingRequiredCDE(pendingRequiredCDE);
  }, [CDEList]);

  useEffect(() => {
    if (page !== 'add') {
      const editInfo = decodeData(page);
      const existingForm = decodeData(router.query.type);
      const routeQuery = router.query && router.query.id;
      const formType = decodeData(routeQuery);
      const category = formType?.category || existingForm?.category;
      if (editInfo && editInfo?.name) {
        setState((prev) => ({ ...prev, editStatus: editInfo.status }));
        setFormType({ formType: category });

        getEditFormData(editInfo);
        setPreview(editInfo.preview);
        setCreateVersion(editInfo.createVersion);
      } else if (existingForm) {
        setFormType({ formType: existingForm.category, useExistingForm: true });
        getEditFormData(existingForm);
      } else {
        router.push('/forms');
      }
    }
    if (page === 'add') {
      const routeQuery = router.query && router.query.type;
      const formType = decodeData(routeQuery);
      // console.log('formType', formType);
      if (!formType) {
        router.push('/forms');
      }
      if (formType?.formType) {
        //formType?.formCategory === 'Use Default CDE Template'
        const query = {
          studyId: user?.study_id,
          category: formType.formType,
          template: formType.formCategory === 'Use Default CDE Template',
        };
        // console.log('query', query);
        dispatch(setFormCDEQuestions(query));
      }
      setFormType(formType);
      setPreview(false);
    }
  }, [page]);

  const previewAction = () => {
    const formData = formRef.current.getFormsData();

    const { dependencyData, formSettingsData } = formData;
    const { reminder, form_expire, form_expire_time, participant_facing } = formSettingsData;
    setState({ ...state, dependencyData, formSettingsData });
    let payload = formData?.forms?.map((item) => {
      // item.FormsSections = stableSort(item.FormsSections, getComparator('asc', 'name'));
      return {
        ...item,
        name,
        version,
        description,
        category: formType.formType || state.category,
        max_cde_question: 0,
        FormDependencyMapping: dependencyData,
        has_dependency: !!dependencyData?.length,
        reminder,
        form_expire,
        form_expire_time,
        participant_facing,
      };
    });

    setShowErrors(true);
    for (const property in payload[0]) {
      switch (property) {
        case 'name':
          if (Validation.empty(name)) return;
          break;
        case 'version':
          if (Validation.empty(version) || version < 0) return;
          break;
        case 'description':
          if (Validation.empty(description)) return;
          break;
        case 'category':
          if (Validation.empty(formType.formType)) return;
          break;
        default:
          break;
      }
    }
    setPreviewFormData(formData?.forms);
    setPreview(!preview);
  };

  const handleChange = (e) => {
    setState({ ...state, [e.target.name]: e.target.value });
  };

  const selectLanguage = ({ target }) => {
    setPreviewData(target.name);
  };

  const setPreviewData = (language) => {
    const content = previewFormData.find((form) => form?.language == language) || {};
    // content.FormsSections = stableSort(content.FormsSections, getComparator('asc', 'name'));
    setSelectedPreviewContent(content);
  };

  useEffect(() => {
    if (previewFormData) {
      setPreviewData('English');
    }
  }, [previewFormData, previewFormData.length]);

  const isButtonAction = createVersion || ['Published', 'Archive'].includes(editStatus) === false;
  const isPublishedPreview = !createVersion && preview && ['Published', 'Archive'].includes(editStatus);

  const cancleBtn = () => {
    const editInfo = decodeData(router.query.type || page);
    if (createVersion) {
      const data = 'Published';
      const encoded = encodeData(data);
      if (!preview) {
        router.push(`/forms/?redirect=${encoded}`);
        return;
      }
      setPreview(false);
      return;
    }
    if (
      ['Published', 'Archive'].includes(editInfo?.status) ||
      ((!editInfo?.status || editInfo?.status === 'Draft') && !preview)
    ) {
      redirectToFormDraft();
    } else {
      setPreview(false);
    }
  };

  const cancleBtnToPublished = () => {
    const data = editStatus;
    const encoded = encodeData(data);
    if (preview) {
      router.push(`/forms/?redirect=${encoded}`);
      return;
    }
  };

  return (
    <div className={`${styles.formContainer}`}>
      <p className={`${styles.header}`}>Forms</p>
      {!preview ? (
        <>
          <div className="row">
            <div className="col-md-5">
              <Form.Group className="col" controlId="formName">
                <Form.Label>Form/Survey Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  placeholder=""
                  onChange={handleChange}
                  value={name}
                  isInvalid={showErrors && Validation.empty(name)}
                  required
                  readOnly={createVersion ? true : false}
                />
                <Form.Control.Feedback type="invalid">{!name ? 'Form/Survey name is required' : ''}</Form.Control.Feedback>
              </Form.Group>
            </div>
            <div className="col-md-3">
              <Form.Group className="col" controlId="formVersion">
                <Form.Label>IRB Version Number</Form.Label>

                <InputGroup>
                  {/* <InputGroup.Text id="basic-addon1" className="bg-white">
                    Version
                  </InputGroup.Text> */}
                  <Form.Control
                    // className={`${styles.versionInput}`}
                    type="text"
                    name="version"
                    placeholder=""
                    min="0"
                    maxLength="30"
                    onChange={handleChange}
                    value={version}
                    isInvalid={showErrors && (version < 0 || Validation.empty(version))}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {!version ? 'IRB Version number is required' : ''}
                    {/* {version && version < 0 ? 'IRB Version Number should greater than 0' : ''} */}
                  </Form.Control.Feedback>
                </InputGroup>
              </Form.Group>
            </div>
            {/* <div className="col-md-4 d-flex justify-content-end">
              <Dropdown className={`${styles.dropdownMenu} custom-dropdown`}>
                <Dropdown.Toggle
                  id="dropdown-basic"
                  data-toggle="tooltip"
                  title="Pending Agreed CDEs"
                  className={`border-0 p-0 ${styles.toggleButton}`}
                >
                  <div className={`${styles.pendingDetails}`}>
                    Pending Agreed CDEs: {pendingRequiredCDE?.length || 0} {` of ${CDEList?.length}`}
                  </div>
                </Dropdown.Toggle>

                <Dropdown.Menu align="end">
                  {pendingRequiredCDE.map((cde, index) => (
                    <Dropdown.Item key={index} className={styles.menuItems}>
                      {cde.variable_name}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </div> */}
            <div className="col-md-6">
              <Form.Group className="col my-2" controlId="formName">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  type="text"
                  className={`${styles.descriptionTextarea}`}
                  as="textarea"
                  name="description"
                  placeholder="Add description here..."
                  onChange={handleChange}
                  value={description}
                  isInvalid={showErrors && Validation.empty(description)}
                  required
                />
                <Form.Control.Feedback type="invalid">{!description ? 'Description is required' : ''}</Form.Control.Feedback>
              </Form.Group>
            </div>
          </div>

          <FormComponent
            ref={formRef}
            eCIFlist={eCIFlist}
            isPreview={preview}
            styles={styles}
            editData={editData || previewFormData}
            formType={formType}
          />
        </>
      ) : (
        <>
          <div className="col md-6  d-flex justify-content-start">
            <div className="me-3 mb-0">
              <div className={styles.formheading}>Form/SurveyName</div>
              <h6 className={`m-0 ${styles.formcontent}`}>{name || ''}</h6>
            </div>
            <div className="mb-0 me-3">
              <div className={styles.formheading}>IRB Version Number</div>
              <h6 className="mb-0">{version || ''}</h6>
            </div>
          </div>
          {/* <div className="col-md-6 mt-2">
            <div className="mb-0 me-3">
              <div className={styles.formheading}>Study Name</div>
              <h6 className="mb-0">{''}</h6>
            </div>
          </div> */}
          <div className=" col md-6 d-flex justify-content-end mb-2 ">
            <button
              onClick={selectLanguage}
              name="English"
              className={`btn px-4 d-inline-block text-white ${
                selectedPreviewContent?.language === 'English' ? styles.button : 'bg-gray'
              } ${styles.outlineNone}`}
            >
              English
            </button>
            <button
              onClick={selectLanguage}
              name="Spanish"
              className={`btn px-4 d-inline-block text-white ms-1  me-4  ${
                selectedPreviewContent?.language === 'Spanish' ? styles.button : 'bg-gray'
              } ${styles.outlineNone}`}
            >
              Spanish
            </button>
          </div>
          <div className={`mb-1 d-flex flex-column ${styles.previewWrapper}`}>
            {selectedPreviewContent?.FormsSections?.map((section, index) => (
              <QuestionsComponent
                number={index + 1}
                key={index}
                totalSections={selectedPreviewContent?.FormsSections?.length}
                section={section}
              />
            ))}
          </div>
        </>
      )}
      <div className="col-md-12 d-flex mt-5 flex-row justify-content-start mb-5">
        {isPublishedPreview && (
          <button className="btn btn-dark mx-1 " disabled={loading} onClick={cancleBtnToPublished}>
            Cancel
          </button>
        )}
        {isButtonAction && (
          <div>
            <button className="btn btn-dark mx-1 " disabled={loading} onClick={cancleBtn}>
              Cancel
            </button>

            {preview && (
              <button className="btn btn-secondary mx-1" onClick={() => addUpdateForm(false)} disabled={loading}>
                {loading && !isPublishing && (
                  <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" className="me-2" />
                )}
                Save as Draft
              </button>
            )}
            {!preview && !isPublishing && (
              <button className="btn btn-secondary mx-1" onClick={() => addUpdateForm(false)} disabled={loading}>
                {loading && (
                  <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" className="me-2" />
                )}
                Save as Draft
              </button>
            )}
            {preview ? (
              <button
                className="btn btn-primary mx-1"
                onClick={page === 'add' ? newPublishAction : oldPublishAction}
                disabled={loading}
              >
                {loading && isPublishing && (
                  <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" className="me-2" />
                )}
                {'Publish'}
              </button>
            ) : (
              <button className="btn btn-primary mx-1" disabled={loading} onClick={previewAction}>
                {'Preview'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WithAuth(FormAddEditComponent);
