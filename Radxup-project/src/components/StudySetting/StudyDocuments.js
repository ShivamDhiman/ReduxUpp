import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { fetchDocumentsByStudy, uploadStudyDocument } from '../../store/actions/studyManagement';
import { WithAuth } from '../common/WithAuth';
import styles from '../../stylesheets/Forms.module.scss';
import { isAuth } from '../../helpers/auth';
import Router from 'next/router';
import { defaultDocs } from '../../constants/constant';
import { toast } from 'react-toastify';
import { toTitleCase } from '../../utils/commonFunctions';

const StudyDocuments = () => {
  const dispatch = useDispatch();
  const [documents, setDocuments] = useState(defaultDocs);
  const user = isAuth();
  const inputRef = documents.map(() => useRef());
  const isStudyUpload = process.browser && Router.router?.route?.includes('study-setting');

  useEffect(() => {
    getDocuments();
  }, []);

  const getDocuments = async () => {
    try {
      let data = await dispatch(fetchDocumentsByStudy(user.study_id));
      if (data?.length) {
        setDocuments(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleUploadDocument = async (e, document_type) => {
    let formData = new FormData();
    let file = e.target.files[0];
    const ext = file?.name?.split('.').pop();
    if (!['pdf', 'doc', 'docx'].includes(ext)) {
      return toast.error('Only documents allowed.');
    }
    formData.append('document', file);
    formData.append('study_id', user.study_id);
    formData.append('document_type', document_type);
    if (file) {
      try {
        await dispatch(uploadStudyDocument(formData));
        getDocuments();
      } catch (error) {
        console.log(error);
      }
    }
  };

  const getDocStatus = (status) => {
    status = status !== 'pending' ? status : 'Pending Approval';
    return toTitleCase(status);
  };

  return (
    <div className="row ps-2">
      {documents.map((doc, i) => (
        <div key={doc.id} className={`card col-md-12 mb-2 ${styles.formMgmtCard} ${styles['Archive']}`}>
          <div id="doc-container">
            <div className={`${styles.StudyName}`}>
              <label className={`${styles.formName}`}>{doc.document_type}</label>
            </div>
            <div className={`d-flex justify-content-between ${styles.subInfo}`}>
              <div className={`${styles.filesSection}`}>
                {doc.document?.length ? (
                  doc.document.map((item, j) => (
                    <span className={`${styles.fileContainer} ${j < doc?.document?.length - 1 ? styles.contentBorder : ''}`}>
                      <label className={`${styles.docName} my-auto me-2`}>
                        {j + 1}. {item.document_name}
                      </label>
                      <label className={`${styles.version} my-auto`}>
                        <img src={`/images/${item.status !== 'pending' ? 'radio.svg' : 'pending.svg'}`} className="pe-2 " />
                        {getDocStatus(item.status)}
                      </label>
                    </span>
                  ))
                ) : (
                  <label className={`${styles.formName} my-auto me-2`}>Upload Document</label>
                )}
              </div>
              <input
                ref={inputRef[i]}
                type="file"
                onChange={(e) => handleUploadDocument(e, doc.document_type)}
                className="d-none"
              />
              <div className={`${styles.uploadIcon}`} onClick={() => inputRef[i]?.current.click()}>
                <img src={'/images/uploadIcon.svg'} className="pe-2 " />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
export default WithAuth(StudyDocuments);
