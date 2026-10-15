/* ============================================================
 * Amol Collection — demo product catalog
 * ------------------------------------------------------------
 * Used automatically when CONFIG.APPS_SCRIPT_URL is empty
 * (demo mode). Product art is inline SVG, so there are NO
 * external image dependencies.
 * ============================================================ */

// Convert raw SVG markup into a data-URI usable in <img src="...">
function svgURI(svg) {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

// Shared SVG wrapper: pastel background + the toy drawing
function toySVG(bg, inner) {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' +
    '<rect width="200" height="200" rx="24" fill="' + bg + '"/>' +
    inner +
    "</svg>"
  );
}

const DEMO_PRODUCTS = [
  {
    id: "p01",
    name: "टेडी बियर — बड़ा (90 सेमी)",
    price: 499, mrp: 899, category: "Soft Toys", stock: 12,
    description: "बहुत ही नरम बड़ा टेडी बियर, बच्चों का पसंदीदा।",
    art: toySVG("#ffe4e6",
      '<circle cx="70" cy="60" r="18" fill="#b45309"/><circle cx="130" cy="60" r="18" fill="#b45309"/>' +
      '<circle cx="100" cy="90" r="38" fill="#d97706"/><ellipse cx="100" cy="120" rx="40" ry="34" fill="#d97706"/>' +
      '<ellipse cx="100" cy="105" rx="18" ry="14" fill="#fde68a"/><circle cx="88" cy="84" r="5" fill="#1f2937"/>' +
      '<circle cx="112" cy="84" r="5" fill="#1f2937"/><ellipse cx="100" cy="98" rx="7" ry="5" fill="#1f2937"/>' +
      '<ellipse cx="74" cy="140" rx="12" ry="16" fill="#b45309"/><ellipse cx="126" cy="140" rx="12" ry="16" fill="#b45309"/>'),
  },
  {
    id: "p02",
    name: "रिमोट कंट्रोल कार",
    price: 899, mrp: 1299, category: "Cars", stock: 8,
    description: "2.4GHz रिमोट वाली तेज़ रेसिंग कार, रिचार्जेबल बैटरी के साथ।",
    art: toySVG("#e0f2fe",
      '<rect x="45" y="95" width="110" height="40" rx="14" fill="#dc2626"/>' +
      '<rect x="70" y="75" width="60" height="30" rx="10" fill="#7dd3fc"/>' +
      '<circle cx="72" cy="140" r="18" fill="#1f2937"/><circle cx="72" cy="140" r="7" fill="#9ca3af"/>' +
      '<circle cx="128" cy="140" r="18" fill="#1f2937"/><circle cx="128" cy="140" r="7" fill="#9ca3af"/>' +
      '<rect x="150" y="60" width="8" height="45" rx="4" fill="#1f2937"/><circle cx="154" cy="56" r="8" fill="#fbbf24"/>'),
  },
  {
    id: "p03",
    name: "डॉल सेट — 3 पीस",
    price: 349, mrp: 599, category: "Dolls", stock: 15,
    description: "सुंदर ड्रेस वाली 3 डॉल का सेट, बच्चों के खेलने के लिए।",
    art: toySVG("#fce7f3",
      '<circle cx="70" cy="70" r="20" fill="#fbbf24"/><path d="M50 70 a20 20 0 0 1 40 0 v-6 h-40 z" fill="#92400e"/>' +
      '<path d="M70 92 l-22 55 h44 z" fill="#ec4899"/>' +
      '<circle cx="130" cy="60" r="17" fill="#fbbf24"/><path d="M113 60 a17 17 0 0 1 34 0 v-5 h-34 z" fill="#78350f"/>' +
      '<path d="M130 79 l-19 48 h38 z" fill="#8b5cf6"/><circle cx="100" cy="160" r="10" fill="#fbbf24"/>'),
  },
  {
    id: "p04",
    name: "बिल्डिंग ब्लॉक्स — 100 पीस",
    price: 549, mrp: 799, category: "Games", stock: 20,
    description: "रंग-बिरंगे 100 ब्लॉक्स, रचनात्मकता बढ़ाने वाला सेट।",
    art: toySVG("#fef3c7",
      '<rect x="50" y="130" width="45" height="32" rx="4" fill="#ef4444"/>' +
      '<rect x="105" y="130" width="45" height="32" rx="4" fill="#3b82f6"/>' +
      '<rect x="78" y="98" width="45" height="32" rx="4" fill="#22c55e"/>' +
      '<rect x="92" y="66" width="40" height="32" rx="4" fill="#f59e0b"/>' +
      '<rect x="60" y="122" width="8" height="8" rx="2" fill="#b91c1c"/><rect x="72" y="122" width="8" height="8" rx="2" fill="#b91c1c"/>'),
  },
  {
    id: "p05",
    name: "क्रिकेट सेट — बच्चों का",
    price: 699, mrp: 999, category: "Games", stock: 10,
    description: "प्लास्टिक बैट, बॉल और स्टंप का पूरा सेट।",
    art: toySVG("#dcfce7",
      '<rect x="60" y="40" width="22" height="110" rx="10" fill="#a16207"/>' +
      '<rect x="120" y="70" width="10" height="80" fill="#78350f"/><rect x="105" y="70" width="10" height="80" fill="#78350f"/>' +
      '<rect x="135" y="70" width="10" height="80" fill="#78350f"/>' +
      '<circle cx="160" cy="130" r="16" fill="#ef4444"/><path d="M148 122 q12 8 24 0" stroke="#fff" stroke-width="3" fill="none"/>'),
  },
  {
    id: "p06",
    name: "स्कूल बैग — कार्टून प्रिंट",
    price: 599, mrp: 899, category: "School", stock: 25,
    description: "मज़बूत कार्टून प्रिंट स्कूल बैग, 3 पॉकेट के साथ।",
    art: toySVG("#e0e7ff",
      '<path d="M80 60 q20 -25 40 0" stroke="#4f46e5" stroke-width="10" fill="none"/>' +
      '<rect x="60" y="60" width="80" height="100" rx="20" fill="#6366f1"/>' +
      '<rect x="75" y="95" width="50" height="45" rx="10" fill="#c7d2fe"/>' +
      '<circle cx="100" cy="85" r="10" fill="#fbbf24"/><circle cx="96" cy="83" r="3" fill="#1f2937"/><circle cx="104" cy="83" r="3" fill="#1f2937"/>'),
  },
  {
    id: "p07",
    name: "स्टील वॉटर बॉटल — 1 लीटर",
    price: 299, mrp: 449, category: "School", stock: 30,
    description: "लीक-प्रूफ स्टील बॉटल, ठंडा/गर्म 12 घंटे तक।",
    art: toySVG("#cffafe",
      '<rect x="85" y="40" width="30" height="18" rx="6" fill="#0e7490"/>' +
      '<rect x="78" y="58" width="44" height="110" rx="18" fill="#06b6d4"/>' +
      '<rect x="78" y="90" width="44" height="26" fill="#0e7490" opacity="0.35"/>' +
      '<rect x="86" y="70" width="8" height="90" rx="4" fill="#a5f3fc" opacity="0.7"/>'),
  },
  {
    id: "p08",
    name: "शतरंज + लूडो बोर्ड गेम",
    price: 399, mrp: 599, category: "Games", stock: 14,
    description: "2-इन-1 मैग्नेटिक बोर्ड: शतरंज और लूडो।",
    art: toySVG("#fef9c3",
      '<rect x="50" y="50" width="100" height="100" rx="8" fill="#fff"/>' +
      '<rect x="50" y="50" width="50" height="50" fill="#1f2937"/><rect x="100" y="100" width="50" height="50" fill="#1f2937"/>' +
      '<circle cx="75" cy="125" r="12" fill="#dc2626"/><circle cx="125" cy="75" r="12" fill="#2563eb"/>' +
      '<path d="M70 62 l10 -12 10 12 z" fill="#f59e0b"/>'),
  },
  {
    id: "p09",
    name: "कलरिंग आर्ट सेट — 48 पीस",
    price: 249, mrp: 399, category: "Games", stock: 40,
    description: "क्रेयॉन, स्केच पेन और कलर पेंसिल का 48 पीस सेट।",
    art: toySVG("#fae8ff",
      '<rect x="60" y="70" width="80" height="90" rx="10" fill="#fff" stroke="#a855f7" stroke-width="4"/>' +
      '<rect x="72" y="86" width="10" height="60" fill="#ef4444"/><rect x="86" y="86" width="10" height="60" fill="#f59e0b"/>' +
      '<rect x="100" y="86" width="10" height="60" fill="#22c55e"/><rect x="114" y="86" width="10" height="60" fill="#3b82f6"/>' +
      '<circle cx="100" cy="52" r="14" fill="#f472b6"/>'),
  },
  {
    id: "p10",
    name: "खरगोश सॉफ्ट टॉय",
    price: 279, mrp: 499, category: "Soft Toys", stock: 18,
    description: "प्यारा सफेद खरगोश, बहुत मुलायम फर वाला।",
    art: toySVG("#ede9fe",
      '<ellipse cx="85" cy="55" rx="10" ry="30" fill="#fff" stroke="#c4b5fd" stroke-width="3"/>' +
      '<ellipse cx="115" cy="55" rx="10" ry="30" fill="#fff" stroke="#c4b5fd" stroke-width="3"/>' +
      '<ellipse cx="85" cy="55" rx="4" ry="18" fill="#f5d0fe"/><ellipse cx="115" cy="55" rx="4" ry="18" fill="#f5d0fe"/>' +
      '<circle cx="100" cy="105" r="30" fill="#fff" stroke="#c4b5fd" stroke-width="3"/>' +
      '<circle cx="90" cy="100" r="4" fill="#1f2937"/><circle cx="110" cy="100" r="4" fill="#1f2937"/>' +
      '<ellipse cx="100" cy="112" rx="6" ry="4" fill="#f9a8d4"/>'),
  },
];

// Seeded demo order for the Track page (works in demo mode, no setup)
const DEMO_SEED_ORDER = {
  orderId: "AC-20261015-0001",
  createdAt: "2026-10-15T10:30:00+05:30",
  name: "डेमो ग्राहक",
  phone: "9876543210",
  address: "सिविल लाइंस, गोंदिया",
  pincode: "441601",
  items: [{ id: "p01", name: "टेडी बियर — बड़ा (90 सेमी)", price: 499, qty: 1 }],
  total: 499,
  paymentMethod: "cod",
  paymentId: "",
  status: "Shipped",
};
