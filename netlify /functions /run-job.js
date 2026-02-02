const axios = require('axios');

exports.handler = async (event, context) => {
    // التأكد من أن الطلب من نوع POST فقط
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        // استلام البيانات من واجهة المستخدم
        const { script, userId } = JSON.parse(event.body);

        // قراءة المتغيرات التي وضعتها في إعدادات Netlify
        const owner = process.env.GH_OWNER;
        const repo = process.env.GH_REPO;
        const token = process.env.GH_TOKEN;

        // التحقق من وجود المفاتيح لضمان عدم حدوث خطأ
        if (!owner || !repo || !token) {
            return { 
                statusCode: 500, 
                body: JSON.stringify({ error: "Missing Environment Variables in Netlify" }) 
            };
        }

        // إرسال الإشارة لـ GitHub Actions
        const response = await axios.post(
            `https://api.github.com/repos/${owner}/${repo}/dispatches`,
            {
                event_type: "run-live-script", // يجب أن يطابق الاسم الموجود في ملف YAML
                client_payload: { 
                    script_code: script, 
                    user_id: userId 
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                }
            }
        );

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Success: GitHub Action Triggered!", status: response.status })
        };

    } catch (error) {
        console.error("Error details:", error.response ? error.response.data : error.message);
        return {
            statusCode: error.response ? error.response.status : 500,
            body: JSON.stringify({ 
                error: "Failed to trigger GitHub Actions", 
                details: error.response ? error.response.data : error.message 
            })
        };
    }
};
