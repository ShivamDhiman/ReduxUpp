import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { InputGroup, Tab, Tabs } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import styles from '../../stylesheets/Forms.module.scss';
import router from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import { setEicforms, getICFData } from '../../store/actions/eicforms';
import { decodeData, encodeData } from '../../helpers/auth';
import { WithAuth } from '../common/WithAuth';
import EICFBuildModal from './EICFBuildModal';

// import EICFormTableComponent from './EICFormTable';
const EICFormTableComponent = dynamic(() => import('./EICFormTable'));

function EICForms() {
  const dispatch = useDispatch();
  const [key, setKey] = useState('Published');
  const [searchKey, setSearchKey] = useState();
  const [loading, ecifList, ecifCdeList] = useSelector((Gstate) => [
    Gstate.eicf?.loading,
    Gstate.eicf?.ecifList,
    Gstate.eicf.ecifCdeList,
  ]);
  const [ecifDataByType, setEcifDataByType] = useState({ drafts: [], published: [], archives: [] });
  const [ShowModal, setShowModal] = useState(false);

  const router = useRouter();
  useEffect(() => {
    dispatch(setEicforms());
    if (router.query.redirect) {
      routeFunction(router.query.redirect);
    }
  }, []);
  const routeFunction = (value) => {
    const decoded = decodeData(`${value}`);
    if (decoded == 'Draft') {
      return setKey('Draft');
    }
  };

  useEffect(() => {
    if (ecifList) {
      const drafts = ecifList.filter((entry) => entry.status == 'Draft');
      const published = ecifList.filter((entry) => entry.status == 'Published');
      const archives = ecifList.filter((entry) => entry.status == 'Archive');
      setEcifDataByType({ drafts, published, archives });
    }
  }, [ecifList, ecifList?.length, loading]);

  const buildEICF = () => {
    setShowModal(true);
    setSearchKey('');
  };

  const onChangeHandler = (e) => {
    setSearchKey(([e.target.name] = e.target.value));
  };

  const onHandleCloseAction = (data) => {
    if (data === 'Pediatric' || data === 'Adult') {
      let payload = encodeData({ category: data });
      router.push(`/informed-consent-form/add?query=${payload}`);
      // dispatch(getICFData(payload));
    }
    setShowModal(false);
  };

  return (
    <>
      {ShowModal && <EICFBuildModal open={ShowModal} handleClose={onHandleCloseAction} />}
      <div className="row mb-4 data-table-header">
        <div className="col-md-6 ">
          <label className={`float-start ${styles.header}`} />
        </div>
        <div className="col-md-6">
          <button className="btn btn-primary mx-1 primary-button-bg float-end" onClick={buildEICF}>
            Build New e-ICF
          </button>
        </div>
      </div>
      <div className="row mb-4 top-tabs">
        <div className="fixed-search">
          <InputGroup className="search-input">
            <input
              placeholder="Search..."
              value={searchKey}
              onChange={onChangeHandler}
              name="searchKey"
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
          <Tabs
            id="controlled-tab-example"
            activeKey={key}
            onSelect={(k) => setKey(k)}
            className="mb-3 mx-2"
            onClick={() => {
              searchKey ? setSearchKey('') : '';
            }}
          >
            <Tab eventKey="Draft" title="Draft">
              <EICFormTableComponent
                loading={loading}
                type={'draft'}
                ecifList={ecifDataByType.drafts}
                searchKey={searchKey}
                setSearchKey={setSearchKey}
              />
            </Tab>
            <Tab eventKey="Published" title="Published">
              <EICFormTableComponent
                loading={loading}
                type={'published'}
                ecifList={ecifDataByType.published}
                searchKey={searchKey}
                setSearchKey={setSearchKey}
              />
            </Tab>
            <Tab eventKey="Archive" title="Archive">
              <EICFormTableComponent
                loading={loading}
                type={'archives'}
                ecifList={ecifDataByType.archives}
                searchKey={searchKey}
                setSearchKey={setSearchKey}
              />
            </Tab>
          </Tabs>
        </div>
      </div>
    </>
  );
}

export default WithAuth(EICForms);
