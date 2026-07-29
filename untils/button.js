// untils/button.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { buttons } = require('./config.json');

const styleMap = {
  Danger:    ButtonStyle.Danger,
  Secondary: ButtonStyle.Secondary,
  Primary:   ButtonStyle.Primary,
  Success:   ButtonStyle.Success,
};

async function generateButtonLabels(groqRequest, reply, selectedModule) {
  const isCode = selectedModule === 'code';

  const systemPrompt = `Bạn là AI tạo nút gợi ý tiếp theo cho người dùng.

QUY TẮC BẮT BUỘC:
- Tạo đúng 3 nút. Không hơn, không kém.
- label: tối đa 5 từ, ngắn, tự nhiên, KHÔNG dùng số thứ tự, KHÔNG viết "Câu hỏi 1/2/3", KHÔNG dùng "OK/Có/Không/Tiếp/Khác"
- followUp: câu hỏi đầy đủ, tự nhiên, đúng ngữ cảnh
- Mỗi nút phải khác mục đích nhau hoàn toàn

${isCode
  ? `VÌ ĐÂY LÀ CODE, ưu tiên label kiểu:
- "Giải thích từng dòng"
- "Cách cài đặt"
- "Fix lỗi phổ biến"
- "Tối ưu hiệu năng"
- "Viết test"
- "Refactor sạch hơn"`
  : `VÌ ĐÂY LÀ HỘI THOẠI, ưu tiên label kiểu:
- "Ví dụ thực tế"
- "So sánh cách khác"
- "Tại sao lại vậy"
- "Dùng khi nào"`}

OUTPUT: Chỉ trả về JSON array thuần. Không markdown. Không backtick. Không giải thích.`;

  const { status, body } = await groqRequest([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Tạo 3 nút gợi ý cho câu trả lời sau:\n\n${reply}` },
  ], 400);

  if (status !== 200) return null;

  try {
    const raw = body.choices?.[0]?.message?.content?.trim() ?? '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    if (!Array.isArray(parsed) || parsed.length !== 3) return null;
    if (!parsed.every(b => b.label && b.followUp)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function buildButtons(selectedModule, labels) {
  const btns = buttons[selectedModule];
  if (!btns) return null;

  const components = btns.map((b, i) => {
    const isLast = i === btns.length - 1;
    const label = isLast
      ? (selectedModule === 'code' ? 'Không' : 'OK')
      : labels?.[i]?.label ?? `Gợi ý ${i + 1}`;

    return new ButtonBuilder()
      .setCustomId(b.customId)
      .setLabel(label)
      .setStyle(styleMap[b.style] ?? ButtonStyle.Secondary);
  });

  return new ActionRowBuilder().addComponents(components);
}

module.exports = { buildButtons, generateButtonLabels, buttons };