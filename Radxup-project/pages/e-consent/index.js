import dynamic from 'next/dynamic';
import Layout from '../../src/components/common/MainHeaderFooterLayout';

// const EConcentComponent = dynamic(() => import('../../src/components/Econcent'));
const EConcentInfoComponent = dynamic(() => import('../../src/components/Econcent/EConsentInfoComponent'));

export default function EConcent() {
  return (
    <Layout title={`E-Consent | RADxUP.`} data={{ layoutType: 'noSidebar' }} description={`RADxUp Survey`}>
      <div className="container text-center">
        <EConcentInfoComponent />
      </div>
    </Layout>
  );
}
