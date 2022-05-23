import dynamic from 'next/dynamic';
import { LazyLoaderGeneral } from '../../src/components/common/LazyLoaderComponent';
import Layout from '../../src/components/common/MainHeaderFooterLayout';
import styles from '../../src/stylesheets/Common.module.scss';

const StudyManagementComponent = dynamic(() => import('../../src/components/StudyManagement'), {
  loading: () => <LazyLoaderGeneral />,
});

export default function StudyManagement() {
  return (
    <Layout title={`Study Management | RADxUP.`} data={{ layoutType: 'HOME' }} description={`RADxUp Study Management`}>
      <div className="container text-center">
        <StudyManagementComponent styles={styles} />
      </div>
    </Layout>
  );
}
