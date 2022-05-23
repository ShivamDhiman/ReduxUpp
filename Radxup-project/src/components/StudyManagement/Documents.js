import { useEffect, useRef, useState } from 'react';
import { Button, FormCheck, Spinner } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import API from '../../helpers/api';
import { encodeData } from '../../helpers/auth';
import { handleErrorMessage } from '../../utils/commonFunctions';
import ConfirmationModal from '../common/confirmationModal';

const Documents = (props) => {
  const defaultDocs = [
    {
      document_type: 'IRB Approval',
      document: [],
    },
    {
      document_type: 'IRB Protocol',
      document: [],
    },
    {
      document_type: 'Data Use Agreement',
      document: [],
    },
    {
      document_type: 'Informed Consent Form',
      document: [],
    },
    {
      document_type: 'Other',
      document: [],
    },
  ];
  const { cancel, next, previous, styles, documents, study, isLoading, pageType } = props;
  const [docs, setDocuments] = useState([...defaultDocs]);
  const dispatch = useDispatch();
  const fileUploader = defaultDocs.map(() => useRef());
  const [ShowModal, setShowModal] = useState(false);
  const [payloadData, setPayloadData] = useState({});
  const [loadingForModal, setLoadingForModal] = useState(false);
  const [documentIds, setdocumentIds] = useState([]);
  const [status, setstatus] = useState();
  const [study_id, setstudy_id] = useState(study.id);

  useEffect(() => {
    if (documents?.length) {
      setDocuments(documents);
    }
  }, [documents.length]);
  const handleFileSelect = (event) => {};
  const handleUploadDocument = async (e, document, i) => {
    if (e?.target && e?.target?.files && e?.target?.files?.length) {
      if (document.document.length > 3) {
        toast.error('Atmost four documents allowed per document type.');
        return;
      }
      const file = e?.target?.files[0];
      const ext = file.name.split('.').pop();
      if (!['pdf', 'doc', 'docx'].includes(ext)) {
        toast.error('Only documents allowed.');
        return;
      }
      document.document.push({ document_name: file.name, file: file, status: 'pending' });
      docs[i] = document;
      setDocuments([...docs]);
    }
  };

  const addDocs = () => {
    if (pageType === 'edit') {
      let filteredDocs = [];
      docs.forEach((document) => {
        let filtered = document.document.filter((doc) => doc.file);
        let doc = JSON.parse(JSON.stringify(document));
        filteredDocs.push({ ...doc, document: [...filtered] });
      });
      next(filteredDocs);
      if (documentIds?.length) {
        const encodePayload = encodeData({ study_id, documentIds, status });
        API.apiPost('statusUpdate', { payload: encodePayload })
          .then((response) => {
            if (response.data && response.data.success === true) {
              toast.success(response.data.message);
            }
          })
          .catch((err) => {
            console.log('err', err);
            handleErrorMessage(err);
          });
      }
    } else {
      next(docs);
    }
  };

  const onHandleCloseAction = (data) => {
    setShowModal(false);
    if (data.actionType === 'Add' || data.actionType === 'Update') {
      addDocs();
      setShowModal(false);
    }
  };

  const openFileChooser = (i) => {
    fileUploader[i]?.current?.click();
  };

  const confirmAction = (actionType) => {
    setPayloadData({
      actionType,
    });
    setShowModal(true);
  };

  const formChangeHandler = (e, i, documents, index) => {
    let updateStatus = e.target.checked ? 'approved' : 'pending';
    setstatus('approved');
    documents[i].document[index].status = updateStatus;
    setDocuments([...documents]);
    let documentsId = documents[i].document[index]?.id;
    if (e.target?.checked && !documentIds.includes(documentsId)) {
      setdocumentIds([...documentIds, documentsId]);
    }
    if (!e.target?.checked && documentIds.includes(documentsId)) {
      const docs = documentIds.filter((el) => el !== documentsId);
      setdocumentIds([...docs]);
    }
  };

  const isDisabled = (pagetype, status, fileId) => {
    if (pagetype === 'edit' && status?.toLowerCase() === 'approved' && !documentIds.includes(fileId)) {
      return false;
    }
    return true;
  };

  return (
    <div>
      {ShowModal && (
        <ConfirmationModal open={ShowModal} handleClose={onHandleCloseAction} data={payloadData} loading={loadingForModal} />
      )}
      {docs.map((doc, i) => (
        <div key={i} className={`card mt-3 ${styles.documentCard}`}>
          <div className="d-flex justify-content-center py-3 px-2 ">
            <div className={`${styles.documentTitle}`}>{doc.document_type}</div>
            <div className={`flex-grow-1 ms-3 ${styles.documentDocsTitle}`}>
              {!!doc.document?.length &&
                doc?.document.map((file, index) => (
                  <span className={`mx-2 d-flex ${styles.documentDocs}`}>
                    {file.document_name}
                    {/* {file?.status !== 'pending' && (
                      <img
                        src={'/images/tick_mark.svg'}
                        className="cursor-pointer ms-1 "
                        data-toggle="tooltip"
                        title={file?.status}
                      />
                    )}
                    {file?.status === 'pending' && (
                      <img
                        src={'/images/pending.svg'}
                        className="cursor-pointer ms-1 "
                        data-toggle="tooltip"
                        title="Pending"
                      />
                    )} */}
                    <FormCheck
                      type="checkbox"
                      name={`${file.document_type}`}
                      checked={file?.status?.toLowerCase() === 'approved'}
                      className={`cursor-pointer ms-2 ${styles.rightCheck}`}
                      onChange={(e) => isDisabled(pageType, file.status, file.id) && formChangeHandler(e, i, docs, index)}
                    />
                  </span>
                ))}
              {!doc.docs?.length && <span className={`mx-2 text-muted ${styles.documentNoDocs}`}>Upload Document</span>}
            </div>
            <div className={` ${styles.documentuploadIcon}`}>
              <input
                type="file"
                className="d-none"
                onChange={(e) => handleUploadDocument(e, doc, i)}
                accept="application/pdf,application/msword,
                application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                ref={fileUploader[i]}
              />
              <img
                src={'/images/doc_upload_icon.svg'}
                onClick={() => openFileChooser(i)}
                className="cursor-pointer"
                data-toggle="tooltip"
                title="Upload"
              />
            </div>
          </div>
        </div>
      ))}

      <div className="d-flex justify-content-end mt-5">
        <div className={`fw-bold ms-3 ${styles.sectionHeading}`}>
          <Button size="md" disabled={isLoading} className="admin_panel_button primary" onClick={previous}>
            Previous
          </Button>
        </div>
        <div className={` fw-bold ms-3 ${styles.sectionHeading}`}>
          <Button
            size="md"
            disabled={isLoading}
            className="admin_panel_button primary"
            onClick={() => cancel(study?.study_id)}
          >
            Cancel
          </Button>
        </div>
        <div className={`fw-bold ms-3 ${styles.sectionHeading} `}>
          <Button
            disabled={isLoading}
            size="md"
            className="admin_panel_button secondary"
            onClick={() => confirmAction(`${study.id ? 'Update' : 'Add'}`)}
          >
            {study.id ? 'Update' : 'Add'}
            {isLoading && <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" className="me-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
export default Documents;
