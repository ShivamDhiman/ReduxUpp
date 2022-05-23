import styles from '../../stylesheets/Analytics.module.scss';
import dynamic from 'next/dynamic';
import { LazyLoaderGeneral } from '../common/LazyLoaderComponent';
import { WithAuth } from '../common/WithAuth';

const AverageTimeFormCard = dynamic(() => import('./AverageTimeFormCard'), {
  loading: () => <LazyLoaderGeneral />,
});
const ParticipantEnrolledCard = dynamic(() => import('./ParticipantEnrolledCard'), {
  loading: () => <LazyLoaderGeneral />,
});
const RecordSyncedCard = dynamic(() => import('./RecordSyncedCard'), {
  loading: () => <LazyLoaderGeneral />,
});
const SurveyChartCard = dynamic(() => import('./SurveyChartCard'), {
  loading: () => <LazyLoaderGeneral />,
});
const FeedbackCard = dynamic(() => import('./FeedbackCard'), {
  loading: () => <LazyLoaderGeneral />,
});

export default WithAuth(function AnalyticsComponent() {
  return (
    <>
      <div className="row mb-2">
        <div className="col-md-4">
          <AverageTimeFormCard styles={styles} />
        </div>
        <div className="col-md-4">
          <ParticipantEnrolledCard styles={styles} />
        </div>
        <div className="col-md-4">
          <RecordSyncedCard styles={styles} />
        </div>
      </div>
      <div className="row mb-2">
        <div className="col-md-6">
          <SurveyChartCard styles={styles} />
        </div>
        <div className="col-md-6">
          <FeedbackCard styles={styles} />
        </div>
      </div>
    </>
  );
});
