import dynamic from 'next/dynamic';
import { LazyLoaderGeneral } from '../../src/components/common/LazyLoaderComponent';
import Layout from '../../src/components/common/MainHeaderFooterLayout';

const DataManagementComponent = dynamic(() => import('../../src/components/DataExchange'), {
  loading: () => <LazyLoaderGeneral />,
});

const DataExchange = () => {
  return (
    <Layout title={`Analytics | RADxUP.`} data={{ layoutType: 'PUBLIC' }} description={`RADxUp Survey`}>
      <div className="container text-center">
        <DataManagementComponent />
      </div>
    </Layout>
  );
};

export default DataExchange;
