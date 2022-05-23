import API from '../../helpers/api';

export function setArmList(study_id) {
  return (dispatch) => {
    dispatch({ type: 'REQUEST_ARM_LIST' });
    API.apiGet('armList', `?study_id=${study_id}`)
      .then((response) => {
        if (response.data && response.data.success === true && response.data.data) {
          dispatch({ type: `SET_ARM_LIST`, payload: response.data.data });
        }
      })
      .catch((err) => {
        dispatch({ type: `SET_ARM_LIST`, payload: [] });
      });
  };
}
