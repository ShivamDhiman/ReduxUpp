import Head from 'next/head';
import dynamic from 'next/dynamic';
import Layout from '../src/components/common/MainHeaderFooterLayout';
import { LazyLoaderGeneral } from '../src/components/common/LazyLoaderComponent';
import styles from '../src/stylesheets/Analytics.module.scss';

const AnalyticsComponent = dynamic(() => import('../src/components/Analytics'), {
  loading: () => <LazyLoaderGeneral />,
});

export default function Analytics() {
  return (
    <Layout title={`Analytics | RADxUP.`} data={{ layoutType: 'HOME' }} description={`RADxUp Survey`}>
      <div className="container text-center">
        <AnalyticsComponent />
      </div>
    </Layout>
  );
}
