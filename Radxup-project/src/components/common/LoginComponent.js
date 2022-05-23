import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Container, Form, Row, Button, Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { userConfig } from '../../constants/constant';
import { login } from '../../store/actions/user';
import Validation from '../../utils/validations';
import styles from '../../../src/stylesheets/Home.module.scss';

function LoginComponent() {
  const [areErrors, showErrors] = useState(false);
  const [data, setData] = useState({});
  const [isLoading, setLoading] = useState(false);
  const userData = useSelector(({ user }) => user.userData);
  const router = useRouter();
  const dispatch = useDispatch();
  const onChangeHandler = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (userData && userData.role_id) {
      router.push(userConfig[userData.role_id]);
    }
  }, [userData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    let payload = {
      email: data.email,
    };
    showErrors(true);
    // setLoading(true);
    dispatch(login(payload));
  };

  const { email } = data;
  return (
    <div className="d-flex ms-4 mt-0 align-items-center">
      <div className={`d-flex d-nonex d-sm-blockx ${styles.loginLeftContent}`}>
        <div className={`ms-4  my-auto ${styles.loginDescContainer}`}>
          <p className={styles.loginDesc}>
            <b>Colectiv</b> is a web-based electronic data capture platform for RADx-UP research teams to create and manage
            secure data collection forms, surveys, and electronic consent forms.
          </p>

          <p className={styles.loginDesc}>
            The platform also comes preloaded with the NIH Tier 1 CDEs, a feature to securely transfer data to the RADx-UP
            CDCC, and an at-a-glance way to assess the progress of your study.
          </p>

          <p className={styles.loginDesc}>
            To learn more about Colectiv, please contact your EIT or check visit our{' '}
            <a target="_blank" href="https://radx-up.org/colectiv/" className={styles.greenText}>
              website
            </a>{' '}
            containing training materials, frequently asked questions, and more. You may also contact the Colectiv team at{' '}
            <a href="mailto:colectiv@duke.edu" target="_blank" className={styles.greenText}>
              colectiv@duke.edu
            </a>{' '}
            for additional information or to request support.
          </p>
        </div>
      </div>

      <div className={`col-md d-flex ${styles.loginRightContent}`}>
        <Form onSubmit={handleSubmit} className={styles.formContainer}>
          <Row className="mt-4">
            <Col sm={12} className="mt-4">
              <div className={styles.logoContainer}>
                <div className="mb-1">
                  <img src={'/images/final_color_logo1.svg'}></img>
                </div>
                <div className="mb-3">
                  <img src={'/images/mask-group.png'}></img>
                </div>
              </div>
            </Col>
            <Col sm={9} className="mx-auto">
              <Form.Group controlId="formBasicEmail" className={`${styles.emailBox}`}>
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  isInvalid={areErrors && !Validation.email(email)}
                  onChange={onChangeHandler}
                  value={email}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {!email ? 'Email is required' : 'Please enter a valid email'}
                </Form.Control.Feedback>
              </Form.Group>
              <Button type="submit" className="mt-3 w-100" variant="primary" size="md" disabled={isLoading}>
                Login
              </Button>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
}

export default LoginComponent;
