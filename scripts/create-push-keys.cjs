/* eslint-disable @typescript-eslint/no-require-imports -- Standalone local key-generation command. */
const fs = require('fs');
const webpush = require('web-push');
const path = require('path').join(__dirname, '..', '.env.push.generated');
const keys = webpush.generateVAPIDKeys();
fs.writeFileSync(path, `VAPID_PUBLIC_KEY=${keys.publicKey}\nVAPID_PRIVATE_KEY=${keys.privateKey}\nVAPID_SUBJECT=mailto:REEMPLAZAR_POR_TU_CORREO\nREMINDER_TIMEZONE=America/Guayaquil\n`, { flag: 'wx', mode: 0o600 });
console.log('Claves creadas en .env.push.generated (excluido de Git). No las regeneres al desplegar.');
