const API_COUNTRIES = "/api/countries";
const API_RANDOM_USER = "https://randomuser.me/api/";
const API_COUNTRIES_NOW = "https://countriesnow.space/api/v0.1/countries";

let countries = [];
let citiesData = [];
let selectedCountry = null;
let currentData = {};

const el = (id) => document.getElementById(id);

const searchInput = el("searchInput");
const countrySelect = el("countrySelect");
const bioBox = el("bioBox");
const addressBox = el("addressBox");
const moreBox = el("moreBox");
const countryInfo = el("countryInfo");

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randNum(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function showToast(msg) {
  const toast = el("toast");
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => toast.style.display = "none", 2200);
}

function getCountryName(c) {
  return c.name?.common || c.name || "Unknown";
}

function getCountryCode(c) {
  return c.cca2 || c.code || "";
}

function getDialCode(c) {
  if (c.idd?.root) {
    return `${c.idd.root}${c.idd.suffixes?.[0] || ""}`;
  }

  if (c.dialingCode) return c.dialingCode;
  return "+00";
}

function getCurrency(c) {
  if (!c.currencies) return "-";
  const key = Object.keys(c.currencies)[0];
  return key || "-";
}

function getLanguage(c) {
  if (!c.languages) return "-";
  return Object.values(c.languages)[0] || "-";
}

function getCapital(c) {
  if (Array.isArray(c.capital)) return c.capital[0] || "-";
  return c.capital || "-";
}

function makePostalCode(countryCode) {
  const formats = {
    US: () => `${randNum(10000, 99999)}`,
    ID: () => `${randNum(10000, 99999)}`,
    MY: () => `${randNum(10000, 99999)}`,
    SG: () => `${randNum(100000, 999999)}`,
    TH: () => `${randNum(10000, 99999)}`,
    PH: () => `${randNum(1000, 9999)}`,
    JP: () => `${randNum(100, 999)}-${randNum(1000, 9999)}`,
    KR: () => `${randNum(10000, 99999)}`,
    CN: () => `${randNum(100000, 999999)}`,
    IN: () => `${randNum(100000, 999999)}`,
    AU: () => `${randNum(1000, 9999)}`,
    GB: () => `${rand(["SW", "NW", "EC", "W", "M"])}${randNum(1, 9)} ${randNum(1, 9)}${rand(["AA", "AB", "BA", "ZZ"])}`,
    DE: () => `${randNum(10000, 99999)}`,
    FR: () => `${randNum(10000, 99999)}`,
    IT: () => `${randNum(10000, 99999)}`,
    ES: () => `${randNum(10000, 99999)}`,
    NL: () => `${randNum(1000, 9999)} ${rand(["AA", "AB", "BC", "ZZ"])}`,
    CA: () => `${rand(["K", "M", "V", "T"])}${randNum(1,9)}${rand(["A","B","C"])} ${randNum(1,9)}${rand(["D","E","F"])}${randNum(1,9)}`,
    BR: () => `${randNum(10000, 99999)}-${randNum(100, 999)}`
  };

  return formats[countryCode]?.() || `${randNum(10000, 99999)}`;
}

function makeStreet(countryCode) {
  const local = {
    ID: ["Jl. Melati", "Jl. Asia Afrika", "Jl. Sudirman", "Jl. Merdeka", "Jl. Diponegoro"],
    US: ["Main Street", "Oak Avenue", "Maple Drive", "Washington Street", "Sunset Boulevard"],
    GB: ["Baker Street", "Oxford Road", "King Street", "Victoria Road", "High Street"],
    FR: ["Rue Victor Hugo", "Rue Nationale", "Avenue Jean Jaurès", "Rue de Paris"],
    DE: ["Hauptstraße", "Bahnhofstraße", "Schillerstraße", "Goethestraße"],
    JP: ["Sakura Dori", "Chuo Dori", "Heiwa Dori", "Aoyama Street"]
  };

  const streets = local[countryCode] || [
    "Central Street",
    "Market Road",
    "Garden Avenue",
    "Station Street",
    "Liberty Road"
  ];

  return `${randNum(1, 999)} ${rand(streets)}`;
}

