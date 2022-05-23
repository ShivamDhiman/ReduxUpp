import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Layout from '../../src/components/common/MainHeaderFooterLayout';
import { useEffect, useState } from 'react';
import { decodeData, encodeData } from '../../src/helpers/auth';
import API from '../../src/helpers/api';
import { handleErrorMessage } from '../../src/utils/commonFunctions';
import { toast } from 'react-toastify';
import { WithAuth } from '../../src/components/common/WithAuth';

const RegistrationComponent = dynamic(() => import('../../src/components/common/RegistrationComponent'));
const EConcentComponent = dynamic(() => import('../../src/components/Econcent'));
const initialState = {
  first_name: '',
  last_name: '',
  personal_email: '',
  mobile_phone: '',
  participant_id: '',
  survey_id: '',
  id: '',
  token: '',
  form_code: '',
  form_name: '',
  form_group: '',
  surveyForm: [],
  eICFs: [],
};
const InformedConsentForm = (props) => {
  const router = useRouter();
  const { query, id } = router.query;
  const [userInfo, setUserInfo] = useState(initialState);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!['consent-sign', 'register'].includes(id) || !decodeData(query)) {
      router.push('/');
    }
    getUserAndFormInfo();
  }, [query]);

  const getUserAndFormInfo = () => {
    setLoading(true);
    API.apiGet('surveyInfo', `?query=${query}`)
      .then((response) => {
        if (response.data && response.data.success === true) {
          // if (!response?.data?.data?.surveyForm?.length) {
          //   toast.error('Suvey not found.');
          //   router.push('/');
          //   return;
          // }
          // console.log(response.data, 'dd');
          setLoading(false);
          const tokenInfo = decodeData(query);
          const { surveyForm, userProfile, survey_id, eICFs } = response.data.data;
          // const userFromToken = decryptedToken(response.data.data.token);
          setUserInfo({
            ...tokenInfo,
            ...userProfile,
            surveyForm,
            eICFs: [...eICFs],
            token: response.data.data.token,
            survey_id,
          });
        }
      })
      .catch((err) => {
        if ([403].includes(err?.response?.status)) {
          router.push('/unauthorize');
        }
        setLoading(false);
        toast.error(err?.response?.data?.message);
      });
  };

  const handleUserInfo = (data) => {
    setUserInfo((prev) => ({ ...prev, ...data }));
  };

  const onSkip = (queryToken) => {
    router.push(`/survey?query=${queryToken || query}`);
  };

  return (
    <Layout title={`E-Consent | RADxUP.`} data={{ layoutType: 'noSidebar' }} description={`RADxUp Survey`}>
      <div className="container text-center">
        {id == 'consent-sign' && !loading && <EConcentComponent onSkip={onSkip} userInfo={userInfo} />}
        {id == 'register' && !loading && (
          <RegistrationComponent
            userInfo={userInfo}
            eICFs={userInfo?.eICFs}
            handleUserInfo={handleUserInfo}
            onSkip={onSkip}
          />
        )}
      </div>
    </Layout>
  );
};

InformedConsentForm.getInitialProps = async ({ store, query, isServer, pathname }) => {
  //   const stateProps = { ...store.getState() };
  // await store.dispatch( fetchProfileIfNeeded(loginData, type, authorCode ) );
  return { isServer, query, pathname };
};

export default WithAuth(InformedConsentForm);
