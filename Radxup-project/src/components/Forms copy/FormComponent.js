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
const CDEQuestionComponent = dynamic(() => import('./Components/CDEQuestion'));
const DependencyClauseCard = dynamic(() => import('./DependencyClauseCard'));
const FormSettingCard = dynamic(() => import('./FormSettingCard'));

const FormComponent = forwardRef((props, ref) => {
  const { styles, eCIFlist, editData, isPreview, submitFormInfo, formType } = props;
  const [dependencyData, setDependencyState] = useState([]);
  const [formSettingsData, setFormSettingsState] = useState({});

  const user = isAuth();
  const setDependencyData = (data) => {
    let dependencyData = [];
    if (data.length) {
      data.forEach((dapendency, index) => {
        let { condition, dependent_form_code, operator, question, values, variable_name, label } = dapendency;
        let formattedData = {
          order: index + 1,
          condition: index == 0 ? null : condition,
          dependent_form_code,
          response_type: question?.response_type,
          variable_name,
          operator,
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
  });
  const [openQuestionConfirmModal, setQuestionConfirmModal] = useState({
    isOpen: false,
    question: {},
    actionType: 'unlink',
  });
  const [state, setState] = useState({
    eICFName1: '',
    eICFVersion1: '',
    eICFName2: '',
    eICFVersion2: '',
    eICFName3: '',
    eICFVersion3: '',
    FormsSections: [{ expand: true, name: '', FSQuestions: [] }],
  });
  const [eICF, setEICF] = useState([
    { id: '', version: '', name: '', body: '', label: '', value: '', language: '', languageList: '' },
  ]);
  const { FormsSections } = state;
  // const [dragId, setDragId] = useState();

  const getPreparedPayload = () => {
    const cloneState1 = JSON.parse(JSON.stringify(state));
    const cloneState2 = JSON.parse(JSON.stringify(state));
    const data = [
      {
        ...cloneState1,
        language: 'English',
        max_cde_question: '50',
        eICFLanguages: eICF.map((ecif) => ecif.languageList),
      },
      {
        ...cloneState2,
        language: 'Spanish',
        max_cde_question: '50',
        eICFLanguages: eICF.map((ecif) => ecif.languageList),
      },
    ];

    data.map((entry, index) => {
      entry.FormsSections = entry.FormsSections.map((section) => {
        section.FSQuestions = section.FSQuestions.map((question, qIndex) => {
          question = question[entry.language];
          return question;
        });
        delete section.expand;
        return section;
      });
      return entry;
    });
    return data;
  };

  useImperativeHandle(ref, () => ({
    getFormsData() {
      const data = { forms: [...getPreparedPayload()], dependencyData, formSettingsData };
      // const data = getPreparedPayload();

      setShowErrors(true);
      return data;
    },
  }));

  const getPreparedEditData = async (data) => {
    const englishData = JSON.parse(JSON.stringify(data.find((ite) => ite.language === 'English')));
    const spanishData = data.find((ite) => ite.language === 'Spanish');
    const defaultSpanishQ = {
      question_type: '',
      question: '',
      language: 'Spanish',
      FSQAttributes: [
        {
          not_to_ans: true,
          choice_key: '',
          choice_label: '',
          choice_value: '',
          max_date: '',
          max_datetime: '',
          max_time: '',
          min_date: '',
          min_datetime: '',
          min_time: '',
          num_flot_max: '',
          num_max_value: '',
          num_min_value: '',
          response_type: '',
          text_max_char: '',
          text_min_char: '',
        },
      ],
    };

    async function reMappingData() {
      if (englishData && englishData.FormsSections) {
        englishData.FormsSections = englishData.FormsSections.map((section, sectionIndex) => {
          section.FSQuestions = section.FSQuestions.map((question, qIndex) => {
            let Spanish;
            if (!spanishData) {
              let FSQAttributes = [...JSON.parse(JSON.stringify(question.FSQAttributes))];
              FSQAttributes = FSQAttributes.map((attr) => {
                attr.choice_label = '';
                return attr;
              });
              Spanish = {
                ...defaultSpanishQ,
                FSQAttributes: FSQAttributes,
                hint: '',
                question_type: question.question_type,
                response_type: question.response_type,
                variable_name: question.variable_name,
              };
            }
            question = {
              English: {
                language: 'English',
                ...question,
              },
              Spanish: {
                ...(spanishData ? spanishData.FormsSections[sectionIndex]?.FSQuestions[qIndex] : { ...Spanish }),
              },
              language: 'English',
            };
            return question;
          });
          return section;
        });
        return englishData;
      }
    }

    reMappingData().then((result) => {
      // console.log(result, 'res');
      setState({ ...state, ...result });
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
  }, []);

  useEffect(() => {
    if (eCIFlist.length) {
      let ecifs = eCIFlist.map((ecif) => {
        return {
          id: ecif.id,
          version: ecif.version,
          name: ecif.name,
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
    const _name = event.target.name.split('.');
    let node = state;
    let questions = [];
    node[_name[0]].map((sec) => {
      questions = [...questions, ...sec.FSQuestions];
    });
    let isFound;
    questions.forEach((que, outerIndex) => {
      isFound = questions.find((v, i) => v.English.variable_name === que.English.variable_name && i !== outerIndex);
      if (isFound && isFound.English) {
        node[_name[0]].map((sec) => {
          sec.FSQuestions.map((secQue) => {
            if (secQue.English.variable_name == isFound.English.variable_name) {
              secQue.English.hasError = true;
              secQue.Spanish.hasError = true;
            }
          });
        });
      } else {
        node[_name[0]].map((sec) => {
          sec.FSQuestions.map((secQue) => {
            if (secQue.English.variable_name == que.English.variable_name) {
              secQue.English.hasError = false;
              secQue.Spanish.hasError = false;
            }
          });
        });
      }
    });
    setState({ ...node });
  };

  const handleChange = (event) => {
    setShowErrors(false);
    const _name = event.target.name.split('.');
    let node = state;
    if (_name.length === 1) {
      node[_name[0]] = event && event.target ? event.target.value : event.target.checked;
    }
    if (_name.length === 2) {
      node[_name[0]][_name[1]] = event && event.target ? event.target.value : event.target.checked;
    }
    if (_name.length === 3) {
      node[_name[0]][_name[1]][_name[2]] = event && event.target ? event.target.value : event.target.checked;
    }
    if (_name.length === 5) {
      // Case is CDE id  used  'variable_name' instead of cde_id
      if (_name[4] == 'variable_name') {
        let question = CDEList.find((que) => que.variable_name === event.target?.value);
        const oldData = JSON.parse(JSON.stringify(node[_name[0]][_name[1]][_name[2]][_name[3]]));
        // let exist = node[_name[0]][_name[1]][_name[2]].find((queItem) => queItem.English.cde_id === question.English.cde_id);
        let found = false;
        let exist = false;
        node[_name[0]].forEach((section) => {
          found = section.FSQuestions.find((queItem) => queItem.English.variable_name === question.English.variable_name);
          if (found) {
            exist = true;
          }
        });
        if (exist) {
          return false;
        }
        node[_name[0]][_name[1]][_name[2]][_name[3]] = {
          ...oldData, //TD
          English: question.English,
          Spanish: question.Spanish ? question.Spanish : oldData.Spanish,
        };

        dispatch(selectedRequiredCDEQuestion(oldData, question)); // Select required cde question: now used for maintain cdelist
        // dispatch(selectedCDEQuestion(oldData, question)); // Select cde question

        if (question?.childrens?.length) {
          question?.childrens.forEach((child, childIndex) => {
            let parents = CDEList.filter(
              (que) =>
                child?.linked_variable_name?.includes(que.variable_name) &&
                !que.selected &&
                que?.variable_name !== question?.variable_name
            );
            if (!parents.length) {
              node[_name[0]][_name[1]][_name[2]].splice(parseInt(_name[3]) + (childIndex + 1), 0, {
                ...oldData,
                English: child.English,
                Spanish: child.Spanish ? child.Spanish : oldData.Spanish,
                language: 'English',
              });
            }
          });
        }
      } else {
        node[_name[0]][_name[1]][_name[2]][_name[3]][_name[4]] =
          event && event.target ? event.target.value : event.target.checked;
      }
    }
    if (_name.length === 6) {
      if (['variable_name', 'response_type', 'question_type'].includes(_name[5])) {
        const value = event && event.target ? event.target.value : event.target.checked;
        //below update child question linked_variable_name as well if its parent question
        if (_name[5] === 'variable_name' && node[_name[0]][_name[1]][_name[2]][_name[3]]['English']['child_node'] === true) {
          node[_name[0]][_name[1]][_name[2]].map((item) => {
            const oldVariableName = node[_name[0]][_name[1]][_name[2]][_name[3]]['English'].variable_name;
            if (
              item['English'].linked_variable_name?.length &&
              item['English'].linked_variable_name?.includes(oldVariableName)
            ) {
              const updatedList = item['English'].linked_variable_name.map((linkVname) => {
                if (linkVname === oldVariableName) {
                  return value;
                }
                return linkVname;
              });

              item['English'].linked_variable_name = updatedList;
              item['Spanish'].linked_variable_name = updatedList;
              // now update its question_attributes_list, question_attributes_label based on new modal
              const oldQuestionAttributeList = item['English'].question_attributes_list;
              if (oldQuestionAttributeList && oldQuestionAttributeList[oldVariableName]) {
                const updatedListResult = renameObjKey(oldQuestionAttributeList, oldVariableName, value);
                const updatedLabelResult = item['English'].question_attributes_label;
                item['English'].question_attributes_list = updatedListResult;
                item['Spanish'].question_attributes_list = updatedListResult;
                item['English'].question_attributes_label = item['English'].question_attributes_label?.replace(
                  oldVariableName,
                  value
                );
                item['Spanish'].question_attributes_label = item['Spanish'].question_attributes_label?.replace(
                  oldVariableName,
                  value
                );
              }
            }
            return item;
          });
        }
        node[_name[0]][_name[1]][_name[2]][_name[3]]['English'][_name[5]] = value;
        node[_name[0]][_name[1]][_name[2]][_name[3]]['Spanish'][_name[5]] = value;
        if (_name[5] === 'response_type') {
          if (value === 'Descriptive') {
            node[_name[0]][_name[1]][_name[2]][_name[3]]['Spanish'].descriptive = true;
            node[_name[0]][_name[1]][_name[2]][_name[3]]['English'].descriptive = true;
          } else {
            node[_name[0]][_name[1]][_name[2]][_name[3]]['Spanish'].descriptive = false;
            node[_name[0]][_name[1]][_name[2]][_name[3]]['English'].descriptive = false;
          }
        }
      } else {
        node[_name[0]][_name[1]][_name[2]][_name[3]][_name[4]][_name[5]] =
          event && event.target ? event.target.value : event.target.checked;
      }
    }
    if (_name.length === 8) {
      const checked = ['not_to_ans', 'max_current_datetime'].includes(_name[7]) ? event.target.checked : '';
      if (['not_to_ans', 'choice_value', 'max_current_datetime'].includes(_name[7])) {
        //TODO: below update child question linked_variable_name as well if its child question question_attributes_list
        if (_name[7] === 'choice_value' && node[_name[0]][_name[1]][_name[2]][_name[3]]['English']['child_node'] === true) {
          node[_name[0]][_name[1]][_name[2]].map((item) => {
            if (
              item['English'].linked_variable_name === node[_name[0]][_name[1]][_name[2]][_name[3]]['English'].variable_name
            ) {
              const oldParentChoiceVal =
                node[_name[0]][_name[1]][_name[2]][_name[3]]['English'][_name[5]][_name[6]][_name[7]];
              item['English'].question_attributes_list.map((elm, inx) => {
                if (elm === oldParentChoiceVal) {
                  elm = event && event.target ? event.target.value : '';
                  item['Spanish'].question_attributes_list[inx] = elm;
                }
                return elm;
              });
            }
            return item;
          });
        }

        node[_name[0]][_name[1]][_name[2]][_name[3]]['English'][_name[5]][_name[6]][_name[7]] =
          event && event.target ? event.target.value || checked : event;
        node[_name[0]][_name[1]][_name[2]][_name[3]]['Spanish'][_name[5]][_name[6]][_name[7]] =
          event && event.target ? event.target.value || checked : event;
      } else {
        node[_name[0]][_name[1]][_name[2]][_name[3]][_name[4]][_name[5]][_name[6]][_name[7]] =
          event && event.target ? event.target.value || checked : event;
      }

      if (!node[_name[0]][_name[1]][_name[2]][_name[3]][_name[4]][_name[5]].response_type) {
        node[_name[0]][_name[1]][_name[2]][_name[3]][_name[4]][_name[5]][_name[6]].language =
          node[_name[0]][_name[1]][_name[2]][_name[3]][_name[4]].language;
        node[_name[0]][_name[1]][_name[2]][_name[3]][_name[4]][_name[5]][_name[6]].response_type =
          node[_name[0]][_name[1]][_name[2]][_name[3]][_name[4]].response_type;
      }
    }
    // console.log(node);
    setState({ ...node });
  };

  const toggleSection = (index) => {
    const nodeState = state;
    nodeState.FormsSections[index].expand = !nodeState.FormsSections[index].expand;
    setState({ ...nodeState });
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
        node[_name[1]].name = selected.name;
        node[_name[1]].language = selected.language;
        node[_name[1]].languageList = selected.languageList;

        setEICF([...node]);

        state[`eICFName${ecifIndex + 1}`] = selected.name;
        state[`eICFVersion${ecifIndex + 1}`] = selected.version;

        setState({ ...state });
      }
    }
  };

  const removeEICF = (index) => {
    if (eICF.length > 1) {
      eICF.splice(index, 1);
      setEICF([...eICF]);
      [1, 2, 3].forEach((ele) => {
        const item = eICF.length ? eICF[ele - 1] : {};
        state[`eICFName${ele}`] = item && item.name ? item.name : '';
        state[`eICFVersion${ele}`] = item && item.version ? item.version : '';
      });

      setState({ ...state });
    }
  };
  const addEICF = () => {
    if (eICF.length < 3) {
      eICF.push({ id: '', version: '', name: '', body: '', label: '', value: '', language: '', languageList: '' });
      setEICF([...eICF]);
    }
  };

  const removeSection = (index) => {
    if (FormsSections.length > 1) {
      FormsSections[index].FSQuestions.forEach((que) => {
        if (que.English.question_type === 'CDE Question') {
          dispatch(selectedRequiredCDEQuestion(que, {}));
        }
      });
      FormsSections.splice(index, 1);
      setState({ ...state, FormsSections: [...FormsSections] });
    }
  };
  const addSection = () => {
    if (FormsSections.length < 15) {
      FormsSections.push({ expand: false, name: '', FSQuestions: [] });
      setState({ ...state, FormsSections: [...FormsSections] });
    }
  };
  const removeQuestion = (sectionIndex, questionIndex, que) => {
    if (que[que.language].child_node) {
      setQuestionConfirmModal({ isOpen: true, sectionIndex, questionIndex, question: que, actionType: 'unlink' });
      return;
    }

    if (FormsSections[sectionIndex].FSQuestions.length > 0) {
      // dispatch(selectedCDEQuestion(que, {}));
      dispatch(selectedRequiredCDEQuestion(que, {})); // Select required cde question
      FormsSections[sectionIndex].FSQuestions.splice(questionIndex, 1);

      if (que[que.language]?.linked_variable_name?.length) {
        // update child_node of parent
        const parentIndex = FormsSections[sectionIndex].FSQuestions.findIndex((ques) =>
          que[que.language].linked_variable_name.includes(ques['English'].variable_name)
        );
        if (parentIndex > -1) {
          FormsSections[sectionIndex].FSQuestions[parentIndex]['English'].child_node = false;
          FormsSections[sectionIndex].FSQuestions[parentIndex]['Spanish'].child_node = false;
        }
      }
      setState({ ...state, FormsSections: [...FormsSections] });
    }
  };

  const addQuestion = (sectionIndex) => {
    FormsSections[sectionIndex].FSQuestions.push({
      English: {
        question_type: '',
        question: '',
        hint: '',
        linked_level: 0,
        language: 'English',
        FSQAttributes: [
          {
            not_to_ans: true,
            choice_key: 'choice_1',
            choice_label: '',
            choice_value: '',
            max_date: '',
            max_datetime: '',
            max_time: '',
            min_date: '',
            min_datetime: '',
            min_time: '',
            num_flot_max: '',
            num_max_value: '',
            num_min_value: '',
            response_type: '',
            text_max_char: '',
            text_min_char: '',
          },
        ],
      },
      Spanish: {
        question_type: '',
        question: '',
        hint: '',
        linked_level: 0,
        language: 'Spanish',
        FSQAttributes: [
          {
            not_to_ans: true,
            choice_key: 'choice_1',
            choice_label: '',
            choice_value: '',
            max_date: '',
            max_datetime: '',
            max_time: '',
            min_date: '',
            min_datetime: '',
            min_time: '',
            num_flot_max: '',
            num_max_value: '',
            num_min_value: '',
            response_type: '',
            text_max_char: '',
            text_min_char: '',
          },
        ],
      },
      language: 'English',
    });
    setState({ ...state, FormsSections: [...FormsSections] });
  };

  const changeLanguage = (lang, sectionIndex, questionIndex) => {
    FormsSections[sectionIndex].FSQuestions[questionIndex].language = lang;
    setState({ ...state, FormsSections: [...FormsSections] });
  };

  const addQuestionChoice = (sectionIndex, questionIndex, questionLanguage) => {
    const variableName = FormsSections[sectionIndex].FSQuestions[questionIndex][questionLanguage]?.variable_name;
    if (!FormsSections[sectionIndex].FSQuestions[questionIndex][questionLanguage].FSQAttributes) {
      FormsSections[sectionIndex].FSQuestions[questionIndex][questionLanguage].FSQAttributes = [
        { choice_key: `${variableName}_1`, choice_label: '', choice_value: '' },
      ];
      setState({ ...state, FormsSections: [...FormsSections] });
    }
    if (
      FormsSections[sectionIndex].FSQuestions[questionIndex][questionLanguage].FSQAttributes &&
      FormsSections[sectionIndex].FSQuestions[questionIndex][questionLanguage].FSQAttributes.length < 8
    ) {
      const length = FormsSections[sectionIndex].FSQuestions[questionIndex][questionLanguage].FSQAttributes.length;
      FormsSections[sectionIndex].FSQuestions[questionIndex]['English'].FSQAttributes.push({
        choice_key: `${variableName}_${length + 1}`,
        choice_label: '',
        choice_value: '',
      });
      FormsSections[sectionIndex].FSQuestions[questionIndex]['Spanish'].FSQAttributes.push({
        choice_key: `${variableName}_${length + 1}`,
        choice_label: '',
        choice_value: '',
      });
      setState({ ...state, FormsSections: [...FormsSections] });
    }
  };

  const removeQuestionChoice = (sectionIndex, questionIndex, choiceIndex, questionLanguage) => {
    if (FormsSections[sectionIndex].FSQuestions[questionIndex][questionLanguage].FSQAttributes.length > 0) {
      FormsSections[sectionIndex].FSQuestions[questionIndex]['English'].FSQAttributes.splice(choiceIndex, 1);
      FormsSections[sectionIndex].FSQuestions[questionIndex]['Spanish'].FSQAttributes.splice(choiceIndex, 1);
      setState({ ...state, FormsSections: [...FormsSections] });
    }
  };

  const handleDateTime = (info, statePath, format) => {
    const _name = statePath.split('.');
    let node = state;
    if (_name.length === 8) {
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
      node[_name[0]][_name[1]][_name[2]][_name[3]][_name[4]][_name[5]][_name[6]][_name[7]] = value;

      if (!node[_name[0]][_name[1]][_name[2]][_name[3]][_name[4]][_name[5]].response_type) {
        node[_name[0]][_name[1]][_name[2]][_name[3]][_name[4]][_name[5]][_name[6]].language =
          node[_name[0]][_name[1]][_name[2]][_name[3]][_name[4]].language;
        node[_name[0]][_name[1]][_name[2]][_name[3]][_name[4]][_name[5]][_name[6]].response_type =
          node[_name[0]][_name[1]][_name[2]][_name[3]][_name[4]].response_type;
      }
    }

    setState({ ...node });
  };

  const isValidDate = function (current) {
    const yesterday = moment().subtract(0, 'day');
    return yesterday.isAfter(current);
  };

  const closeChildLinkModal = (sendData) => {
    if (sendData) {
      // console.log(sendData);
      const { linked_variable_name, question_attributes_list, question_attributes_label, sectionIndex, qIndex, language } =
        sendData;
      const parentQIndex = FormsSections[sectionIndex].FSQuestions.findIndex((item) =>
        linked_variable_name?.includes(item[language].variable_name)
      );
      // need to change when multi parent condition
      if (parentQIndex || parentQIndex >= 0) {
        ['English', 'Spanish'].forEach((lang) => {
          const parent = FormsSections[sectionIndex].FSQuestions[parentQIndex][lang];
          const child = FormsSections[sectionIndex].FSQuestions[qIndex][lang];
          FormsSections[sectionIndex].FSQuestions[parentQIndex][lang].child_node = true;
          FormsSections[sectionIndex].FSQuestions[qIndex][lang].linked_variable_name = linked_variable_name;
          FormsSections[sectionIndex].FSQuestions[qIndex][lang].question_attributes_list = question_attributes_list;
          FormsSections[sectionIndex].FSQuestions[qIndex][lang].question_attributes_label = question_attributes_label;
          FormsSections[sectionIndex].FSQuestions[qIndex][lang].linked_level = parent.linked_level + 1;
          if (child.child_node) {
            (function recursive(child) {
              FormsSections[sectionIndex].FSQuestions.map((ch, chIdx) => {
                if (ch[lang]?.linked_variable_name?.includes(child?.variable_name)) {
                  FormsSections[sectionIndex].FSQuestions[chIdx][lang].linked_level = child.linked_level + 1;
                  if (ch[lang].child_node) {
                    recursive(ch[lang]);
                  }
                }
              });
            })(child);
          }
        });

        setState({ ...state, FormsSections: [...FormsSections] });
        setChildLinkModal({ isOpen: false, question: {}, customQuestions: '' });
      }
      return;
    }
    setChildLinkModal({ isOpen: false, question: {}, customQuestions: '' });
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
      (que) => que.English?.variable_name === question?.English?.variable_name
    );

    if (quesIndex > -1) {
      //Removing question
      FormsSections[sectionIndex]?.FSQuestions?.splice(quesIndex, 1);
      setState({ ...state, FormsSections: [...FormsSections] });
      dispatch(selectedRequiredCDEQuestion(question, {}));
      //If question has childrens
      if (question?.English?.child_node == true) {
        // finding the childrens question
        let childrens = FormsSections[sectionIndex]?.FSQuestions.filter((que) =>
          que.English?.linked_variable_name?.includes(question?.English?.variable_name)
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
        // !el[language].linked_variable_name?.length &&
        // el[language].question_type === 'Custom Question' &&
        /**  'Date', 'Time', onhold: v1.8 only */
        ['Multiple Choice', 'Radio Button', 'Dropdown', 'Descriptive', 'DateTime', 'Number'].includes(
          el[language].response_type
        )
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
              ch.English?.linked_variable_name?.includes(que?.variable_name) &&
              !restrictedChoiceTypes.includes(ch.English.variable_name)
            ) {
              restrictedChoiceTypes.push(ch.English.variable_name);
              recursive(ch.English);
            }
          });
        })(question);

        hasChoiceTypes = hasChoiceTypes.filter((ch) => !restrictedChoiceTypes?.includes(ch?.English.variable_name));
      }
      setChildLinkModal({ question, customQuestions: hasChoiceTypes, language, sectionIndex, qIndex, isOpen: true });
      return;
    }
    // }
    setChildLinkModal({ question, isOpen: true });
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
        className={`${'custom-modal'}`}
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
      <div className={`row ${styles.sectionWrapper}`}>
        <DependencyClauseCard
          publishedForms={publishedForms}
          formType={formType}
          setDependencyData={setDependencyData}
          styles={styles}
          showErrors={showErrors}
          formDependencyMapping={state?.FormDependencyMapping}
        />
        {/* {renderDependencyClause()} */}
      </div>
      <div className={`row ${styles.sectionWrapper}`}>
        <FormSettingCard forwordFormSettingsData={setFormSettingsData} styles={styles} data={editData} />
        {/* {renderFormSettings()} */}
      </div>
      <div className={`row ${styles.sectionWrapper}`}>{renderEICF()}</div>

      <div className="sectionContainer">
        {FormsSections.map((item, index) => (
          <div
            className={`${styles.sectionWrapper}`}
            key={index}
            // id={index}
            // draggable={true}
            // onDragOver={(ev) => ev.preventDefault()}
            // onDragStart={handleDrag}
            // onDrop={handleDrop}
          >
            <div className={`${styles.sectionHeader} row`}>
              <div className={`${styles.sectionTitle}`}>Section {index + 1}</div>
              <div className="col-md-6 d-flex align-items-end p-0">
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
                  <div className={`${styles.questionWrapper}`} key={qIndex}>
                    <div className={`row p-0 m-0 d-flex flex-wrap`}>
                      <div className={`col-md-2 ${styles.sectionTitle}`}>Question {qIndex + 1}</div>
                      <div className="col-md-4 d-flex align-items-end p-0">
                        {!!que[que?.language]?.linked_variable_name?.length && (
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
                            name={`FormsSections.${index}.FSQuestions.${qIndex}.${que.language}.question_type`}
                            placeholder="Add Question"
                            onChange={handleChange}
                            value={que[que?.language]?.question_type}
                            className={`${styles.icfDropdownNormal}`}
                            aria-label="Default select question type"
                            disabled={
                              que[que.language]?.question_type === 'CDE Question' ||
                              (que[que.language].cde_id && que[que.language]?.linked_variable_name?.length) ||
                              que.language === 'Spanish'
                            }
                            isInvalid={showErrors && Validation.empty(que[que.language].question_type)}
                            required
                          >
                            <option value="">Select Question Type</option>
                            <option value="CDE Question">CDE Question </option>
                            <option value="Custom Question">Custom Question </option>
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">Question is required field.</Form.Control.Feedback>
                        </Form.Group>
                        {
                          // !que[que?.language]?.child_node &&
                          (que[que?.language]?.linked_variable_name?.length ||
                            (item.FSQuestions.length > 1 &&
                              ['Custom Question', 'CDE Question'].includes(que[que?.language]?.question_type))) && (
                            <img
                              src={'/images/child-links.svg'}
                              data-toggle="tooltip"
                              title="Child Question link"
                              height={36}
                              className="cursor-pointer mx-2"
                              onClick={() => openChildQuestionLinkModal(que[que?.language], index, qIndex)}
                            />
                          )
                        }
                        {item.FSQuestions.length > 0 &&
                          !(
                            que[que?.language]?.linked_variable_name?.length &&
                            que[que?.language]?.question_type === 'CDE Question'
                          ) && (
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
                      <div className="col-md-5 d-flex justify-content-end align-items-md-end ms-5">
                        <div>
                          <button
                            className={`btn mx-1 ${que.language === 'English' ? 'btn-primary' : 'btn-gray'}`}
                            onClick={() => changeLanguage('English', index, qIndex)}
                          >
                            English
                          </button>
                          <button
                            className={`btn mx-1 ${que.language === 'Spanish' ? 'btn-primary' : 'btn-gray'}`}
                            onClick={() => changeLanguage('Spanish', index, qIndex)}
                          >
                            Spanish
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* question type inputs CDE Question */}
                    {que[que.language].question_type === 'CDE Question' && (
                      <CDEQuestionComponent
                        styles={styles}
                        handleChange={handleChange}
                        index={index}
                        qIndex={qIndex}
                        que={que}
                        showErrors={showErrors}
                        CDEList={CDEList}
                        language={que.language}
                      />
                    )}

                    {/* question type inputs Custom */}
                    {que[que.language].question_type === 'Custom Question' && (
                      <div className="d-flex flex-column">
                        <Form.Group className="col me-5 mt-2" controlId="sectionQuestion">
                          <Form.Control
                            type="text"
                            name={`FormsSections.${index}.FSQuestions.${qIndex}.${que.language}.question`}
                            placeholder="Question"
                            onChange={handleChange}
                            value={que[que.language].question}
                            maxLength="150"
                            isInvalid={showErrors && Validation.empty(que[que.language].question)}
                            required
                          />
                          <Form.Control.Feedback type="invalid">Question is required field.</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="col me-5 mt-2" controlId="sectionHint">
                          <Form.Control
                            type="text"
                            name={`FormsSections.${index}.FSQuestions.${qIndex}.${que.language}.hint`}
                            placeholder="Hint"
                            onChange={handleChange}
                            value={que[que.language].hint}
                            maxLength="150"
                            // isInvalid={showErrors && Validation.empty(que[que.language].hint)}
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
                                name={`FormsSections.${index}.FSQuestions.${qIndex}.${que.language}.variable_name`}
                                placeholder=""
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={que[que.language].variable_name}
                                maxLength="50"
                                disabled={que.language === 'Spanish'}
                                isInvalid={
                                  (showErrors && Validation.empty(que[que.language].variable_name)) ||
                                  que[que.language].hasError
                                }
                                required
                              />
                              <Form.Control.Feedback type="invalid">
                                {que[que.language].hasError
                                  ? 'Variable name is already used!'
                                  : 'Variable name is required field.'}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </div>
                          <div className={`${styles.defaultText} d-flex align-items-center`}>
                            <div className="pe-2">Response Type: </div>
                            <Form.Group className="col" controlId="selectQuestion">
                              <Form.Select
                                type="text"
                                name={`FormsSections.${index}.FSQuestions.${qIndex}.${que.language}.response_type`}
                                placeholder="Add Question"
                                onChange={handleChange}
                                value={que[que.language].response_type}
                                className={`${styles.icfDropdownNormal}`}
                                aria-label="Default select question type"
                                isInvalid={showErrors && Validation.empty(que[que.language].response_type)}
                                disabled={que.language === 'Spanish'}
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
                              <Form.Control.Feedback type="invalid">Response type is required field.</Form.Control.Feedback>
                            </Form.Group>
                          </div>
                        </div>

                        {/* FSQAttributes and responses choice type */}
                        <>
                          {que[que.language].response_type &&
                            ['Multiple Choice', 'Radio Button', 'Dropdown'].includes(que[que.language].response_type) && (
                              <div className="d-flex flex-column ps-3">
                                <div className={`d-flex justify-content-end mt-1 me-5 data-table`}>
                                  <div className="form-check">
                                    <input
                                      className="form-check-input"
                                      name={`FormsSections.${index}.FSQuestions.${qIndex}.${que.language}.FSQAttributes.0.not_to_ans`}
                                      checked={que[que.language].FSQAttributes[0]?.not_to_ans}
                                      onChange={handleChange}
                                      disabled={que.language === 'Spanish'}
                                      type="checkbox"
                                      value=""
                                      id="flexCheckDefault"
                                    />
                                  </div>
                                  <div className={`${styles.defaultText}`}>Include prefer not to answer</div>
                                </div>
                                {que[que.language].FSQAttributes && que[que.language].FSQAttributes.length > 0 && (
                                  <div className="row p-0">
                                    <div className={`col-md-12 me-5 ms-1 ${styles.cdeOptionsTable}`}>
                                      <table>
                                        <tr>
                                          <th>Sl.No</th>
                                          <th>Choices</th>
                                          <th>Values</th>
                                          <th></th>
                                        </tr>
                                        {que[que.language].FSQAttributes.map((chItem, chIndex) => (
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
                                                  name={`FormsSections.${index}.FSQuestions.${qIndex}.${que.language}.FSQAttributes.${chIndex}.choice_label`}
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
                                                  name={`FormsSections.${index}.FSQuestions.${qIndex}.${que.language}.FSQAttributes.${chIndex}.choice_value`}
                                                  placeholder=""
                                                  onChange={handleChange}
                                                  value={chItem.choice_value}
                                                  disabled={que.language === 'Spanish'}
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
                                              <img
                                                className={`${styles.addTextIcon} ${
                                                  que[que.language].child_node ? 'cursor-not-allowed' : 'cursor-pointer'
                                                } me-2`}
                                                onClick={() =>
                                                  que.language !== 'Spanish' &&
                                                  !que[que.language].child_node &&
                                                  removeQuestionChoice(index, qIndex, chIndex, que.language)
                                                }
                                                src={'/images/cross-icon.svg'}
                                                data-toggle="tooltip"
                                                title={
                                                  que[que.language].child_node
                                                    ? 'Cannot delete Child linked choice'
                                                    : 'Delete Choice'
                                                }
                                              ></img>
                                            </td>
                                          </tr>
                                        ))}
                                      </table>
                                    </div>
                                  </div>
                                )}
                                <div className="d-flex mt-2">
                                  {(!que[que.language].FSQAttributes ||
                                    (que[que.language].FSQAttributes && que[que.language].FSQAttributes.length < 9)) && (
                                    <button
                                      disabled={que.language === 'Spanish'}
                                      className="btn btn-secondary mx-1"
                                      onClick={() => addQuestionChoice(index, qIndex, que.language)}
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
                          {que[que.language].response_type && que[que.language].response_type === 'Text Box' && (
                            <div className="d-flex flex-row ps-3">
                              <div className="d-flex flex-column">
                                <div className={`${styles.defaultText} d-flex align-items-center pe-2`}>
                                  <div className="pe-2"> Minimum Character limit </div>
                                  <Form.Group className={`colx me-5 my-2 ${styles.choiceValueInput}`} controlId="minChar">
                                    <Form.Control
                                      type="number"
                                      name={`FormsSections.${index}.FSQuestions.${qIndex}.${que.language}.FSQAttributes.0.text_min_char`}
                                      placeholder=""
                                      onChange={(e) => e?.target?.value <= 999 && handleChange(e)}
                                      value={que[que.language].FSQAttributes[0]?.text_min_char}
                                      onKeyDown={(e) => e.key == 'e' && e.preventDefault()}
                                      // isInvalid={
                                      //   showErrors && Validation.empty(que[que.language].FSQAttributes[0].text_min_char)
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
                                      name={`FormsSections.${index}.FSQuestions.${qIndex}.${que.language}.FSQAttributes.0.text_max_char`}
                                      placeholder=""
                                      // onChange={handleChange}
                                      onChange={(e) => e?.target?.value <= 1024 && handleChange(e)}
                                      value={que[que.language].FSQAttributes[0].text_max_char}
                                      // isInvalid={
                                      //   showErrors && Validation.empty(que[que.language].FSQAttributes[0].text_max_char)
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
                                    disabled={que.language === 'Spanish'}
                                    name={`FormsSections.${index}.FSQuestions.${qIndex}.${que.language}.FSQAttributes.0.not_to_ans`}
                                    checked={que[que.language].FSQAttributes[0]?.not_to_ans}
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
                          {que[que.language].response_type && que[que.language].response_type === 'Number' && (
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
                                      name={`FormsSections.${index}.FSQuestions.${qIndex}.${que.language}.FSQAttributes.0.num_min_value`}
                                      placeholder=""
                                      onChange={handleChange}
                                      value={que[que.language].FSQAttributes[0].num_min_value}
                                      // isInvalid={
                                      //   showErrors && Validation.empty(que[que.language].FSQAttributes[0].num_min_value)
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
                                      name={`FormsSections.${index}.FSQuestions.${qIndex}.${que.language}.FSQAttributes.0.num_max_value`}
                                      placeholder=""
                                      // onChange={handleChange}
                                      onChange={(e) => e?.target?.value <= 999999 && handleChange(e)}
                                      value={que[que.language].FSQAttributes[0].num_max_value}
                                      // isInvalid={
                                      //   showErrors && Validation.empty(que[que.language].FSQAttributes[0].num_max_value)
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
                                      name={`FormsSections.${index}.FSQuestions.${qIndex}.${que.language}.FSQAttributes.0.num_flot_max`}
                                      placeholder=""
                                      // onChange={handleChange}
                                      onChange={(e) => e?.target?.value <= 3 && handleChange(e)}
                                      value={que[que.language].FSQAttributes[0].num_flot_max}
                                      // isInvalid={
                                      //   showErrors && Validation.empty(que[que.language].FSQAttributes[0].num_flot_max)
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
                                    disabled={que.language === 'Spanish'}
                                    name={`FormsSections.${index}.FSQuestions.${qIndex}.${que.language}.FSQAttributes.0.not_to_ans`}
                                    checked={que[que.language].FSQAttributes[0]?.not_to_ans}
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
                          {que[que.language].response_type === 'Descriptive' && (
                            <div className="d-flex flex-row mt-2 mb-2 align-items-center"></div>
                          )}
                        </>

                        {/* responses 'DateTime' > min_datetime, max_datetime, Date: min_date, max_date, Time: min_time,max_time */}
                        <>
                          {que[que.language].response_type &&
                            ['Date', 'DateTime', 'Time'].includes(que[que.language].response_type) && (
                              <div className="d-flex row p-0 mt-3 ps-3">
                                <div className="col-md-6 d-flex flex-column">
                                  <div className={`${styles.defaultText}`}>
                                    Set Acceptable {que[que.language].response_type} Range
                                  </div>
                                </div>

                                <div className={`col-md-4 d-flex mt-1 ms-4 data-table`}>
                                  {que[que.language].response_type !== 'Time' && (
                                    <>
                                      <div className="form-check">
                                        <input
                                          className="form-check-input"
                                          disabled={que.language === 'Spanish'}
                                          name={`FormsSections.${index}.FSQuestions.${qIndex}.${que.language}.FSQAttributes.0.max_current_datetime`}
                                          checked={que[que.language].FSQAttributes[0]?.max_current_datetime}
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
                                  {que[que.language].response_type === 'Date' && (
                                    <div className="d-flex flex-row mt-2 mb-2 align-items-center">
                                      <div
                                        className={`${styles.dateTimeIcon}`}
                                        id={`datetimepicker${que[que.language].response_type}${index}${qIndex}from`}
                                      >
                                        <Datetime
                                          dateFormat="MM/DD/YYYY"
                                          className={`${styles.defaultDateTimeText}`}
                                          inputProps={{
                                            disabled: que[que.language]?.FSQAttributes[0].max_current_datetime,
                                            onChange: (e) => {
                                              return false;
                                            },
                                          }}
                                          isValidDate={isValidDate}
                                          initialValue={
                                            que[que.language]?.FSQAttributes[0].min_date
                                              ? moment(que[que.language].FSQAttributes[0].min_date)
                                              : ''
                                          }
                                          onChange={(ev) =>
                                            handleDateTime(
                                              ev,
                                              `FormsSections.${index}.FSQuestions.${qIndex}.${que.language}.FSQAttributes.0.min_date`,
                                              'toDate'
                                            )
                                          }
                                          timeFormat={false}
                                        />
                                        <img
                                          src={'/images/calendar-icon.svg'}
                                          className={`${styles.dateTimeIconImage}`}
                                          onClick={() =>
                                            openDatepicker(`${que[que.language].response_type}${index}${qIndex}from`)
                                          }
                                        ></img>
                                      </div>
                                      <div className={`${styles.defaultText} px-3`}>To</div>
                                      <div
                                        className={`${styles.dateTimeIcon}`}
                                        id={`datetimepicker${que[que.language].response_type}${index}${qIndex}to`}
                                      >
                                        <Datetime
                                          dateFormat="MM/DD/YYYY"
                                          timeFormat={false}
                                          inputProps={{
                                            disabled: que[que.language]?.FSQAttributes[0].max_current_datetime,
                                            onChange: (e) => {
                                              return false;
                                            },
                                          }}
                                          className={`${styles.defaultDateTimeText}`}
                                          isValidDate={isValidDate}
                                          initialValue={
                                            que[que.language]?.FSQAttributes[0].max_date
                                              ? moment(que[que.language]?.FSQAttributes[0].max_date)
                                              : ''
                                          }
                                          onChange={(ev) =>
                                            handleDateTime(
                                              ev,
                                              `FormsSections.${index}.FSQuestions.${qIndex}.${que.language}.FSQAttributes.0.max_date`,
                                              'toDate'
                                            )
                                          }
                                        />
                                        <img
                                          src={'/images/calendar-icon.svg'}
                                          className={`${styles.dateTimeIconImage}`}
                                          onClick={() =>
                                            openDatepicker(`${que[que.language].response_type}${index}${qIndex}to`)
                                          }
                                        ></img>
                                      </div>
                                    </div>
                                  )}
                                  {que[que.language].response_type === 'DateTime' && (
                                    <div className="d-flex flex-row mt-2 mb-2 align-items-center">
                                      <div
                                        className={`${styles.dateTimeIcon}`}
                                        id={`datetimepicker${que[que.language].response_type}${index}${qIndex}from`}
                                      >
                                        <Datetime
                                          dateFormat="MM/DD/YYYY;"
                                          timeFormat="HH:mm"
                                          className={`${styles.defaultDateTimeText}`}
                                          inputProps={{
                                            disabled: que[que.language]?.FSQAttributes[0].max_current_datetime,
                                            onChange: (e) => {
                                              return false;
                                            },
                                          }}
                                          isValidDate={isValidDate}
                                          initialValue={
                                            que[que.language]?.FSQAttributes[0].min_datetime
                                              ? moment(que[que.language]?.FSQAttributes[0].min_datetime)
                                              : ''
                                          }
                                          onChange={(ev) =>
                                            handleDateTime(
                                              ev,
                                              `FormsSections.${index}.FSQuestions.${qIndex}.${que.language}.FSQAttributes.0.min_datetime`,
                                              'toISOString'
                                            )
                                          }
                                        />
                                        <img
                                          src={'/images/calendar-icon.svg'}
                                          className={`${styles.dateTimeIconImage}`}
                                          onClick={() =>
                                            openDatepicker(`${que[que.language].response_type}${index}${qIndex}from`)
                                          }
                                        ></img>
                                      </div>
                                      <div className={`${styles.defaultText} px-3`}>To</div>
                                      <div
                                        className={`${styles.dateTimeIcon}`}
                                        id={`datetimepicker${que[que.language].response_type}${index}${qIndex}to`}
                                      >
                                        <Datetime
                                          dateFormat="MM/DD/YYYY;"
                                          timeFormat="HH:mm"
                                          inputProps={{
                                            disabled: que[que.language]?.FSQAttributes[0].max_current_datetime,
                                            onChange: (e) => {
                                              return false;
                                            },
                                          }}
                                          className={`${styles.defaultDateTimeText}`}
                                          isValidDate={isValidDate}
                                          initialValue={
                                            que[que.language]?.FSQAttributes[0].max_datetime
                                              ? moment(que[que.language]?.FSQAttributes[0].max_datetime)
                                              : ''
                                          }
                                          onChange={(ev) =>
                                            handleDateTime(
                                              ev,
                                              `FormsSections.${index}.FSQuestions.${qIndex}.${que.language}.FSQAttributes.0.max_datetime`,
                                              'toISOString'
                                            )
                                          }
                                        />
                                        <img
                                          src={'/images/calendar-icon.svg'}
                                          className={`${styles.dateTimeIconImage}`}
                                          onClick={() =>
                                            openDatepicker(`${que[que.language].response_type}${index}${qIndex}to`)
                                          }
                                        ></img>
                                      </div>
                                    </div>
                                  )}
                                  {que[que.language].response_type === 'Time' && (
                                    <div className="d-flex flex-row mt-2 mb-2 align-items-center">
                                      <div
                                        className={`${styles.dateTimeIcon}`}
                                        id={`datetimepicker${que[que.language].response_type}${index}${qIndex}from`}
                                      >
                                        <Datetime
                                          dateFormat={false}
                                          timeFormat="HH:mm"
                                          className={`${styles.defaultDateTimeText}`}
                                          inputProps={{
                                            disabled: que[que.language]?.FSQAttributes[0].max_current_datetime,
                                            onChange: (e) => {
                                              return false;
                                            },
                                          }}
                                          initialValue={
                                            que[que.language]?.FSQAttributes[0]?.min_time
                                              ? moment(que[que.language]?.FSQAttributes[0]?.min_time, 'HH:mm:ss')
                                              : ''
                                          }
                                          onChange={(ev) =>
                                            handleDateTime(
                                              ev,
                                              `FormsSections.${index}.FSQuestions.${qIndex}.${que.language}.FSQAttributes.0.min_time`,
                                              'toTime'
                                            )
                                          }
                                        />
                                        <img
                                          src={'/images/clock-icon.svg'}
                                          onClick={() =>
                                            openDatepicker(`${que[que.language].response_type}${index}${qIndex}from`)
                                          }
                                          className={`${styles.dateTimeIconImage}`}
                                        ></img>
                                      </div>
                                      <div className={`${styles.defaultText} px-3`}>To </div>
                                      <div
                                        className={`${styles.dateTimeIcon}`}
                                        id={`datetimepicker${que[que.language].response_type}${index}${qIndex}to`}
                                      >
                                        <Datetime
                                          dateFormat={false}
                                          timeFormat="HH:mm"
                                          className={`${styles.defaultDateTimeText}`}
                                          inputProps={{
                                            disabled: que[que.language]?.FSQAttributes[0].max_current_datetime,
                                            onChange: (e) => {
                                              return false;
                                            },
                                          }}
                                          initialValue={
                                            que[que.language]?.FSQAttributes[0]?.max_time
                                              ? moment(que[que.language]?.FSQAttributes[0]?.max_time, 'HH:mm')
                                              : ''
                                          }
                                          onChange={(ev) =>
                                            handleDateTime(
                                              ev,
                                              `FormsSections.${index}.FSQuestions.${qIndex}.${que.language}.FSQAttributes.0.max_time`,
                                              'toTime'
                                            )
                                          }
                                        />
                                        <img
                                          src={'/images/clock-icon.svg'}
                                          onClick={() =>
                                            openDatepicker(`${que[que.language].response_type}${index}${qIndex}to`)
                                          }
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
                                      disabled={que.language === 'Spanish'}
                                      name={`FormsSections.${index}.FSQuestions.${qIndex}.${que.language}.FSQAttributes.0.not_to_ans`}
                                      checked={que[que.language].FSQAttributes[0]?.not_to_ans}
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
