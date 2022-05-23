import dynamic from 'next/dynamic';
import { LazyLoaderGeneral } from '../common/LazyLoaderComponent';
import { WithAuth } from '../common/WithAuth';

const TotalStudyCard = dynamic(() => import('./TotalStudyCard'), {
  loading: () => <LazyLoaderGeneral />,
});
const ParticipantEnrolledCard = dynamic(() => import('./ParticipantEnrolledCard'), {
  loading: () => <LazyLoaderGeneral />,
});
const RecordSyncedCard = dynamic(() => import('./RecordSyncedCard'), {
  loading: () => <LazyLoaderGeneral />,
});
const StudyChartCard = dynamic(() => import('./StudyChartCard'), {
  loading: () => <LazyLoaderGeneral />,
});
const FeedbackCard = dynamic(() => import('./FeedbackCard'), {
  loading: () => <LazyLoaderGeneral />,
});

export default WithAuth(function DashboardComponent({ styles }) {
  return (
    <>
      <div className="row mb-2">
        <div className="col-md-4">
          <TotalStudyCard styles={styles} />
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
          <StudyChartCard styles={styles} />
        </div>
        <div className="col-md-6">
          <FeedbackCard styles={styles} />
        </div>
      </div>
    </>
  );
});
