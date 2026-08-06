import * as chatbotService from '../../services/ecom/chatbotService.js';

const chat = async (req, res, next) => {
    try {
        const { message, history } = req.body;

        if (!message || !message.trim()) {
            const err = new Error('Vui lòng nhập tin nhắn!');
            err.statusCode = 400;
            return next(err);
        }
        if (message.trim().length > 1000) {
            const err = new Error('Tin nhắn quá dài (tối đa 1000 ký tự)!');
            err.statusCode = 400;
            return next(err);
        }

        const result = await chatbotService.sendMessage(message.trim(), history || []);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export { chat };
