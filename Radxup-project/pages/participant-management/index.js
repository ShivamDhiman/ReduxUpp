import dynamic from 'next/dynamic';
import Layout from '../../src/components/common/MainHeaderFooterLayout';
import { LazyLoaderGeneral } from '../../src/components/common/LazyLoaderComponent';

const ParticipantManagementComponent = dynamic(() => import('../../src/components/ParticipantManagement/index'), {
  loading: () => <LazyLoaderGeneral />,
});

export default function ParticipantManagement() {
  return (
    <Layout title={`Participant Management | RADxUP.`} data={{ layoutType: 'HOME' }} description={`RADxUp Survey`}>
      <div className="container text-center">
        <ParticipantManagementComponent />
      </div>
    </Layout>
  );
}
