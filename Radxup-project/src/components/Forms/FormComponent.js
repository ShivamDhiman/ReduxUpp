import { LazyLoaderGeneral } from '../common/LazyLoaderComponent';
import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button, Modal, Form, InputGroup, FormCheck } from 'react-bootstrap';
import { toast } from 'react-toastify';
import API from '../../helpers/api';
import moment from 'moment';
import { decodeData, encodeData, isAuth } from '../../helpers/auth';
import Validation from '../../utils/validations';
import { renameObjKey } from '../../utils/commonFunctions';
import 'react-datetime/css/react-datetime.css';
import Datetime from 'react-datetime';
import Autosuggest from '../common/AutoSuggest';
import dynamic from 'next/dynamic';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectedCDEQuestion,
  selectedRequiredCDEQuestion,
  setCDEQuestions,
  setFormCDEQuestions,
} from '../../store/actions/CDEQuestions';
import ChildLinkModal from './ChildLinkModal';
import Select from 'react-select';
import _ from 'lodash';
import ConfirmModal from '../common/confirmationModal';
import { dataMapper } from '../../store/reducers/eicforms';
import { setForms } from '../../store/actions/forms';
import { LANGUAGE_LIST } from '../../constants/constant';
const CDEQuestionComponent = dynamic(() => import('./Components/CDEQuestion'));
const DependencyClauseCard = dynamic(() => import('./DependencyClauseCard'));
const FormSettingCard = dynamic(() => import('./FormSettingCard'));

const languageConfigList = LANGUAGE_LIST.reduce((res, acc) => {
  res.push(acc.name);
  return res;
}, []);

const initialState = languageConfigList.map((itemLanguage) => {
  return {
    eICFName1: '',
    eICFVersion1: '',
    eICFCode1: '',
    eICFName2: '',
    eICFVersion2: '',
    eICFCode2: '',
    eICFName3: '',
    eICFVersion3: '',
    eICFCode3: '',
    FormsSections: [
      {
        expand: true,
        name: '',
        FSQuestions: [],
        linked_variable_name: [],
        question_attributes_list: {},
        question_attributes_label: '',
        cde_version: '',
        cde_status: '',
      },
    ],
    language: itemLanguage,
    max_cde_question: '50',
  };
});

