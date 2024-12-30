A simple twilio + OpenAI bot that receives a forwared voicenote on Whatsapp, and returns a summary of the content.

## How to run

1. Clone the repository
2. Create a .env file with the credentials (follow .env.example)
3. Run `npm install`
4. Run `node server.js`
5. Run `ngrok http 3000`
6. Update the webhook on Twilio with the ngrok url
7. Activate the sandbox on Twilio
8. Send a voicenote to the number configured on Twilio
