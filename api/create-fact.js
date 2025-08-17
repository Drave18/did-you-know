import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Create Supabase client using correct env variable names
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  try {
    const { text, source, category } = req.body;

    // Basic validation
    if (!text || !source || !category) {
      return res.status(400).json({ error: 'Missing required fields: text, source, category' });
    }

    const { data, error } = await supabase
      .from('facts')
      .insert({
        text: text,
        source: source,
        category: category.toLowerCase()
      })
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ 
      message: 'Fact created successfully', 
      data: data[0] 
    });

  } catch (error) {
    return res.status(500).json({ error: 'Failed to create fact' });
  }
}
