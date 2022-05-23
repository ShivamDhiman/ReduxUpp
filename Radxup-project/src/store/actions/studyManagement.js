import API from '../../helpers/api';
import { toast } from 'react-toastify';
import { handleErrorMessage } from '../../utils/commonFunctions';

export function setStudyManagement() {
  return (dispatch) => {
    dispatch({ type: 'REQUEST_STUDY_MGMT' });
    API.apiGet('studyManagementList')
      .then((response) => {
        if (response.data && response.data.success === true && response.data.data) {
          toast.success(response.data.message);
          dispatch({ type: `SET_STUDY_MGMT`, payload: response.data.data });
        }
      })
      .catch((err) => {
        handleErrorMessage(err);
        dispatch({ type: `SET_STUDY_MGMT`, payload: [] });
      });
  };
}

export function getStudyDetails(params) {
  return (dispatch) => {
    dispatch({ type: 'REQ_STUDY_MGMT_DETAILS' });
    Promise.all([
      API.apiGet('studyDetails', params),
      API.apiGet('studyCDEs', `?studyId=${params}`),
      API.apiGet('fetchDocumentsByStudy', `?study_id=${params}`),
      API.apiGet(`getStudyAmins`, `?study_id=${params}`),
    ])
      .then(([studyDetails, studyCDEs, docs, admins]) => {
        let study = {};
        if (studyDetails.data && studyDetails.data.success === true && studyDetails.data.data) {
          study = { ...studyDetails.data.data };
        }
        if (studyCDEs.data && studyCDEs.data.success === true && studyCDEs.data.data) {
          study.cdeList = studyCDEs.data.data;
          study.summary = studyCDEs?.data?.summary;
        }
        if (docs.data && docs.data.success === true && docs.data.data) {
          study.docs = docs.data.data;
        }
        if (admins.data && admins.data.success === true && admins.data.data) {
          study.admins = admins.data.data;
        }

        dispatch({ type: `SET_STUDY_MGMT_DETAILS`, payload: study });
      })
      .catch((err) => {
        handleErrorMessage(err);
      });
    // API.apiGet('studyCDEs', `?studyId=${params}`)
    //   .then((response) => {
    //     if (response.data && response.data.success === true && response.data.data) {
    //       dispatch({ type: `SET_STUDY_MGMT_DETAILS`, payload: response.data.data });
    //     }
    //   })
    //   .catch((err) => {
    //     handleErrorMessage(err);
    //   });
    // API.apiGet('studyDetails', params)
    //   .then((response) => {
    //     if (response.data && response.data.success === true && response.data.data) {
    //       dispatch({ type: `SET_STUDY_MGMT_DETAILS`, payload: response.data.data });
    //     }
    //   })
    //   .catch((err) => {
    //     handleErrorMessage(err);
    //   });
  };
}

export function getPublicStudyDetails(params) {
  return (dispatch) => {
    dispatch({ type: 'REQ_STUDY_MGMT_DETAILS' });
    API.apiGet('studyDetails', params)
      .then((response) => {
        if (response.data && response.data.success === true && response.data.data) {
          dispatch({ type: `SET_STUDY_MGMT_DETAILS`, payload: response.data.data });
        }
      })
      .catch((err) => {
        handleErrorMessage(err);
      });
  };
}

export function clearStudyDetails() {
  return { type: `SET_STUDY_MGMT_DETAILS`, payload: {} };
}

export function fetchDocumentsByStudy(params) {
  return () => {
    return API.apiGet('fetchDocumentsByStudy', `?study_id=${params}`)
      .then((response) => {
        if (response.data && response.data.success === true && response.data.data) {
          return response.data.data;
        }
      })
      .catch((err) => {
        handleErrorMessage(err);
        return [];
      });
  };
}

export function uploadStudyDocument(payload) {
  return () => {
    return API.apiPost('uploadStudyDocument', payload)
      .then((response) => {
        if (response.data && response.data.success === true) {
          toast.success(response.data.message);
        }
      })
      .catch((err) => {
        handleErrorMessage(err);
      });
  };
}

export function fetchStudiesStats(loading) {
  return {
    type: 'REQUEST_STUDIES_STATS',
    loading,
  };
}

export function getStudiesData() {
  return (dispatch) => {
    dispatch(fetchStudiesStats(true));
    API.apiGet('getStudiesData')
      .then((response) => {
        if (response.data && response.data.success === true) {
          dispatch({ type: `GET_STUDIES_STATS`, payload: response.data.data });
        }
        dispatch(fetchStudiesStats(false));
      })
      .catch((err) => {
        dispatch(fetchStudiesStats(false));
        handleErrorMessage(err);
      });
  };
}

export function emailTemplates(params) {
  return (dispatch) => {
    dispatch({ type: 'REQUEST_EMAIL_TEMPLATE' });
    API.apiGet('getTemplate', `?study_id=${params}`)
      .then((response) => {
        if (response.data && response.data.success === true && response.data.data) {
          dispatch({ type: `SET_EMAIL_TEMPLATE`, payload: response.data.data });
        }
      })
      .catch((err) => {
        handleErrorMessage(err);
        dispatch({ type: `SET_EMAIL_TEMPLATE`, payload: [] });
      });
  };
}
export function getstudyContentDetails(params) {
  return (dispatch) => {
    dispatch({ type: 'REQUEST_STUDY_CONTENT' });
    API.apiGet('studyContent', `${params}`)
      .then((response) => {
        if (response.data && response.data.success === true && response.data.data) {
          toast.success(response.data.message);
          dispatch({ type: `SET_STUDY_CONTENT`, payload: response.data.data });
        }
      })
      .catch((err) => {
        handleErrorMessage(err);
        dispatch({ type: `SET_STUDY_CONTENT`, payload: [] });
      });
  };
}
