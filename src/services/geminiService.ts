import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export const generateAIResponse = async (prompt: string, context?: any) => {
  const ai = getAI();
  const systemInstruction = `
    Anda adalah asisten AI pintar bernama "WARUNG+ Assistant" untuk aplikasi manajemen UMKM kuliner di Indonesia.
    Tujuan Anda adalah membantu pemilik warung (User) dalam mengelola bisnis mereka.
    Gaya bicara: Ramah, santun (menggunakan Bahasa Indonesia yang sopan tapi santai), solutif, proaktif, dan memotivasi.
    Gunakan informasi konteks yang diberikan (stok, penjualan, cuaca) untuk memberikan saran yang spesifik.
    
    Aturan:
    1. Berikan analisa yang logis.
    2. Jika cuaca hujan, rekomendasikan menu hangat (kopi panas, teh hangat, mi instan).
    3. Jika cuaca panas, rekomendasikan menu dingin (es kopi, es teh, es krim).
    4. Selalu motivasi pemilik warung.
    5. Singkatkan jawaban jika memungkinkan agar mudah dibaca di mobile.
    6. Fokus pada keuntungan dan efisiensi stok.
  `;

  const fullPrompt = context 
    ? `Konteks Bisnis Saat Ini:\n${JSON.stringify(context, null, 2)}\n\nPertanyaan/Permintaan User: ${prompt}`
    : prompt;

  let retries = 5;
  let delay = 2000;

  while (retries > 0) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: fullPrompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      if (!response.text) {
        throw new Error("No text returned from Gemini");
      }

      return response.text;
    } catch (error: any) {
      console.error(`Gemini AI Attempt Failed (${retries} left):`, error);
      
      // Check if it's a 503 (Service Unavailable) or 429 (Rate Limit)
      const errorMsg = error?.message || "";
      const isRetryable = errorMsg.includes("503") || errorMsg.includes("429") || errorMsg.includes("UNAVAILABLE");

      if (isRetryable && retries > 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        retries--;
        delay *= 2; // Exponential backoff
        continue;
      }
      
      return "Maaf, sistem AI sedang mengalami gangguan sejenak karena traffic sedang tinggi. Silakan coba lagi nanti.";
    }
  }
};

export const getAIInsight = async (data: any) => {
  const prompt = "Berikan 1 insight singkat (maksimal 2 kalimat) untuk hari ini berdasarkan data bisnis tersebut. Sapa user dengan ramah.";
  return generateAIResponse(prompt, data);
};

export async function getDashboardBriefing(data: {
  userName: string;
  totalRevenue: number;
  totalProfit: number;
  topProduct: string;
  transactionCount: number;
  weather: string;
  lowStockItems: string[];
  salesTrend: 'up' | 'down' | 'stable';
}) {
  const prompt = `
    Buatlah naskah singkat (maksimal 60 kata) dalam Bahasa Indonesia untuk menyapa pemilik toko bernama ${data.userName}.
    
    Data Bisnis Hari Ini:
    - Omset: Rp ${data.totalRevenue.toLocaleString()}
    - Keuntungan: Rp ${data.totalProfit.toLocaleString()}
    - Produk Terlaris: ${data.topProduct}
    - Jumlah Transaksi: ${data.transactionCount}
    - Cuaca: ${data.weather}
    - Stok Rendah: ${data.lowStockItems.join(', ')}
    - Tren: ${data.salesTrend}

    Naskah harus terdengar seperti asisten pribadi futuristik. Sebutkan omset dan tren. Berikan rekomendasi berdasarkan cuaca. Jangan gunakan simbol Markdown.
  `;

  return generateAIResponse(prompt, { context: "Dashboard Briefing" });
}
