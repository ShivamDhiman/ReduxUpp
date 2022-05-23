import Head from 'next/head';
import dynamic from 'next/dynamic';
import Layout from '../../src/components/common/MainHeaderFooterLayout';
import { LazyLoaderGeneral } from '../../src/components/common/LazyLoaderComponent';
import styles from '../../src/stylesheets/ICForm.module.scss';

const EICFormTableComponent = dynamic(() => import('../../src/components/InformedConsentForm'), {
  loading: () => <LazyLoaderGeneral />,
});

export default function InformedConsentForm() {
  return (
    <Layout title={`Informed consent form | RADxUP.`} data={{ layoutType: 'HOME' }} description={`RADxUp Survey`}>
      <div className="container text-center">
        <EICFormTableComponent />
      </div>
    </Layout>
  );
}
