import styles from '../../stylesheets/Common.module.scss';
import React, { useEffect } from 'react';
import { Container, Row } from 'react-bootstrap';
import Image from 'next/image';
import { useState } from 'react';
import API from '../../helpers/api';
import { handleErrorMessage } from '../../utils/commonFunctions';
import { encodeData } from '../../helpers/auth';
import { toast } from 'react-toastify';
import { Button } from 'react-bootstrap';
import { clearFormData } from '../../store/actions/survey';
import { useDispatch, useSelector } from 'react-redux';
import { getPublicStudyDetails } from '../../store/actions/studyManagement';

let questions = [
  {
    statement: 'How was the overall look and feel of the application?',
    name: 'lookAndFeel',
  },
  {
    statement: 'How easy was the application to use?',
    name: 'easyToUse',
  },
  {
    statement: 'How was your overall experience of the application?',
    name: 'overallExperience',
  },
];
const Review = ({ survey_id, study_id, userProfile, token }) => {
  const stars = [1, 2, 3, 4, 5];
  const [responses, setResponse] = useState({ lookAndFeel: 0, easyToUse: 0, overallExperience: 0 });
  const [isSuccess, setIsSuccess] = useState(false);
  const dispatch = useDispatch();
  const [studyInfo] = useSelector((GState) => [GState.studyManagement?.studyDetails]);

  useEffect(() => {
    if (study_id) {
      dispatch(getPublicStudyDetails(study_id?.toString()));
    }

    // if (!study_id || !token) {
    //    setIsSuccess(true);
    // }
    return () => dispatch(clearFormData());
  }, []);

  const handleSubmit = () => {
    const headers = {
      version: 'v1',
      authorization: token,
    };
    API.apiPost(
      'surveyFeedback',
      {
        payload: encodeData({
          easy_use: responses.easyToUse,
          overall_look: responses.lookAndFeel,
          overall_experience: responses.overallExperience,
          study_id,
          survey_id,
          user_id: userProfile?.id,
        }),
      },
      { headers }
    )
      .then((response) => {
        setIsSuccess(true);
        toast.success(response.data.message);
        // router.push(`/initiate-participant`);
      })
      .catch((error) => {
        handleErrorMessage(error);
      });
  };

  const handleResponse = (key, resp) => {
    setResponse((prev) => ({ ...prev, [key]: resp + 1 }));
  };

  const { lookAndFeel, easyToUse, overallExperience } = responses;
  return (
    <Container className={` text-center ${styles.pageContentWrapper}`}>
      <Row className="p-0 m-0">
        <div className={`row my-0 mx-auto p-0 ${styles.upperBox}`}>
          <div className={`row mx-auto mt-4 p-0 ${styles.content}`}>Thank You!!</div>
        </div>
      </Row>
      <Row className={`d-flex flex-column justify-content-around m-0 p-0 ${styles.SecondRow}`}>
        <div className={`mb-1 text-break  ${styles.paragraph}`}>
          {!isSuccess ? (
            <span>
              {studyInfo?.feedback_description} <br></br>
            </span>
          ) : (
            <span>
              Thank you for completing the survey for the study. <br></br>
              We appreciate you contributing your time and knowledge to participate in this study.{' '}
            </span>
          )}
          {/* <div className="mt-3"> Kindly take a minute to give us a feedback below</div> //[insert study name] */}
        </div>
        {!isSuccess && (
          <>
            {questions.map((que) => (
              <>
                <div className={` md d-flex justify-content-center ${styles.content1}`}>{que.statement}</div>
                <div className="row d-flex justify-content-center">
                  <div className={`d-flex justify-content-between mt-0 ${styles.starRating}`}>
                    {stars.map((_, index) => {
                      return (
                        <Image
                          className={`${styles.star}`}
                          src={`${responses[que.name] > index ? '/images/favorite.svg' : '/images/starBlack.svg'}`}
                          alt="star"
                          width="22"
                          height="22"
                          key={`${que.name}_${index}`}
                          onClick={() => handleResponse(que.name, index)}
                        />
                      );
                    })}
                  </div>
                </div>
              </>
            ))}
            <div className="d-flex justify-content-center mt-2">
              <Button
                variant="green"
                size="md"
                onClick={handleSubmit}
                className={`mb-2 ${styles.btn}`}
                disabled={!(lookAndFeel > 0 && overallExperience > 0 && easyToUse > 0)}
              >
                Submit
              </Button>
            </div>
          </>
        )}
      </Row>
    </Container>
  );
};
export default Review;
