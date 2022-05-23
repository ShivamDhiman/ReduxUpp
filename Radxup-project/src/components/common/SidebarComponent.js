import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Nav } from 'react-bootstrap';
import appMenuItems, { SUPER_ADMIN_ROLE, ADMIN_ROLE, COORDINATOR_ROLE } from '../../constants/constant';
import styles from '../../stylesheets/Home.module.scss';
import { isAuth } from '../../helpers/auth';

const Sidebar = () => {
  const router = useRouter();
  const [selectedKey, setSelected] = useState(1);
  const [appMenuItemsData, setAppMenuItemsData] = useState([]);
  const userData = useSelector(({ user }) => user.userData);

  const selectKey = (key) => {
    setSelected(key);
  };

  useEffect(() => {
    const user = isAuth();
    const roleId = userData?.role_id || user.role_id;
    if (roleId && roleId === SUPER_ADMIN_ROLE) {
      const menu = appMenuItems.filter((item) => item.id > 8);
      setAppMenuItemsData(menu);
    }
    if (roleId && roleId === ADMIN_ROLE) {
      const menu = appMenuItems.filter((item) => item.id <= 8);
      setAppMenuItemsData(menu);
    }
    if (roleId && roleId === COORDINATOR_ROLE) {
      const menu = appMenuItems.filter((item) => [2, 5, 6].includes(item.id));
      setAppMenuItemsData(menu);
    }
  }, [userData]);

  return (
    <>
      <Nav className={`col-md-12 d-none d-md-block ${styles.sidebar}`} activeKey={selectedKey} onSelect={selectKey}>
        {userData &&
          appMenuItemsData.map((menu) => (
            <Nav.Item
              href={menu.link}
              key={menu.id}
              className={`${styles.menuItem} ${router.pathname.includes(menu.link) && styles.menuItemActive
                } d-flex  align-items-center`}
            >
              <Nav.Link eventKey={menu.id} className="float-left">
                <Link href={menu.link} passHref className="flex-grow-1">
                  <div className="side-menu">
                    <img
                      src={router.pathname.includes(menu.link) ? menu.IconActive : menu.Icon}
                      alt="Logo"
                      height="20"
                      width="20"
                      className="me-2"
                    />
                    <span className="flex-grow-1">{menu.name}</span>
                  </div>
                </Link>
              </Nav.Link>
            </Nav.Item>
          ))}
        <div className="bottom-logo">
          {/* <img src="/images/colectiv_logo.jpeg" alt="Logo" height="55" width="238" className="me-2" /> */}
          <img src="/images/colectiv_logo.jpg" alt="Logo" height="70" className="me-2" />
        </div>
      </Nav>
    </>
  );
};
export default Sidebar;