const FormComponent = forwardRef((props, ref) => {
  const {
    styles,
    eCIFlist,
    editData,
    isPreview,
    submitFormInfo,
    formType,
    currentFormData,
    languageList,
    languageListPicked,
    formSettingDataState,
  } = props;
  const [dependencyData, setDependencyState] = useState([]);
  const [formSettingsData, setFormSettingsState] = useState({});
  const [dragId, setDragId] = useState('');
  const [questionDragId, setQuestionDragId] = useState('');
  const [sectionDragIndex, setSectionDragIndex] = useState('');
  const [currentSectionId, setCurrentSectionId] = useState('');
  //TODO: multi language work  languageList, languageListPicked
  const [language, setLanguage] = useState('English');
  const handleChangeLanguage = (language) => {
    setLanguage(language);
  };

  const user = isAuth();
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
          form_group,
          form_code,
          values,
          label: label,
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
  const [loading, CDEList] = useSelector((Gstate) => [
    Gstate.CDEList?.loading,
    Gstate.CDEList?.CDEList,
    Gstate.CDEList?.selectedCDEQuestions,
  ]);
  const [formsLoading, publishedForms] = useSelector((Gstate) => [Gstate.forms?.loading, Gstate.forms?.publishedForms]);

  const router = useRouter();
  const dispatch = useDispatch();
  const [showErrors, setShowErrors] = useState(false);
  const [openChildLinkModal, setChildLinkModal] = useState({
    isOpen: false,
    question: {},
    customQuestions: '',
    isSectionLinking: false,
  });
  const [openQuestionConfirmModal, setQuestionConfirmModal] = useState({
    isOpen: false,
    question: {},
    actionType: 'unlink',
  });

  const [state, setState] = useState(_.cloneDeep(initialState));
  const [eICF, setEICF] = useState([
    { id: '', version: '', name: '', body: '', label: '', value: '', language: '', languageList: '' },
  ]);
  const { FormsSections } = (state?.length && state?.find((item) => item.language === language)) || {};
  // const [dragId, setDragId] = useState();

  const getPreparedPayload = () => {
    const cloneData = _.cloneDeep(state);
    cloneData.map((entry, index) => {
      entry.FormsSections = entry.FormsSections.map((section) => {
        delete section.expand;
        return section;
      });
      return entry;
    });
    return cloneData;
  };

  useImperativeHandle(ref, () => ({
    getFormsData() {
      const formsResult = getPreparedPayload();
      const pickedFormsResult = formsResult.filter((item) => languageListPicked.includes(item.language));
      const data = { forms: [...pickedFormsResult], dependencyData, formSettingsData };

      setShowErrors(true);
      return data;
    },
  }));

  const getPreparedEditData = async (data) => {
    const englishData = _.cloneDeep(data.find((ite) => ite.language === 'English'));

    async function reMappingData() {
      if (englishData && englishData.FormsSections) {
        const mappedData = languageConfigList.map((itemLanguage) => {
          const itemLanguageData = _.cloneDeep(data.find((ite) => ite.language === itemLanguage));
          const formSectionByLanguage = englishData.FormsSections.map((sectionItem, sectionIndex) => {
            return {
              category: sectionItem.category,
              form_id: _.get(itemLanguageData, `FormsSections.${sectionIndex}.form_id`) || '',
              id: _.get(itemLanguageData, `FormsSections.${sectionIndex}.id`) || '',
              name: _.get(itemLanguageData, `FormsSections.${sectionIndex}.name`) || '',
              order: _.get(itemLanguageData, `FormsSections.${sectionIndex}.order`) || sectionItem.order,
              study_id: sectionItem.study_id,

              linked_variable_name: sectionItem.linked_variable_name || [],
              question_attributes_list: sectionItem.question_attributes_list || {},
              question_attributes_label:
                _.get(itemLanguageData, `FormsSections.${sectionIndex}.question_attributes_label`) || '',
              cde_version: _.get(itemLanguageData, `FormsSections.${sectionIndex}.cde_version`) || sectionItem.cde_version,
              cde_status: _.get(itemLanguageData, `FormsSections.${sectionIndex}.cde_status`) || sectionItem.cde_status,

              FSQuestions: sectionItem.FSQuestions.map((questionItem, questionIndex) => {
                return {
                  category: questionItem.category,
                  question_edited: questionItem?.question_edited || false,
                  cde_variable_name:
                    _.get(
                      itemLanguageData,
                      `FormsSections.${sectionIndex}.FSQuestions.${questionIndex}.cde_variable_name`
                    ) || '',
                  cde_version: questionItem.cde_version || '',
                  cde_status: questionItem.cde_status || '',
                  child_node: questionItem.child_node,
                  descriptive: questionItem.descriptive,
                  dependent: questionItem?.dependent,
                  form_id:
                    _.get(itemLanguageData, `FormsSections.${sectionIndex}.FSQuestions.${questionIndex}.form_id`) || '',
                  hint: _.get(itemLanguageData, `FormsSections.${sectionIndex}.FSQuestions.${questionIndex}.hint`) || '',
                  id:
                    _.get(itemLanguageData, `FormsSections.${sectionIndex}.FSQuestions.${questionIndex}.id`) ||
                    questionItem.id,
                  language: itemLanguage,
                  linked_level: questionItem.linked_level || 0,
                  linked_variable_name: questionItem.linked_variable_name || [],
                  not_to_ans_value: questionItem.not_to_ans_value || '',
                  order: questionItem.order,
                  question:
                    _.get(itemLanguageData, `FormsSections.${sectionIndex}.FSQuestions.${questionIndex}.question`) || '',
                  question_attributes_label:
                    _.get(
                      itemLanguageData,
                      `FormsSections.${sectionIndex}.FSQuestions.${questionIndex}.question_attributes_label`
                    ) || '',
                  question_attributes_list: questionItem.question_attributes_list || {},
                  question_group: questionItem.question_group || '',
                  question_type: questionItem.question_type || '',
                  response_type: questionItem.response_type || '',
                  sections_id:
                    _.get(itemLanguageData, `FormsSections.${sectionIndex}.FSQuestions.${questionIndex}.question`) || '',
                  shared_question: questionItem.shared_question || false,
                  study_id: questionItem.study_id,
                  variable_name: questionItem?.variable_name || '',
                  FSQAttributes: [
                    ...questionItem.FSQAttributes.map((attribute, attributeIndex) => {
                      const languageItemFSQAttributesItem =
                        _.get(
                          itemLanguageData,
                          `FormsSections.${sectionIndex}.FSQuestions.${questionIndex}.FSQAttributes.${attributeIndex}`
                        ) || {};
                      return {
                        choice_key: attribute.choice_key,
                        choice_label: languageItemFSQAttributesItem?.choice_label || '',
                        choice_value: attribute.choice_value,
                        form_id: attribute.form_id,
                        id: languageItemFSQAttributesItem?.id || '',
                        max_current_datetime: attribute.max_current_datetime || false,
                        max_date: attribute.max_date || '',
                        max_datetime: attribute.max_datetime || '',
                        max_time: attribute.max_time || '',
                        min_date: attribute.min_date || '',
                        min_datetime: attribute.min_datetime || '',
                        min_time: attribute.min_time || '',
                        not_to_ans: attribute.not_to_ans,
                        num_flot_max: attribute.num_flot_max || '',
                        num_max_value: attribute.num_max_value || '',
                        num_min_value: attribute.num_min_value || '',
                        order: attribute.order,
                        questions_id: languageItemFSQAttributesItem?.questions_id || '',
                        response_type: attribute.response_type,
                        sections_id: languageItemFSQAttributesItem?.sections_id || '',
                        study_id: attribute.study_id || '',
                        text_max_char: attribute.text_max_char || '',
                        text_min_char: attribute.text_min_char || '',
                      };
                    }),
                  ],
                };
              }),
            };
          });
          return {
            // ...itemLanguageData,
            FormDependencyMapping: englishData?.FormDependencyMapping || [],
            category: englishData?.category || '',
            description: englishData?.description || '',
            eICFList: englishData?.eICFList || [],
            eICFName1: englishData?.eICFName1 || '',
            eICFName2: englishData?.eICFName2 || '',
            eICFName3: englishData?.eICFName3 || '',
            eICFVersion1: englishData?.eICFVersion1 || '',
            eICFVersion2: englishData?.eICFVersion2 || '',
            eICFVersion3: englishData?.eICFVersion3 || '',
            eICFCode1: englishData?.eICFCode1 || '',
            eICFCode2: englishData?.eICFCode2 || '',
            eICFCode3: englishData?.eICFCode3 || '',
            form_code: englishData?.form_code || '',
            form_expire: englishData?.form_expire || '',
            form_expire_time: englishData?.form_expire_time || '',
            has_dependency: englishData?.has_dependency,
            email_code: englishData?.email_code || '',
            email_version: englishData?.email_version || '',
            email_reminder_code: englishData?.email_reminder_code || '',
            email_reminder_version: englishData?.email_reminder_version || '',
            days_reminder: englishData?.days_reminder || '',
            days: englishData?.days || '',
            hours_reminder: englishData?.hours_reminder || '',
            hours: englishData?.hours || '',
            id: itemLanguageData?.id || '',
            name: englishData?.name || '',
            reminder: englishData?.reminder,
            status: englishData?.status || '',
            study_id: englishData?.study_id || '',
            version: englishData?.version || '',
            FormsSections: formSectionByLanguage,
            language: itemLanguage,
            max_cde_question: '50',
          };
        });

        return mappedData;
      }
    }

    reMappingData().then((result) => {
      setState([...result]);
      return result;
    });
  };

  useEffect(() => {
    if (formType?.formType) {
      const query = {
        category: formType.formType,
        studyId: user?.study_id,
        template: formType.formCategory === 'Use Default CDE Template',
      };

      dispatch(setFormCDEQuestions(query));
    }
  }, [formType]);

  //Section drag drop
  const handleDrag = (ev) => {
    setDragId(ev.currentTarget.id);
  };
  const handleDrop = (ev) => {
    if (questionDragId) {
      return;
    }
    let draggedSection = state[0].FormsSections[dragId];
    let nextToDraggedSec = state[0]?.FormsSections[parseInt(dragId) + 1];
    let droppedAt = state[0]?.FormsSections[ev.currentTarget.id];
    let previousSecOfDroppedAt = state[0]?.FormsSections[parseInt(ev.currentTarget.id) - 1];
    let nextSecOfDroppedAt = state[0]?.FormsSections[parseInt(ev.currentTarget.id) + 1];
    if (
      draggedSection?.linked_variable_name?.length || // Do not allow drag if section is linked to question
      nextToDraggedSec?.linked_variable_name?.length || // Do not allow drag if section is parent to next section
      // previousSecOfDroppedAt?.linked_variable_name?.length ||
      droppedAt?.linked_variable_name?.length || // Do not allow drop if section at dropped location is linked to question
      nextSecOfDroppedAt?.linked_variable_name?.length // Do not allow drop if section at dropped location is parent to next section
    ) {
      toast.error('Not Allowed');
      return;
    }

    state.map((item) => {
      let removed = item.FormsSections.splice(dragId, 1);

      item.FormsSections.splice(ev.currentTarget.id, 0, removed[0]);

      item.FormsSections.forEach((section, index) => {
        item.FormsSections[index].order = index + 1;
      });
    });
    setState([...state]);
  };

  //Question Drag Drop
  const handleQuestionDrag = (ev, secId, secIndex) => {
    setQuestionDragId(ev.currentTarget.id);
    setSectionDragIndex(secIndex);

    setCurrentSectionId(secId);
  };

  const handleQuestionDrop = (ev, sIndex) => {
    let draggedOutsideSection = false;
    let droppedOnChild = false;
    let draggedChild = false;

    //Allow drag drop questions within section

    if (sIndex !== sectionDragIndex) {
      toast.error('Can not drop in different section');
      return;
    }
    state.map((item) => {
      // if (currentSectionId !== item.FormsSections[sIndex].id) {
      //   draggedOutsideSection = true;
      //   return;
      // }
      if (ev.currentTarget.id === questionDragId) {
        // Droppped on same question
        return;
      }

      // Dont allow drop on  child question
      if (
        item.FormsSections[sIndex].FSQuestions[ev.currentTarget.id]?.linked_variable_name?.length &&
        !item.FormsSections[sIndex].FSQuestions[questionDragId]?.linked_variable_name?.length
      ) {
        droppedOnChild = true;

        return;
      }

      let que = item?.FormsSections[sIndex]?.FSQuestions[questionDragId];
      // Dont allow drag for childrens

      if (que && (!que?.linked_variable_name || !que?.linked_variable_name?.length)) {
        let questionsToRemove = 1; // 1 is for dragged question
        const questions = item?.FormsSections[sIndex]?.FSQuestions;

        for (let index = 0; index < questions?.length; index++) {
          // This breaks the loop when next level 0 question finds
          if (
            index > questionDragId &&
            (!questions[index]?.linked_variable_name || !questions[index]?.linked_variable_name?.length)
          ) {
            // console.log('return');
            break;
          }

          // Increament untill next level 0 question find
          if (index > questionDragId && questions[index]?.linked_variable_name?.length) {
            questionsToRemove++; // increamenting one for every child
          }
        }

        let droppedIndex = ev.currentTarget.id; // Actual dropped Index
        const questionAtDroppedIndex = item.FormsSections[sIndex]?.FSQuestions[droppedIndex]; //Question At DroppedIndex

        // Removing questions with their childrens id exist from questions
        let removed = item.FormsSections[sIndex]?.FSQuestions.splice(questionDragId, questionsToRemove);

        // finding new dropindex as we have removed dragged question(with childrens) from questions
        let newDropIndex = item?.FormsSections[sIndex]?.FSQuestions.findIndex((q) => q?.id == questionAtDroppedIndex?.id);

        // If Direction of drag is up to Down
        if (questionDragId < droppedIndex) {
          // Find if questionAtDroppedIndex has childs

          if (questionAtDroppedIndex?.child_node) {
            newDropIndex++; // skiping the iteration of self

            for (let index = newDropIndex; index < item?.FormsSections[sIndex]?.FSQuestions?.length; index++) {
              // Incerament until new level 0 question finds

              if (item.FormsSections[sIndex]?.FSQuestions[index]?.linked_variable_name) {
                newDropIndex++;
              } else {
                // Next level 0 question found
                break;
              }
            }
          } else {
            // Question doesent have childrens
            newDropIndex++;
          }
        }

        // Re-insert removed questions at dropped position whith childrens
        item.FormsSections[sIndex]?.FSQuestions.splice(newDropIndex, 0, ...removed);

        // Update order key in questrion
        item.FormsSections[sIndex].FSQuestions.forEach((question, index) => {
          item.FormsSections[sIndex].FSQuestions[index].order = index + 1;
        });
      } else if (que?.linked_variable_name?.length) {
        const questions = structuredClone(item?.FormsSections[sIndex]?.FSQuestions);

        let droppedIndex = ev.currentTarget.id; // Actual dropped Index

        let allowDropOn = [];
        let lastChildIndex = 0;
        for (let index = 0; index < questions?.length; index++) {
          // This breaks the loop when next level 0 question finds
          if (
            index >= questionDragId &&
            (!questions[index]?.linked_variable_name || !questions[index]?.linked_variable_name?.length)
          ) {
            // console.log('return');
            break;
          }

          // Increament untill next level 0 question find
          if (index >= questionDragId && questions[index]?.linked_variable_name?.length) {
            allowDropOn.push(index);
            lastChildIndex = index; //  allowed drop indexes
          }
        }
        for (let index = lastChildIndex; index > 0; index--) {
          // This breaks the loop when previous level 0 question finds
          if (!questions[index]?.linked_variable_name || !questions[index]?.linked_variable_name?.length) {
            // console.log('return');
            break;
          }

          // Increament untill previous level 0 question find
          allowDropOn.push(index); //  allowed drop indexes
        }
        if (allowDropOn.includes(parseInt(droppedIndex))) {
          // Removing questions
          let removed = item.FormsSections[sIndex]?.FSQuestions.splice(questionDragId, 1);

          // Re-insert removed questions at dropped position
          item.FormsSections[sIndex]?.FSQuestions.splice(droppedIndex, 0, ...removed);

          // Update order key in question
          item.FormsSections[sIndex].FSQuestions.forEach((question, qindex) => {
            item.FormsSections[sIndex].FSQuestions[qindex].order = qindex + 1;
          });
        } else {
          draggedChild = true;
        }
      }
      return item;
    });

    if (draggedOutsideSection) {
      toast.error('Drag Drop only allowed within section');
    }
    if (droppedOnChild) {
      toast.error('Questions cannot be dropped over dependent questions.');
    }
    if (draggedChild) {
      toast.error('Child questions cannot be dragged above parent questions');
    }
    setState([...state]);
    setQuestionDragId('');
    setSectionDragIndex('');
    setCurrentSectionId('');
  };

  useEffect(() => {
    if (editData && editData.length) {
      const englishecifs = editData[0]?.eICFList || [];
      const spanishecifs = editData[1]?.eICFList || [];
      let ecifs = [...englishecifs, ...spanishecifs];
      ecifs = ecifs.filter((e) => e.id);

      ecifs = dataMapper(ecifs);
      getPreparedEditData(editData);
      const ecifList = [];
      ecifs.forEach((ecif) => {
        if (ecif.id) {
          ecifList.push({
            id: ecif.id,
            version: ecif.version,
            form_code: ecif.form_code,
            name: ecif.name,
            body: ecif.body,
            label: `${ecif.name} ${ecif.version}`,
            value: ecif.id,
            language: ecif.language,
            languageList: ecif.languageList,
          });
        }
      });
      setEICF([...ecifList]);
      setShowErrors(false);
    }
  }, [editData]);

  const [modifiedEcifList, setModifiedEcifList] = useState([]);

  useEffect(() => {
    dispatch(setForms());
    return () => {
      setState(_.cloneDeep(initialState));
    };
  }, []);

  useEffect(() => {
    if (eCIFlist.length) {
      let ecifs = eCIFlist.map((ecif) => {
        return {
          id: ecif.id,
          version: ecif.version,
          name: ecif.name,
          form_code: ecif.form_code,
          body: ecif.body,
          label: `${ecif.name} ${ecif.version}`,
          value: ecif.id,
          language: ecif.language,
          languageList: ecif.languageList,
        };
      });
      ecifs = ecifs.filter((e) => !getSelectedeICFids().includes(e.id));
      setModifiedEcifList(ecifs);
    }
  }, [eCIFlist, eICF]);

  const getSelectedeICFids = () => {
    let filteredeICF = eICF.filter((e) => e.id);
    filteredeICF = filteredeICF.map((e) => e.id);
    return filteredeICF || [];
  };

  const handleBlur = (event) => {
    const _name = event.target.name.split('.'); //`FormsSections.${index}.FSQuestions.${qIndex}.variable_name`
    let node = state.find((item) => item.language === 'English'); //english as variable only change from english
    let questions = [];
    node[_name[0]]?.map((sec) => {
      questions = [...questions, ...sec.FSQuestions];
    });
    let isFound;
    questions.forEach((que, outerIndex) => {
      isFound = questions.find((v, i) => v.variable_name === que.variable_name && i !== outerIndex);
      if (isFound) {
        node[_name[0]].map((sec, secIndex) => {
          sec.FSQuestions.map((secQue, secQueIndex) => {
            if (isFound?.variable_name && secQue.variable_name == isFound.variable_name) {
              secQue.hasError = true;
              //for all language
              languageConfigList.forEach((itemLang, indexLang) => {
                state[indexLang].FormsSections[secIndex].FSQuestions[secQueIndex].hasError = true;
              });
            }
          });
        });
      } else {
        node[_name[0]].map((sec, secIndex) => {
          sec.FSQuestions.map((secQue, secQueIndex) => {
            if (secQue.variable_name == que.variable_name) {
              secQue.hasError = false;
              //for all language
              languageConfigList.forEach((itemLang, indexLang) => {
                state[indexLang].FormsSections[secIndex].FSQuestions[secQueIndex].hasError = false;
              });
            }
          });
        });
      }
    });
    setState([...state]);
  };

  const handleChange = (event) => {
    setShowErrors(false);
    const _name = event.target.name.split('.'); //`FormsSections.${index}.FSQuestions.${qIndex}.FSQAttributes.0.not_to_ans
    const currentLanguageIndex = languageConfigList.findIndex((item) => item === language);
    const newState = _.cloneDeep(state);
    let node = state[currentLanguageIndex];
    if (_name.length === 1) {
      state[currentLanguageIndex][_name[0]] = event && event.target ? event.target.value : event.target.checked;
    }
    if (_name.length === 2) {
      state[currentLanguageIndex][_name[0]][_name[1]] = event && event.target ? event.target.value : event.target.checked;
    }
    if (_name.length === 3) {
      state[currentLanguageIndex][_name[0]][_name[1]][_name[2]] =
        event && event.target ? event.target.value : event.target.checked;
    }
    if (_name.length === 6) {
      //for TODO: cde> {`FormsSections.${index}.FSQuestions.${qIndex}.variable_name.cde_type`}
      //* Case is CDE id  used  'variable_name' instead of cde_id > cde_type
      if (_name[4] == 'variable_name') {
        //TODO: CDElist => need to change in language Array not in english spanish
        let list = CDEList.find((item) => item.language == language);
        list = list.questions;
        let question = list.find((que) => que.variable_name === event.target?.value);
        const oldData = JSON.parse(JSON.stringify(node[_name[0]][_name[1]][_name[2]][_name[3]])); //qIndex-question
        // let exist = node[_name[0]][_name[1]][_name[2]].find((queItem) => queItem.cde_id === question.cde_id);
        let found = false;
        let exist = false;
        node[_name[0]].forEach((section) => {
          found = section.FSQuestions.find((queItem) => queItem?.variable_name === question?.variable_name);
          if (found) {
            exist = true;
          }
        });
        if (exist) {
          return false; //restrict duplicate variable_name
        }

        //TODO:  new change
        languageConfigList.forEach((langItem, langIndex) => {
          let list = CDEList.find((item) => item.language == langItem);
          if (list) {
            list = list.questions;
            const langQuestion = list.find((que) => que.variable_name === question.variable_name);
            state[langIndex].FormsSections[_name[1]].FSQuestions[_name[3]] = {
              ...oldData,
              ...langQuestion,
            };
          }
        });

        dispatch(selectedRequiredCDEQuestion(oldData, question)); // Select required cde question: now used for maintain cdelist
        // dispatch(selectedCDEQuestion(oldData, question)); // Select cde question

        if (question?.childrens?.length) {
          question?.childrens.forEach((child, childIndex) => {
            let parents = CDEList[0].questions.filter(
              (que) =>
                child?.linked_variable_name?.includes(que.variable_name) &&
                !que.selected &&
                que?.variable_name !== question?.variable_name
            );
            if (!parents.length) {
              //TODO:  new change
              languageConfigList.forEach((langItem, langIndex) => {
                let list = CDEList.find((item) => item.language == langItem);
                if (list) {
                  list = list.questions;
                  const langQuestion = list.find((que) => que.variable_name === question.variable_name);
                  let currentChild = langQuestion.childrens.find((que) => que.variable_name === child.variable_name);
                  state[langIndex].FormsSections[_name[1]].FSQuestions.splice(parseInt(_name[3]) + (childIndex + 1), 0, {
                    ...oldData,
                    ...currentChild,
                    language: langItem,
                  });
                }
              });
            }
          });
        }
      } else {
        state[currentLanguageIndex][_name[0]][_name[1]][_name[2]][_name[3]][_name[4]] =
          event && event.target ? event.target.value : event.target.checked;
      }
    }
    if (_name.length === 5) {
      const sectionIndex = _name[1];
      const questionIndex = _name[3];
      //FormsSections.${index}.FSQuestions.${qIndex}.FSQAttributes.${0}.
      //FormsSections.${index}.FSQuestions.${qIndex}.variable_name {`FormsSections.${index}.FSQuestions.${qIndex}.response_type`
      if (['variable_name', 'response_type', 'question_type'].includes(_name[4])) {
        //changing possible in english
        const value = event && event.target ? event.target.value : event.target.checked;
        //below update child question linked_variable_name as well if its parent question
        if (_name[4] === 'variable_name' && node[_name[0]][_name[1]][_name[2]][_name[3]]['child_node'] === true) {
          node[_name[0]][_name[1]][_name[2]].forEach((item) => {
            const oldVariableName = node[_name[0]][_name[1]][_name[2]][_name[3]].variable_name;
            if (item.linked_variable_name?.length && item.linked_variable_name?.includes(oldVariableName)) {
              const updatedList = item.linked_variable_name.map((linkVname) => {
                if (linkVname === oldVariableName) {
                  return value;
                }
                return linkVname;
              });

              languageConfigList.forEach((langItem, langIndex) => {
                state[langIndex].FormsSections[sectionIndex].FSQuestions[questionIndex].linked_variable_name = updatedList;

                // now update its question_attributes_list, question_attributes_label based on new modal
                const oldQuestionAttributeList =
                  state[langIndex].FormsSections[sectionIndex].FSQuestions[questionIndex].question_attributes_list;
                if (oldQuestionAttributeList && oldQuestionAttributeList[oldVariableName]) {
                  const updatedListResult = renameObjKey(oldQuestionAttributeList, oldVariableName, value);
                  const oldQuestionAttributeLabel =
                    state[langIndex].FormsSections[sectionIndex].FSQuestions[questionIndex].question_attributes_label;

                  state[langIndex].FormsSections[sectionIndex].FSQuestions[questionIndex].question_attributes_list =
                    updatedListResult;

                  state[langIndex].FormsSections[sectionIndex].FSQuestions[questionIndex].question_attributes_label =
                    oldQuestionAttributeLabel?.replace(oldVariableName, value);
                }
              });
            }
            return item;
          });
        }

        languageConfigList.forEach((langItem, langIndex) => {
          state[langIndex].FormsSections[sectionIndex].FSQuestions[questionIndex][_name[4]] = value;
          if (_name[4] === 'response_type') {
            if (value === 'Descriptive') {
              state[langIndex].FormsSections[sectionIndex].FSQuestions[questionIndex].descriptive = true;
            } else {
              state[langIndex].FormsSections[sectionIndex].FSQuestions[questionIndex].descriptive = false;
            }
          }
        });
      } else {
        let que = state[currentLanguageIndex][_name[0]][_name[1]][_name[2]][_name[3]];
        if (que.question_type == 'CDE Question') {
          state[currentLanguageIndex][_name[0]][_name[1]][_name[2]][_name[3]].question_edited = true;
        }
        state[currentLanguageIndex][_name[0]][_name[1]][_name[2]][_name[3]][_name[4]] =
          event && event.target ? event.target.value : event.target.checked;
      }
    }
    if (_name.length === 7) {
      const sectionIndex = _name[1];
      const questionIndex = _name[3];
      const checked = ['not_to_ans', 'max_current_datetime'].includes(_name[6]) ? event.target.checked : '';
      if (['choice_value', 'choice_label'].includes(_name[6])) {
        // making suue change in child question linked in all type of branching option can be done
        //TODO: below update child question linked_variable_name as well if its child question question_attributes_list
        if (_name[6] === 'choice_value' && node[_name[0]][_name[1]][_name[2]][_name[3]]['child_node'] === true) {
          node[_name[0]][_name[1]][_name[2]].map((item) => {
            if (item.linked_variable_name === node[_name[0]][_name[1]][_name[2]][_name[3]].variable_name) {
              const oldParentChoiceVal = node[_name[0]][_name[1]][_name[2]][_name[3]][_name[4]][_name[5]][_name[6]];
              //FormsSections.${index}.FSQuestions.${qIndex}.FSQAttributes.${chIndex}.choice_value

              languageConfigList.forEach((langItem, langIndex) => {
                state[langIndex].FormsSections[sectionIndex].FSQuestions[questionIndex].question_attributes_list.map(
                  (elm, inx) => {
                    if (elm === oldParentChoiceVal) {
                      elm = event && event.target ? event.target.value : '';
                    }
                    return elm;
                  }
                );
              });
            }
            return item;
          });
        }

        if (_name[6] === 'choice_label') {
          state[currentLanguageIndex].FormsSections[sectionIndex].FSQuestions[questionIndex][_name[4]][_name[5]][_name[6]] =
            event && event.target ? event.target.value || checked : event;
          //TODO: question_attributes_label modification needed with respect to older text
        } else {
          languageConfigList.forEach((langItem, langIndex) => {
            state[langIndex].FormsSections[sectionIndex].FSQuestions[questionIndex][_name[4]][_name[5]][_name[6]] =
              event && event.target ? event.target.value || checked : event;
          });
        }
      } else {
        //for rest all attributes value need to populate in all lang
        languageConfigList.forEach((langItem, langIndex) => {
          state[langIndex][_name[0]][_name[1]][_name[2]][_name[3]][_name[4]][_name[5]][_name[6]] =
            event && event.target ? event.target.value || checked : event;
        });
      }

      if (!node[_name[0]][_name[1]][_name[2]][_name[3]][_name[4]].response_type) {
        state[currentLanguageIndex][_name[0]][_name[1]][_name[2]][_name[3]][_name[4]][_name[5]].language =
          state[currentLanguageIndex][_name[0]][_name[1]][_name[2]][_name[3]].language;
        state[currentLanguageIndex][_name[0]][_name[1]][_name[2]][_name[3]][_name[4]][_name[5]].response_type =
          state[currentLanguageIndex][_name[0]][_name[1]][_name[2]][_name[3]].response_type;
      }
    }

    // This is added because some how state is mutated and parent questions linked_variable_name is getting some childs variable names.
    // It will simply empty the arrray of linked_variable_name from the level 0 questions
    if (_name.length === 5 && _name[4] == 'variable_name')
      state.map((item) => {
        item.FormsSections.map((questions) => {
          questions.FSQuestions.map((que) => {
            if (que.question_type == 'CDE Question' && que.linked_level == 0) {
              que.linked_variable_name = [];
            }
          });
        });
      });

    setState([...state]);
  };

  const toggleSection = (index) => {
    const nodeState = state;
    nodeState.map((item) => {
      item.FormsSections = item.FormsSections.map((section, secIndex) => {
        if (secIndex === index) {
          section.expand = !section.expand;
        }
        return section;
      });
      return item;
    });
    setState([...nodeState]);
  };

  const handleIcfChange = (e, ecifIndex) => {
    const _name = e.target.name.split('.');
    let node = eICF;
    const value = parseInt(e.target.value.id);
    if ((value || value === 0) && modifiedEcifList.length) {
      const selected = modifiedEcifList.find((itm) => itm.id === value);
      if (selected) {
        node[_name[1]].id = value;
        node[_name[1]].version = selected.version;
        node[_name[1]].body = selected.body;
        node[_name[1]].label = selected.label;
        node[_name[1]].value = selected.value;
        node[_name[1]].form_code = selected.form_code;
        node[_name[1]].name = selected.name;
        node[_name[1]].language = selected.language;
        node[_name[1]].languageList = selected.languageList;

        setEICF([...node]);
        state.map((langState, idx) => {
          state[idx][`eICFName${ecifIndex + 1}`] = selected.name;
          state[idx][`eICFVersion${ecifIndex + 1}`] = selected.version;
          state[idx][`eICFCode${ecifIndex + 1}`] = selected.form_code;
        });

        setState([...state]);
      }
    }
  };

  const removeEICF = (index) => {
    if (eICF.length > 1) {
      eICF.splice(index, 1);
      setEICF([...eICF]);
      let arr = [...state];
      [1, 2, 3].forEach((ele) => {
        const item = eICF.length ? eICF[ele - 1] : {};
        arr[0][`eICFName${ele}`] = item && item.name ? item.name : '';
        arr[0][`eICFVersion${ele}`] = item && item.version ? item.version : '';
        arr[0][`eICFCode${ele}`] = item && item.form_code ? item.form_code : '';
      });
      if (eICF.length) {
        let eicflistdata = eICF.filter((item) => item.id != '');
        arr[0]['eICFList'] = eicflistdata;
      }
      setState([...arr]);
    }
  };
  const addEICF = () => {
    if (eICF.length < 3) {
      eICF.push({
        id: '',
        version: '',
        name: '',
        form_code: '',
        body: '',
        label: '',
        value: '',
        language: '',
        languageList: '',
      });
      setEICF([...eICF]);
    }
  };

  const removeSection = (index) => {
    if (FormsSections.length > 1) {
      // if section has question whcih is used in any Form/Icf restrict delete
      let hasDependency = FormsSections[index].FSQuestions.some((que) => que?.dependent);
      if (hasDependency) {
        toast.error('Not allwed, section has dependent question');
        return;
      }
      //first re-update CDE from redux
      FormsSections[index].FSQuestions.forEach((que) => {
        if (que.question_type === 'CDE Question') {
          dispatch(selectedRequiredCDEQuestion(que, {}));
        }
      });
      languageConfigList.forEach((itemLang, itemIndex) => {
        let nextSection = state[itemIndex]?.FormsSections[index + 1];
        //If current section is parent of next section, then remove brancing data from next/child section
        if (nextSection && nextSection?.linked_variable_name?.length) {
          state[itemIndex].FormsSections[index + 1].linked_variable_name = [];
          state[itemIndex].FormsSections[index + 1].question_attributes_label = '';
          state[itemIndex].FormsSections[index + 1].question_attributes_list = {};
        }
        state[itemIndex]?.FormsSections.splice(index, 1);
      });
      setState([...state]);
    }
  };

  const addSection = () => {
    if (FormsSections.length < 15) {
      languageConfigList.forEach((itemLang, itemIndex) => {
        state[itemIndex]?.FormsSections.push({
          expand: false,
          name: '',
          FSQuestions: [],
          linked_variable_name: [],
          question_attributes_list: {},
          question_attributes_label: '',
          cde_version: '',
          cde_status: '',
        });
      });
      setState([...state]);
    }
  };

  const removeQuestion = (sectionIndex, questionIndex, que) => {
    if (que?.dependent) {
      toast.error('Not allwed, it is dependent question');
      return;
    }
    if (que.child_node) {
      setQuestionConfirmModal({ isOpen: true, sectionIndex, questionIndex, question: que, actionType: 'unlink' });
      return;
    }

    if (FormsSections[sectionIndex].FSQuestions.length > 0) {
      // dispatch(selectedCDEQuestion(que, {}));
      dispatch(selectedRequiredCDEQuestion(que, {})); // Select required cde question

      languageConfigList.forEach((itemLang, itemIndex) => {
        state[itemIndex]?.FormsSections[sectionIndex].FSQuestions.splice(questionIndex, 1);
      });

      if (que[que.language]?.linked_variable_name?.length) {
        // update child_node of parent
        const parentIndex = FormsSections[sectionIndex].FSQuestions.findIndex((ques) =>
          que.linked_variable_name.includes(ques.variable_name)
        );
        if (parentIndex > -1) {
          languageConfigList.forEach((itemLang, itemIndex) => {
            state[itemIndex].FormsSections[sectionIndex].FSQuestions[parentIndex].child_node = false;
          });
        }
      }
      setState([...state]);
    }
  };

  const addQuestion = (sectionIndex) => {
    const newState = _.cloneDeep(state);

    languageConfigList.forEach((itemLang, index) => {
      newState[index].FormsSections[sectionIndex].FSQuestions.push({
        question_type: '',
        question: '',
        hint: '',
        cde_version: '',
        cde_status: '',
        linked_level: 0,
        language: itemLang,
        question_edited: false,
        FSQAttributes: [
          {
            not_to_ans: true,
            attribute_edited: false,
            choice_key: 'choice_1',
            choice_label: '',
            choice_value: '',
            form_id: '',
            id: '',
            max_current_datetime: true,
            max_date: '',
            max_datetime: '',
            max_time: '',
            min_date: '',
            min_datetime: '',
            min_time: '',
            num_flot_max: '',
            num_max_value: '',
            num_min_value: '',
            order: 0,
            questions_id: '',
            response_type: '',
            sections_id: '',
            study_id: '',
            text_max_char: '',
            text_min_char: '',
          },
        ],
      });
    });
    setState([...newState]);
  };

  const changeLanguage = (lang, sectionIndex, questionIndex) => {
    // FormsSections[sectionIndex].FSQuestions[questionIndex].language = lang;
    // setState({ ...state, FormsSections: [...FormsSections] });
    setLanguage(lang);
  };

  const addQuestionChoice = (sectionIndex, questionIndex, questionLanguage) => {
    const variableName =
      _.get(state, `0.FormsSections.${sectionIndex}.FSQuestions.${questionIndex}.variable_name`) || 'choice';
    const hasFSQAttributes =
      _.get(state, `0.FormsSections.${sectionIndex}.FSQuestions.${questionIndex}.FSQAttributes`) || [];
    // maximum choice can be 15 only
    if (hasFSQAttributes.length === 15) return;

    languageConfigList.forEach((itemLang, index) => {
      state[index]?.FormsSections[sectionIndex].FSQuestions[questionIndex].FSQAttributes.push({
        not_to_ans: true,
        attribute_edited: false,
        choice_key: `${variableName}_${hasFSQAttributes.length + 1}`,
        choice_label: '',
        choice_value: '',
        form_id: '',
        id: '',
        max_current_datetime: false,
        max_date: '',
        max_datetime: '',
        max_time: '',
        min_date: '',
        min_datetime: '',
        min_time: '',
        num_flot_max: '',
        num_max_value: '',
        num_min_value: '',
        order: 0,
        questions_id: '',
        response_type: '',
        sections_id: '',
        study_id: '',
        text_max_char: '',
        text_min_char: '',
      });
    });
    setState([...state]);
  };

  const removeQuestionChoice = (sectionIndex, questionIndex, choiceIndex, questionLanguage) => {
    if (FormsSections[sectionIndex].FSQuestions[questionIndex].FSQAttributes.length > 0) {
      languageConfigList.forEach((itemLang, index) => {
        state[index]?.FormsSections[sectionIndex].FSQuestions[questionIndex].FSQAttributes.splice(choiceIndex, 1);
      });
      setState([...state]);
    }
  };

  const handleDateTime = (info, statePath, format) => {
    const _name = statePath.split('.');
    const stateIndex = state.findIndex((item) => item.language === language);
    let node = state[stateIndex];
    if (_name.length === 7) {
      let value = '';
      switch (format) {
        case 'toISOString':
          value = moment(info).toISOString();
          break;
        case 'toDate':
          value = moment(info).format('yyyy-MM-DD');
          break;
        case 'toTime':
          value = moment(info).format('HH:mm:ss');
          break;
      }
      node[_name[0]][_name[1]][_name[2]][_name[3]][_name[4]][_name[5]][_name[6]] = value;
    }

    setState([...state]);
  };

  const isValidDate = function (current) {
    const yesterday = moment().subtract(0, 'day');
    return yesterday.isAfter(current);
  };

  const closeChildLinkModal = (sendData) => {
    //question link branching
    if (sendData && !sendData.isSectionLinking) {
      // console.log(sendData);
      const { linked_variable_name, question_attributes_list, question_attributes_label, sectionIndex, qIndex, language } =
        sendData;

      /** common update for all even if removed branching as empty linked_variable_name */
      languageConfigList.forEach((itemLang, index) => {
        if (state[index].FormsSections[sectionIndex].FSQuestions[qIndex]) {
          state[index].FormsSections[sectionIndex].FSQuestions[qIndex].linked_variable_name = linked_variable_name;
          state[index].FormsSections[sectionIndex].FSQuestions[qIndex].question_attributes_list = question_attributes_list;
          state[index].FormsSections[sectionIndex].FSQuestions[qIndex].question_attributes_label = question_attributes_label;
        }
      });

      // update child node false if not new linked_variable_name
      const previousLinked_varable_name = FormsSections[sectionIndex].FSQuestions[qIndex].linked_variable_name;
      if (previousLinked_varable_name?.length) {
        previousLinked_varable_name.forEach((variableName) => {
          //find parentQIndex to update child node
          const parentQIndex = FormsSections[sectionIndex].FSQuestions.findIndex(
            (item) => item.variable_name === variableName && !linked_variable_name?.includes(variableName)
          );
          if (parentQIndex || parentQIndex >= 0) {
            //do it for all lang
            languageConfigList.forEach((itemLang, index) => {
              if (state[index].FormsSections[sectionIndex].FSQuestions[parentQIndex]) {
                state[index].FormsSections[sectionIndex].FSQuestions[parentQIndex].child_node = false;
              }
            });
          }
        });
      }

      // update child node true if new linked_variable_name
      if (linked_variable_name?.length) {
        //if linked_variable has list do it for each variable
        linked_variable_name.forEach((linkedVariable) => {
          //get new variables parent index
          const parentQIndex = FormsSections[sectionIndex].FSQuestions.findIndex(
            (item) => linkedVariable === item.variable_name
          );

          if (parentQIndex || parentQIndex >= 0) {
            // *important TODO: might need to update in all language // @Solution: while remapping payload automatically picked it from english data
            // languageConfigList.forEach((itemLang, index) => {
            const parent = FormsSections[sectionIndex].FSQuestions[parentQIndex];
            const child = FormsSections[sectionIndex].FSQuestions[qIndex];
            //do it for all lang
            languageConfigList.forEach((itemLang, index) => {
              if (state[index].FormsSections[sectionIndex].FSQuestions[parentQIndex]) {
                state[index].FormsSections[sectionIndex].FSQuestions[parentQIndex].child_node = true;
                state[index].FormsSections[sectionIndex].FSQuestions[qIndex].linked_level = parent.linked_level + 1;
              }
            });

            if (child.child_node) {
              (function recursive(child) {
                FormsSections[sectionIndex].FSQuestions.map((ch, chIdx) => {
                  if (ch?.linked_variable_name?.includes(child?.variable_name)) {
                    FormsSections[sectionIndex].FSQuestions[chIdx].linked_level = child.linked_level + 1;
                    if (ch.child_node) {
                      recursive(ch);
                    }
                  }
                });
              })(child);
            }
            // });
          }
        });
      }

      setState([...state]);
      setChildLinkModal({ isOpen: false, question: {}, customQuestions: '', isSectionLinking: false });

      return;
    }

    //section link branching
    if (sendData && sendData.isSectionLinking) {
      const {
        linked_variable_name,
        question_attributes_list,
        question_attributes_label,
        sectionIndex,
        qIndex,
        language,
        isSectionLinking,
      } = sendData;

      const parentSectionIndex = parseInt(sectionIndex - 1);
      languageConfigList.forEach((itemLang, itemIndex) => {
        state[itemIndex].FormsSections[parentSectionIndex].child_node = linked_variable_name?.length ? true : false;
        state[itemIndex].FormsSections[sectionIndex].linked_variable_name = linked_variable_name;
        state[itemIndex].FormsSections[sectionIndex].question_attributes_list = question_attributes_list;
        state[itemIndex].FormsSections[sectionIndex].question_attributes_label = question_attributes_label;
      });

      setState([...state]);
      setChildLinkModal({ isOpen: false, question: {}, customQuestions: '', isSectionLinking: false });
    }

    //default close
    setChildLinkModal({ isOpen: false, question: {}, customQuestions: '', isSectionLinking: false });
  };

  const closeQuestionConfirmModal = (sendData) => {
    const { sectionIndex, questionIndex, question } = sendData;
    if (sendData && FormsSections[sectionIndex].FSQuestions.length >= 1) {
      // FormsSections[sectionIndex].FSQuestions = FormsSections[sectionIndex].FSQuestions.filter((quest) => {
      //   if (
      //     quest.English?.linked_variable_name?.includes(question.English?.variable_name) ||
      //     quest.English.variable_name === question.English.variable_name
      //   ) {
      //     dispatch(selectedRequiredCDEQuestion(quest, {}));
      //     return false;
      //   }
      //   return true;
      // });
      findRecursive(question, sectionIndex);
      // setState({ ...state, FormsSections: [...FormsSections] });
    }
    setQuestionConfirmModal({ open: false });
  };

  const findRecursive = (question, sectionIndex) => {
    // finding question index to be deleted
    let quesIndex = _.findIndex(
      FormsSections[sectionIndex].FSQuestions,
      (que) => que?.variable_name === question?.variable_name
    );

    if (quesIndex > -1) {
      //Removing question
      // TODO: multi lang
      languageConfigList.forEach((itemLang, itemIndex) => {
        state[itemIndex].FormsSections[sectionIndex]?.FSQuestions?.splice(quesIndex, 1);
      });

      setState([...state]);
      dispatch(selectedRequiredCDEQuestion(question, {}));
      //If question has childrens
      if (question?.child_node == true) {
        // finding the childrens question
        let childrens = FormsSections[sectionIndex]?.FSQuestions.filter((que) =>
          que?.linked_variable_name?.includes(question?.variable_name)
        );
        //calling recursively
        childrens.forEach((child) => findRecursive(child, sectionIndex));
      }
    }

    return FormsSections;
  };

  const openChildQuestionLinkModal = (question, sectionIndex, qIndex) => {
    // if (question?.question_type === 'Custom Question') {
    const language = question.language;
    let hasChoiceTypes = FormsSections[sectionIndex].FSQuestions.filter((el, i) => {
      if (
        i !== qIndex &&
        i < qIndex &&
        // new todo: only above question can be linked i < qIndex
        // !el[language].linked_variable_name?.length &&
        // el[language].question_type === 'Custom Question' &&
        // TODO: 'Dropdown', for future version
        ['Multiple Choice', 'Radio Button', 'Descriptive', 'Date', 'Time', 'DateTime', 'Number'].includes(el.response_type)
      ) {
        return el;
      }
    });
    if (hasChoiceTypes && hasChoiceTypes.length) {
      if (question.child_node) {
        let restrictedChoiceTypes = [];
        // Searching recursively and finding childs at nested level to avoid circular linking
        (function recursive(que) {
          hasChoiceTypes.map((ch) => {
            if (
              ch?.linked_variable_name?.includes(que?.variable_name) &&
              !restrictedChoiceTypes.includes(ch.variable_name)
            ) {
              restrictedChoiceTypes.push(ch.variable_name);
              recursive(ch);
            }
          });
        })(question);

        hasChoiceTypes = hasChoiceTypes.filter((ch) => !restrictedChoiceTypes?.includes(ch?.variable_name));
      }
      setChildLinkModal({ question, customQuestions: hasChoiceTypes, language, sectionIndex, qIndex, isOpen: true });
      return;
    }
    // }
    setChildLinkModal({ question, isOpen: true });
  };

  const openChildSectionLinkModal = (section, sectionIndex) => {
    const language = section.language || 'English';
    if (
      !FormsSections[sectionIndex - 1]?.FSQuestions?.length ||
      FormsSections[sectionIndex - 1]?.linked_variable_name?.length
    ) {
      //if above section hasn't questions
      toast.error('top section has inappropriate questions or already linked');
      return;
    }
    let hasChoiceTypes = FormsSections[sectionIndex - 1].FSQuestions.filter((el, i) => {
      if (
        // !el[language].linked_variable_name?.length &&
        // el[language].question_type === 'Custom Question' &&
        // TODO: 'Dropdown', for future version
        ['Multiple Choice', 'Radio Button', 'Date', 'Time', 'DateTime', 'Number'].includes(el.response_type)
      ) {
        return el;
      }
    });
    if (hasChoiceTypes && hasChoiceTypes.length) {
      setChildLinkModal({
        question: section,
        customQuestions: hasChoiceTypes,
        language,
        sectionIndex,
        qIndex: sectionIndex,
        isOpen: true,
        isSectionLinking: true,
      });
      return;
    }
  };

  const eICformCheck = () => {
    let spanishNeeded;
    FormsSections.forEach((entry, i) => {
      let spanishQuestions = entry.FSQuestions.filter((question) => question.Spanish);
      let custumQuestions = spanishQuestions.filter(
        (question) =>
          question.Spanish.question_type !== 'CDE Question' || formType?.formCategory === 'Use Default CDE Template'
      );
      const hasAnyQuestionType = custumQuestions.some((question) => question.Spanish.question);
      if (hasAnyQuestionType) {
        spanishNeeded = true;
      }
    });
    return spanishNeeded;
  };

  // const handleDrag = (ev) => {
  //   setDragId(ev.currentTarget.id);
  // };

  // const handleDrop = (ev) => {
  //   let removed = FormsSections.splice(dragId, 1);
  //   FormsSections.splice(ev.currentTarget.id, 0, removed[0]);
  //   FormsSections.forEach((section, index) => {
  //     FormsSections[index].order = index + 1;
  //   });
  //   setState({ ...state, FormsSections: [...FormsSections] });
  // };

  const checkEICFError = () => {
    let hasError = false;
    if (eICF.length) {
      hasError = eICF.every((e) => Validation.empty(e.name));
    }
    if (!eICF.length) {
      hasError = true;
    }
    return hasError;
  };

  const openDatepicker = (variable) => {
    let datePickerDiv = document.getElementById(`datetimepicker${variable}`);
    datePickerDiv.querySelector('input').focus();
  };

  const languagesIneICF = eICF.map((e) => e.languageList);
  const renderEICF = () => {
    return (
      <>
        {eICF.map((item, index) => (
          <div className={`row`} key={index}>
            <div className="col-md-6  p-0">
              {/* <Form.Group controlId="formName" className="col-12">
                <Form.Label>e-ICF</Form.Label> */}

              {/* <Form.Select
                  type="text"
                  name={`eICF.${index}`}
                  placeholder=""
                  onChange={(e) => handleIcfChange(e, index)}
                  value={item.id}
                  className={`${styles.icfDropdown}`}
                  aria-label="Default select eicf"
                  isInvalid={showErrors && Validation.empty(eICF)}
                  required>
                  <option value=""> Select ICF </option>
                  {eCIFlist.map((elem, inx) => (
                    <option key={inx} value={elem.id}>
                      {elem?.name} {''} {elem?.version}{' '}
                    </option>
                  ))}
                </Form.Select> */}
              <Form.Group className="mb-3 d-flex flex-column " controlId="exampleForm.ControlInput1">
                <Form.Label>e-ICF</Form.Label>
                <Select
                  value={item.value ? item : ''}
                  name={`eICF.${index}`}
                  onChange={(e) => handleIcfChange({ target: { value: e, name: `eICF.${index}` } }, index)}
                  options={modifiedEcifList}
                  isInvalid={showErrors && Validation.empty(item.value)}
                  required
                />
                <Form.Control.Feedback type="invalid">e-ICF is required field.</Form.Control.Feedback>
              </Form.Group>
              {/* </Form.Group> */}
            </div>
            <div className="col-md-6  p-0 py-4 mt-1">
              {eICF.length > 1 && (
                <img
                  src={'/images/delete-form-item.svg'}
                  data-toggle="tooltip"
                  title="Delete"
                  height={36}
                  className="cursor-pointer mx-2"
                  onClick={() => removeEICF(index)}
                />
              )}
            </div>
            <div className={`col-md-12 ${styles.innerSectionWrapper}`}>
              <div className={`${styles.icfDetails}`} dangerouslySetInnerHTML={{ __html: item.body }}></div>
            </div>
          </div>
        ))}
        <div className="d-flex cursor-pointer ps-0 mb-2">
          <div className="cursor-pointer mt-2" onClick={addEICF}>
            <img
              className={`${styles.addTextIcon} me-2`}
              src={'/images/plus-icon.svg'}
              data-toggle="tooltip"
              title="Add e-ICF"
            ></img>
            <span className={`${styles.defaultBoldText}`}>Add e-ICF</span>
          </div>
          {/* {showErrors && checkEICFError() && (
            <label className="text-danger text-center mt-2 align-self-center ms-4">Atleast one Spanish eICF required!</label>
          )} */}
          {/* {showErrors &&
            !(languagesIneICF.includes('English & Spanish') || languagesIneICF.includes('Spanish & English')) &&
            eICformCheck() && (
              <label className="text-danger text-center mt-2 align-self-center ms-4">
                Atleast one Spanish eICF required!
              </label>
            )} */}
        </div>
      </>
    );
  };

  return (
    <div className="form">
      <Modal
        className={`${'custom-modal child-link-modal'} ${styles.formContainer}`}
        show={openChildLinkModal.isOpen}
        onHide={closeChildLinkModal}
        backdrop="static"
        keyboard={false}
        centered
      >
        <ChildLinkModal details={openChildLinkModal} styles={styles} handleClose={closeChildLinkModal} />
      </Modal>

      <ConfirmModal
        data={openQuestionConfirmModal}
        open={openQuestionConfirmModal.isOpen}
        handleClose={closeQuestionConfirmModal}
      />

      <div className="language-set row">
        {/* TODO: multilanguage change */}
        {/* <div className="col-md-12 d-flex justify-content-end align-items-md-end me-5">
          <div>
            {languageListPicked.map((langItem, index) => (
              <button
                key={index}
                className={`btn mx-1 ${language === langItem ? 'btn-primary' : 'btn-gray'}`}
                onClick={() => handleChangeLanguage(langItem)}
              >
                {langItem}
              </button>
            ))}
            </div>
          </div> */}
      </div>

      <div className={`row ${styles.sectionWrapper}`}>{renderEICF()}</div>

      <div className={`row ${styles.sectionWrapper}`}>
        <DependencyClauseCard
          publishedForms={publishedForms}
          formType={formType}
          setDependencyData={setDependencyData}
          styles={styles}
          showErrors={showErrors}
          formDependencyMapping={state[0]?.FormDependencyMapping}
          currentFormData={currentFormData}
        />
        {/* {renderDependencyClause()} */}
      </div>
      <div className={`row ${styles.sectionWrapper}`}>
        <FormSettingCard
          forwordFormSettingsData={setFormSettingsData}
          styles={styles}
          data={editData}
          showErrors={showErrors}
          formSettingData={formSettingDataState}
        />
        {/* {renderFormSettings()} */}
      </div>

      <div className="sectionContainer">
        {FormsSections &&
          FormsSections.map((item, index) => (
            <div className={`${styles.sectionWrapper}`}>
              <div className={`${styles.sectionHeader} row`}>
                <div className={`${styles.sectionTitle}`}>Section {index + 1}</div>
                <div className="col-md-6 d-flex align-items-end p-0">
                  {!!item?.linked_variable_name?.length && (
                    <img
                      src={'/images/child-branching.png'}
                      data-toggle="tooltip"
                      title="Child Branching Question"
                      height={24}
                      className="cursor-pointerx me-2 d-flex mb-2"
                    />
                  )}
                  <Form.Group className="col" controlId="sectionName">
                    <Form.Control
                      type="text"
                      name={`FormsSections.${index}.name`}
                      placeholder="Section name"
                      onChange={handleChange}
                      value={item.name}
                      maxLength="100"
                      isInvalid={showErrors && Validation.empty(FormsSections[index].name)}
                      required
                    />
                    <Form.Control.Feedback type="invalid">Section is required field.</Form.Control.Feedback>
                  </Form.Group>
                  {index > 0 && (
                    <img
                      src={'/images/child-links.svg'}
                      data-toggle="tooltip"
                      title="Section link"
                      height={36}
                      onClick={() => openChildSectionLinkModal(item, index)}
                      className="cursor-pointer mx-2"
                    />
                  )}
                  {FormsSections.length > 1 && (
                    <img
                      src={'/images/delete-form-item.svg'}
                      data-toggle="tooltip"
                      title="Delete"
                      height={36}
                      className="cursor-pointer mx-2"
                      onClick={() => removeSection(index)}
                    />
                  )}
                </div>
                <div className={`col ${styles.sectionToggle}`}>
                  {FormsSections?.length > 1 && (
                    <div
                      // className={`${styles.sectionWrapper}`}
                      key={index}
                      id={index}
                      draggable={true}
                      onDragOver={(ev) => ev.preventDefault()}
                      onDragStart={handleDrag}
                      onDrop={handleDrop}
                    >
                      <img
                        src={'/images/dnd.svg'}
                        data-toggle="tooltip"
                        title="Drag"
                        height={30}
                        className="cursor-pointer me-4 my-auto"
                      />
                    </div>
                  )}
                  <img
                    src={item.expand ? '/images/right-arrow.svg' : '/images/bottom-arrow.svg'}
                    data-toggle="tooltip"
                    title="Expand"
                    className="cursor-pointer mx-2"
                    onClick={() => toggleSection(index)}
                  />
                </div>
              </div>
              <div className={`sectionBody ${item.expand ? '' : 'd-none'}`}>
                {item.FSQuestions &&
                  item.FSQuestions.map((que, qIndex) => (
                    <div
                      className={`${styles.questionWrapper}`}
                      onDragOver={(ev) => ev.preventDefault()}
                      id={qIndex}
                      onDrop={(e) => handleQuestionDrop(e, index)}
                    >
                      <div className={`row p-0 m-0 d-flex flex-wrap`}>
                        <div className={`col-md-2 ${styles.sectionTitle}`}>Question {qIndex + 1}</div>
                        <div className="col-md-4 d-flex align-items-end p-0">
                          {!!que?.linked_variable_name?.length && (
                            <img
                              src={'/images/child-branching.png'}
                              data-toggle="tooltip"
                              title="Child Branching Question"
                              height={24}
                              className="cursor-pointerx me-2 d-flex mb-2"
                            />
                          )}
                          <Form.Group className="col" controlId="selectQuestion">
                            <Form.Select
                              type="text"
                              name={`FormsSections.${index}.FSQuestions.${qIndex}.question_type`}
                              placeholder="Add Question"
                              onChange={handleChange}
                              value={que?.question_type}
                              className={`${styles.icfDropdownNormal}`}
                              aria-label="Default select question type"
                              disabled={
                                que?.question_type === 'CDE Question' ||
                                (que.cde_id && que?.linked_variable_name?.length) ||
                                language !== 'English'
                              }
                              isInvalid={showErrors && Validation.empty(que.question_type)}
                              required
                            >
                              <option value="">Select Question Type</option>
                              <option value="CDE Question">CDE Question </option>
                              <option value="Custom Question">Custom Question </option>
                            </Form.Select>
                            {/* <Form.Control.Feedback type="invalid">Question is required field.</Form.Control.Feedback> */}
                          </Form.Group>
                          {
                            // !que?.child_node &&
                            (que?.linked_variable_name?.length ||
                              (item.FSQuestions.length > 1 &&
                                ['Custom Question', 'CDE Question'].includes(que?.question_type))) && (
                              <img
                                src={'/images/child-links.svg'}
                                data-toggle="tooltip"
                                title="Child Question link"
                                height={36}
                                className="cursor-pointer mx-2"
                                onClick={() => openChildQuestionLinkModal(que, index, qIndex, false)}
                              />
                            )
                          }
                          {item.FSQuestions.length > 0 &&
                            !(que?.linked_variable_name?.length && que?.question_type === 'CDE Question') && (
                              <img
                                src={'/images/delete-form-item.svg'}
                                data-toggle="tooltip"
                                title="Delete"
                                height={36}
                                className="cursor-pointer mx-2"
                                onClick={() => removeQuestion(index, qIndex, que)}
                              />
                            )}
                        </div>
                        <div className="col-md-5 d-flex justify-content-end align-items-center ms-5">
                          {/* TODO: multilanguage change */}
                          <div className="me-2">
                            {languageListPicked.map((langItem, index) => (
                              <button
                                key={index}
                                className={`btn mx-1 ${language === langItem ? 'btn-primary' : 'btn-gray'}`}
                                onClick={() => handleChangeLanguage(langItem)}
                              >
                                {langItem}
                              </button>
                            ))}
                          </div>
                          <div
                            className={`ms-5 float-end `}
                            key={qIndex}
                            draggable={true}
                            onDragOver={(ev) => ev.preventDefault()}
                            onDragStart={(e) => handleQuestionDrag(e, item.id, index)}
                            id={qIndex}
                          >
                            <img
                              src={'/images/dnd.svg'}
                              data-toggle="tooltip"
                              title="Drag"
                              height={22}
                              className="cursor-pointer ms-2"
                            />
                          </div>
                        </div>
                        {showErrors && Validation.empty(que.question_type) && (
                          <span className={`${styles.cstInvalidFeedback} `}>Question type is required field.</span>
                        )}
                      </div>

                      {/* question type inputs CDE Question */}
                      {que.question_type === 'CDE Question' && (
                        <CDEQuestionComponent
                          styles={styles}
                          handleChange={handleChange}
                          index={index}
                          qIndex={qIndex}
                          que={que}
                          showErrors={showErrors}
                          CDEList={CDEList}
                          language={language}
                        />
                      )}

                      {/* question type inputs Custom */}
                      {que.question_type === 'Custom Question' && (
                        <div className="d-flex flex-column">
                          <Form.Group className="col me-5 mt-2" controlId="sectionQuestion">
                            <Form.Control
                              type="text"
                              name={`FormsSections.${index}.FSQuestions.${qIndex}.question`}
                              placeholder="Question"
                              onChange={handleChange}
                              value={que.question}
                              maxLength="150"
                              isInvalid={showErrors && Validation.empty(que.question)}
                              required
                            />
                            <Form.Control.Feedback type="invalid">Question is required field.</Form.Control.Feedback>
                          </Form.Group>
                          <Form.Group className="col me-5 mt-2" controlId="sectionHint">
                            <Form.Control
                              type="text"
                              name={`FormsSections.${index}.FSQuestions.${qIndex}.hint`}
                              placeholder="Hint"
                              onChange={handleChange}
                              value={que.hint}
                              maxLength="150"
                              // isInvalid={showErrors && Validation.empty(que.hint)}
                              required
                            />
                            {/* <Form.Control.Feedback type="invalid">Hint is required field.</Form.Control.Feedback> */}
                          </Form.Group>
                          <div className="d-flex mb-2 ps-3">
                            <div className={`${styles.defaultText} d-flex align-items-center pe-2`}>
                              <div className="pe-2"> Variable Name: </div>
                              <Form.Group className="col me-5 my-2" controlId="sectionHint">
                                <Form.Control
                                  type="text"
                                  name={`FormsSections.${index}.FSQuestions.${qIndex}.variable_name`}
                                  placeholder=""
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  value={que.variable_name}
                                  maxLength="50"
                                  disabled={language !== 'English'}
                                  isInvalid={(showErrors && Validation.empty(que.variable_name)) || que.hasError}
                                  required
                                />
                                <Form.Control.Feedback type="invalid">
                                  {que.hasError ? 'Variable name is already used!' : 'Variable name is required field.'}
                                </Form.Control.Feedback>
                              </Form.Group>
                            </div>
                            <div className={`${styles.defaultText} d-flex align-items-center`}>
                              <div className="pe-2">Response Type: </div>
                              <Form.Group className="col" controlId="selectQuestion">
                                <Form.Select
                                  type="text"
                                  name={`FormsSections.${index}.FSQuestions.${qIndex}.response_type`}
                                  placeholder="Add Question"
                                  onChange={handleChange}
                                  value={que.response_type}
                                  className={`${styles.icfDropdownNormal}`}
                                  aria-label="Default select question type"
                                  isInvalid={showErrors && Validation.empty(que.response_type)}
                                  disabled={language !== 'English'}
                                  required
                                >
                                  <option value="">Select Response Type</option>
                                  <option value="Radio Button">Radio Button </option>
                                  <option value="Multiple Choice">Multiple Choice </option>
                                  <option value="Dropdown">Dropdown </option>
                                  <option value="Text Box">Text Box</option>
                                  <option value="Number">Number</option>
                                  <option value="Date">Date </option>
                                  <option value="DateTime">DateTime </option>
                                  <option value="Time">Time </option>
                                  <option value="Descriptive">Descriptive </option>
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                  Response type is required field.
                                </Form.Control.Feedback>
                              </Form.Group>
                            </div>
                          </div>

                          {/* FSQAttributes and responses choice type */}
                          <>
                            {que.response_type &&
                              ['Multiple Choice', 'Radio Button', 'Dropdown'].includes(que.response_type) && (
                                <div className="d-flex flex-column ps-3">
                                  <div className={`d-flex justify-content-end mt-1 me-5 data-table`}>
                                    <div className="form-check">
                                      <input
                                        className="form-check-input"
                                        name={`FormsSections.${index}.FSQuestions.${qIndex}.FSQAttributes.0.not_to_ans`}
                                        checked={que.FSQAttributes[0]?.not_to_ans}
                                        onChange={handleChange}
                                        disabled={language !== 'English'}
                                        type="checkbox"
                                        value=""
                                        id="flexCheckDefault"
                                      />
                                    </div>
                                    <div className={`${styles.defaultText}`}>Include prefer not to answer</div>
                                  </div>
                                  {que.FSQAttributes && que.FSQAttributes.length > 0 && (
                                    <div className="row p-0">
                                      <div className={`col-md-12 me-5 ms-1 ${styles.cdeOptionsTable}`}>
                                        <table>
                                          <tr>
                                            <th>Sl.No</th>
                                            <th>Choices</th>
                                            <th>Values</th>
                                            <th></th>
                                          </tr>
                                          {que.FSQAttributes.map((chItem, chIndex) => (
                                            <tr key={chIndex}>
                                              <td>
                                                <div className={`me-1 ${styles.choiceTitle}`}>
                                                  {`Choice ${chIndex + 1 || chItem.choice_key}`}
                                                </div>
                                              </td>
                                              <td>
                                                <Form.Group className="col my-2" controlId="choice-label">
                                                  <Form.Control
                                                    type="text"
                                                    name={`FormsSections.${index}.FSQuestions.${qIndex}.FSQAttributes.${chIndex}.choice_label`}
                                                    placeholder=""
                                                    onChange={handleChange}
                                                    value={chItem.choice_label}
                                                    maxLength="50"
                                                    isInvalid={showErrors && Validation.empty(chItem.choice_label)}
                                                    required
                                                  />
                                                  <Form.Control.Feedback type="invalid">
                                                    Choice label is required field.
                                                  </Form.Control.Feedback>
                                                </Form.Group>
                                              </td>
                                              <td>
                                                <Form.Group
                                                  className={`col my-2 ${styles.choiceValueInput}`}
                                                  controlId="choice-value"
                                                >
                                                  <Form.Control
                                                    type="text"
                                                    name={`FormsSections.${index}.FSQuestions.${qIndex}.FSQAttributes.${chIndex}.choice_value`}
                                                    placeholder=""
                                                    onChange={handleChange}
                                                    value={chItem.choice_value}
                                                    disabled={language !== 'English'}
                                                    maxLength="50"
                                                    isInvalid={showErrors && Validation.empty(chItem.choice_value)}
                                                    required
                                                  />
                                                  <Form.Control.Feedback type="invalid">
                                                    Choice value is required field.
                                                  </Form.Control.Feedback>
                                                </Form.Group>
                                              </td>
                                              <td>
                                                {que?.FSQAttributes && que?.FSQAttributes?.length > 1 && (
                                                  <img
                                                    className={`${styles.addTextIcon} ${
                                                      que.child_node ? 'cursor-not-allowed' : 'cursor-pointer'
                                                    } me-2`}
                                                    onClick={() =>
                                                      language === 'English' &&
                                                      !que.child_node &&
                                                      removeQuestionChoice(index, qIndex, chIndex, language)
                                                    }
                                                    src={'/images/cross-icon.svg'}
                                                    data-toggle="tooltip"
                                                    title={
                                                      que.child_node ? 'Cannot delete Child linked choice' : 'Delete Choice'
                                                    }
                                                  ></img>
                                                )}
                                              </td>
                                            </tr>
                                          ))}
                                        </table>
                                      </div>
                                    </div>
                                  )}
                                  <div className="d-flex mt-2">
                                    {(!que.FSQAttributes || (que.FSQAttributes && que.FSQAttributes.length < 9)) && (
                                      <button
                                        disabled={language !== 'English'}
                                        className="btn btn-secondary mx-1"
                                        onClick={() => addQuestionChoice(index, qIndex, language)}
                                      >
                                        Add Choice
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                          </>

                          {/* responses textbox , min max char, not to answer */}
                          <>
                            {que.response_type && que.response_type === 'Text Box' && (
                              <div className="d-flex flex-row ps-3">
                                <div className="d-flex flex-column">
                                  <div className={`${styles.defaultText} d-flex align-items-center pe-2`}>
                                    <div className="pe-2"> Minimum Character limit </div>
                                    <Form.Group className={`colx me-5 my-2 ${styles.choiceValueInput}`} controlId="minChar">
                                      <Form.Control
                                        type="number"
                                        name={`FormsSections.${index}.FSQuestions.${qIndex}.FSQAttributes.0.text_min_char`}
                                        placeholder=""
                                        disabled={language !== 'English'}
                                        onChange={(e) => e?.target?.value <= 999 && handleChange(e)}
                                        value={que.FSQAttributes[0]?.text_min_char}
                                        onKeyDown={(e) => e.key == 'e' && e.preventDefault()}
                                        // isInvalid={
                                        //   showErrors && Validation.empty(que.FSQAttributes[0].text_min_char)
                                        // }
                                        max="999"
                                        maxLength="3"
                                        required
                                      />
                                      {/* <Form.Control.Feedback type="invalid">Required field.</Form.Control.Feedback> */}
                                    </Form.Group>
                                  </div>
                                  <div className={`${styles.defaultText} d-flex align-items-center pe-2`}>
                                    <div className="pe-2">
                                      Maximum Character limit
                                      <br />
                                      (Max Limit 1024)
                                    </div>
                                    <Form.Group className={`colx me-5 my-2 ${styles.choiceValueInput}`} controlId="maxChar">
                                      <Form.Control
                                        type="number"
                                        onKeyDown={(e) => e.key == 'e' && e.preventDefault()}
                                        name={`FormsSections.${index}.FSQuestions.${qIndex}.FSQAttributes.0.text_max_char`}
                                        placeholder=""
                                        disabled={language !== 'English'}
                                        // onChange={handleChange}
                                        onChange={(e) => e?.target?.value <= 1024 && handleChange(e)}
                                        value={que.FSQAttributes[0].text_max_char}
                                        // isInvalid={
                                        //   showErrors && Validation.empty(que.FSQAttributes[0].text_max_char)
                                        // }
                                        max="1024"
                                        maxLength="4"
                                        required
                                      />
                                      {/* <Form.Control.Feedback type="invalid">Required field.</Form.Control.Feedback> */}
                                    </Form.Group>
                                  </div>
                                </div>
                                <div className={`d-flex mt-4 ms-4 data-table`}>
                                  <div className="form-check">
                                    <input
                                      className="form-check-input"
                                      disabled={language !== 'English'}
                                      name={`FormsSections.${index}.FSQuestions.${qIndex}.FSQAttributes.0.not_to_ans`}
                                      checked={que.FSQAttributes[0]?.not_to_ans}
                                      onChange={handleChange}
                                      type="checkbox"
                                      value=""
                                      id="flexCheckDefault"
                                    />
                                  </div>
                                  <div className={`${styles.defaultText}`}>Include prefer not to answer</div>
                                </div>
                              </div>
                            )}
                          </>
                          {/* responses Number , min max char, not to answer */}
                          <>
                            {que.response_type && que.response_type === 'Number' && (
                              <div className="d-flex flex-row ps-3">
                                <div className="d-flex flex-column">
                                  <div className={`${styles.defaultText} d-flex align-items-center pe-2`}>
                                    <div className="pe-2">
                                      {' '}
                                      Minimum Value Accepted <br />
                                      (Min Number Limit -999999){' '}
                                    </div>
                                    <Form.Group className={`colx me-3 my-2 ${styles.choiceValueInput}`} controlId="minChar">
                                      <Form.Control
                                        type="number"
                                        onKeyDown={(e) => e.key == 'e' && e.preventDefault()}
                                        name={`FormsSections.${index}.FSQuestions.${qIndex}.FSQAttributes.0.num_min_value`}
                                        placeholder=""
                                        disabled={language !== 'English'}
                                        onChange={handleChange}
                                        value={que.FSQAttributes[0].num_min_value}
                                        // isInvalid={
                                        //   showErrors && Validation.empty(que.FSQAttributes[0].num_min_value)
                                        // }
                                        min="-999999"
                                        maxLength="6"
                                        required
                                      />
                                      {/* <Form.Control.Feedback type="invalid">Required field.</Form.Control.Feedback> */}
                                    </Form.Group>
                                  </div>
                                  <div className={`${styles.defaultText} d-flex align-items-center pe-2`}>
                                    <div className="pe-2">
                                      {' '}
                                      Maximum Value Accepted <br />
                                      (Max Number Limit 999999){' '}
                                    </div>
                                    <Form.Group className={`colx me-3 my-2 ${styles.choiceValueInput}`} controlId="maxChar">
                                      <Form.Control
                                        type="number"
                                        onKeyDown={(e) => e.key == 'e' && e.preventDefault()}
                                        name={`FormsSections.${index}.FSQuestions.${qIndex}.FSQAttributes.0.num_max_value`}
                                        placeholder=""
                                        disabled={language !== 'English'}
                                        // onChange={handleChange}
                                        onChange={(e) => e?.target?.value <= 999999 && handleChange(e)}
                                        value={que.FSQAttributes[0].num_max_value}
                                        // isInvalid={
                                        //   showErrors && Validation.empty(que.FSQAttributes[0].num_max_value)
                                        // }
                                        max="999999"
                                        maxLength="6"
                                        required
                                      />
                                      {/* <Form.Control.Feedback type="invalid">Required field.</Form.Control.Feedback> */}
                                    </Form.Group>
                                  </div>
                                </div>
                                <div className="d-flex flex-column">
                                  <div className={`${styles.defaultText} d-flex align-items-center pe-2`}>
                                    <div className="pe-2">
                                      {' '}
                                      Allowed Decimal Value <br />
                                      (Max Decimal Limit 3){' '}
                                    </div>
                                    <Form.Group className={`colx me-5 my-2 ${styles.choiceValueInput}`} controlId="minChar">
                                      <Form.Control
                                        type="number"
                                        onKeyDown={(e) => e.key == 'e' && e.preventDefault()}
                                        name={`FormsSections.${index}.FSQuestions.${qIndex}.FSQAttributes.0.num_flot_max`}
                                        placeholder=""
                                        disabled={language !== 'English'}
                                        // onChange={handleChange}
                                        onChange={(e) => e?.target?.value <= 3 && handleChange(e)}
                                        value={que.FSQAttributes[0].num_flot_max}
                                        // isInvalid={
                                        //   showErrors && Validation.empty(que.FSQAttributes[0].num_flot_max)
                                        // }
                                        max="3"
                                        maxLength="1"
                                        required
                                      />
                                      {/* <Form.Control.Feedback type="invalid">Required field.</Form.Control.Feedback> */}
                                    </Form.Group>
                                  </div>
                                </div>
                                <div className={`d-flex mt-1 ms-4 data-table`}>
                                  <div className="form-check">
                                    <input
                                      className="form-check-input"
                                      disabled={language !== 'English'}
                                      name={`FormsSections.${index}.FSQuestions.${qIndex}.FSQAttributes.0.not_to_ans`}
                                      checked={que.FSQAttributes[0]?.not_to_ans}
                                      onChange={handleChange}
                                      type="checkbox"
                                      value=""
                                      id="flexCheckDefault"
                                    />
                                  </div>
                                  <div className={`${styles.defaultText}`}>Include prefer not to answer</div>
                                </div>
                              </div>
                            )}
                          </>

                          {/* response type is  'Descriptive'  */}
                          <>
                            {que.response_type === 'Descriptive' && (
                              <div className="d-flex flex-row mt-2 mb-2 align-items-center"></div>
                            )}
                          </>

                          {/* responses 'DateTime' > min_datetime, max_datetime, Date: min_date, max_date, Time: min_time,max_time */}
                          <>
                            {que.response_type && ['Date', 'DateTime', 'Time'].includes(que.response_type) && (
                              <div className="d-flex row p-0 mt-3 ps-3">
                                <div className="col-md-6 d-flex flex-column">
                                  <div className={`${styles.defaultText}`}>Set Acceptable {que.response_type} Range</div>
                                </div>

                                <div className={`col-md-4 d-flex mt-1 ms-4 data-table`}>
                                  {que.response_type !== 'Time' && (
                                    <>
                                      <div className="form-check">
                                        <input
                                          className="form-check-input"
                                          disabled={language !== 'English'}
                                          name={`FormsSections.${index}.FSQuestions.${qIndex}.FSQAttributes.0.max_current_datetime`}
                                          checked={que.FSQAttributes[0]?.max_current_datetime}
                                          onChange={handleChange}
                                          type="checkbox"
                                          value=""
                                          id="flexCheckDefault"
                                        />
                                      </div>
                                      <div className={`${styles.defaultText}`}>Set limit to current date</div>
                                    </>
                                  )}
                                </div>

                                <div className="col-md-6 d-flex flex-column">
                                  {/* <div className={`${styles.defaultText}`}>Set Acceptable Date Range</div> */}
                                  {que.response_type === 'Date' && (
                                    <div className="d-flex flex-row mt-2 mb-2 align-items-center">
                                      <div
                                        className={`${styles.dateTimeIcon}`}
                                        id={`datetimepicker${que.response_type}${index}${qIndex}from`}
                                      >
                                        <Datetime
                                          dateFormat="MM/DD/YYYY"
                                          className={`${styles.defaultDateTimeText}`}
                                          inputProps={{
                                            disabled: language !== 'English' || que?.FSQAttributes[0].max_current_datetime,
                                            onChange: (e) => {
                                              return false;
                                            },
                                          }}
                                          isValidDate={isValidDate}
                                          initialValue={
                                            que?.FSQAttributes[0].min_date ? moment(que.FSQAttributes[0].min_date) : ''
                                          }
                                          onChange={(ev) =>
                                            handleDateTime(
                                              ev,
                                              `FormsSections.${index}.FSQuestions.${qIndex}.FSQAttributes.0.min_date`,
                                              'toDate'
                                            )
                                          }
                                          timeFormat={false}
                                        />
                                        <img
                                          src={'/images/calendar-icon.svg'}
                                          className={`${styles.dateTimeIconImage}`}
                                          onClick={() => openDatepicker(`${que.response_type}${index}${qIndex}from`)}
                                        ></img>
                                      </div>
                                      <div className={`${styles.defaultText} px-3`}>To</div>
                                      <div
                                        className={`${styles.dateTimeIcon}`}
                                        id={`datetimepicker${que.response_type}${index}${qIndex}to`}
                                      >
                                        <Datetime
                                          dateFormat="MM/DD/YYYY"
                                          timeFormat={false}
                                          inputProps={{
                                            disabled: language !== 'English' || que?.FSQAttributes[0].max_current_datetime,
                                            onChange: (e) => {
                                              return false;
                                            },
                                          }}
                                          className={`${styles.defaultDateTimeText}`}
                                          isValidDate={isValidDate}
                                          initialValue={
                                            que?.FSQAttributes[0].max_date ? moment(que?.FSQAttributes[0].max_date) : ''
                                          }
                                          onChange={(ev) =>
                                            handleDateTime(
                                              ev,
                                              `FormsSections.${index}.FSQuestions.${qIndex}.FSQAttributes.0.max_date`,
                                              'toDate'
                                            )
                                          }
                                        />
                                        <img
                                          src={'/images/calendar-icon.svg'}
                                          className={`${styles.dateTimeIconImage}`}
                                          onClick={() => openDatepicker(`${que.response_type}${index}${qIndex}to`)}
                                        ></img>
                                      </div>
                                    </div>
                                  )}
                                  {que.response_type === 'DateTime' && (
                                    <div className="d-flex flex-row mt-2 mb-2 align-items-center">
                                      <div
                                        className={`${styles.dateTimeIcon}`}
                                        id={`datetimepicker${que.response_type}${index}${qIndex}from`}
                                      >
                                        <Datetime
                                          dateFormat="MM/DD/YYYY;"
                                          timeFormat="HH:mm"
                                          className={`${styles.defaultDateTimeText}`}
                                          inputProps={{
                                            disabled: language !== 'English' || que?.FSQAttributes[0].max_current_datetime,
                                            onChange: (e) => {
                                              return false;
                                            },
                                          }}
                                          isValidDate={isValidDate}
                                          initialValue={
                                            que?.FSQAttributes[0].min_datetime
                                              ? moment(que?.FSQAttributes[0].min_datetime)
                                              : ''
                                          }
                                          onChange={(ev) =>
                                            handleDateTime(
                                              ev,
                                              `FormsSections.${index}.FSQuestions.${qIndex}.FSQAttributes.0.min_datetime`,
                                              'toISOString'
                                            )
                                          }
                                        />
                                        <img
                                          src={'/images/calendar-icon.svg'}
                                          className={`${styles.dateTimeIconImage}`}
                                          onClick={() => openDatepicker(`${que.response_type}${index}${qIndex}from`)}
                                        ></img>
                                      </div>
                                      <div className={`${styles.defaultText} px-3`}>To</div>
                                      <div
                                        className={`${styles.dateTimeIcon}`}
                                        id={`datetimepicker${que.response_type}${index}${qIndex}to`}
                                      >
                                        <Datetime
                                          dateFormat="MM/DD/YYYY;"
                                          timeFormat="HH:mm"
                                          inputProps={{
                                            disabled: language !== 'English' || que?.FSQAttributes[0].max_current_datetime,
                                            onChange: (e) => {
                                              return false;
                                            },
                                          }}
                                          className={`${styles.defaultDateTimeText}`}
                                          isValidDate={isValidDate}
                                          initialValue={
                                            que?.FSQAttributes[0].max_datetime
                                              ? moment(que?.FSQAttributes[0].max_datetime)
                                              : ''
                                          }
                                          onChange={(ev) =>
                                            handleDateTime(
                                              ev,
                                              `FormsSections.${index}.FSQuestions.${qIndex}.FSQAttributes.0.max_datetime`,
                                              'toISOString'
                                            )
                                          }
                                        />
                                        <img
                                          src={'/images/calendar-icon.svg'}
                                          className={`${styles.dateTimeIconImage}`}
                                          onClick={() => openDatepicker(`${que.response_type}${index}${qIndex}to`)}
                                        ></img>
                                      </div>
                                    </div>
                                  )}
                                  {que.response_type === 'Time' && (
                                    <div className="d-flex flex-row mt-2 mb-2 align-items-center">
                                      <div
                                        className={`${styles.dateTimeIcon}`}
                                        id={`datetimepicker${que.response_type}${index}${qIndex}from`}
                                      >
                                        <Datetime
                                          dateFormat={false}
                                          timeFormat="HH:mm"
                                          className={`${styles.defaultDateTimeText}`}
                                          inputProps={{
                                            // || que?.FSQAttributes[0].max_current_datetime
                                            disabled: language !== 'English',
                                            onChange: (e) => {
                                              return false;
                                            },
                                          }}
                                          initialValue={
                                            que?.FSQAttributes[0]?.min_time
                                              ? moment(que?.FSQAttributes[0]?.min_time, 'HH:mm:ss')
                                              : ''
                                          }
                                          onChange={(ev) =>
                                            handleDateTime(
                                              ev,
                                              `FormsSections.${index}.FSQuestions.${qIndex}.FSQAttributes.0.min_time`,
                                              'toTime'
                                            )
                                          }
                                        />
                                        <img
                                          src={'/images/clock-icon.svg'}
                                          onClick={() => openDatepicker(`${que.response_type}${index}${qIndex}from`)}
                                          className={`${styles.dateTimeIconImage}`}
                                        ></img>
                                      </div>
                                      <div className={`${styles.defaultText} px-3`}>To </div>
                                      <div
                                        className={`${styles.dateTimeIcon}`}
                                        id={`datetimepicker${que.response_type}${index}${qIndex}to`}
                                      >
                                        <Datetime
                                          dateFormat={false}
                                          timeFormat="HH:mm"
                                          className={`${styles.defaultDateTimeText}`}
                                          inputProps={{
                                            // || que?.FSQAttributes[0].max_current_datetime
                                            disabled: language !== 'English',
                                            onChange: (e) => {
                                              return false;
                                            },
                                          }}
                                          initialValue={
                                            que?.FSQAttributes[0]?.max_time
                                              ? moment(que?.FSQAttributes[0]?.max_time, 'HH:mm')
                                              : ''
                                          }
                                          onChange={(ev) =>
                                            handleDateTime(
                                              ev,
                                              `FormsSections.${index}.FSQuestions.${qIndex}.FSQAttributes.0.max_time`,
                                              'toTime'
                                            )
                                          }
                                        />
                                        <img
                                          src={'/images/clock-icon.svg'}
                                          onClick={() => openDatepicker(`${que.response_type}${index}${qIndex}to`)}
                                          className={`${styles.dateTimeIconImage}`}
                                        ></img>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className={`col-md-4 d-flex mt-1 ms-4 data-table`}>
                                  <div className="form-check">
                                    <input
                                      className="form-check-input"
                                      disabled={language !== 'English'}
                                      name={`FormsSections.${index}.FSQuestions.${qIndex}.FSQAttributes.0.not_to_ans`}
                                      checked={que.FSQAttributes[0]?.not_to_ans}
                                      onChange={handleChange}
                                      type="checkbox"
                                      value=""
                                      id="flexCheckDefault"
                                    />
                                  </div>
                                  <div className={`${styles.defaultText}`}>Include prefer not to answer</div>
                                </div>
                              </div>
                            )}
                          </>
                        </div>
                      )}
                    </div>
                  ))}

                <div className="d-flex ps-0 mb-2">
                  <div className="cursor-pointer mt-2" onClick={() => addQuestion(index)}>
                    <img
                      className={`${styles.addTextIcon} me-2`}
                      src={'/images/plus-icon.svg'}
                      data-toggle="tooltip"
                      title="Add Question"
                    ></img>
                    <span className={`${styles.defaultBoldText}`}>Add Question</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        {FormsSections && FormsSections.length < 15 && (
          <div className="d-flex ps-0 mb-2">
            <div className="cursor-pointer mt-2" onClick={() => addSection()}>
              <img
                className={`${styles.addTextIcon} me-2`}
                src={'/images/plus-icon.svg'}
                data-toggle="tooltip"
                title="Add Section/Category"
              ></img>
              <span className={`${styles.defaultBoldText}`}>Add another Section/Category</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default FormComponent;

FormComponent.defaultProps = {
  eCIFlist: [],
};
