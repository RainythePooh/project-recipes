import type {Pricing} from './pricing';
import {supplierName} from './suppliers';
export const fieldNames = ['Supplier','Product code','Material','Finishes','Colour','Fixing options','Price','CAD status'] as const;
export type FieldName = typeof fieldNames[number];
export type Asset = {role:string;url:string;filename:string;kind:'image'|'cad'|'pdf';status:'available'|'blocked';note?:string;previewUrl?:string};
export type Product = {id:string;name:string;code:string;url:string;fields:Record<FieldName,string>;assets:Asset[];notes:string[];image?:string;plan?:string;planLabel?:string;checkedAt:string;reviewed:boolean;fromSnapshot:boolean;pricing?:Pricing};
export const unknown = 'Not published / supplier confirmation required';
export function safe(s:string){return s.normalize('NFKD').replace(/[^A-Za-z0-9._-]+/g,'_').replace(/^[_\.]+|[_\.]+$/g,'').slice(0,120)||'Product'}
export function normalise(value:string){const u=new URL(value.trim());if(u.protocol!=='https:')throw new Error('Use an HTTPS product URL');u.hash='';const keep=new URLSearchParams();for(const key of ['v','page','paged']){const value=u.searchParams.get(key);if(value&&/^[A-Za-z0-9_-]{1,80}$/.test(value))keep.set(key,value)}u.search=keep.toString();u.pathname=u.pathname.replace(/\/+$/,'');return u.toString()}
export function supplierHost(value:string){try{return !!supplierName(value)}catch{return false}}
