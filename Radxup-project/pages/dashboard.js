import dynamic from 'next/dynamic';
import { LazyLoaderGeneral } from '../src/components/common/LazyLoaderComponent';
import Layout from '../src/components/common/MainHeaderFooterLayout';
import styles from '../src/stylesheets/Analytics.module.scss';

const DashboardComponent = dynamic(() => import('../src/components/Dashboard'), {
  loading: () => <LazyLoaderGeneral />,
});

export default function Dashboard() {
  return (
    <Layout title={`Dashboard | RADxUP.`} data={{ layoutType: 'HOME' }} description={`RADxUp Dashboard`}>
      <div className="container text-center">
        <DashboardComponent styles={styles} />
      </div>
    </Layout>
  );
}
