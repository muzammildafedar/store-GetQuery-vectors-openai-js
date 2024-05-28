const OpenAIApi = require('openai');
const { createClient, supabase } = require('@supabase/supabase-js'); // Replace with your actual Supabase setup

// Your Supabase configuration
const supabaseUrl = 'Your supabase url';
const supabaseKey = 'API KEY';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// OpenAI configuration
const openaiConfig = {
    apiKey: 'OPENAI API KEY',
};

const openaiClient = new OpenAIApi(openaiConfig);

// Function to store the embedding in Supabase
async function storeEmbedding(title, body, embedding) {
    const { data, error } = await supabaseClient.from('posts').insert({
        title,
        body,
        embedding,
    });

    if (error) {
        console.error('Error storing embedding:', error.message);
    } else {
        console.log('Embedding stored successfully:', data);
    }
}

// Function to query embeddings in Supabase
async function queryEmbeddings(query, matchThreshold, matchCount) {
    // OpenAI recommends replacing newlines with spaces for best results
    const input = query.replace(/\n/g, ' ');

    // console.log(input);

    // Generate a one-time embedding for the query itself
    const embeddingResponse = await openaiClient.embeddings.create({
        model: 'text-embedding-ada-002',
        input,
    });

    const embedding = embeddingResponse.data[0].embedding;

    // console.log(embedding);

    // Query the closest matches in Supabase
    const response = await supabaseClient.rpc('match_posts', {
        query_embedding: embedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
    });
    // console.log("Res----");
    // console.log(response);

    // Extract the data from the response
    const { data: posts } = response;

    // Display the matched documents
    // console.log('Matched Documents:', JSON.stringify(posts, null, 2));

    return posts;
}

// Function to get the answer from OpenAI based on the matched documents
async function getAnswer(query, posts) {

    // console.log(posts[0].body);
    // Prompting OpenAI with context from the matched documents
    const prompt = `
    You are a very enthusiastic ChatBot who loves to help people! Given the following Posts from this collection, answer the question using only that information, outputted in markdown format. If you are unsure and the answer is not explicitly written in the collection provided, say "Sorry, I don't have that knowledge."

    Context Posts:
    ${JSON.stringify(posts[0].body)}

    Question: """
    ${query}
    """

    Answer as markdown:
  `;

    // Requesting the answer from OpenAI GPT Completions API
    const completionResponse = await openaiClient.completions.create ({
        model: 'text-davinci-003',
        prompt,
        max_tokens: 512,
        temperature: 0,
    });
    // console.log(completionResponse);
    const { id, model, choices, usage } = completionResponse;
    const { text, finish_reason } = choices[0];

    console.log(completionResponse);
    
    // Display the response from OpenAI GPT Completions
    // console.log('---');
    // console.log('Query Response from OpenAI GPT Completions:');
    // console.log(JSON.stringify({ id, text }, null, 2));

    return text;
}

// Example usage
async function main() {
    const query = `write a hello word program in java`;
    const matchThreshold = 0.70;
    const matchCount = 1;
    const body = `<Your Training Data in Text>`;

    // This sends the text to the OpenAI API and returns the Embedding.
    // const embeddingResponse = await openaiClient.embeddings.create({
    //     model: 'text-embedding-ada-002',
    //     input: body,
    //     max_tokens: 900
    // });

    // // This is our embedding. We'll store this in our Vector Database.
    // const embedding = embeddingResponse.data[0].embedding;

    // storeEmbedding('test', body, embedding);

    // console.log(embedding);

      const posts = await queryEmbeddings(query, matchThreshold, matchCount);

    //   console.log(posts);
      const answer = await getAnswer(query, posts);

      console.log('Final Answer:', answer);
}

main().catch((error) => console.error('Error:', error));
