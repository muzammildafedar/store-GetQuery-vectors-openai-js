# Custom-ChatGPT with OpenAI API's

This repository contains code for how to store and query your own data using OpenAI Embeddings and Supabase using JavaScript.

## Prerequisites

Before you begin, make sure you have the following set up:

- Node.js installed
- Supabase account with a configured database
- OpenAI API key

## Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/muzammildafedar/custom-chatgpt-using-js.git
    cd your-repo
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

## Configuration

Replace the placeholder values in the code with your actual Supabase and OpenAI credentials:

```javascript
const supabaseUrl = 'Your Supabase URL';
const supabaseKey = 'Your Supabase API Key';
const openaiConfig = {
    apiKey: 'Your OpenAI API Key',
};
```
## Code Functions

storeEmbedding(title, body, embedding)
Description:
Stores the provided title, body, and embedding in the Supabase database.

queryEmbeddings(query, matchThreshold, matchCount)
Description:
Queries Supabase for embeddings that match the provided query, threshold, and count.

getAnswer(query, posts)
Description:
Generates an answer from OpenAI GPT-3.5 based on the provided query and matched documents.

## DB Schema
Create table to store embeddings

```
create table posts (
  id serial primary key,
  title text not null,
  body text not null,
  embedding vector(1536)
);
```
In order to "hook up" OpenAI to our embeddings we need to create a function in Postgres find the closest matching values when given a vector.
```
create or replace function match_posts (
    query_embedding vector(1536),
    match_threshold float,
    match_count int
  )
  returns table (
    id bigint,
    body text,
    title text,
    similarity float
  )
  language sql stable
  as $$
    select
      posts.id,
      posts.body,
      posts.title,
      1 - (posts.embedding <=> query_embedding) as similarity
    from posts
    where 1 - (posts.embedding <=> query_embedding) > match_threshold
    order by similarity desc
    limit match_count;
  $$;
```
Additionally we can create an index on our posts table to speed up the query.

```
create index on posts using ivfflat (embedding vector_cosine_ops)
with
  (lists = 100);
```


