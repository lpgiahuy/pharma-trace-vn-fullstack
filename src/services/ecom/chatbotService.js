import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchProductsForContext } from '../../models/ecom/chatbotModel.js';

// Stop words tiếng Việt thông dụng, không có giá trị tìm kiếm thuốc
const STOP_WORDS = new Set([
    'tôi', 'mình', 'bị', 'thì', 'nên', 'sử', 'dụng', 'là', 'và', 'có', 'cho',
    'với', 'của', 'được', 'các', 'những', 'một', 'trong', 'hay', 'hoặc', 'muốn',
    'hỏi', 'về', 'cần', 'dùng', 'uống', 'mua', 'nào', 'gì', 'không', 'có',
    'thế', 'nào', 'ạ', 'ơi', 'nhé', 'vậy', 'thôi', 'đó', 'này', 'kia', 'đây',
    'bạn', 'em', 'anh', 'chị', 'tui', 'ta', 'họ', 'mà', 'khi', 'lúc', 'rồi',
    'thì', 'mà', 'à', 'ừ', 'uh', 'ok', 'okay', 'vâng', 'dạ', 'cho', 'hỏi',
]);

const extractKeywords = (message) => {
    const words = message
        .toLowerCase()
        .replace(/[.,!?;:"'()[\]]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 2 && !STOP_WORDS.has(w));

    // Giữ cả bigram (2 từ liền nhau) để khớp cụm như "thiếu máu", "đau đầu"
    const bigrams = [];
    for (let i = 0; i < words.length - 1; i++) {
        bigrams.push(`${words[i]} ${words[i + 1]}`);
    }

    // Unique, tối đa 8 terms để tránh query quá dài
    return [...new Set([...bigrams, ...words])].slice(0, 8);
};

const genAI = new GoogleGenerativeAI(process.env.API_GEMINI);
const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });

const SYSTEM_PROMPT = `Bạn là trợ lý tư vấn dược phẩm thông minh của PharmaTrace VN - hệ thống nhà thuốc trực tuyến uy tín tại Việt Nam.

NHIỆM VỤ:
- Tư vấn thông tin về thuốc dựa trên dữ liệu sản phẩm được cung cấp trong mỗi tin nhắn của người dùng.
- Giải thích công dụng, liều dùng, tác dụng phụ, chống chỉ định một cách dễ hiểu cho người không chuyên.
- Gợi ý sản phẩm phù hợp với triệu chứng hoặc nhu cầu của khách hàng.

QUY TẮC BẮT BUỘC:
1. Chỉ tư vấn dựa trên sản phẩm có trong phần [DỮ LIỆU SẢN PHẨM] được cung cấp. Không bịa đặt thông tin thuốc không có trong hệ thống.
2. Với THUỐC KÊ ĐƠN, luôn nhắc khách cần có đơn bác sĩ và không được tự ý sử dụng.
3. Không đưa ra chẩn đoán bệnh. Chỉ cung cấp thông tin thuốc và khuyến nghị gặp bác sĩ hoặc dược sĩ.
4. Nếu không tìm thấy sản phẩm phù hợp trong hệ thống, hãy nói thẳng và đề nghị khách liên hệ dược sĩ trực tiếp.
5. Trả lời ngắn gọn, rõ ràng, thân thiện bằng tiếng Việt. Dùng emoji phù hợp để dễ đọc.
6. Khi đề cập giá, nói rõ đây là giá tham khảo và có thể thay đổi.`;

const formatProductContext = (products) => {
    if (!products || products.length === 0) {
        return 'Không tìm thấy sản phẩm phù hợp trong hệ thống PharmaTrace VN.';
    }

    return products.map((p, i) => {
        const ct = p.chi_tiet_thuoc || {};
        const lines = [`--- SẢN PHẨM ${i + 1}: ${p.ten_thuoc} ---`];

        if (p.ten_danh_muc) lines.push(`Danh mục: ${p.ten_danh_muc}`);
        if (p.nha_san_xuat) lines.push(`Nhà sản xuất: ${p.nha_san_xuat}`);
        lines.push(`Loại: ${p.la_thuoc_ke_don ? 'THUỐC KÊ ĐƠN (bắt buộc có đơn bác sĩ)' : 'Thuốc không kê đơn'}`);
        if (p.gia_ban_thap_nhat) lines.push(`Giá tham khảo từ: ${Number(p.gia_ban_thap_nhat).toLocaleString('vi-VN')}đ`);
        if (p.mo_ta_ngan) lines.push(`Mô tả ngắn: ${p.mo_ta_ngan}`);

        const toText = (val, limit = 3) =>
            Array.isArray(val) ? val.slice(0, limit).join('; ') : (typeof val === 'string' ? val : null);

        if (ct.mo_ta_chung) lines.push(`Thông tin chung: ${ct.mo_ta_chung}`);
        const ingredients = toText(ct.ingredients);
        if (ingredients) lines.push(`Hoạt chất: ${ingredients}`);
        const chiDinh = toText(ct.chi_dinh);
        if (chiDinh) lines.push(`Chỉ định: ${chiDinh}`);
        const chongChiDinh = toText(ct.chong_chi_dinh);
        if (chongChiDinh) lines.push(`Chống chỉ định chính: ${chongChiDinh}`);
        const tacDungPhu = toText(ct.tac_dung_phu);
        if (tacDungPhu) lines.push(`Tác dụng phụ thường gặp: ${tacDungPhu}`);
        if (ct.huong_dan_su_dung?.cach_dung) lines.push(`Cách dùng: ${ct.huong_dan_su_dung.cach_dung}`);
        if (ct.huong_dan_su_dung?.lieu_dung) lines.push(`Liều dùng: ${ct.huong_dan_su_dung.lieu_dung}`);
        const canhBao = toText(ct.canh_bao_than_trong, 1);
        if (canhBao) lines.push(`Lưu ý quan trọng: ${canhBao}`);
        if (ct.duoc_luc_hoc?.co_che_tac_dung) lines.push(`Cơ chế: ${ct.duoc_luc_hoc.co_che_tac_dung}`);

        return lines.join('\n');
    }).join('\n\n');
};

const sendMessage = async (message, history = []) => {
    // 1. Tách từ khóa → tìm sản phẩm liên quan từ DB
    const keywords = extractKeywords(message);
    const products = await searchProductsForContext(keywords);
    const productContext = formatProductContext(products);

    // 2. Chuyển định dạng history: { role, content } → { role: 'user'|'model', parts: [{text}] }
    // Giới hạn 10 lượt gần nhất để tránh vượt context window
    const recentHistory = history.slice(-10);
    const geminiHistory = recentHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    }));

    // 3. Ghép dữ liệu sản phẩm vào tin nhắn hiện tại
    const enrichedMessage = `${message}\n\n[DỮ LIỆU SẢN PHẨM TỪ HỆ THỐNG PHARMATRACE]\n${productContext}`;

    // 4. Khởi tạo phiên chat với history
    const chat = model.startChat({
        history: geminiHistory,
    });

    // 5. Ghép system prompt vào tin nhắn và gửi
    const messageWithSystem = `${SYSTEM_PROMPT}\n\n---\n\n${enrichedMessage}`;
    const result = await chat.sendMessage(messageWithSystem);
    const replyText = result.response.text();

    return {
        reply: replyText,
        productsFound: products.map(p => ({
            id: p.id,
            ten_thuoc: p.ten_thuoc,
            slug: p.slug,
            la_thuoc_ke_don: p.la_thuoc_ke_don,
            gia_ban_thap_nhat: p.gia_ban_thap_nhat,
        }))
    };
};

export { sendMessage };
