import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class UiService {

  constructor() { }

  showSuccess(title: string, text?: string) {
    return Swal.fire({
      icon: 'success',
      title,
      text,
      timer: 2000,
      showConfirmButton: false
    });
  }

  showError(title: string, text?: string) {
    return Swal.fire({
      icon: 'error',
      title,
      text,
      confirmButtonColor: '#d33'
    });
  }

  showWarning(title: string, text?: string) {
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      confirmButtonColor: '#f8bb86'
    });
  }

  async confirm(title: string, text: string, confirmButtonText = 'Đồng ý', cancelButtonText = 'Hủy'): Promise<boolean> {
    const result = await Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText,
      cancelButtonText
    });
    return result.isConfirmed;
  }

  showLoading(text: string = 'Đang xử lý...') {
    Swal.fire({
      title: text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  hideLoading() {
    Swal.close();
  }

  showOfflineModal() {
    Swal.fire({
      icon: 'error',
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
