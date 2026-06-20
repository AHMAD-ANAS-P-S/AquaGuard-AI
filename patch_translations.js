const fs = require('fs');
const file = 'src/i18n/translations.ts';
let code = fs.readFileSync(file, 'utf8');

const enAdd = `
      // Added
      stayInformed: 'Stay informed • Report issues • Protect your community',
      casesToday: 'Cases Today',
      riskLevel: 'Risk Level',
      myArea: 'My Area Health Status',
      highRisk: 'High Risk',
      riskIndex: 'Risk Index /100',
      reportDesc: 'Health / Water / Emergency',
      activeNow: 'active now',
      riskZones: 'Risk zones near you',
      uploadWater: 'Upload water photos',
      quizzes: 'Quizzes, points & certificates',
      voiceReport: 'Voice Report',
      voiceDesc: 'Speak in local language',
      guideBot: 'App Guide Bot',
      myReports: 'My Recent Reports',
      noReports: 'No reports yet — be the first to report!',
      imageAnalysisTitle: 'Image Analysis',
      imageAnalysisSub: 'Upload water body or microscopic pathogen images for AI analysis',
      imageType: 'Image Type',
      waterBody: 'Water Body (Lake, River, Pond)',
      microscopic: 'Microscopic Pathogen',
      uploadPrompt: 'Click to upload or take a photo',
      supports: 'Supports JPG, PNG, WEBP',
      notes: 'Notes (Optional)',
      describe: 'Describe any observations...',
      analyzeBtn: 'Analyze Image',
      results: 'Analysis Results',
      uploadFirst: 'Upload an image and click Analyze to see results',
`;

const hiAdd = `
      // Added
      stayInformed: 'सूचित रहें • समस्याएं रिपोर्ट करें • अपने समुदाय की रक्षा करें',
      casesToday: 'आज के मामले',
      riskLevel: 'जोखिम स्तर',
      myArea: 'मेरे क्षेत्र की स्वास्थ्य स्थिति',
      highRisk: 'उच्च जोखिम',
      riskIndex: 'जोखिम सूचकांक /100',
      reportDesc: 'स्वास्थ्य / पानी / आपातकाल',
      activeNow: 'अभी सक्रिय',
      riskZones: 'आपके पास जोखिम क्षेत्र',
      uploadWater: 'पानी की तस्वीरें अपलोड करें',
      quizzes: 'क्विज़, अंक और प्रमाणपत्र',
      voiceReport: 'वॉयस रिपोर्ट',
      voiceDesc: 'स्थानीय भाषा में बोलें',
      guideBot: 'ऐप गाइड बॉट',
      myReports: 'मेरी हाल की रिपोर्टें',
      noReports: 'अभी तक कोई रिपोर्ट नहीं — पहली रिपोर्ट करें!',
      imageAnalysisTitle: 'छवि विश्लेषण',
      imageAnalysisSub: 'एआई विश्लेषण के लिए जल निकाय या रोगज़नक़ छवियां अपलोड करें',
      imageType: 'छवि प्रकार',
      waterBody: 'जल निकाय (झील, नदी, तालाब)',
      microscopic: 'सूक्ष्म रोगज़नक़',
      uploadPrompt: 'अपलोड करने के लिए क्लिक करें या फोटो लें',
      supports: 'समर्थन करता है JPG, PNG, WEBP',
      notes: 'नोट्स (वैकल्पिक)',
      describe: 'किसी भी अवलोकन का वर्णन करें...',
      analyzeBtn: 'छवि का विश्लेषण करें',
      results: 'विश्लेषण परिणाम',
      uploadFirst: 'परिणाम देखने के लिए छवि अपलोड करें और विश्लेषण पर क्लिक करें',
`;

code = code.replace(/en:\s*\{\s*translation:\s*\{/, 'en: { translation: {' + enAdd);
code = code.replace(/hi:\s*\{\s*translation:\s*\{/, 'hi: { translation: {' + hiAdd);
code = code.replace(/as:\s*\{\s*translation:\s*\{/, 'as: { translation: {' + hiAdd);
code = code.replace(/bn:\s*\{\s*translation:\s*\{/, 'bn: { translation: {' + hiAdd);

fs.writeFileSync(file, code);
console.log('patched');
