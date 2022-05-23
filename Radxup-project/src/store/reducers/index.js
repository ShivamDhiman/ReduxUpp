import { combineReducers } from 'redux';
import user from './user';
import participants from './participants';
import eicf from './eicforms';
import forms from './forms';
import dataManagement from './dataManagement';
import survey from './survey';
import CDEList from './CDEQuestions';
import studyManagement from './studyManagement';
import auditTrail from './auditTrail';
import armList from './armList';
import UserManagement from './UserManagement';

// import loading from './loading';
import error from './error';

const appReducer = combineReducers({
  // loading,
  user,
  error,
  participants,
  eicf,
  forms,
  dataManagement,
  survey,
  CDEList,
  studyManagement,
  auditTrail,
  armList,
  UserManagement,
});

const rootReducer = (state, action) => {
  if (action.type === 'LOGOUT') {
    state = {};
  }
  return appReducer(state, action);
};

export default rootReducer;
