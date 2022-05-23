import dynamic from 'next/dynamic';
import Layout from '../../src/components/common/MainHeaderFooterLayout';
import { LazyLoaderGeneral } from '../../src/components/common/LazyLoaderComponent';

const DataManagementComponent = dynamic(() => import('../../src/components/DataManagement'), {
  loading: () => <LazyLoaderGeneral />,
});

export default function DataManagement() {
  return (
    <Layout title={`Data Management | RADxUP.`} data={{ layoutType: 'HOME' }} description={`RADxUp Survey`}>
      <div className="container text-center">
        <DataManagementComponent />
      </div>
    </Layout>
  );
}
