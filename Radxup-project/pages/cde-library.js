import dynamic from 'next/dynamic';
import { LazyLoaderGeneral } from '../src/components/common/LazyLoaderComponent';
import Layout from '../src/components/common/MainHeaderFooterLayout';
import styles from '../src/stylesheets/CDELibrary.module.scss';

const CDELibraryComponent = dynamic(() => import('../src/components/CDELibrary'), {
  loading: () => <LazyLoaderGeneral />,
});

export default function CDELibrary() {
  return (
    <Layout title={`CDE Library | RADxUP.`} data={{ layoutType: 'HOME' }} description={`RADxUp Survey`}>
      <div className="container text-center">
        <CDELibraryComponent styles={styles} />
      </div>
    </Layout>
  );
}