function makePhone(dial) {
  return `${dial} ${randNum(100,999)}-${randNum(1000,9999)}-${randNum(1000,9999)}`;
}

function item(label, value) {
  return `
    <div class="item">
      <small>${label}</small>
      <strong>${value || "-"}</strong>
    </div>
  `;
}

function info(label, value) {
  return `<div class="info-row">${label}: ${value || "-"}</div>`;
}

async function loadCountries() {
  countrySelect.innerHTML = `<option>Loading countries...</option>`;

  try {
    const res = await fetch(API_COUNTRIES);
    countries = await res.json();

    countries = countries
      .filter(c => getCountryName(c) && getCountryCode(c))
      .sort((a, b) => getCountryName(a).localeCompare(getCountryName(b)))
      .slice(0, 250);

    renderCountryOptions(countries);

    const indonesia = countries.find(c => getCountryName(c).toLowerCase() === "indonesia");
    selectedCountry = indonesia || countries[0];
    countrySelect.value = getCountryCode(selectedCountry);

    await generate();
  } catch (err) {
    console.error(err);
    showToast("Gagal load REST Countries");
  }
}

async function loadCitiesData() {
  try {
    const res = await fetch(API_COUNTRIES_NOW);
    const json = await res.json();
    citiesData = json.data || [];
  } catch {
    citiesData = [];
  }
}

function renderCountryOptions(list) {
  countrySelect.innerHTML = list.map(c => {
    return `<option value="${getCountryCode(c)}">${getCountryName(c)}</option>`;
  }).join("");
}

function findCities(countryName) {
  const found = citiesData.find(x =>
    x.country?.toLowerCase() === countryName.toLowerCase()
  );

  return found?.cities || [];
}

async function getRandomUser(gender, nat) {
  let url = `${API_RANDOM_USER}?inc=name,gender,dob,email,phone,nat&noinfo`;

  if (gender !== "random") url += `&gender=${gender}`;

  try {
    const res = await fetch(url);
    const json = await res.json();
    return json.results[0];
  } catch {
    return null;
  }
}

async function generate(custom = false) {
  if (!selectedCountry) return;

  const countryName = getCountryName(selectedCountry);
  const countryCode = getCountryCode(selectedCountry);
  const dial = getDialCode(selectedCountry);
  const gender = el("genderInput").value;

  const user = await getRandomUser(gender, countryCode);
  const cityList = findCities(countryName);

  const customCity = el("cityInput").value.trim();
  const customState = el("stateInput").value.trim();
  const customZip = el("zipInput").value.trim();

  const city = custom && customCity ? customCity : (cityList.length ? rand(cityList) : getCapital(selectedCountry));
  const state = custom && customState ? customState : makeState(countryCode, countryName);
  const zip = custom && customZip ? customZip : makePostalCode(countryCode);

  const first = user?.name?.first || rand(["Adam", "David", "Raka", "Lina", "Maya", "Sofia"]);
  const last = user?.name?.last || rand(["Putra", "Smith", "Wijaya", "Tanaka", "Martin"]);
  const fullName = `${first} ${last}`;

  currentData = {
    fullName,
    gender: user?.gender || gender,
    birthday: user?.dob?.date?.slice(0, 10) || `${randNum(1970, 2005)}-${randNum(1,12)}-${randNum(1,28)}`,
    age: user?.dob?.age || randNum(18, 65),
    blood: rand(["A+", "A-", "B+", "B-", "AB+", "O+", "O-"]),
    height: `${randNum(150, 190)} cm`,
    weight: `${randNum(45, 95)} kg`,
    education: rand(["High School", "Diploma", "Bachelor Degree", "Master Degree"]),
    street: makeStreet(countryCode),
    city,
    state,
    postal: zip,
    country: countryName,
    phone: makePhone(dial),
    email: user?.email || `${first.toLowerCase()}.${last.toLowerCase()}${randNum(10,99)}@example.com`,
    job: rand(["Developer", "Designer", "Doctor", "Teacher", "Engineer", "Marketing", "Manager"]),
    company: rand(["Sheiko Group", "Global Media", "Nova Digital", "Prime Studio", "Metro Works"]),
    marital: rand(["Single", "Married", "Divorced"]),
    code: countryCode,
    capital: getCapital(selectedCountry),
    dial,
    currency: getCurrency(selectedCountry),
    language: getLanguage(selectedCountry)
  };

  renderData();
}

