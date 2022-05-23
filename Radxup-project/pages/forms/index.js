import dynamic from 'next/dynamic';
import { LazyLoaderGeneral } from '../../src/components/common/LazyLoaderComponent';
import Layout from '../../src/components/common/MainHeaderFooterLayout';
import styles from '../../src/stylesheets/Forms.module.scss';

const FormsComponent = dynamic(() => import('../../src/components/Forms'), {
  loading: () => <LazyLoaderGeneral />,
});

export default function Forms() {
  return (
    <Layout title={`Form management | RADxUP.`} data={{ layoutType: 'HOME' }} description={`RADxUp Survey`}>
      <div className="container text-center">
        <FormsComponent />
      </div>
    </Layout>
  );
}
