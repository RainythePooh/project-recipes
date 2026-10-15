import Workspace from './workspace';
import {getChatGPTUser,chatGPTSignInPath,chatGPTSignOutPath} from './chatgpt-auth';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getChatGPTUser();return <Workspace user={user} signInPath={chatGPTSignInPath('/')} signOutPath={chatGPTSignOutPath('/')}/>}
