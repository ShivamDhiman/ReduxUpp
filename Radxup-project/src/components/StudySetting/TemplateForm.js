import React, { useEffect, useRef, useState } from 'react';
import { Button, Form, FormCheck, Spinner } from 'react-bootstrap';
import { Editor } from '@tinymce/tinymce-react';
import { useRouter } from 'next/router';
import { decodeData, encodeData, isAuth } from '../../helpers/auth';
import Validation from '../../utils/validations';
import API from '../../helpers/api';
import { handleErrorMessage } from '../../utils/commonFunctions';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import moment from 'moment';
import ConfirmationModal from '../common/confirmationModal';

function TemplateForm(props) {
  const { styles, page } = props;
  const [state, setState] = useState({
    name: '',
    subject: '',
    header: '',
    language: 'English',
    bodyEnglish: '',
    bodySpanish: '',
    bodyGerman: '',
  });
  const [showErrors, setShowErrors] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const editorRef = useRef(null);
  const [preview, setPreview] = useState(false);
  const [previewdata, setPreviewdata] = useState('');
  const { name, subject, header, language, bodyEnglish, bodySpanish, bodyGerman } = state;
  const [ShowModal, setShowModal] = useState(false);
  const [payloadData, setPayloadData] = useState({});
  const [loadingForModal, setLoadingForModal] = useState(false);
  const userData = useSelector(({ user }) => user.userData) || isAuth();

  const data = 'templateTab';
  const encoded = encodeData(data);

  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setState({ ...state, [name]: value });
  };

  const chooseLanguage = (lang) => {
    if (lang === 'English') {
      return 'bodyEnglish';
    }
    if (lang === 'Spanish') {
      return 'bodySpanish';
    }
    if (lang === 'German') {
      return 'bodyGerman';
    }
  };

  const handleEditorChange = (content, editor) => {
    const bodyKey = chooseLanguage(language);
    setState({ ...state, [bodyKey]: content });
  };

  const changeLanguage = (evt) => {
    const { value } = evt.target;
    setState({ ...state, language: value });
  };

  useEffect(() => {
    if (page !== 'templateForm') {
      const editInfo = decodeData(page);
      setPreviewdata(editInfo);
      setPreview(true);
    }
  }, [page]);

  const addParticipant = () => {
    setShowErrors(true);
    const payload = { name, subject, header, language, bodyEnglish, bodySpanish, bodyGerman };

    for (const property in payload) {
      switch (property) {
        case 'name':
          if (!Validation.maxOf(name, 100)) return;
          break;
        case 'subject':
          if (!Validation.specialAlphaNum(subject)) return;
          break;
        case 'header':
          if (!Validation.specialAlphaNum(header)) return;
          break;
        case 'bodyEnglish':
          if (!Validation.maxOf(bodyEnglish, 2000)) return;
          break;
        // case 'bodySpanish':
        //   // if (language === 'Spanish' && Validation.empty(bodySpanish)) {
        //   //   return;
        //   // }
        //   if (!Validation.maxOf(bodySpanish, 2000)) return;
        //   break;
        // case 'bodyGerman':
        //   // if (language === 'German' && Validation.empty(bodyGerman)) {
        //   //   return;
        //   // }
        //   if (!Validation.maxOf(bodyGerman, 2000)) return;
        //   break;
        default:
          break;
      }
    }
    setIsLoading(true);
    const sendData = [];
    if (Validation.maxOf(bodyEnglish, 2000)) {
      sendData.push({
        name,
        language,
        subject,
        header,
        body_content: bodyEnglish,
      });
    }
    const encodePayload = encodeData({
      study_id: userData?.study_id,
      templateObjects: sendData,
    });
    API.apiPost('createTemplate', { payload: encodePayload })
      .then((response) => {
        if (response.data && response.data.success === true) {
          setIsLoading(false);
          setShowErrors(false);
          router.push(`/study-setting?redirect=${encoded}`);
          toast.success(response.data.message);
        }
      })
      .catch((err) => {
        console.log('err', err);
        handleErrorMessage(err);
        setIsLoading(false);
        return false;
      });
  };

  useEffect(() => {
    let content = chooseLanguage(language);
    let newContent = state[content];
    if (editorRef?.current) {
      editorRef?.current.setContent(newContent);
    }
  }, [language]);

  const redirectTable = () => {
    router.push(`/study-setting?redirect=${encoded}`);
  };

  const onHandleCloseAction = (data) => {
    if (data.actionType === 'TemplateCancel' && data.text === 'edit') {
      redirectTable();
    }
    setShowModal(false);
  };
  const confirmAction = () => {
    const text = 'edit';
    let actionType = 'TemplateCancel';
    setPayloadData({
      actionType,
      text,
    });
    setShowModal(true);
  };

  return (
    <>
      {ShowModal && (
        <ConfirmationModal open={ShowModal} handleClose={onHandleCloseAction} data={payloadData} loading={loadingForModal} />
      )}
      {!preview ? (
        <div className="eICF-form">
          <div className="row mb-2">
            {/* <div
              className={`col md-12 d-flex justify-content-end ${styles.radioLabel}`}
              onChange={(evt) => changeLanguage(evt)}
            >
              <Form.Group controlId="formBasicCheckbox1">
                <FormCheck type="radio" defaultChecked name="language" value="English" label={'English'} className="me-3" />
              </Form.Group>
              <Form.Group controlId="formBasicCheckbox2">
                <FormCheck type="radio" className="mb-1 me-3" name="language" value="Spanish" label={'Spanish'} />
              </Form.Group>
              <Form.Group controlId="formBasicCheckbox3">
                <FormCheck type="radio" name="language" value="German" label={'German'} />
              </Form.Group>
            </div> */}
            <div className={`mb-3 ${styles.studyViewMainHeader}`}>Enter Email Content</div>
            <div className="col-md-6">
              <Form.Group className="col" controlId="formName">
                <Form.Label>E-mail Template Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  placeholder="Enter text"
                  onChange={handleChange}
                  value={name}
                  isInvalid={showErrors && !Validation.maxOf(name, 100)}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {name && !Validation.maxOf(name, 100)
                    ? 'E-mail Template name should be 0-100 length'
                    : 'E-mail Template name is Required'}
                </Form.Control.Feedback>
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="col" controlId="formVersion">
                <Form.Label>Email Subject</Form.Label>
                <Form.Control
                  type="text"
                  name="subject"
                  placeholder="Enter text"
                  onChange={handleChange}
                  value={subject}
                  isInvalid={showErrors && !Validation.specialAlphaNum(subject)}
                  maxLength="200"
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {subject && !Validation.specialAlphaNum(subject)
                    ? 'Please enter a valid format'
                    : 'Email Subject is Required'}
                </Form.Control.Feedback>
              </Form.Group>
            </div>
            <div className="col-md-12">
              <Form.Group className="col mt-2" controlId="formName">
                <Form.Label>Header</Form.Label>
                <Form.Control
                  type="text"
                  name="header"
                  placeholder="Enter text"
                  onChange={handleChange}
                  value={header}
                  isInvalid={showErrors && !Validation.specialAlphaNum(header)}
                  maxLength="200"
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {header && !Validation.specialAlphaNum(header) ? 'Please enter a valid format' : 'Header is Required'}
                </Form.Control.Feedback>
              </Form.Group>
            </div>
          </div>
          <div className="row mb-4">
            <div>
              {language === 'English' && (
                <label type="invalid" className="text-danger text-left">
                  {bodyEnglish && !Validation.maxOf(bodyEnglish, 2000) && 'English Form Content should be 0-2000 length'}
                  {!bodyEnglish && showErrors && 'English Form Content is Required'}
                </label>
              )}
              {/* {language === 'Spanish' && (
                <label type="invalid" className="text-danger text-left">
                  {bodySpanish && !Validation.maxOf(bodySpanish, 2000) && 'Spanish Form Content should be 0-2000 length'}
                  {!bodySpanish && showErrors && 'Spanish Form Content is Required'}
                </label>
              )}
              {language === 'German' && (
                <label type="invalid" className="text-danger text-left">
                  {bodyGerman && !Validation.maxOf(bodyGerman, 2000) && 'German Form Content should be 0-2000 length'}
                  {!bodyGerman && showErrors && 'German Form Content is Required'}
                </label>
              )} */}
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
                required
              />
            </div>
          </div>
          <div className="d-flex mt-5 mb-5 ps-0 justify-content-start">
            <div className={` fw-bold ${styles.sectionHeading}`}>
              <Button size="md" className="admin_panel_button dark" onClick={confirmAction}>
                Cancel
              </Button>
            </div>
            <div className={`fw-bold ms-3 ${styles.sectionHeading} `}>
              <Button size="md" className="admin_panel_button secondary" onClick={addParticipant}>
                Save
                {isLoading && (
                  <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" className="me-2" />
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <div className="d-flex justify-content-between mb-4">
            <div className="col-md-10 col-sm-10 d-flex justify-content-start">
              <div className={`mt-auto ${styles.previewMainHeader}`}>Email Preview - &nbsp;</div>
              <div className={`mt-auto ${styles.showdot}`} data-toggle="tooltip" title={previewdata?.name}>
                {previewdata?.name || '-'}
              </div>
            </div>
            <div className="col-md-2 col-sm-2 d-flex justify-content-end">
              <Button className="mx-2 admin_panel_button dark " size="md" onClick={redirectTable}>
                Close Preview
              </Button>
            </div>
          </div>
          <div className="col-md-12 d-flex justify-content-start mt-1 mb-3">
            <div className={`me-1  ${styles.contentText}`}>Email Subject:</div>
            <div className={` ${styles.textContent}`} data-toggle="tooltip" title={previewdata?.subject}>
              {previewdata?.subject || '-'}
            </div>
          </div>
          <div className="col-md-7 col-lg-7 mb-4">
            {preview && (
              <>
                <div>
                  <div className={styles.previewLogo}>
                    <img src="/images/logo.svg" alt="Logo" />
                    <div className={styles.arrowDown}></div>
                  </div>

                  <div className={`${styles.previewTitle} p-4 text-center`}>{previewdata?.header || ''}</div>
                </div>
                <div
                  className={`text-left col-md-12 ${styles.previewBody} px-4`}
                  dangerouslySetInnerHTML={{ __html: previewdata?.body_content }}
                ></div>
                <div className="d-flex justify-content-center pb-4">
                  <Button className="mt-4 mb-4">Initiate survey</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default TemplateForm;
