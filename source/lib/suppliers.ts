export const supplierDomains:Record<string,string>={
 'moduplay.com.au':'Moduplay','vanrytind.com.au':'Van Ryt Industries','kompan.com':'KOMPAN',
 'willplay.com.au':'WillPlay','activediscovery.net.au':'Active Discovery','lypa.com.au':'Lypa','lypaproduct.com.au':'Lypa',
 'landmarkpro.com.au':'Landmark Products','streetfurniture.com':'Street Furniture Australia','ironcladwa.com.au':'IronClad WA'
};
export const supplierName=(url:string)=>supplierDomains[new URL(url).hostname.replace(/^www\./,'')];
export type Directory={name:string;url:string;items:{name:string;url:string;kind:'product'|'category'}[]};
