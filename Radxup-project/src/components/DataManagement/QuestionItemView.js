import React from 'react';
import styles from '../../stylesheets/DataMgt.module.scss';

const QuestionItemView = ({ details, index }) => {
  return (
    <div className={`col-md-12 ${styles.questionItem} d-flex flex-column`}>
      <div className={'d-flex'}>
        <label className={`${styles.questionTitle}`}>{index + '.'}</label>
        <div className={'mx-4 d-flex flex-column'}>
          <label className={`${styles.questionTitle}`}>{details && details?.question}</label>
          <div className={'my-2'}>
            <label className={`${styles.answer}`}>{details && details?.answer}</label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionItemView;
