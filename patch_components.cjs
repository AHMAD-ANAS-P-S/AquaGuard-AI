const fs = require('fs');

// Patch Community Dashboard
const cdFile = 'src/pages/CommunityDashboard.tsx';
let cdCode = fs.readFileSync(cdFile, 'utf8');

cdCode = cdCode.replace('Stay informed • Report issues • Protect your community', '{t(\'stayInformed\')}');
cdCode = cdCode.replace('Cases Today</p>', '{t(\'casesToday\')}</p>');
cdCode = cdCode.replace('Risk Level</p>', '{t(\'riskLevel\')}</p>');
cdCode = cdCode.replace('My Area Health Status</p>', '{t(\'myArea\')}</p>');
cdCode = cdCode.replace('Risk Index /100</p>', '{t(\'riskIndex\')}</p>');
cdCode = cdCode.replace('Health / Water / Emergency</p>', '{t(\'reportDesc\')}</p>');
cdCode = cdCode.replace('{recentAlerts.length} active now</p>', '{recentAlerts.length} {t(\'activeNow\')}</p>');
cdCode = cdCode.replace('Risk zones near you</p>', '{t(\'riskZones\')}</p>');
cdCode = cdCode.replace('Upload water photos</p>', '{t(\'uploadWater\')}</p>');
cdCode = cdCode.replace('Quizzes, points & certificates</p>', '{t(\'quizzes\')}</p>');
cdCode = cdCode.replace('Voice Report 🎤</h3>', '{t(\'voiceReport\')} 🎤</h3>');
cdCode = cdCode.replace('Speak in local language</p>', '{t(\'voiceDesc\')}</p>');
cdCode = cdCode.replace('App Guide Bot\n            </h3>', '{t(\'guideBot\')}\n            </h3>');
cdCode = cdCode.replace('My Recent Reports\n            </h3>', '{t(\'myReports\')}\n            </h3>');
cdCode = cdCode.replace('No reports yet — be the first to report!</p>', '{t(\'noReports\')}</p>');
cdCode = cdCode.replace('High Risk</span>', '{t(\'highRisk\')}</span>');

fs.writeFileSync(cdFile, cdCode);

// Patch Image Analysis
const iaFile = 'src/pages/ImageAnalysis.tsx';
let iaCode = fs.readFileSync(iaFile, 'utf8');

iaCode = iaCode.replace('import { useState } from "react";', 'import { useState } from "react";\nimport { useTranslation } from "react-i18next";');
iaCode = iaCode.replace('const ImageAnalysis = () => {', 'const ImageAnalysis = () => {\n  const { t } = useTranslation();');

iaCode = iaCode.replace('Image Analysis</h1>', '{t(\'imageAnalysisTitle\')}</h1>');
iaCode = iaCode.replace('Upload water body or microscopic pathogen images for AI analysis</p>', '{t(\'imageAnalysisSub\')}</p>');
iaCode = iaCode.replace('Image Type</label>', '{t(\'imageType\')}</label>');
iaCode = iaCode.replace('"Water Body (Lake, River, Pond)"', 't(\'waterBody\')');
iaCode = iaCode.replace('"Microscopic Pathogen"', 't(\'microscopic\')');
iaCode = iaCode.replace('Click to upload or take a photo</p>', '{t(\'uploadPrompt\')}</p>');
iaCode = iaCode.replace('Supports JPG, PNG, WEBP</p>', '{t(\'supports\')}</p>');
iaCode = iaCode.replace('Notes (Optional)</label>', '{t(\'notes\')}</label>');
iaCode = iaCode.replace('placeholder="Describe any observations..."', 'placeholder={t(\'describe\')}');
iaCode = iaCode.replace('Analyze Image\n                </Button>', '{t(\'analyzeBtn\')}\n                </Button>');
iaCode = iaCode.replace('Analysis Results</h3>', '{t(\'results\')}</h3>');
iaCode = iaCode.replace('Upload an image and click Analyze to see results</p>', '{t(\'uploadFirst\')}</p>');

fs.writeFileSync(iaFile, iaCode);
console.log('files patched');
