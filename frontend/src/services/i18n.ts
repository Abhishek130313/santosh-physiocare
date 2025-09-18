import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: { translation: {
    title: 'Kerala Digital Health Records',
    enroll: 'Enroll',
    clinicianPortal: 'Clinician Portal',
    kioskMode: 'Kiosk Mode',
    dashboard: 'Public Health Dashboard',
    admin: 'Admin',
    language: 'Language',
    consent: 'I agree to data usage for care and analytics',
    printQR: 'Print QR Card'
  }},
  hi: { translation: {
    title: 'केरल डिजिटल स्वास्थ्य रिकॉर्ड',
    enroll: 'पंजीकरण',
    clinicianPortal: 'चिकित्सक पोर्टल',
    kioskMode: 'कियोस्क मोड',
    dashboard: 'जनस्वास्थ्य डैशबोर्ड',
    admin: 'प्रशासन',
    language: 'भाषा',
    consent: 'मैं देखभाल और विश्लेषण के लिए डेटा उपयोग से सहमत हूँ',
    printQR: 'क्यूआर कार्ड प्रिंट करें'
  }},
  ml: { translation: {
    title: 'കേരള ഡിജിറ്റൽ ഹെൽത്ത് റെക്കോർഡുകൾ',
    enroll: 'ചേർക്കുക',
    clinicianPortal: 'ക്ലിനീഷ്യൻ പോർട്ടൽ',
    kioskMode: 'കിയോസ്‌ക് മോഡ്',
    dashboard: 'പബ്ലിക് ഹെൽത്ത് ഡാഷ്‌ബോർഡ്',
    admin: 'അഡ്മിൻ',
    language: 'ഭാഷ',
    consent: 'പരിചരണത്തിനും വിശകലനത്തിനുമായി ഡാറ്റ ഉപയോഗിക്കാൻ ഞാൻ സമ്മതിക്കുന്നു',
    printQR: 'ക്യൂആർ കാർഡ് പ്രിന്റ് ചെയ്യുക'
  }}
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

export default i18n;