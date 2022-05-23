/* eslint-disable no-underscore-dangle */

export const handleCheckboxChange = (name, _this, cb) => (event) => {
  const _name = name.split('.');
  if (_name.length === 1) {
    _this.setState({ [name]: event.target.checked });
    return;
  }

  let node = _this.state;
  for (let i = 0; i < _name.length; i += 1) {
    node = node[_name[i]];
    if (i === _name.length - 2) {
      node[_name[i + 1]] = event.target.checked;
    }
  }
  _this.setState(_this.state, () => {
    if (cb) {
      cb();
    }
    return 0;
  });
};

export const handleChange = (name, _this, cb) => (event) => {
  const _name = name.split('.');
  if (_name.length === 1) {
    _this.setState({
      [name]: event && event.target ? event.target.value : event,
    }); // if event == value
    return;
  }
  let node = _this.state;
  for (let i = 0; i < _name.length; i += 1) {
    node = node[_name[i]];
    if (i === _name.length - 2) {
      node[_name[i + 1]] = event && event.target ? event.target.value : event; // if event == value
    }
  }
  _this.setState(_this.state, () => {
    if (cb) {
      cb();
    }
    return 0;
  });
};
