import React, { useEffect, useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { getstudyContentDetails } from '../../store/actions/studyManagement';
import { useSelector, useDispatch } from 'react-redux';
import API from '../../helpers/api';
import { handleErrorMessage } from '../../utils/commonFunctions';
import { toast } from 'react-toastify';
import { encodeData, isAuth } from '../../helpers/auth';
import Validation from '../../utils/validations';

const StudyContent = (props) => {
  const userData = useSelector(({ user }) => user.userData) || isAuth();
  const { styles } = props;
  const [buttonHide, setButtonhide] = useState(false);
  const [contentSubmiting, setContentSubmiting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [data, setData] = useState({
    registration_description: '',
    feedback_description: '',
    description: '',
  });
  const [loading, studyContentData] = useSelector((Gstate) => [
    Gstate.studyManagement?.loading,
    Gstate.studyManagement?.studyContentData,
  ]);

  const dispatch = useDispatch();
  const { registration_description, feedback_description, description } = data;

  const contentEdit = () => {
    setButtonhide(true);
  };

  const studyContentDataKeysLength = Object.keys(studyContentData || {}).length;

  useEffect(() => {
    dispatch(getstudyContentDetails(userData?.study_id));
    setData(studyContentData);
  }, [studyContentDataKeysLength]);

  const changeHandler = (e) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
  };

  const updateStudyContent = () => {
    setShowErrors(true);
    if (
      !Validation.maxOf(description, 2000) ||
      !Validation.maxOf(registration_description, 2000) ||
      !Validation.maxOf(feedback_description, 2000)
    ) {
      setContentSubmiting(false);
      return;
    }

    if (
      registration_description === studyContentData?.registration_description &&
      feedback_description === studyContentData?.feedback_description &&
      description === studyContentData?.description
    ) {
      setContentSubmiting(false);
      return;
    }
    const payload = {
      study_id: userData?.study_id,
      description,
      registration_description,
      feedback_description,
    };
    const encodePayload = encodeData(payload);
    API.apiPut('statusContantUpdate', { payload: encodePayload })
      .then((response) => {
        if (response.data && response.data.success === true) {
          setButtonhide(false);
          setContentSubmiting(false);
          dispatch(getstudyContentDetails(userData?.study_id));
          toast.success(response.data.message);
        }
      })
      .catch((err) => {
        setContentSubmiting(false);
        handleErrorMessage(err);
      });
  };
  const handleContentSubmit = () => {
    setContentSubmiting(true);
    updateStudyContent();
  };

  const handleCancel = () => {
    setButtonhide(false);
    dispatch(getstudyContentDetails(userData?.study_id));
  };

  useEffect(() => {
    setData(studyContentData);
  }, [studyContentData]);

  return (
    <div className="ps-2">
      <div className="row mb-3">
        <div className="col d-flex justify-content-between">
          <div className="fw-bold page_paragraph">Study Description</div>
          {!buttonHide && (
            <div>
              <img
                src={'/images/editIcon.svg'}
                className="cursor-pointer me-3 "
                data-toggle="tooltip"
                onClick={contentEdit}
                title="Edit Study"
              />
            </div>
          )}
        </div>
        <label type="invalid" className="text-danger text-start mb-1">
          {description && !Validation.maxOf(description, 2000) && 'Description should be 0-2000 length'}
          {!description && showErrors && 'Study Description is Required'}
        </label>
        {!loading && (
          <textarea
            className={`text_paragraph ${styles.textArea} ${!buttonHide && `bg-white border-0 `}`}
            id="exampleFormControlTextarea1"
            readOnly={!buttonHide}
            rows="3"
            name="description"
            onChange={(e) => changeHandler(e)}
            value={description}
            placeholder="Study Description is Required"
          />
        )}
        {loading && (
          <div className="d-flex justify-content-center">
            <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="row mb-3">
        <div className="col d-flex justify-content-between">
          <div className="fw-bold page_paragraph">Participant Registration</div>
          {!buttonHide && (
            <div>
              <img
                src={'/images/editIcon.svg'}
                className="cursor-pointer me-3 "
                data-toggle="tooltip"
                onClick={contentEdit}
                title="Edit Study"
              />
            </div>
          )}
        </div>
        <label type="invalid" className="text-danger text-start">
          {registration_description &&
            !Validation.maxOf(registration_description, 2000) &&
            'Participant Registration should be 0-2000 length'}
          {!registration_description && showErrors && 'Participant Registration is Required'}
        </label>
        {!loading && (
          <textarea
            className={`text_paragraph ${styles.textArea} ${!buttonHide && `bg-white border-0 `}`}
            id="exampleFormControlTextarea1"
            readOnly={!buttonHide}
            rows="3"
            name="registration_description"
            onChange={(e) => changeHandler(e)}
            value={registration_description}
            placeholder="Participant Registration is Required"
          />
        )}
        {loading && (
          <div className="d-flex justify-content-center">
            <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="row mb-3">
        <div className="col d-flex justify-content-between">
          <div className="fw-bold page_paragraph">Feedback Description</div>
          {!buttonHide && (
            <div>
              <img
                src={'/images/editIcon.svg'}
                className="cursor-pointer me-3 "
                data-toggle="tooltip"
                onClick={contentEdit}
                title="Edit Study"
              />
            </div>
          )}
        </div>
        <label type="invalid" className="text-danger text-start">
          {feedback_description &&
            !Validation.maxOf(feedback_description, 2000) &&
            'Feedback Description should be 0-2000 length'}
          {!feedback_description && showErrors && 'Feedback Description is Required'}
        </label>
        {!loading && (
          <textarea
            className={`text_paragraph ${styles.textArea} ${!buttonHide && `bg-white border-0`}`}
            id="exampleFormControlTextarea1"
            readOnly={!buttonHide}
            rows="3"
            name="feedback_description"
            onChange={(e) => changeHandler(e)}
            value={feedback_description}
            placeholder="Feedback Description is Required"
          />
        )}
        {loading && (
          <div className="d-flex justify-content-center">
            <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" />
          </div>
        )}
      </div>
      {buttonHide && (
        <div className="mt-3 d-flex justify-content-start">
          <Button className="me-3 admin_panel_button dark" onClick={() => handleCancel(false)}>
            Cancel
          </Button>

          <Button className="admin_panel_button secondary" onClick={handleContentSubmit}>
            {contentSubmiting && (
              <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" className="me-2" />
            )}
            Save
          </Button>
        </div>
      )}
    </div>
  );
};

export default StudyContent;
