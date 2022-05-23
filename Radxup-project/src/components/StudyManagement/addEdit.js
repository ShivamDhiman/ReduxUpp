import styles from '../../stylesheets/Study.module.scss';
import { Button, Spinner } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import StudyDetails from './StudyDetails';
import CDEtoCollect from './CDEtoCollect';
import CDEtoShare from './CDEtoShare';
import StudyAdminDetails from './StudyAdminDetails';
import Documents from './Documents';
import { useRouter } from 'next/router';
import StudyView from './StudyView';
import { setCDEQuestions } from '../../store/actions/CDEQuestions';
import { clearStudyDetails, fetchDocumentsByStudy, getStudyDetails } from '../../store/actions/studyManagement';
import { useDispatch, useSelector } from 'react-redux';
import { defaultDocs } from '../../constants/constant';
import { decodeData, encodeData } from '../../helpers/auth';
import API from '../../helpers/api';
import { handleErrorMessage, isArrayEqual } from '../../utils/commonFunctions';
import { toast } from 'react-toastify';
import ConfirmationModal from '../common/confirmationModal';
import { WithAuth } from '../common/WithAuth';
import * as _ from 'lodash';
function AddEdit(props) {
  const dispatch = useDispatch();
  const { page, studyId } = props;
  const isViewMode = page === 'view' && !!studyId;
  const isAddEditMode = ['edit', 'add'].includes(page);
  const [formSection, setFormSection] = useState(1);
  const [isLoading, setLoading] = useState(false);
  const router = useRouter();
  const [ShowModal, setShowModal] = useState(false);
  const [payloadData, setPayloadData] = useState({});
  const [loadingForModal, setLoadingForModal] = useState(false);

  const [CDEListLoading, masterCDEQuestiosnList, masterCDEList, CDElibrary] = useSelector((Gstate) => [
    Gstate.CDEList?.loading,
    Gstate.CDEList?.masterCDEQuestiosnList,
    Gstate.CDEList?.masterCDEList,
    Gstate?.CDEList?.CDElibrary,
  ]);

  const [collectedCDES, setCollectedCDES] = useState([]);
  const [studyAdmin, setStudyAdmin] = useState([]);
  const [studyDocuments, setStudyDocuments] = useState([]);
  const [study, setStudy] = useState({});
  const [studyInfo, loading] = useSelector((GState) => [
    GState.studyManagement?.studyDetails,
    GState.studyManagement?.loading,
  ]);
  const isUpdateAllowed = study?.status === 'Onboarding' || !study.id;

  let search = router.query.search;
  let decoded = decodeData(search);
  useEffect(() => {
    dispatch(setCDEQuestions());

    return () => {
      setStudy({});
      setCollectedCDES([]);
      setStudyAdmin([]);
      setStudyDocuments([]);
      dispatch(clearStudyDetails());
    };
  }, []);

  useEffect(() => {
    let lib = _.cloneDeep(CDElibrary);
    let collectedCDESQuestions = _.cloneDeep(collectedCDES);
    let maCDEList = lib?.map((section, sidx) => {
      let foundSelectedSec = collectedCDESQuestions.find((sec) => sec?.id == section.id);

      if (foundSelectedSec) {
        //If all question aelected from section then mark section checked
        let isSectionChecked = foundSelectedSec.CDEQuestions.every((q) => q.checked);
        let isSectionSelected = foundSelectedSec.CDEQuestions.some((q) => q.checked);
        section.checked = isSectionChecked;
        section.selected = isSectionSelected;
      }
      section.expand = true;
      let uniqueVariables = [...new Set([...section?.CDEQuestions.map((q) => q?.variable_name)])];
      let uniqueSectionQuestions = [];
      uniqueVariables?.forEach((variable) => {
        //finding question in library
        let foundQue = section?.CDEQuestions?.find((que) => que?.variable_name == variable);
        // Finding question in Collected CDEs
        let foundSelected = collectedCDESQuestions[sidx]?.CDEQuestions?.find((que) => que?.variable_name == variable);

        if (foundQue) {
          let englishQuestions = section?.CDEQuestions.filter(
            (que) => que?.language === 'English' && foundQue?.variable_name == que?.variable_name
          );
          let spanishQuestions = section.CDEQuestions.filter(
            (que) => que?.language === 'Spanish' && foundQue?.variable_name == que?.variable_name
          );

          let englistAdult = englishQuestions.find(
            (que) => que?.category === 'Adult' && foundQue?.variable_name == que?.variable_name
          );
          let englistPeadiatric = englishQuestions.find(
            (que) => que?.category === 'Pediatric' && foundQue?.variable_name == que?.variable_name
          );
          let spanishAdult = spanishQuestions.find(
            (que) => que?.category === 'Adult' && foundQue?.variable_name == que?.variable_name
          );
          let spanishPeadiatric = spanishQuestions.find(
            (que) => que?.category === 'Pediatric' && foundQue?.variable_name == que?.variable_name
          );
          let queData = {
            English: {
              Adult: englistAdult,
              Peadiatric: englistPeadiatric,
              question_type: 'CDE Question',
              cde_id: englistAdult?.id,
            },
            Spanish: {
              Adult: spanishAdult,
              Peadiatric: spanishPeadiatric,
              question_type: 'CDE Question',
              cde_id: englistAdult?.id,
            },
            cde_id: englistAdult?.cde_id || englistAdult?.id,
            cde_idEnglish: englistAdult?.id,
            cde_idSpanish: spanishAdult?.id,
            required: !englistAdult?.required,
            study_mapped: !englistAdult?.study_mapped,
            shared_question: !!foundSelected?.shared_question,
            checked: !!foundSelected?.checked,
            variable_name: variable,
            linked_variable_name: englistAdult?.linked_variable_name,
            labelEnglish: englistAdult?.question,
            labelSpanish: spanishAdult?.question,
            question_attributes_label: englistAdult?.question_attributes_label,
            study_id: study?.study_id,
          };

          uniqueSectionQuestions.push(queData);
        }
      });
      section.study_id = study?.study_id;
      section.CDEQuestions = uniqueSectionQuestions;
      return section;
    });
    maCDEList.map((mSec, idx) => {
      mSec.CDEQuestions.map((cdeQ, cIdx) => {
        let arr = rec(cdeQ);
        if (arr.length) {
          arr.forEach((q) => {
            let index = mSec.CDEQuestions.findIndex((cQ) => cQ.variable_name == q.variable_name);
            if (index !== -1) {
              if (!maCDEList[idx].CDEQuestions[index].checked) {
                maCDEList[idx].CDEQuestions[index].checked = cdeQ.checked;
              }
              if (!maCDEList[idx].CDEQuestions[index].shared_question) {
                maCDEList[idx].CDEQuestions[index].shared_question = cdeQ.shared_question;
              }
            }
          });
        }
      });

      function rec(question) {
        let childQuestions = [];
        (function recursive(que) {
          mSec.CDEQuestions.map((ch) => {
            if (ch?.linked_variable_name?.includes(que?.variable_name)) {
              childQuestions.push(ch);
              recursive(ch);
            }
          });
        })(question);
        return childQuestions;
      }
    });

    setCollectedCDES(maCDEList);
  }, [CDElibrary?.length]);

  let steps = [1, 2, 3, 4, 5];
  const stepData = [
    { label: 'Study Details', isOptional: false },
    { label: "CDE's to collect", isOptional: false },
    { label: "CDE's to share", isOptional: false },
    { label: 'Study Admin Details', isOptional: true },
    { label: 'Documents', isOptional: true },
  ];

  const getDocuments = async (id) => {
    try {
      let data = await dispatch(fetchDocumentsByStudy(id));
      if (data?.length) {
        setStudyDocuments(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (decoded && decoded.id) {
      let id = decoded.id?.toString();
      dispatch(getStudyDetails(id));
      getDocuments(id);
    }
  }, []);

  useEffect(() => {
    setStudy(studyInfo);
    if (decoded && decoded.id) {
      if (studyInfo && studyInfo?.cdeList?.length && collectedCDES?.length) {
        setEditData();
      }
    }
  }, [studyInfo, collectedCDES?.length]);

  const setEditData = () => {
    let collected = collectedCDES.map((section) => {
      studyInfo.cdeList.forEach((studySection) => {
        if (section.name === studySection.name) {
          return section.CDEQuestions.map((que) => {
            let found = studySection.StudyCDEQuestions.find((stduyQue) => stduyQue.variable_name == que.variable_name);
            if (found) {
              que.checked = true;
              que.shared_question = found.shared_question;
              section.selected = true;
              // que = { ...que, ...found };
              // section = { ...section, ...studySection };
            }
            return que;
          });
        }
      });
      return section;
    });
    setCollectedCDES(collected);
    let studyAdmins = [];
    studyInfo.admins.forEach((admin) => {
      studyAdmins.push({ ...admin, netId: admin.personal_email });
    });
    setStudyAdmin(studyAdmins);
  };

  const cancel = () => {
    dispatch(clearStudyDetails());
    router.push('/study-management');
  };

  const setCollectedCDes = (sections) => {
    setCollectedCDES(sections);
    setFormSection(formSection + 1);
  };

  const setStudyData = (studyData) => {
    setStudy(studyData);
    setFormSection(formSection + 1);
  };

  const setStudyAdminData = (studyAdminData) => {
    setStudyAdmin(studyAdminData);
    setFormSection(formSection + 1);
  };

  const generateDocsPromices = (docsData, study_id) => {
    let docsPromices = [];
    docsData.forEach((docType) => {
      docType.document.forEach((doc) => {
        let formData = new FormData();
        let file = doc.file;
        formData.append('document', file);
        formData.append('study_id', study_id);
        formData.append('document_type', docType.document_type);
        formData.append('status', doc.status);
        docsPromices.push(API.apiPost('uploadStudyDocument', formData));
      });
    });
    return docsPromices;
  };

  const finilizeStudy = async (docsData) => {
    let ignoreAdminUpdate = isArrayEqual(
      studyAdmin?.map((admin) => admin.netId),
      studyInfo?.admins?.map((admin) => admin.personal_email)
    );
    const users = studyAdmin.map((admin) => admin.netId);
    setStudyDocuments([...docsData]);
    setLoading(true);
    try {
      if (page === 'edit') {
        if (isUpdateAllowed) {
          const payload = {
            name: study?.name,
            description: study?.description,
            study_id: study?.study_id,
            id: studyInfo?.id,
            awardee_org: study?.awardee_org,
            status: study?.status,
            arms: study?.arms,
          };
          const encodePayload = encodeData(payload);
          await API.apiPut('updateStudy', { payload: encodePayload });
        }
        const CDEs = getQuestions(studyInfo?.id);
        if (!ignoreAdminUpdate) {
          await API.apiPost(`addStudyAmins`, {
            payload: encodeData({ users: users, id: studyInfo?.id }),
          });
        }
        let docsPromices = generateDocsPromices(docsData, studyInfo?.id);
        await Promise.all([...docsPromices]);

        createOrUpdateCDE(CDEs, true);
      } else {
        const encodePayload = encodeData(study);
        let studyResponse = await API.apiPost('addStudy', { payload: encodePayload }).then((response) => response.data);
        const CDEs = getQuestions(studyResponse?.study_id);
        let docsPromices = [];
        docsData.forEach((docType) => {
          docType.document.forEach((doc) => {
            let formData = new FormData();
            let file = doc.file;
            formData.append('document', file);
            formData.append('study_id', studyResponse?.study_id);
            formData.append('document_type', docType.document_type);
            formData.append('status', doc.status);
            docsPromices.push(API.apiPost('uploadStudyDocument', formData));
          });
        });
        Promise.all([
          API.apiPost('studyCDEs', { payload: CDEs }),
          API.apiPost(`addStudyAmins`, {
            payload: encodeData({ users: users, id: studyResponse?.study_id }),
          }),
          ...docsPromices,
        ]).then(([response1, response2]) => {
          if (response1.data && response1.data.success === true) {
            setLoading(false);
            // setShowErrors(false);
            toast.success('Study successfully created ');
            router.push('/study-management');
          }
        });
        // createOrUpdateCDE(CDEs);
      }
    } catch (err) {
      setLoading(false);
      handleErrorMessage(err);
    }
    // createStudy();
    // createOrUpdateCDE();
  };

  const createOrUpdateCDE = (CDEs, isUpdate) => {
    if (!CDEs.length) {
      return;
    }
    API.apiPost('studyCDEs', { payload: CDEs })
      .then((response) => {
        if (response.data && response.data.success === true) {
          setLoading(false);
          // setShowErrors(false);
          toast.success(isUpdate ? 'Study successfully updated ' : 'Study successfully created ');
          router.push('/study-management');
        }
      })
      .catch((err) => {
        console.log('err', err);
        setLoading(false);
      });
  };

  const getQuestions = (study_id) => {
    let selectedData = _.cloneDeep(collectedCDES);
    let masterCdeClone = _.cloneDeep(masterCDEQuestiosnList);
    let sections = [];
    selectedData.forEach((section) => {
      if (section.selected) {
        masterCdeClone.forEach((mSection) => {
          if (section.name === mSection.name) {
            let selectedQuestions = [];
            section.study_id = study_id;
            section?.CDEQuestions.forEach((question) => {
              if (question.checked) {
                let matched = mSection.CDEQuestions.filter((que) => que.variable_name === question.variable_name);
                matched.shared_question = question.shared_question;
                if (question.shared_question) {
                  matched.map((mappedQ) => {
                    mappedQ.shared_question = question.shared_question;
                  });
                }
                selectedQuestions.push(...matched);
              }
            });
            sections.push({ ...section, CDEQuestions: [...selectedQuestions] });
          }
        });
      }
    });
    return sections;
  };
  const confirmAction = (id) => {
    const text = page && page === 'edit' ? 'edit' : 'add';
    let actionType = 'Cancel';
    setPayloadData({
      actionType,
      text,
      id,
    });
    setShowModal(true);
  };
  const onHandleCloseAction = (data) => {
    if (data.actionType === 'Cancel' && data.text === 'add') {
      cancel();
    }
    if (data.actionType === 'Cancel' && data.text === 'edit') {
      const { id } = data;
      let encryptedPayload = encodeData({ id });
      router.push({
        pathname: '/study-management/view',
        query: { search: encryptedPayload },
      });
    }
    setShowModal(false);
  };

  return (
    <>
      {ShowModal && (
        <ConfirmationModal open={ShowModal} handleClose={onHandleCloseAction} data={payloadData} loading={loadingForModal} />
      )}
      {isAddEditMode && <div className={`mb-1 ${styles.mainHeading}`}>{page === 'edit' ? 'Edit Study' : 'Add Study'}</div>}
      {isAddEditMode && (
        <div className="stepper">
          <div className={`d-flex ${styles.stepper}`}>
            {steps.map((step, index) => (
              <div
                key={index}
                className={`${step !== 5 ? 'flex-grow-1' : ''} d-flex align-items-center position-relative ${
                  styles.stepperDeck
                }`}
              >
                {step === 1 && (
                  <div className={`col-md-3x ${styles.sqaueDesign} ${!formSection && styles.sqaueDesignInActive}`}>
                    {page === 'edit' && loading && (
                      <Spinner as="span" animation="border" size="md" role="status" aria-hidden="true" className="m-1" />
                    )}
                  </div>
                )}
                {step !== 1 && (
                  <div
                    className={`col-md-3x ${styles.sqaueDesign} ${!(formSection >= step) && styles.sqaueDesignInActive}`}
                  ></div>
                )}

                {step !== 5 && (
                  <div className={`flex-grow-1 ${styles.line} ${formSection >= step + 1 && styles.lineInActive}`}></div>
                )}
                <span className={`position-absolute ${styles.CardNumber}`}>{step}</span>
                <div
                  className={`col-md-2x fw-bold text-nowrap position-absolute ms-1 text-center
               ${styles.sectionHeading} ${!formSection >= step && styles.sectionHeadingInActive}`}
                >
                  <div>{stepData[index].label}</div>
                  {stepData[index].isOptional && <div>(Optional)</div>}
                </div>
              </div>
            ))}
          </div>
          <div className="row mt-5">
            {formSection === 1 && (
              <StudyDetails
                cancel={confirmAction}
                previous={() => setFormSection(formSection - 1)}
                next={setStudyData}
                styles={styles}
                study={study}
              />
            )}
            {formSection === 2 && (
              <CDEtoCollect
                previous={() => setFormSection(formSection - 1)}
                cancel={confirmAction}
                next={setCollectedCDes}
                collectedCDES={collectedCDES}
                styles={styles}
                study={study}
              />
            )}
            {formSection === 3 && (
              <CDEtoShare
                cancel={confirmAction}
                previous={() => setFormSection(formSection - 1)}
                collectedCDES={collectedCDES}
                next={setCollectedCDes}
                styles={styles}
                study={study}
              />
            )}
            {formSection === 4 && (
              <StudyAdminDetails
                cancel={confirmAction}
                previous={() => setFormSection(formSection - 1)}
                next={setStudyAdminData}
                styles={styles}
                study={study}
                admins={studyAdmin}
              />
            )}
            {formSection === 5 && (
              <Documents
                cancel={confirmAction}
                previous={() => setFormSection(formSection - 1)}
                next={finilizeStudy}
                styles={styles}
                study={study}
                documents={studyDocuments}
                isLoading={isLoading}
                pageType={page}
              />
            )}
          </div>
        </div>
      )}
      {isViewMode && (
        <StudyView study={study} documents={studyDocuments} collectedCDES={collectedCDES} styles={styles} cancel={cancel} />
      )}
    </>
  );
}

export default WithAuth(AddEdit);
