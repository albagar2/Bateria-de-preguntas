const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test(modelName, apiVersion) {
  try {
    const config = { model: modelName };
    const options = apiVersion ? { apiVersion } : undefined;
    const model = genAI.getGenerativeModel(config, options);
    const result = await model.generateContent("Say 'hello'");
    console.log(`✅ ${modelName} (${apiVersion || 'default'}): OK -> ${result.response.text().trim()}`);
    return true;
  } catch (e) {
    console.log(`❌ ${modelName} (${apiVersion || 'default'}): ${e.message}`);
    return false;
  }
}

async function runAll() {
  const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
  const versions = [null, 'v1', 'v1beta'];
  
  for (const m of models) {
    for (const v of versions) {
      await test(m, v);
      await test(`models/${m}`, v);
    }
  }
}

runAll();
