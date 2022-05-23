import { Button, Modal, Spinner } from 'react-bootstrap';
import styles from '../../stylesheets/Common.module.scss';

const ConfirmModal = ({ open, handleClose, data, loading }) => {
  const { actionType, module, text, id } = data;
  const actionText = {
    delete: `Delete ${module === 'form' ? 'Form' : 'E-Content Form'} `,
    archive: `Archive ${module === 'form' ? 'Form' : 'E-Content Form'}`,
    deleteBody: `you want to delete this ${module === 'form' ? 'Form' : 'E-Consent Form'} ?`,
    archiveBody: `you want to move this ${module === 'form' ? 'Form' : 'E-Consent Form'} in archive?`,
    unlink: `Delete Question`,
    unlinkBody: `you want to delete this question, child associated with it also gets deleted`,
    deleteBtn: 'Delete',
    archiveBtn: 'Ok',
    unlinkBtn: 'Delete',
    Add: 'Add New Study',
    Delete: 'Deregister User',
    Update: 'Update Study Details',
    Cancel: 'Cancel Study Details',
    TemplateDelete: 'Delete Email Template',
    TemplateCancel: 'Cancel Email Template',
    AddBtn: 'Add',
    UpdateBtn: 'Update',
    CancelBtn: 'Back',
    DeleteBtn: 'Delete',
    TemplateDeleteBtn: 'Delete',
    AddBody: 'you want to add new study?',
    UpdateBody: 'you want to update the study?',
    CancelBody: 'you want to cancel the study?',
    DeleteBody: 'you want to deregister the user?',
    TemplateDeleteBody: 'you want to delete the template?',
    save: 'Update Status',
    saveBtn: 'Save',
    saveBody: 'you want to Update status?',
  };

  return (
    <>
      <Modal
        className={`custom-modal`}
        show={open}
        onHide={() => handleClose(false)}
        backdrop="static"
        keyboard={false}
        centered
      >
        <Modal.Header closeButton className="modal-header pb-0">
          <Modal.Title className="title fw-bold">{actionText[actionType]}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className={styles['confirm-modal-body']}>
            {text ? (
              <h4>Cancel without saving changes ?</h4>
            ) : (
              <h4>
                Are you sure,
                <br /> {actionText[`${actionType}Body`]}
              </h4>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="modal-footer mb-4">
          <Button className="mx-3" variant="secondary" size="md" onClick={() => handleClose(false)}>
            {text ? 'No' : 'Cancel'}
          </Button>
          <Button variant="primary" size="md" onClick={() => handleClose(data)} disabled={loading}>
            {loading && <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" className="me-2" />}
            {text ? 'Yes' : actionText[`${actionType}Btn`]}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ConfirmModal;
