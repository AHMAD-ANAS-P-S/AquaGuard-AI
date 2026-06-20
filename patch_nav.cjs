const fs = require('fs');

// Patch translations.ts again
const file = 'src/i18n/translations.ts';
let code = fs.readFileSync(file, 'utf8');

const enAdd = `
      // Additional Nav
      'nav.imageAnalysis': 'Image Analysis',
      'nav.exportReports': 'Export Reports',
`;

const hiAdd = `
      // Additional Nav
      'nav.imageAnalysis': 'छवि विश्लेषण',
      'nav.exportReports': 'रिपोर्ट निर्यात करें',
`;

code = code.replace(/en:\s*\{\s*translation:\s*\{/, 'en: { translation: {' + enAdd);
code = code.replace(/hi:\s*\{\s*translation:\s*\{/, 'hi: { translation: {' + hiAdd);
code = code.replace(/as:\s*\{\s*translation:\s*\{/, 'as: { translation: {' + hiAdd);
code = code.replace(/bn:\s*\{\s*translation:\s*\{/, 'bn: { translation: {' + hiAdd);

fs.writeFileSync(file, code);

// Patch Navigation.tsx
const navFile = 'src/components/layout/Navigation.tsx';
let navCode = fs.readFileSync(navFile, 'utf8');

navCode = navCode.replace('{ path: "/image-analysis", label: "Image Analysis", icon: Microscope },', '{ path: "/image-analysis", label: t(\'nav.imageAnalysis\'), icon: Microscope },');
navCode = navCode.replace('{ path: "/image-analysis", label: "Image Analysis", icon: Microscope },', '{ path: "/image-analysis", label: t(\'nav.imageAnalysis\'), icon: Microscope },');
navCode = navCode.replace('{ path: "/export-reports", label: "Export Reports", icon: Download },', '{ path: "/export-reports", label: t(\'nav.exportReports\'), icon: Download },');

fs.writeFileSync(navFile, navCode);

console.log('nav patched');
