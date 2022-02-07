const googleapis = require('googleapis');

require('dotenv').config();

// the values are the thresholds for when to trigger a response
const attributeThresholds = {
  'TOXICITY': 0.90,
  'SEVERE_TOXICITY': 0.85,
  'IDENTITY_ATTACK': 0.80,
  'INSULT': 0.80,
  'PROFANITY': 1.0,
  'THREAT':0.80,
  'SEXUALLY_EXPLICIT': 0.80,
  'FLIRTATION': 0.80,
  'SPAM': 0.90,
  'INCOHERENT': 0.95,
  'INFLAMMATORY': 0.80,
  'OBSCENE': 0.90,
};

/**
 * Analyze attributes in a block of text
 * @param {string} text - text to analyze
 * @return {json} res - analyzed atttributes
 */
async function analyzeText(text) {
  const analyzer = new googleapis.commentanalyzer_v1alpha1.Commentanalyzer();

  // this is the format the API expects
  const requestedAttributes = {};
  for (const key in attributeThresholds) {
    requestedAttributes[key] = {};
  }

  const req = {
    comment: {text: text},
    languages: ['en'],
    requestedAttributes: requestedAttributes,
  };

  const res = await analyzer.comments.analyze({
    key: process.env.PERSPECTIVE_API_KEY,
    resource: req},
  );

  data = {};

  let dominatingAttribute

  for (const key in res['data']['attributeScores']) {
    data[key] =
        res['data']['attributeScores'][key]['summaryScore']['value'] >
        attributeThresholds[key];
  }

  return data;
}

module.exports.analyzeText = analyzeText;
