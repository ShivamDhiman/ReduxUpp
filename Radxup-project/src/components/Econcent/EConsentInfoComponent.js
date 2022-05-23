import { useRouter } from 'next/router';
import { Button } from 'react-bootstrap';
import { decodeData } from '../../helpers/auth';
import moment from 'moment';
import { WithAuth } from '../common/WithAuth';
import { useEffect, useState } from 'react';
import { getPublicStudyDetails } from '../../store/actions/studyManagement';
import { useDispatch, useSelector } from 'react-redux';
import API from '../../helpers/api';

const EConsentInfoComponent = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const onContinue = () => {
    if (!decodeData(router?.query?.query)) {
      return router.push('/');
    }
    router.push(`e-consent/register?query=${router?.query?.query}`);
  };

  const tokenInfo = decodeData(router?.query?.query);
  const currentDate = moment();
  const expireDate = moment(new Date(tokenInfo?.linkExp * 1000));
  const [isExpired, setIsExpired] = useState(false);
  const [studyInfo] = useSelector((GState) => [GState.studyManagement?.studyDetails]);

  const getUserAndFormInfo = () => {
    const routeQuery = router?.query?.query;
    API.apiGet('surveyInfo', `?query=${routeQuery}`)
      .then((response) => {
        if (response.data && response.data.success === true) {
          if (!response?.data?.data?.surveyForm?.length) {
            toast.error('Suvey not found.');
            router.push('/');
            return;
          }
        }
      })
      .catch((err) => {
        if ([417].includes(err?.response?.status)) {
          setIsExpired(true);
        }
      });
  };

  useEffect(() => {
    if (tokenInfo?.study_id) {
      dispatch(getPublicStudyDetails(tokenInfo?.study_id?.toString()));
    }
    getUserAndFormInfo();
  }, []);

  const infoContent = () => {
    return (
      <>
        <div className="row ">
          <div className="col-md-12">
            <label className="page_heading float-start text-start col-12">Study Brief:</label>
          </div>
          <div className="col-md-12 mt-4">
            <p className="page_paragraph mt-2 col-md-12 text-break text-start">{studyInfo?.description}</p>
            <p className="page_paragraph mt-2 mb-4 text-start"></p>
            <Button variant="primary" className="mt-4 float-start" size="md" onClick={onContinue}>
              Continue
            </Button>
          </div>
        </div>
      </>
    );
  };

  const surveyExpireContent = () => {
    return (
      <div className={'d-flex my-4'}>
        <label className="page_heading float-start text-center col-12 my-4">
          Sorry the survey has been expired please contact to administrator.
        </label>
      </div>
    );
  };
  // if (currentDate.isAfter(expireDate)) {
  if (isExpired) {
    return surveyExpireContent();
  } else {
    return infoContent();
  }
};
export default WithAuth(EConsentInfoComponent);
