import dynamic from 'next/dynamic';
import Layout from '../../src/components/common/MainHeaderFooterLayout';
import { LazyLoaderGeneral } from '../../src/components/common/LazyLoaderComponent';
import { isAuth } from '../../src/helpers/auth';

const StudySettingComponent = dynamic(() => import('../../src/components/StudySetting'), {
  loading: () => <LazyLoaderGeneral />,
});

export default function StudySetting() {
  return (
    <Layout title={`Study Setting | RADxUP.`} data={{ layoutType: 'HOME' || 'PAGE' }} description={`RADxUp Study setting`}>
      <div className="container text-center">
        <StudySettingComponent />
      </div>
    </Layout>
  );
}
