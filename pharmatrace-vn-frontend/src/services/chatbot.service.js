import apiClient from './apiClient'

export const chatbotService = {
  async sendMessage(message, history = []) {
    const { data } = await apiClient.post('/chatbot/message', { message, history }, { timeout: 60000 })
    return data.data
  }
}
