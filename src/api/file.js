/**
 * 文件相关API
 */
import { del } from './request';
import { BASE_URL } from '@/config';

/**
 * 获取文件URL
 * @param {string} subPath - 子路径
 * @param {string} fileName - 文件名
 */
export function getFileUrl(subPath, fileName) {
  if (subPath) {
    return `${BASE_URL}/api/files/${subPath}/${fileName}`;
  }
  return `${BASE_URL}/api/files/${fileName}`;
}

/**
 * 上传文件
 * @param {File} file - 文件对象
 * @param {string} type - 文件类型 (avatar/product-image/default)
 */
export async function uploadFile(file, type = 'default') {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);

  let url = '/api/files/upload';
  if (type === 'avatar') {
    url = '/api/files/upload/avatar';
  } else if (type === 'product-image') {
    url = '/api/files/upload/product-image';
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: formData,
  });

  return response.json();
}

/**
 * 批量上传文件（管理员）
 * @param {FileList} files - 文件列表
 */
export async function uploadFiles(files) {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i]);
  }

  const response = await fetch(`${BASE_URL}/api/files/upload/batch`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: formData,
  });

  return response.json();
}

/**
 * 删除文件（管理员）
 * @param {string} subPath - 子路径
 * @param {string} fileName - 文件名
 */
export function deleteFile(subPath, fileName) {
  return del(`/api/files/${subPath}/${fileName}`);
}

/**
 * 根据URL删除文件（管理员）
 * @param {string} fileUrl - 文件URL
 */
export function deleteFileByUrl(fileUrl) {
  return del(`/api/files/by-url?fileUrl=${encodeURIComponent(fileUrl)}`);
}
