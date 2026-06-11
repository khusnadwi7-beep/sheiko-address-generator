const COUNTRY_QUERIES = [
  "indonesia", "malaysia", "singapore", "thailand", "philippines",
  "vietnam", "japan", "south korea", "china", "india",
  "united states", "canada", "mexico", "brazil", "argentina",
  "united kingdom", "france", "germany", "italy", "spain",
  "netherlands", "belgium", "switzerland", "sweden", "norway",
  "denmark", "finland", "australia", "new zealand", "turkey",
  "saudi arabia", "united arab emirates", "egypt", "south africa"
];

export default async function handler(req, res) {
  const API_KEY = process.env.REST_COUNTRIES_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: "REST_COUNTRIES_API_KEY belum diisi" });
  }

  try {
    const results = [];

    for (const q of COUNTRY_QUERIES) {
      const response = await fetch(
        `https://api.restcountries.com/countries/v5?q=${encodeURIComponent(q)}`,
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`
          }
        }
      );

      if (!response.ok) continue;

      const data = await response.json();

      if (Array.isArray(data)) {
        results.push(...data);
      } else if (data?.data && Array.isArray(data.data)) {
        results.push(...data.data);
      } else {
        results.push(data);
      }
    }

    return res.status(200).json(results);
  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      detail: err.message
    });
  }
}
