import Swal from 'sweetalert2';

const theme = {
  background: '#16213e',
  color: '#f1f5f9',
  confirmButtonColor: '#6366f1',
  cancelButtonColor: '#334155',
  customClass: {
    popup: 'swal-custom-popup',
    title: 'swal-custom-title',
    confirmButton: 'swal-custom-confirm',
    cancelButton: 'swal-custom-cancel',
  }
};

export const showAlert = (title, text, icon = 'info') => {
  return Swal.fire({
    title,
    text,
    icon,
    ...theme
  });
};

export const showConfirm = (title, text, confirmText = 'Aceptar', cancelText = 'Cancelar') => {
  return Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    ...theme
  });
};

export const showSuccess = (title, text) => {
  return Swal.fire({
    title,
    text,
    icon: 'success',
    ...theme,
    timer: 3000,
    timerProgressBar: true
  });
};

export const showError = (title, text) => {
  return Swal.fire({
    title,
    text,
    icon: 'error',
    ...theme
  });
};

export default {
  alert: showAlert,
  confirm: showConfirm,
  success: showSuccess,
  error: showError
};
