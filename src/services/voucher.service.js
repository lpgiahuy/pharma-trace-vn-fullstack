import apiClient from './apiClient'

export const voucherService = {
  async applyVoucher(code, totalAmount) {
    const { data } = await apiClient.post('/vouchers/apply', {
      ma_code: code,
      tong_tien_don_hang: totalAmount
    })
    return data.data || data
  },
}
