import API from '../../helpers/api';
import { get } from 'lodash';
import { encodeData } from '../../helpers/auth';

function requestCDEQuestions() {
  return {
    type: 'REQUEST_CDES',
  };
}

function errorCDEQuestions(err) {
  let data = get(err, 'response.data', null);
  data = data || get(err, 'response');
  data = data || err;

  return (dispatch) => {
    dispatch({
      type: 'FAILURE_CDES',
      payload: err,
    });
  };
}

export function setCDEQuestions(query) {
  return (dispatch) => {
    dispatch(requestCDEQuestions());

    API.apiGet('cdePublished', query ? `?query=${encodeData(query)}` : '')
      .then((response) => {
        if (response.data && response.data.success === true && response.data.data) {
          dispatch({ type: `RECEIVE_CDES`, payload: response.data.data, query });
        }
      })
      .catch((error) => {
        errorCDEQuestions(error)(dispatch);
      });
  };
}

export function setFormCDEQuestions(query) {
  return (dispatch) => {
    dispatch(requestCDEQuestions());

    API.apiGet('cdeCategory', query ? `?query=${encodeData(query)}` : '')
      .then((response) => {
        if (response.data && response.data.success === true && response.data.data) {
          dispatch({ type: `RECEIVE_FORM_CDES`, payload: response.data.data, query });
        }
      })
      .catch((error) => {
        errorCDEQuestions(error)(dispatch);
      });
  };
}

export function setCDESummary(query) {
  return (dispatch) => {
    dispatch(requestCDEQuestions());
    API.apiGet('cdeSummary', query ? `?studyId=${query}` : '')
      .then((response) => {
        if (response.data && response.data.success === true && response.data.data) {
          dispatch({ type: `SUMMARY_CDES`, payload: response.data.data, query });
        }
      })
      .catch((error) => {
        errorCDEQuestions(error)(dispatch);
      });
  };
}

export function selectedRequiredCDEQuestion(oldCDE, selectedCDE) {
  return (dispatch) => {
    dispatch({ type: `SELECTED_REQUIRED_CDES`, payload: { oldCDE, selectedCDE } });
  };
}

export function selectedCDEQuestion(oldCDE, selectedCDE) {
  return (dispatch) => {
    dispatch({ type: `SELECTED_CDES`, payload: { oldCDE, selectedCDE } });
  };
}

export const CDEListUpdater = (data) => {
  return (dispatch) => {
    dispatch({ type: `UPDATE_SELECTED_CDES`, payload: data });
  };
};

export const cleanCDEQUestions = () => {
  return (dispatch) => {
    dispatch({ type: `CLEAN_CDES`, payload: [] });
  };
};

export const formatCDEQuestions = (payload) => {
  return (dispatch) => {
    dispatch({ type: `FORMAT_CEE`, payload: payload });
  };
};
