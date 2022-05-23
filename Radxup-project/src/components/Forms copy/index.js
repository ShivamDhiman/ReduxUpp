import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { InputGroup, Modal, Pagination, Tab, Tabs, Table, OverlayTrigger, Popover } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { encodeData, isAuth } from '../../helpers/auth';
import BuildFormModal from './BuildFormModal';
import styles from '../../stylesheets/Forms.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import { setForms } from '../../store/actions/forms';
import { decodeData } from '../../helpers/auth';
import { WithAuth } from '../common/WithAuth';
import { setCDESummary } from '../../store/actions/CDEQuestions';

const FormListComponent = dynamic(() => import('./FormList'));

function Forms() {
  const [key, setKey] = useState('Published');
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  let user = isAuth();
  const dispatch = useDispatch();
  const [searchKey, setSearchKey] = useState({ searchKey: '' });
  const [loading, formsList] = useSelector((Gstate) => [Gstate.forms?.loading, Gstate.forms?.formList]);
  const [formsDataByType, setFormsDataByType] = useState({ drafts: [], published: [], archives: [] });
  const { drafts, published, archives } = formsDataByType;
  const [cdeSummaryLoading, cdeSummary] = useSelector((Gstate) => [Gstate.CDEList?.loading, Gstate.CDEList?.cdeSummary]);
  const [question, setquestion] = useState({
    Pediatrics: 'Pediatrics Agreed to Collect CDEs',
    Adult: 'Adult Agreed to Collect CDEs',
  });

  useEffect(() => {
    dispatch(setForms());
    dispatch(setCDESummary(user?.study_id));
    if (router.query.redirect) {
      redirectOnCancel(router.query.redirect);
    }
  }, []);

  useEffect(() => {
    if (formsList) {
      const drafts = formsList.filter((entry) => entry.status == 'Draft');
      const published = formsList.filter((entry) => entry.status == 'Published');
      const archives = formsList.filter((entry) => entry.status == 'Archive');
      setFormsDataByType({ drafts, published, archives });
    }
  }, [formsList, formsList?.length, loading]);

  const redirectOnCancel = (value) => {
    const decoded = decodeData(value);
    if (decoded == 'Draft') {
      return setKey('Draft');
    }
    if (decoded == 'Archive') {
      return setKey('Archive');
    }
    if (decoded == 'Published') {
      return setKey('Published');
    }
  };

  const onChangeHandler = (e) => {
    setSearchKey({ [e.target.name]: e.target.value });
  };

  const handleClose = () => {
    setShowModal(false);
  };

  const addFormAction = (formState) => {
    setShowModal(false);
    if (['Create from Scratch', 'Use Default CDE Template'].includes(formState.formCategory)) {
      router.push({
        pathname: '/forms/add',
        query: { type: encodeData(formState) },
      });
    }
    if (formState.formCategory == 'Use Variables from existing form') {
      router.push({
        pathname: '/forms/edit',
        query: { type: encodeData(formState) },
      });
    }
  };
  const popover = (que) => (
    <Popover id="popover-basic">
      <Popover.Body className={styles.popoverText}>{que}</Popover.Body>
    </Popover>
  );

  const handleShow = () => setShowModal(true);

  return (
    <>
      <Modal className="custom-modal" show={showModal} onHide={handleClose} backdrop="static" keyboard={false} centered>
        <BuildFormModal handleClose={handleClose} addFormAction={addFormAction} forms={published}></BuildFormModal>
      </Modal>
      <div className="row mb-4 data-table-header">
        <div className="col-2 ">
          <label className={`float-start ${styles.header}`}>Forms</label>
        </div>
        <div className="col-8 d-flex justify-content-end ">
          <div className="d-flex me-2 col-4 justify-content-end">
            <span className={`align-self-center me-2 ${styles.PediatricCDElabel}`}>
              Pediatric CDEs
              <OverlayTrigger
                onExit={false}
                rootClose
                trigger="click"
                placement="bottom"
                overlay={popover(question.Pediatrics)}
              >
                <img src={'/images/information.svg'} height="20" className="ms-2" />
              </OverlayTrigger>
            </span>
            <div className={`${styles.PediatricCDEs}`}>
              {cdeSummary.Pediatric?.usedCDECount || '0'} of {cdeSummary.Pediatric?.studyCDECount || '0'}
            </div>
          </div>
          <div className="d-flex col-4 justify-content-center">
            <span className={`align-self-center me-2 ${styles.PediatricCDElabel}`}>
              Adult CDEs
              <OverlayTrigger onExit={false} rootClose trigger="click" placement="bottom" overlay={popover(question.Adult)}>
                <img src={'/images/information.svg'} height="20" className="ms-2" />
              </OverlayTrigger>
            </span>
            <div className={`${styles.PediatricCDEs}`}>
              {cdeSummary.Adult?.usedCDECount || '0'} of {cdeSummary.Adult?.studyCDECount || '0'}
            </div>
          </div>
        </div>
        <div className="col-2">
          <button className="btn btn-primary mx-1  primary-button-bg float-end" onClick={handleShow}>
            Build New Form
          </button>
        </div>
      </div>
      <div className="row mb-4 top-tabs">
        <div className="fixed-search">
          <InputGroup className="search-input">
            <input
              placeholder="Search..."
              value={searchKey.searchKey}
              name="searchKey"
              onChange={onChangeHandler}
              type="text"
              className="form-control"
              maxLength="15"
            />
            <div className="search-icon">
              <img src={'/images/search_icon.svg'}></img>
            </div>
          </InputGroup>
        </div>
        <div className="col-md-12 tab-headings">
          <Tabs id="controlled-tab-example" activeKey={key} onSelect={(k) => setKey(k)} className="mb-3">
            <Tab eventKey="Draft" title="Draft">
              <FormListComponent loading={loading} type={'Draft'} formList={drafts} searchKey={searchKey.searchKey} />
            </Tab>
            <Tab eventKey="Published" title="Published">
              <FormListComponent loading={loading} type={'Published'} formList={published} searchKey={searchKey.searchKey} />
            </Tab>
            <Tab eventKey="Archive" title="Archive">
              <FormListComponent loading={loading} type={'Archive'} formList={archives} searchKey={searchKey.searchKey} />
            </Tab>
          </Tabs>
        </div>
      </div>
    </>
  );
}

export default WithAuth(Forms);
