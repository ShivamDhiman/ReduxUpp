import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isAuth } from '../../helpers/auth';
import { getProfile } from '../../store/actions/user';

const ManageProfile = () => {
  const userData = useSelector((state) => state?.user?.userData);
  const dispatch = useDispatch();

  useEffect(() => {
    if (isAuth() && userData && !userData.role_id) {
      dispatch(getProfile());
    }
  }, []);

  return null;
};

export default ManageProfile;
