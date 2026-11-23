import {requireChatGPTUser} from '../chatgpt-auth';
import QuotationEditor from './quotation-editor';
export const dynamic='force-dynamic';
export const metadata={title:'Orçamento — MEINERZ UNIFORM STUDIO'};
export default async function Quotations(){const user=await requireChatGPTUser('/orcamentos');return <QuotationEditor sellerName={user.fullName||user.displayName}/>;}
