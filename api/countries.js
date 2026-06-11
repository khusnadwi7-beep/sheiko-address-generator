export default async function handler(req, res) {
  const API_KEY = process.env.REST_COUNTRIES_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({
      error: "REST_COUNTRIES_API_KEY belum diisi di Vercel Environment Variables"
    });
  }

  try {
    const response = await fetch("https://api.restcountries.com/countries/v5?q=", {
      headers: {
        Authorization: `Bearer ${API_KEY}`
      }
    });

    const text = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Gagal mengambil data REST Countries",
        status: response.status,
        detail: text
      });
    }

    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");
    return res.status(200).send(text);
  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      detail: err.message
    });
  }
}
