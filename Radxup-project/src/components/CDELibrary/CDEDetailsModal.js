import { useState } from 'react';
import { Button, Col, Modal, Row } from 'react-bootstrap';
import styles from '../../stylesheets/CDELibrary.module.scss';
import '../../stylesheets/CDELibrary.module.scss';
import QuestionAttributes from './QuestionAttributes';

const CDEDetailsModal = ({ open, handleClose, details }) => {
  const [lang, setLang] = useState('English');

  const handleLang = (e) => {
    setLang(e.target.value);
  };
  let linkedTo = details[lang]?.Adult?.linked_variable_name || details[lang]?.Peadiatric?.linked_variable_name;
  let linkedValue = details[lang]?.Adult?.question_attributes_label || details[lang]?.Peadiatric?.question_attributes_label;
  if (linkedTo) {
    linkedTo = linkedTo.join(' ,');
  }

  return (
    <>
      <Modal className={`cde-modal`} show={open} onHide={() => handleClose(false)} backdrop="static">
        <Modal.Header closeButton className="modal-header pb-0"></Modal.Header>
        <Modal.Body>
          <Col md={12}>
            <Row className="align-items-center">
              <Col md={5}>
                <div className={styles.vbNameBox}>
                  <span className={styles.vNameLable}>Variable Name :</span>
                  <span className={styles.vNameValue}>{` ${details[lang].Adult?.variable_name}`}</span>
                </div>
              </Col>
              <Col className={'d-flex justify-content-end'} md={7}>
                <div>
                  <Button
                    onClick={handleLang}
                    value="English"
                    className={`btn ${lang === 'English' ? 'btn-primary' : styles.inactive} mx-1`}
                  >
                    English
                  </Button>
                  <Button
                    onClick={handleLang}
                    value="Spanish"
                    className={`btn ${lang === 'Spanish' ? 'btn-primary' : styles.inactive}`}
                  >
                    Spanish
                  </Button>
                </div>
              </Col>
            </Row>
            <div className="d-flex align-items-center my-4">
              <div className={styles.containtView}>
                <span className={`${styles.vNameLable} ${styles.labelWidth}`}>Linked to</span>
                <div className={`${styles.disableInput} mx-2 ${styles.linkedTo}`}>
                  <span className={`${styles.answerText} `}>{linkedTo}</span>
                </div>
              </div>
              <div className={`${styles.containtView} my-4`}>
                <span className={`${styles.vNameLable} ${styles.labelWidth}`}>{'Linked value'}</span>
                <div className={`${styles.disableInput} mx-2 ${styles.linkedTo}`}>
                  <span className={styles.answerText}> {linkedValue}</span>
                </div>
              </div>
            </div>
            <div className="my-2">
              <span className={styles.vNameValue}>{` ${'Adult Question'}`}</span>
              <div className={`${styles.disableInput}`}>
                <span className={styles.answerText}>{details[lang]?.Adult?.question}</span>
              </div>
            </div>
            <div className="my-2">
              <span className={styles.vNameValue}>{` ${'Paediatric Question'}`}</span>
              <div className={`${styles.disableInput}`}>
                <span className={styles.answerText}>{details[lang]?.Peadiatric?.question}</span>
              </div>
              <div className={`${styles.disableInput} my-2`}>
                <span className={styles.vNameValue}>{` ${'Hint:-  '}`}</span>
                <span className={styles.answerText}>{details[lang]?.Adult?.hint}</span>
              </div>
            </div>
            <Row className={'my-4 align-items-center'}>
              {/* <Col className="my-2" md={5}>
                <div>
                  <span className={styles.vNameLable}>Variable Name :</span>
                  <span className={styles.vNameValue}>{details[lang]?.Adult?.variable_name}</span>
                </div>
              </Col> */}
              <Col md={10} className="my-2 ms-3">
                <Row className="align-items-center my-2">
                  <div className={styles.containtView}>
                    <span className={styles.vNameLable}>Response Type:</span>
                    <div className={`${styles.disableInput} mx-2`}>
                      <span className={styles.answerText}>{details[lang]?.Adult?.response_type}</span>
                    </div>
                  </div>
                </Row>
              </Col>
            </Row>
            <div className={`${styles.divider} ms-3`} />
            <Col md={6}>
              <QuestionAttributes styles={styles} question={details[lang]?.Adult} />
            </Col>
          </Col>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default CDEDetailsModal;
