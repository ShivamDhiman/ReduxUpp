import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { routesConfig, SUPER_ADMIN_ROLE, ADMIN_ROLE, COORDINATOR_ROLE } from '../../constants/constant';
import { isAuth, logout } from '../../helpers/auth';
import { LazyLoaderGeneral } from './LazyLoaderComponent';

export const WithAuth = (Component) => {
  return (props) => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const userData = useSelector(({ user }) => user.auth);
    const user = isAuth();
    useEffect(() => {
      const currentPath = routesConfig[router.pathname];
      if (currentPath) {
        if (currentPath.protected && !isAuth()) {
          router.push('/');
          return null;
        }
        if (isAuth() && ![ADMIN_ROLE, COORDINATOR_ROLE, SUPER_ADMIN_ROLE].includes(user.role_id)) {
          logout();
          return;
        }

        if (isAuth() && currentPath.protected && !currentPath.access.includes(user.role_id)) {
          if (user.role_id === SUPER_ADMIN_ROLE) {
            router.push('/dashboard');
          } else {
            router.push(currentPath.redirect);
          }
          return null;
        }
      } else {
        router.push('/404');
        return null;
      }
      setLoading(false);
    }, [userData, user]);

    return loading ? <LazyLoaderGeneral /> : <Component {...props} />;
  };
};
