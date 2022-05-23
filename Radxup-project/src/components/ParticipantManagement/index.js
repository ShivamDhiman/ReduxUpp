import dynamic from 'next/dynamic';
import { WithAuth } from '../common/WithAuth';

const ParticipantManagement = dynamic(() => import('./ParticipantManagement'));

export default WithAuth(function ParticipantManagementIndex() {
  return <ParticipantManagement />;
});
