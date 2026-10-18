import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const target=fileURLToPath(new URL('.env',import.meta.url));
if(existsSync(target)){console.log('.env exists. Edit its domain; it has not been overwritten.');process.exit(0);}
const template=readFileSync(new URL('.env.example',import.meta.url),'utf8');
writeFileSync(target,template+'\nSEARXNG_SECRET='+randomBytes(32).toString('hex')+'\n',{mode:0o600,flag:'wx'});
console.log('.env created. Set SEARXNG_DOMAIN before running docker compose up -d.');
