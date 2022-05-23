import { Button, Modal } from 'react-bootstrap';

const BriefModal = ({ openBrief, setOpenBrief }) => {
  return (
    <>
      <Modal
        className="custom-modal"
        show={openBrief}
        onHide={() => setOpenBrief(false)}
        backdrop="static"
        keyboard={false}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="modal-header pb-0">
          <Modal.Title className="title fw-bold">Study Brief:</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Welcome to the COVID-19 Testing in Gender Diverse Adults</p>
          <p>
            This study will examine the history and experiences of gender-diverse adults related to COVID-19 testing, testing
            and vaccine preferences, and social, economic, and mental health impacts of the COVID-19 pandemic. Participation
            in this study will include the completion of an online consent form, online survey(s), and self-reporting the
            results of your most recent COVID-19 test. Your information will be kept confidential.
          </p>
        </Modal.Body>
        <Modal.Footer className="modal-footer mb-4">
          <Button className="mx-3" variant="primary" size="md" onClick={() => setOpenBrief(false)}>
            Continue
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default BriefModal;
