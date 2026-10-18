export const APP_ORIGIN='https://europauto-portail.sharprain32.chatgpt.site';
export function listingUrl(value){
 let url;try{url=new URL(value);}catch{throw Error('Saisissez une URL de liste valide.');}
 if(url.protocol!=='https:'||url.username||url.password||url.port||!['autoexportmarseille.com','www.autoexportmarseille.com'].includes(url.hostname)||!/^\/annonces(?:\/page\/\d+)?\/?$/.test(url.pathname))throw Error('L’assistant navigateur prend en charge les listes https://autoexportmarseille.com/annonces/ et leurs pages suivantes. Les autres sites restent en import manuel.');
 url.hash='';return url.href;
}
export function trustedSender(sender){try{return sender.tab?.id!==undefined&&sender.frameId===0&&new URL(sender.url).origin===APP_ORIGIN;}catch{return false;}}
export function publicAccessAllowed(robots){return !robots.split(/\r?\n/).some(line=>/^\s*disallow:\s*\/\s*(?:#.*)?$/i.test(line));}
