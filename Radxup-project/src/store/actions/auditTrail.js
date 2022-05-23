import API from '../../helpers/api';
import { toast } from 'react-toastify';
import { handleErrorMessage } from '../../utils/commonFunctions';

export function auditTrailDataList() {
  return (dispatch) => {
    dispatch({ type: 'REQUEST_AUDIT_TRIALS' });
    API.apiGet('auditList')
      .then((response) => {
        if (response.data && response.data.success === true && response.data.data) {
          toast.success(response.data.message);
          dispatch({ type: `SET_AUDIT_TRIALS`, payload: response.data.data });
        }
      })
      .catch((err) => {
        handleErrorMessage(err);
        dispatch({ type: `SET_AUDIT_TRIALS`, payload: [] });
      });
  };
}
