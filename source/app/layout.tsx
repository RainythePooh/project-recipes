import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={icons:{icon:{url:'/project-recipes-chef.svg',type:'image/svg+xml'}},title:'Project Recipes',description:'Create your play&furniture collection. Collect products, edit prices and quantities, and create project PDF schedules.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
