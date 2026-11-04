# Enable LUMA AI chat

The site already calls the `luma-chat` Edge Function. Until the function is deployed and the secret is set, the widget falls back to its local scripted replies.

## Set the OpenAI API key in Supabase

1. Create an API key in your OpenAI API account. ChatGPT Plus/Free and API usage are billed separately; API calls use the billing and limits on that API account.
2. In Supabase, open **Edge Functions ? Secrets** and add:
   - `OPENAI_API_KEY`: your private API key. Never put it in Vercel environment variables, the website `.env`, or Git.
   - `OPENAI_MODEL`: optional; defaults to `gpt-4.1-mini`.
3. The function reads only public data through the anon/publishable key and RLS: published projects, verified published homes, and active social links. It does not query enquiries, admin users, drafts, or private dashboard data.
4. Deploy from the repository root (replace the project ref with the subdomain before `.supabase.co` in your Supabase URL):

   ```powershell
   npx supabase functions deploy luma-chat --project-ref YOUR_PROJECT_REF
   ```

5. Open the live website and try a greeting, a small-talk question, and a project question. Check the function logs in Supabase if it falls back to scripted replies.

The function sends the latest chat turns to the OpenAI Responses API with response storage disabled. The site does not save chat history. OpenAI API processing is still subject to the data controls and terms on the API account. Do not enter sensitive personal data into the chat.

## Local development

For `supabase functions serve luma-chat`, add `OPENAI_API_KEY` and optionally `OPENAI_MODEL` to `supabase/functions/.env` (not the Vite `.env`), then start Supabase locally. Keep the file private and never commit it.
