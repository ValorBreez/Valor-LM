// test_supabase.js
// Test script to verify Supabase connection and database setup

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');
  
  try {
    // Test 1: Read relationship types
    console.log('1. Testing relationship types table...');
    const { data: relationshipTypes, error: rtError } = await supabase
      .from('relationship_types')
      .select('*')
      .limit(3);
    
    if (rtError) throw rtError;
    
    console.log(`✅ Found ${relationshipTypes.length} relationship types`);
    console.log(`   Sample: ${relationshipTypes[0]?.type_name}\n`);
    
    // Test 2: Check if all 12 relationship types exist
    const { data: allTypes, error: allTypesError } = await supabase
      .from('relationship_types')
      .select('type_name, desire_level, power_level, rapport_level');
    
    if (allTypesError) throw allTypesError;
    
    console.log('2. Checking all relationship types...');
    console.log(`✅ Found ${allTypes.length}/12 relationship types`);
    
    if (allTypes.length === 12) {
      console.log('   All relationship types are loaded correctly!\n');
    } else {
      console.log('   ⚠️  Some relationship types may be missing\n');
    }
    
    // Test 3: Test RLS policies (should work for anonymous access to relationship_types)
    console.log('3. Testing Row Level Security...');
    const { data: publicData, error: publicError } = await supabase
      .from('relationship_types')
      .select('type_name')
      .limit(1);
    
    if (publicError) {
      console.log('   ❌ RLS may be blocking access');
    } else {
      console.log('   ✅ RLS allows public read access to relationship_types\n');
    }
    
    // Test 4: Test user table (should be protected by RLS)
    console.log('4. Testing protected tables...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (userError && userError.code === 'PGRST116') {
      console.log('   ✅ RLS correctly protecting users table');
    } else {
      console.log('   ⚠️  RLS may not be working as expected');
    }
    
    console.log('\n🎉 All tests completed!');
    console.log('\nNext steps:');
    console.log('1. Set up authentication if needed');
    console.log('2. Create a simple web interface');
    console.log('3. Test AI integration');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Check your .env file has correct SUPABASE_URL and SUPABASE_ANON_KEY');
    console.log('2. Verify the schema was run successfully in Supabase');
    console.log('3. Check that relationship_types data was inserted');
  }
}

// Test AI integration (if OpenAI key is available)
async function testAI() {
  if (!process.env.OPENAI_API_KEY) {
    console.log('\n🤖 OpenAI API key not found - skipping AI test');
    return;
  }
  
  console.log('\n🤖 Testing AI integration...');
  
  const OpenAI = require('openai');
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "user", 
        content: "You are Valor LM. Give me one sentence of relationship advice for a 'Collaborative Partner' scenario."
      }],
      max_tokens: 50,
      temperature: 0.7
    });
    
    console.log('✅ AI integration working!');
    console.log(`   Response: ${completion.choices[0].message.content}`);
    
  } catch (error) {
    console.error('❌ AI test failed:', error.message);
  }
}

// Run tests
async function runTests() {
  await testConnection();
  await testAI();
}

runTests(); 