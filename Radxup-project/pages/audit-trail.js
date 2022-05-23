import dynamic from 'next/dynamic';
import { LazyLoaderGeneral } from '../src/components/common/LazyLoaderComponent';
import Layout from '../src/components/common/MainHeaderFooterLayout';
import styles from '../src/stylesheets/auditTrail.module.scss';

const AuditTrailComponent = dynamic(() => import('../src/components/AuditTrail'), {
  loading: () => <LazyLoaderGeneral />,
});

export default function AuditTrail() {
  return (
    <Layout title={`Audit Trail | RADxUP.`} data={{ layoutType: 'HOME' }} description={`RADxUp Audit trail`}>
      <div className="container text-center">
        <AuditTrailComponent styles={styles} />
      </div>
    </Layout>
  );
}
