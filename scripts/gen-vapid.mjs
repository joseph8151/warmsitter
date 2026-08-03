// Generate a VAPID key pair for Web Push. Paste the output into your .env.
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
console.log("Add these to your .env / Vercel env:\n");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY="${keys.publicKey}"`);
console.log(`VAPID_PRIVATE_KEY="${keys.privateKey}"`);
console.log(`VAPID_SUBJECT="mailto:admin@warmsitter.test"`);
