import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class UiService {

  private defaultSwalOptions = {
    background: 'rgba(20, 30, 25, 0.65)',
    color: '#fff',
    backdrop: 'rgba(0,0,0,0.6)',
    customClass: {
      popup: 'glass-swal-popup',
      title: 'glass-swal-title',
      confirmButton: 'glass-swal-confirm',
      cancelButton: 'glass-swal-cancel'
    }
  };

  constructor() { }

  showSuccess(title: string, text?: string) {
    return Swal.fire({
      ...this.defaultSwalOptions,
      icon: 'success',
      iconColor: '#86EFAC',
      title,
      text,
      timer: 2000,
      showConfirmButton: false
    });
  }

  showError(title: string, text?: string) {
    return Swal.fire({
      ...this.defaultSwalOptions,
      icon: 'error',
      iconColor: '#FDA4AF',
      title,
      text,
      confirmButtonColor: '#FDA4AF',
      customClass: {
         ...this.defaultSwalOptions.customClass,
         confirmButton: 'glass-swal-confirm-danger'
      }
    });
  }

  showWarning(title: string, text?: string) {
    return Swal.fire({
      ...this.defaultSwalOptions,
      icon: 'warning',
      iconColor: '#FDE047',
      title,
      text,
      confirmButtonColor: '#FDE047'
    });
  }

  async confirm(title: string, text: string, confirmButtonText = 'Đồng ý', cancelButtonText = 'Hủy'): Promise<boolean> {
    const result = await Swal.fire({
      ...this.defaultSwalOptions,
      title,
      text,
      icon: 'warning',
      iconColor: '#FDE047',
      showCancelButton: true,
      confirmButtonColor: '#FDE047',
      cancelButtonColor: 'rgba(255,255,255,0.1)',
      confirmButtonText,
      cancelButtonText
    });
    return result.isConfirmed;
  }

  showLoading(text: string = 'Đang xử lý...') {
    Swal.fire({
      ...this.defaultSwalOptions,
      title: `<span style="font-weight: 800; font-size: 1.1em; letter-spacing: -0.5px;">${text}</span>`,
      html: '<div class="summer-spinner-container"><div class="summer-loader"></div></div>',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      customClass: {
        ...this.defaultSwalOptions.customClass,
        popup: 'summer-loading-popup',
        title: 'summer-loading-title'
      }
    });
  }

  hideLoading() {
    Swal.close();
  }

  showOfflineModal() {
    Swal.fire({
      ...this.defaultSwalOptions,
      icon: 'error',
      iconColor: '#FDA4AF',
      title: 'Mất kết nối Internet',
      text: 'Vui lòng kết nối mạng để tiếp tục sử dụng ứng dụng.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false
    });
  }

  closeModal() {
    Swal.close();
  }
}
