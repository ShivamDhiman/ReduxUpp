import Autosuggest from 'react-autosuggest';
import React, { useEffect, useState } from 'react';
import styles from '../../stylesheets/Forms.module.scss';

function escapeRegexCharacters(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const AutosuggestComponent = ({ placeholder, data, index, handleSelect }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [value, setValue] = useState('');

  useEffect(() => {
    setSuggestions(data);
  }, [data]);

  const onChange = (e) => {
    setValue(e.target.value);
  };

  const inputProps = {
    placeholder: placeholder,
    value,
    onChange,
  };

  const getSuggestions = (value = '') => {
    const escapedValue = escapeRegexCharacters(value.trim().toLowerCase());
    if (escapedValue === '') {
      return data;
    }
    return data.filter((opt) => opt?.value?.toLowerCase()?.includes(escapedValue));
  };

  function renderSuggestion(suggestion) {
    if (!suggestion) return '';
    return <span>{suggestion?.value}</span>;
  }

  const onSuggestionsFetchRequested = ({ value }) => {
    setSuggestions(getSuggestions(value));
  };

  const onSuggestionSelected = (e, { suggestion }) => {
    setValue(suggestion.value);
    handleSelect(e, index);
  };

  function getSuggestionValue(suggestion) {
    return suggestion.value;
  }

  return (
    <div className={styles.autosuggest}>
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={onSuggestionsFetchRequested}
        getSuggestionValue={getSuggestionValue}
        renderSuggestion={renderSuggestion}
        onSuggestionSelected={onSuggestionSelected}
        inputProps={inputProps}
      />
    </div>
  );
};

export default AutosuggestComponent;

AutosuggestComponent.defaultProps = {
  placeholder: 'Select',
  data: [],
};
