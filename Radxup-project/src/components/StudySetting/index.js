import { useEffect, useState } from 'react';
import styles from '../../stylesheets/InitiateParticipant.module.scss';
import { WithAuth } from '../common/WithAuth';
import StudyDocuments from './StudyDocuments';
import EmailTemplate from './emailTemplate';
import StudyContent from './StudyContent';
import { useRouter } from 'next/router';
import { decodeData } from '../../helpers/auth';

const StudySetting = () => {
  const [activeTab, setActiveTab] = useState('studyDocuments');
  const router = useRouter();
  const { push, asPath } = router;
  const handleActiveTab = (e) => {
    if (e.target?.value) {
      setActiveTab(e.target?.value);
    }
  };

  useEffect(() => {
    if (router.query?.redirect) {
      routeFunction(router.query?.redirect);
    }
  }, []);

  const delQuery = (asPath) => {
    return asPath.split('?')[0];
  };

  const routeFunction = (value) => {
    const decoded = decodeData(`${value}`);
    if (decoded == 'templateTab') {
      setActiveTab('emailTemplates');
      push(delQuery(asPath));
    }
  };

  return (
    <div className="row mb-4 mt-5 top-tabs">
      <div className="col-md-12 d-flex justify-content-start ps-0">
        <div className="btn-group" role="group" aria-label="languages" onClick={handleActiveTab}>
          <button
            name="Study Documents"
            value="studyDocuments"
            className={`fw-bold btn me-1 ${activeTab === 'studyDocuments' ? styles.active : styles.inactive}`}
          >
            Study Documents
          </button>
          <button
            name="Study Contents"
            value="studyContents"
            className={`fw-bold me-1 btn ${activeTab === 'studyContents' ? styles.active : styles.inactive}`}
          >
            Study Content
          </button>
          <button
            name="Email Templates"
            value="emailTemplates"
            className={`fw-bold btn ${activeTab === 'emailTemplates' ? styles.active : styles.inactive}`}
          >
            Email Template
          </button>
        </div>
      </div>

      <div className="col-md-12 mt-4 ps-0">
        <div className={`${styles['initiate-participant']} }`}>
          {activeTab === 'studyDocuments' && <StudyDocuments />}
          {activeTab === 'studyContents' && <StudyContent styles={styles} />}
          {activeTab === 'emailTemplates' && <EmailTemplate styles={styles} />}
        </div>
      </div>
    </div>
  );
};
export default WithAuth(StudySetting);
