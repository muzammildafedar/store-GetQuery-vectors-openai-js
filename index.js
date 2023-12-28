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
    const body = `
  Hubli, India ·
Muzammil Dafedar
Muzammil is guy and determined to male 
Gmail · Ó +919663518926 · ¯ Muzammil Dafedar ·  Github·
Portfolio
Summary
Full-stack web and mobile developer with 2+ years of experience. Proven ability to develop and maintain high-quality
applications using a variety of technologies, including ReactJS, Flutter, Node.js, and AWS. Seeking a challenging role
where I can use my skills to make a significant contribution to a team.
Skills
Programming: JavaScript, TypeScript, Dart ,NodeJS
Cloud: Aws -EC2, Aws-Lambda, Aws-CloudWatch
Database: MySQL, PostgreSQL, NoSQL(Firestore)
Libraries/Frameworks: Flutter, Codeigniter 3, ReactJS, MaterialUI , Serverless (NodeJS)
Tools/Platforms: Git, Github, Firebase, Android Studio, Visual Studio Code, PyCharm, Postman
Professional Experience
Encora Inc. www.encora.com
Hubli, Karnataka, India
Junior Software Engineer
March 2023 - Present
Developed and maintained React.js, serverless Node.js, and Flutter applications, utilizing clean, clear, efficient, and
well-tested code to ensure easy maintainability. Contributed to the enhancement of the company’s internal product
portfolio.
Trainee Software Engineer
Aug 2022 - Feb 2023
Closely collaborated with Figma designs, resolved bugs, and deployed applications to production using AWS.
Aviabird Technologies Pvt. Ltd. www.aviabird.com
Work From Home
SDE Intern
Oct 2020 - March 2021
Proactively contributed on flutter app development, Figma to code, Bug fixes, performance improvement and API
Integration.
Triwits Technologies Pvt. Ltd . www.triwits.com
SDE (Part-time)
Developed PWA using Android Native.
Vijayapura, Karnataka, India
Jan 2020 - March 2020
Triwits Technologies Pvt. Ltd . www.triwits.com
Vijayapura, Karnataka, India
Jn. SDE
Oct 2018 - Aug 2019
Started as a PHP, and ReactJs developer and worked on a handful of projects. I worked on domains like custom
ERPs/CRMs, Multi-vendor eCommerce websites, SaaS products, etc.
Notable Projects

Swift (Tech stack : Flutter, Dart, Firebase) visit
Swift is the blockchain platform, It will support all kind of blockchain trading
Chrgr.io (Tech stack : ReactJS, PHP, NodeJS) visit
Online marketplace for the Electric Vehicle Charging Infrastructure Ecosystem
App files setup (Tech stack : Flutter Packages, Dart) visit A command-line tool that simplifies the task of creating and
organizing the file structure. Fully flexible, allowing to create project files structure with only one command line.
Education
BLDEA's V P Dr PG Halakatti College of Engineering & Technology
Bachelor of engineering in computer science
Government Polytechnic
Diploma Computer science and eng
Vijayapura,Karnataka
Aug 2019 - Aug 2022
Vijayapura
Jun 2015 - Jun 2018
Achievements and Certifications
Top 10 out of 40+ teams in WIT college Hackathon.
3rd prize in coding competition.
Goodies winner of HacktoberFest 2020
Introduction to flutter development - Certified
July 2020
Jan 2021
Oct 2020
  `;

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
