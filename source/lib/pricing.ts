import type {Product} from './types';
export type Pricing={unitPrice:number|null;quantity:number};
export const maxUnitPrice=10_000_000,maxQuantity=100_000;
export const money=(value:number)=>new Intl.NumberFormat('en-AU',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
export function supplierPrice(value:string):number|null {
 // Only explicit AUD amounts or dollar amounts on these Australian supplier pages.
 // A range, 'from' price or foreign currency is not a confirmed unit price.
 if(/\b(?:from|starting|range|USD|EUR|GBP|NZD)\b|(?:\d\s*[-–]\s*\d)/i.test(value))return null;
 const matches=[...value.matchAll(/(?:\bAUD\s*\$?|\bAU?\$|(?<!\w)\$)\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)(?![\d.,])/gi)];
 if(matches.length!==1)return null;
 const amount=Number(matches[0][1].replace(/,/g,''));return Number.isFinite(amount)&&amount<=maxUnitPrice?amount:null;
}
export function pricingFor(p:Product):Pricing{return p.pricing??{unitPrice:supplierPrice(p.fields.Price),quantity:1}}
export function lineTotal(pricing:Pricing):number|null{return pricing.unitPrice===null?null:Math.round((pricing.unitPrice+Number.EPSILON)*100)*pricing.quantity/100}
export function priceSummary(products:Product[]){let cents=0,priced=0;for(const p of products){const total=lineTotal(pricingFor(p));if(total!==null){cents+=Math.round(total*100);priced++}}return {total:priced?cents/100:null,priced,missing:products.length-priced}}
export function withPricing(p:Product):Product{return {...p,pricing:pricingFor(p)}}
