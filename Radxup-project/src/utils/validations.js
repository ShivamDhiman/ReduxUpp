import * as moment from 'moment';

const number = (value) => {
  // eslint-disable-next-line no-restricted-globals
  return !isNaN(parseFloat(value));
};

const empty = (value) => {
  const val = value ? value.toString().trim() : value || value === 0;
  return !val;
};

const boolean = (value) => {
  if (typeof value === 'boolean') {
    return true;
  }
  if (value === true || value === false || value === 'true') {
    return true;
  }
  return false;
};

const min2 = (value) => {
  return !empty(value) && value.length >= 2;
};

const minOf = (value, min) => {
  return !empty(value) && value.length >= min;
};

const maxOf = (value, max) => {
  return !empty(value) && value.length < max;
};

const name = (value) => {
  const reName = /^[a-zA-Z0-9-_]+$/;
  return value.length >= 2 && value.length <= 30 && reName.test(value);
};
const nameval = (value) => {
  const reName = /^[A-Za-z.-]+(\s*[A-Za-z.-]+)*$/;
  return value.length >= 2 && value.length <= 30 && reName.test(value);
};
const namevalue = (value) => {
  const reName = /^([A-Za-z]\s*)+[a-zA-Z0-9!\(\)\.\,\-\_\:\'\s)\(]{1,}$/g;
  return reName.test(value);
};

const specialAlphaNum = (value) => {
  const reName = /^([A-Za-z0-9]\s*)+[a-zA-Z0-9!\(\)\.\,\-\_\:\'\s)\(]{1,}$/g;
  return reName.test(value);
};

const email = (value) => {
  const re =
    /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(value).toLowerCase());
};

const numericPhone = (value) => {
  const reNum = /^[0-9]*$/;
  return !empty(value) && value.length == 10 && reNum.test(value);
};

const phone = (value) => {
  // const rePhone = /\+(9[976]\d|8[987530]\d|6[987]\d|5[90]\d|42\d|3[875]\d|2[98654321]\d|9[8543210]|8[6421]|6[6543210]|5[87654321]|4[987654310]|3[9643210]|2[70]|7|1)\d{1,14}$/;
  const rePhone = /^(\+\d{1,3}[- ]?)?\d{11}$/;
  return !empty(value) && rePhone.test(value);
};

const password = (value) => {
  // const re = /^[a-zA-Z0-9!@#$%^&]+$/;
  const re = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#!@$^&*_-]).{8,}$/;
  return !empty(value) && value.length >= 8 && re.test(value);
};

const date = (value) => {
  return moment(value).isValid();
};

const url = (str) => {
  const regexp =
    /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
  if (regexp.test(str)) {
    return true;
  }

  return false;
};

const ageNum = (value) => {
  return !empty(value) && value <= 99;
};

// Returns true if it is valid
const isCharAndNum = (value) => {
  const regexp = /^[a-zA-Z0-9]*$/;
  if (regexp.test(value) && !empty(value)) {
    return true;
  }
  return false;
};

// Returns true if it is valid
const description = (value) => {
  if (!value) {
    return false;
  }
  value = value.trim();
  return value.length >= 2 && value.length <= 200;
};

const Validation = {
  empty,
  boolean,
  min2,
  minOf,
  name,
  number,
  numericPhone,
  email,
  phone,
  date,
  password,
  url,
  ageNum,
  maxOf,
  nameval,
  isCharAndNum,
  description,
  namevalue,
  specialAlphaNum,
};

export default Validation;