function makeState(code, countryName) {
  const states = {
    ID: ["Jawa Barat", "DKI Jakarta", "Jawa Tengah", "Jawa Timur", "Bali", "Riau", "Sumatera Utara"],
    US: ["California", "New York", "Texas", "Florida", "Washington", "Illinois"],
    MY: ["Selangor", "Johor", "Penang", "Sabah", "Sarawak"],
    AU: ["New South Wales", "Victoria", "Queensland", "Western Australia"],
    CA: ["Ontario", "Quebec", "British Columbia", "Alberta"],
    GB: ["England", "Scotland", "Wales", "Northern Ireland"]
  };

  return rand(states[code] || [getCapital(selectedCountry), countryName]);
}

function renderData() {
  bioBox.innerHTML =
    item("Full Name", currentData.fullName) +
    item("Gender", currentData.gender) +
    item("Birthday", currentData.birthday) +
    item("Age", currentData.age) +
    item("Blood Type", currentData.blood) +
    item("Height", currentData.height) +
    item("Weight", currentData.weight) +
    item("Education", currentData.education);

  addressBox.innerHTML =
    item("Street Address", currentData.street) +
    item("City", currentData.city) +
    item("State / Province", currentData.state) +
    item("Postal Code", currentData.postal) +
    item("Country", currentData.country) +
    item("Phone", currentData.phone);

  moreBox.innerHTML =
    item("Email", currentData.email) +
    item("Job", currentData.job) +
    item("Company", currentData.company) +
    item("Marital Status", currentData.marital);

  countryInfo.innerHTML =
    info("Country", currentData.country) +
    info("Code", currentData.code) +
    info("Capital", currentData.capital) +
    info("Dial Code", currentData.dial) +
    info("Currency", currentData.currency) +
    info("Language", currentData.language);
}

function copyAll() {
  const text = `
Full Name: ${currentData.fullName}
Gender: ${currentData.gender}
Birthday: ${currentData.birthday}
Age: ${currentData.age}
Blood Type: ${currentData.blood}
Height: ${currentData.height}
Weight: ${currentData.weight}
Education: ${currentData.education}

Street Address: ${currentData.street}
City: ${currentData.city}
State / Province: ${currentData.state}
Postal Code: ${currentData.postal}
Country: ${currentData.country}
Phone: ${currentData.phone}

Email: ${currentData.email}
Job: ${currentData.job}
Company: ${currentData.company}
Marital Status: ${currentData.marital}

Country Code: ${currentData.code}
Capital: ${currentData.capital}
Dial Code: ${currentData.dial}
Currency: ${currentData.currency}
Language: ${currentData.language}
  `.trim();

  navigator.clipboard.writeText(text);
  showToast("Data berhasil disalin");
}

searchInput.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase();
  const filtered = countries.filter(c => getCountryName(c).toLowerCase().includes(q));
  renderCountryOptions(filtered);
});

countrySelect.addEventListener("change", async () => {
  selectedCountry = countries.find(c => getCountryCode(c) === countrySelect.value);
  await generate();
});

el("refreshBtn").addEventListener("click", () => generate());
el("generateBtn").addEventListener("click", () => generate());
el("customBtn").addEventListener("click", () => generate(true));
el("copyBtn").addEventListener("click", copyAll);

async function init() {
  await loadCitiesData();
  await loadCountries();
}

init();