const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const SIDEBAND_CA="";
const SIDEBAND_X_URL="";
const STATIC_DEMO=location.hostname.endsWith(".github.io")||new URLSearchParams(location.search).has("static-demo");
const STATIC_STATE_KEY="sideband-pages-state-v2";
const STATIC_SOURCE_FILES=["README.md","package.json",".env.example","config/network.json","server.mjs","src/store.mjs","src/repository.mjs","src/core/identity.mjs","src/core/policy.mjs","src/core/message.mjs","src/core/payment.mjs","contracts/SidebandAccount.sol","contracts/IdentityRegistry.sol","contracts/PermissionPolicy.sol","ios/Sideband/SidebandApp.swift","ios/Sideband/APIClient.swift","ios/Sideband/Models.swift","ios/Sideband/LocalVault.swift","ios/Sideband/ContactService.swift","ios/Sideband/MessageService.swift","tests/core.test.mjs","workbench.html","workbench.css","workbench-right.css","workbench-polish.css","iphone-real.css","iphone-clean.css","repo-comfort.css","clarity.css","layout-final.css","repo-inline.css","logo-system.css","narrative.css","phone-os.css","phone-product.css","phone-screens.css","workbench.js","index.html"];
let staticStatePromise;
function staticRepositoryTree(){const root={};for(const path of STATIC_SOURCE_FILES){const parts=path.split("/");let node=root;parts.forEach((part,index)=>{if(index===parts.length-1)node[part]={type:"file",path};else{node[part]??={type:"directory",children:{}};node=node[part].children}})}return root}
async function staticState(){if(!staticStatePromise)staticStatePromise=(async()=>{const saved=localStorage.getItem(STATIC_STATE_KEY);if(saved)return JSON.parse(saved);const response=await fetch(new URL("data/state.json",document.baseURI));if(!response.ok)throw new Error("demo state unavailable");const state=await response.json();localStorage.setItem(STATIC_STATE_KEY,JSON.stringify(state));return state})();return staticStatePromise}
function saveStaticState(state){localStorage.setItem(STATIC_STATE_KEY,JSON.stringify(state))}
function staticHash(){const bytes=crypto.getRandomValues(new Uint8Array(32));return "0x"+Array.from(bytes,byte=>byte.toString(16).padStart(2,"0")).join("")}
async function staticApi(path,options={}){
 const url=new URL(path,"https://sideband.local"),method=String(options.method||"GET").toUpperCase();
 if(method==="GET"&&url.pathname==="/api/health")return{ok:true,version:"0.2.0",mode:"pages-demo",chainId:4663};
 if(method==="GET"&&url.pathname==="/api/repository")return staticRepositoryTree();
 if(method==="GET"&&url.pathname==="/api/source"){const sourcePath=url.searchParams.get("path")||"";if(!STATIC_SOURCE_FILES.includes(sourcePath))throw new Error("source file not public");const response=await fetch(new URL(sourcePath,document.baseURI));if(!response.ok)throw new Error("source file unavailable");return{path:sourcePath,source:await response.text()}}
 const state=await staticState();
 if(method==="GET"&&url.pathname==="/api/system")return{identity:state.identity,balances:state.balances,policies:state.policies,recentTransactions:state.transactions.slice(0,5)};
 if(method==="GET"&&url.pathname==="/api/contacts")return state.contacts;
 if(method==="GET"&&url.pathname==="/api/messages"){const contactId=url.searchParams.get("contactId");return contactId?state.messages.filter(message=>message.contactId===contactId):state.messages}
 if(method==="POST"&&url.pathname==="/api/messages"){const input=JSON.parse(options.body||"{}");if(!input.contactId||!String(input.body||"").trim())throw new Error("contactId and body are required");const message={id:"msg_"+Date.now(),contactId:input.contactId,direction:"out",body:String(input.body).trim().slice(0,4000),createdAt:new Date().toISOString()};state.messages.push(message);saveStaticState(state);return message}
 if(method==="GET"&&url.pathname==="/api/policies")return state.policies;
 if(method==="PATCH"&&url.pathname.startsWith("/api/policies/")){const id=decodeURIComponent(url.pathname.slice("/api/policies/".length)),input=JSON.parse(options.body||"{}"),policy=state.policies.find(item=>item.id===id);if(!policy)throw new Error("policy not found");policy.active=Boolean(input.active);saveStaticState(state);return policy}
 if(method==="GET"&&url.pathname==="/api/transactions")return state.transactions;
 if(method==="POST"&&url.pathname==="/api/payments"){const input=JSON.parse(options.body||"{}"),amount=Number(input.amount),asset=input.asset||"USDC",policy=state.policies.find(item=>item.id==="market.pay");if(!policy?.active)throw new Error("capability revoked");if(!(amount>0)||amount>Number(policy.spendLimit||0))throw new Error("spend limit exceeded");if(Number(state.balances[asset]||0)<amount)throw new Error("insufficient balance");state.balances[asset]=Number((state.balances[asset]-amount).toFixed(6));const transaction={id:crypto.randomUUID(),hash:staticHash(),mode:"pages-demo",chainId:state.identity.chainId,contactId:input.contactId,amount,asset,memo:input.memo||"",status:"confirmed",createdAt:new Date().toISOString()};state.transactions.unshift(transaction);saveStaticState(state);return transaction}
 throw new Error("demo route unavailable");
}
async function api(path,options={}){if(STATIC_DEMO)return staticApi(path,options);const response=await fetch(path,{...options,headers:{"Content-Type":"application/json",...(options.headers||{})}});const payload=await response.json();if(!response.ok)throw new Error(payload.error||"request failed");return payload}
async function refreshSystem(){try{const state=await api("/api/system");const usdc=state.balances.USDC.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});if(q("#homeBalance"))q("#homeBalance").textContent=`$${usdc}`;if(q("#phoneUsdc"))q("#phoneUsdc").textContent=usdc;if(q("#phoneBalance"))q("#phoneBalance").textContent=`$${usdc}`}catch{notify("LOCAL SERVICE OFFLINE")}}
const extra=document.createElement("link");extra.rel="stylesheet";extra.href="workbench-right.css";document.head.append(extra);
const polish=document.createElement("link");polish.rel="stylesheet";polish.href="workbench-polish.css";document.head.append(polish);
const iphone=document.createElement("link");iphone.rel="stylesheet";iphone.href="iphone-real.css";document.head.append(iphone);
const cleanPhone=document.createElement("link");cleanPhone.rel="stylesheet";cleanPhone.href="iphone-clean.css";document.head.append(cleanPhone);
const repoComfort=document.createElement("link");repoComfort.rel="stylesheet";repoComfort.href="repo-comfort.css";document.head.append(repoComfort);
const clarity=document.createElement("link");clarity.rel="stylesheet";clarity.href="clarity.css";document.head.append(clarity);
const finalLayout=document.createElement("link");finalLayout.rel="stylesheet";finalLayout.href="layout-final.css";document.head.append(finalLayout);
const inlineRepo=document.createElement("link");inlineRepo.rel="stylesheet";inlineRepo.href="repo-inline.css";document.head.append(inlineRepo);
const logoSystem=document.createElement("link");logoSystem.rel="stylesheet";logoSystem.href="logo-system.css";document.head.append(logoSystem);
const narrativeStyle=document.createElement("link");narrativeStyle.rel="stylesheet";narrativeStyle.href="narrative.css";document.head.append(narrativeStyle);
const phoneOSStyle=document.createElement("link");phoneOSStyle.rel="stylesheet";phoneOSStyle.href="phone-os.css";document.head.append(phoneOSStyle);
const phoneProductStyle=document.createElement("link");phoneProductStyle.rel="stylesheet";phoneProductStyle.href="phone-product.css";document.head.append(phoneProductStyle);
const phoneScreensStyle=document.createElement("link");phoneScreensStyle.rel="stylesheet";phoneScreensStyle.href="phone-screens.css";document.head.append(phoneScreensStyle);
const favicon=document.createElement("link");favicon.rel="icon";favicon.type="image/png";favicon.href="sideband.png";document.head.append(favicon);
const phoneHome=q(".ios-home");
if(phoneHome)phoneHome.innerHTML=[
 "<header class='product-nav'><div><small>SIDEBAND SYSTEM</small><h2>Good morning.</h2></div><button class='product-avatar' data-app='identity' aria-label='Open identity'></button></header>",
 "<button class='trust-surface' data-app='identity'><div class='trust-top'><span><i></i> ROBINHOOD CHAIN</span><em>CHAIN 4663</em></div><div class='trust-identity'><i class='trust-mark'></i><span><small>YOUR IDENTITY</small><b>sideband.id/00</b></span><strong>VERIFIED</strong></div><footer class='trust-footer'><span>THIS IPHONE SIGNS</span><b>FACE ID PROTECTED</b></footer></button>",
 "<section><header class='product-section-title'><h3>Your system</h3><span>4 CORE SERVICES</span></header><div class='product-modules'>",
 "<button class='product-module' data-app='contacts'><i class='product-icon pi-people'></i><span><b>People</b><small>5 verified</small></span></button>",
 "<button class='product-module' data-app='messages'><i class='product-icon pi-message'></i><span><b>Messages</b><small>1 new request</small></span></button>",
 "<button class='product-module' data-app='applications'><i class='product-icon pi-apps'></i><span><b>Apps</b><small>4 connected</small></span></button>",
 "<button class='product-module' data-app='wallet'><i class='product-icon pi-wallet'></i><span><b>Wallet</b><small>2 assets</small></span></button>",
 "</div></section>",
 "<div class='product-controls'>",
 "<button class='product-control' data-app='permissions'><i>PR</i><span><b>Permissions</b><small>3 active &middot; all within limits</small></span><strong>&rsaquo;</strong></button>",
 "<button class='product-control' data-app='activity'><i>AC</i><span><b>System activity</b><small>Last verified just now</small></span><strong>&rsaquo;</strong></button>",
 "<button class='product-control' data-app='recovery'><i>RC</i><span><b>Recovery</b><small>2 of 3 guardians ready</small></span><strong>&rsaquo;</strong></button>",
 "</div>",
 "<nav class='product-tabs'><button class='active' aria-label='Home'><i class='pt-home'></i><span>Home</span></button><button data-app='contacts' aria-label='People'><i class='pt-people'></i><span>People</span></button><button data-app='applications' aria-label='Apps'><i class='pt-apps'></i><span>Apps</span></button><button data-app='permissions' aria-label='Settings'><i class='pt-settings'></i><span>Settings</span></button></nav>"
].join("");
if(phoneHome)phoneHome.classList.add("product-home");
const chainStatus=q(".chain");if(chainStatus)chainStatus.remove();
const topActions=q(".top-actions"),twitterButton=document.createElement("button");
twitterButton.id="twitterLink";twitterButton.className=SIDEBAND_X_URL?"social-link":"social-link social-pending";twitterButton.textContent="X / TWITTER";twitterButton.title=SIDEBAND_X_URL?"Open Sideband on X":"Sideband X account will appear here";
if(topActions)topActions.appendChild(twitterButton);
twitterButton.onclick=()=>{if(!SIDEBAND_X_URL){notify("TWITTER LINK COMING SOON");return}window.open(SIDEBAND_X_URL,"_blank","noopener,noreferrer")};
const caButton=q("#copyAddress");
if(caButton){caButton.classList.toggle("ca-pending",!SIDEBAND_CA);caButton.title=SIDEBAND_CA?"Copy Sideband contract address":"Contract address will be announced soon";caButton.textContent=SIDEBAND_CA?`CA / ${SIDEBAND_CA.slice(0,6)}...${SIDEBAND_CA.slice(-4)}`:"CA / TBA"}
const developerOpening=[
 "<section class='builder-story'><div class='builder-label'>A NOTE FROM THE BUILDER / 01</div><h2>I started Sideband with a simple question: why does the most personal computer we own still make us rent our identity from every app?</h2>",
 "<p>I use an iPhone every day. It already knows who I am, it already protects important keys, and it is already where my conversations, relationships and payments meet. But the moment I open a new service, I start from zero again. I create another account, accept another permission screen and trust another company to keep a piece of my digital life alive.</p>",
 "<p>That feels backwards to me. I do not want an app to be the permanent home of my identity. I want the phone to hold the durable part, and I want apps to be useful tools that I can connect, limit, replace or remove.</p>",
 "<div class='builder-quote'>Sideband began as an attempt to make ownership feel ordinary. No seed phrase on the first screen. No wall of chain terminology. Just a phone that can clearly say: this is you, this is the person you are dealing with, this is what the app is asking for, and this is what will happen next.</div>",
 "<p>I am not trying to put iOS on a blockchain. That would be slow, invasive and unnecessary. I am building a layer that lives inside the normal phone experience. Private work happens locally. Shared proof and settlement happen on Robinhood Chain. The user should feel one coherent system, not two unrelated worlds taped together.</p></section>"
].join("");
const developerMeaning=[
 "<section class='builder-story'><div class='builder-label'>WHAT I MEAN BY A PHONE SYSTEM / 02</div><h2>I am aiming for something deeper than a wallet with extra tabs.</h2>",
 "<p>A wallet normally begins with assets. Sideband begins with a person. Money matters, but it sits next to contacts, conversation, applications and permissions because that is how people actually use a phone. You usually pay someone because you know them, received a request from them or used an application with them.</p>",
 "<p>When I say system, I mean that these parts understand one another. A contact is not only a name in an address book. It can be a verified identity, a message recipient and a safe payment destination. A message can contain a payment request without exposing the conversation onchain. An app can ask for a narrowly defined ability instead of asking the user to trust an unreadable signature.</p>",
 "<p>The chain is important, but it should stay underneath the experience. People should not need to understand calldata, gas strategy or account abstraction before they can judge a payment. Those are implementation details. The interface has to translate them into consequences a person can understand.</p>",
 "<div class='builder-decisions'><div><i>DECISION 01</i><b>The account comes before the app.</b><p>Your identity should survive when a service closes, changes direction or blocks access.</p></div><div><i>DECISION 02</i><b>Private data stays private.</b><p>A public ledger is useful for proof and settlement, not for storing a person's daily life.</p></div><div><i>DECISION 03</i><b>Permissions must read like promises.</b><p>A user should understand the exact action, value limit and expiry before approving it.</p></div><div><i>DECISION 04</i><b>Crypto should not become homework.</b><p>The system can use sophisticated infrastructure without forcing technical vocabulary onto everyone.</p></div></div>",
 "<p>I also want Sideband to be honest about where decentralization helps and where it does not. A message relay can be a normal network service as long as it only sees ciphertext and can be replaced. A chain can prove account ownership without learning a user's contact list. The goal is not to remove every server. The goal is to remove unnecessary control.</p></section>"
].join("");
const developerReality=[
 "<section class='builder-log'><header><span>BUILDER LOG / THE HONEST VERSION</span><span>WORK IN PROGRESS</span></header><div><h3>WHAT WORKS TODAY</h3><p>The phone on this page is interactive. The local service can load contacts, accept messages, change permissions, simulate payments and record activity. The repository includes a permission engine, authenticated encryption primitives, SwiftUI source and early smart-account contracts. It is enough to test the shape of the product and to make the architecture concrete.</p><h3>WHAT IS STILL SIMULATED</h3><p>The balance is demonstration data. The payment flow does not move real USDC. Messages are not yet travelling between two real devices. The contracts have not been audited or deployed as a production account. I keep these limits visible because a credible onchain product should never pretend that a prototype is ready to protect real money.</p><h3>THE HARDEST PART IS NOT THE SCREEN</h3><p>The difficult work is making security understandable. How does recovery work without creating a hidden master key? How can a session be convenient but still expire safely? How do we prevent an app from turning a small permission into a larger action? How do multiple devices rotate keys without losing message history? These questions shape the product more than visual polish does.</p><h3>WHAT I WILL NOT COMPROMISE ON</h3><p>The root key must never be handed to an app. Private conversations must never be published to the chain. A permission must never hide unlimited authority behind friendly wording. Recovery must never quietly make Sideband the owner of the user's account. Before real assets are supported, the contracts and device flows must be tested and reviewed by people who did not write them.</p><h3>WHY BUILD THE INTERFACE THIS EARLY?</h3><p>Because architecture becomes real when a person has to use it. A permission model may look elegant in code and still be impossible to explain on a five-inch screen. Building the phone interface now forces every protocol idea to answer a practical question: what does the user see, what do they understand, and what can they undo?</p></div></section>"
].join("");
const developerClosing=[
 "<section class='builder-signoff'><div class='builder-label'>WHERE I WANT TO TAKE THIS / 03</div><p>I want Sideband to become a small, dependable system that people can actually carry: a native iPhone client, a secure device signer, a recoverable smart account, encrypted communication and an application model built around explicit capabilities.</p><p>I do not expect the first version to replace every existing app. The useful path is narrower: make identity, permission and payment work extremely well; let a few applications integrate with those foundations; test the system with real people; then expand only where the shared layer makes the experience meaningfully better.</p><p>I am publishing the structure because this cannot be solved by interface design alone. It needs criticism from mobile engineers, protocol developers, security researchers and people who do not care about crypto but do care about owning their digital life. If Sideband only makes sense to blockchain developers, I have not finished the job.</p><p><strong>The test I keep returning to is simple:</strong> could I give this phone to someone I care about, let them use it without a technical lesson, and trust it to explain every important decision before they make it? That is the standard I want the project to reach.</p><span>- THE SIDEBAND BUILDER</span></section>"
].join("");
const aboutSummary=q(".plain-answer"),systemMap=q(".system-map"),projectStatus=q(".project-status"),aboutQuote=q(".about-scroll blockquote");
const aboutTitle=q(".about-scroll h1"),aboutLead=q(".about-scroll .lead");
if(aboutTitle){aboutTitle.classList.add("question-title");aboutTitle.innerHTML="WHAT HAPPENS WHEN YOU PUT<br>ROBINHOOD CHAIN<br>INSIDE AN IPHONE?"}
if(aboutLead)aboutLead.textContent="Sideband is a user-owned phone system for identity, private messages, applications, permissions and payments.";
if(aboutSummary)aboutSummary.insertAdjacentHTML("afterend",developerOpening);
if(systemMap)systemMap.insertAdjacentHTML("afterend",developerMeaning);
if(projectStatus)projectStatus.insertAdjacentHTML("beforebegin",developerReality);
if(aboutQuote)aboutQuote.insertAdjacentHTML("afterend",developerClosing);
refreshSystem();
function notify(text){const t=q("#toast");t.textContent=text;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1400)}
function home(){qa(".phone-view").forEach(v=>v.classList.toggle("active",v.dataset.phone==="home"));q("#paySheet").classList.remove("open")}
const apps={
 recovery:{title:"RECOVERY",state:"READY",html:`<h3>Keep your account, even if this phone is lost.</h3><p>Recovery changes the device signer without giving an application control of your identity.</p><div class="mini-card"><small>RECOVERY PLAN</small><b>2 of 3 guardians</b><span>Last verified today</span></div><div class="mini-row"><i>01</i><span><b>Personal recovery key</b><em>Stored offline</em></span><strong>READY</strong></div><div class="mini-row"><i>02</i><span><b>Trusted guardian</b><em>Mira Chen</em></span><strong>READY</strong></div><div class="mini-row"><i>03</i><span><b>Backup device</b><em>Not connected</em></span><strong>ADD</strong></div>`},
 identity:{title:"IDENTITY",state:"LIVE",html:`<div class="mini-card dark"><small>SMART ACCOUNT</small><b>sideband.id/00</b><span>0x71A8 ··· 44C2</span></div><div class="mini-row"><i>✓</i><span><b>Device signer</b><em>This iPhone</em></span><strong>ACTIVE</strong></div><div class="mini-row"><i>↻</i><span><b>Recovery</b><em>2 of 3 guardians</em></span><strong>READY</strong></div>`},
 contacts:{title:"CONTACTS",state:"5",html:`<h3>Your people.</h3><p>Private locally. Portable by identity.</p><div class="mini-row"><i>MI</i><span><b>Mira Chen</b><em>mira.sideband</em></span><strong>›</strong></div><div class="mini-row"><i>NO</i><span><b>Noah Williams</b><em>0x9921···02A1</em></span><strong>›</strong></div><div class="mini-row"><i>K</i><span><b>Kernel Studio</b><em>verified publisher</em></span><strong>›</strong></div>`},
 messages:{title:"MESSAGES",state:"E2EE",html:`<div class="mini-row"><i>MI</i><span><b>Mira Chen</b><em>encrypted · online</em></span><strong>•••</strong></div><h3>Payment request</h3><p>Messages stay offchain. Settlement does not.</p><div class="pay-request"><small>REQUEST / SHARED RELAY</small><b>12.00 USDC</b><button id="openPayment">REVIEW & PAY</button></div>`},
 wallet:{title:"WALLET",state:"4663",html:`<div class="mini-card dark"><small>TOTAL BALANCE</small><b id="phoneBalance">$2,483.90</b><span>ROBINHOOD CHAIN</span></div><div class="mini-row"><i>$</i><span><b>USD Coin</b><em>Robinhood Chain</em></span><strong id="phoneUsdc">1,842.20</strong></div><div class="mini-row"><i>Ξ</i><span><b>Ethereum</b><em>Network gas</em></span><strong>0.247</strong></div>`},
 applications:{title:"APPLICATIONS",state:"4",html:`<h3>Installed locally.</h3><p>Authorized onchain.</p><div class="mini-row"><i>↯</i><span><b>Relay</b><em>Messaging · v1.4</em></span><strong>OPEN</strong></div><div class="mini-row"><i>◫</i><span><b>Market</b><em>Exchange · v0.8</em></span><strong>OPEN</strong></div><div class="mini-row"><i>✦</i><span><b>Agent</b><em>AI · v0.3</em></span><strong>OPEN</strong></div>`},
 permissions:{title:"PERMISSIONS",state:"3",html:`<h3>You are root.</h3><p>Every capability is revocable.</p><label class="toggle-row"><span><b>Relay</b><em>Contacts · Notifications</em></span><input data-policy="relay.contacts" type="checkbox" checked></label><label class="toggle-row"><span><b>Market</b><em>Wallet · $50/day</em></span><input data-policy="market.pay" type="checkbox" checked></label><label class="toggle-row"><span><b>Agent</b><em>Messages · Read only</em></span><input data-policy="agent.messages" type="checkbox" checked></label>`},
 activity:{title:"ACTIVITY",state:"SYNCED",html:`<h3>System activity.</h3><p>Readable events, not mystery access.</p><div class="mini-row"><i>·</i><span><b>Session key renewed</b><em>Agent · 2m</em></span></div><div class="mini-row"><i>·</i><span><b>Message key rotated</b><em>Relay · 18m</em></span></div><div class="mini-row"><i>·</i><span><b>Permission granted</b><em>Market · 1d</em></span></div>`}
};
const productApps={
 identity:{title:"IDENTITY",state:"SECURE",html:"<div id='identityScreen' class='loading-state'>VERIFYING DEVICE...</div>"},
 contacts:{title:"PEOPLE",state:"PRIVATE",html:"<div class='screen-intro'><small>LOCAL ADDRESS BOOK</small><h3>Your people.</h3><p>Names stay on this iPhone. Public identities resolve only when needed.</p></div><label class='search-shell'><i></i><input id='contactSearch' placeholder='Search people' autocomplete='off'></label><div id='contactList' class='contact-list'><div class='loading-state'>LOADING PEOPLE...</div></div>"},
 messages:{title:"MESSAGES",state:"E2EE",html:"<div class='secure-strip'>END-TO-END ENCRYPTED / KEYS ON THIS IPHONE</div><div id='threadList' class='inbox-list'><div class='loading-state'>OPENING PRIVATE RELAY...</div></div>"},
 applications:{title:"APPS",state:"4 ACTIVE",html:"<div class='screen-intro'><small>CAPABILITY-BASED ACCESS</small><h3>Connected apps.</h3><p>Apps receive a limited permission, never your root account key.</p></div><div class='app-card'><i>RE</i><span><b>Relay</b><small>Messages and notifications</small><em class='capability-chip'>CONTACTS / NOTIFY</em></span><button data-service='Relay'>DETAILS</button></div><div class='app-card'><i>MK</i><span><b>Market</b><small>Exchange and settlement</small><em class='capability-chip'>SEND UP TO 50 USDC</em></span><button data-service='Market'>DETAILS</button></div><div class='app-card'><i>AI</i><span><b>Agent</b><small>On-device assistant</small><em class='capability-chip'>MESSAGES / READ</em></span><button data-service='Agent'>DETAILS</button></div>"},
 wallet:{title:"WALLET",state:"CHAIN 4663",html:"<div id='walletScreen' class='loading-state'>READING ACCOUNT...</div>"},
 permissions:{title:"PERMISSIONS",state:"3 RULES",html:"<div class='permission-head'><b>You control every capability.</b><span>Changes take effect immediately.</span></div><div id='policyList'><div class='loading-state'>READING POLICIES...</div></div>"},
 activity:{title:"ACTIVITY",state:"VERIFIED",html:"<div class='screen-intro'><small>READABLE SYSTEM HISTORY</small><h3>What happened.</h3><p>Security, permission and payment events in one place.</p></div><div id='activityTimeline' class='timeline'><div class='loading-state'>VERIFYING EVENTS...</div></div>"},
 recovery:{title:"RECOVERY",state:"READY",html:"<div class='recovery-score'><small>ACCOUNT RECOVERY</small><h3>2 of 3 factors ready.</h3><p>You can replace a lost device without giving Sideband ownership of your account.</p></div><div class='detail-group'><div class='detail-row'><i>01</i><span><b>Personal recovery key</b><small>Stored offline</small></span><strong>READY</strong></div><div class='detail-row'><i>02</i><span><b>Trusted guardian</b><small>Mira Chen</small></span><strong>READY</strong></div><div class='detail-row'><i>03</i><span><b>Backup device</b><small>No device connected</small></span><strong>ADD</strong></div></div><button class='primary-button' id='recoveryCheck'>RUN RECOVERY CHECK</button>"}
};
function escapeText(value){return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}
function shortAccount(value){const text=String(value||"");return text.length>14?text.slice(0,8)+"..."+text.slice(-6):text}
async function hydrateIdentity(){
 const state=await api("/api/system"),identity=state.identity;
 q("#identityScreen").className="";
 q("#identityScreen").innerHTML="<section class='identity-hero'><header><span>USER-OWNED SMART ACCOUNT</span><b>VERIFIED</b></header><h3>"+escapeText(identity.handle)+"</h3><p>"+escapeText(shortAccount(identity.account))+"</p><div class='identity-proof'><span>ROBINHOOD CHAIN "+identity.chainId+"</span><strong>DEVICE PROOF VALID</strong></div></section><div class='detail-group'><div class='detail-row'><i>ID</i><span><b>Public identity</b><small>Portable across connected apps</small></span><strong>LIVE</strong></div><div class='detail-row'><i>SE</i><span><b>Device signer</b><small>"+escapeText(identity.signer)+" / Secure Enclave</small></span><strong>ACTIVE</strong></div><button class='detail-row action' id='identityRecovery'><i>RC</i><span><b>Recovery plan</b><small>2 of 3 factors ready</small></span><strong>&rsaquo;</strong></button></div>";
 q("#identityRecovery").onclick=()=>openApp("recovery");
}
async function hydrateContacts(){
 const contacts=await api("/api/contacts"),list=q("#contactList");
 list.innerHTML=contacts.map((contact,index)=>"<button class='contact-item' data-contact='"+escapeText(contact.id)+"'><i class='person-avatar "+(index%2?"blue":"")+"'>"+escapeText(contact.name.split(" ").map(part=>part[0]).join("").slice(0,2))+"</i><span><b>"+escapeText(contact.name)+"</b><small>"+escapeText(contact.handle)+(contact.verified?" / verified publisher":"")+"</small></span><strong>&rsaquo;</strong></button>").join("");
 qa("[data-contact]").forEach(button=>button.onclick=()=>{const contact=contacts.find(item=>item.id===button.dataset.contact);openConversation(contact.id,contact.name)});
 const search=q("#contactSearch");search.oninput=()=>qa("[data-contact]").forEach(button=>button.hidden=!button.textContent.toLowerCase().includes(search.value.toLowerCase()));
 q("#appState").textContent=contacts.length+" PEOPLE";
}
async function hydrateMessages(){
 const [contacts,messages]=await Promise.all([api("/api/contacts"),api("/api/messages")]),list=q("#threadList");
 list.innerHTML=contacts.map((contact,index)=>{const thread=messages.filter(message=>message.contactId===contact.id),last=thread.at(-1),preview=last?.kind==="payment_request"?(last.amount+" "+last.asset+" payment request"):(last?.body||"Start an encrypted conversation");return "<button class='thread-item' data-thread='"+escapeText(contact.id)+"'><i class='person-avatar "+(index%2?"blue":"")+"'>"+escapeText(contact.name.split(" ").map(part=>part[0]).join("").slice(0,2))+"</i><span><b>"+escapeText(contact.name)+"</b><small>"+escapeText(preview)+"</small></span><em>"+(thread.length?thread.length+" MSG":"NEW")+"</em></button>"}).join("");
 qa("[data-thread]").forEach(button=>button.onclick=()=>{const contact=contacts.find(item=>item.id===button.dataset.thread);openConversation(contact.id,contact.name)});
}
async function openConversation(contactId,name){
 q("#phoneBack").onclick=()=>openApp("messages");
 q("#appTitle").textContent=name.toUpperCase();q("#appState").textContent="E2EE";
 const messages=await api("/api/messages?contactId="+encodeURIComponent(contactId));
 const content=messages.map(message=>message.kind==="payment_request"?"<div class='chat-request'><small>PAYMENT REQUEST / "+escapeText(message.memo||"")+"</small><b>"+Number(message.amount).toFixed(2)+" "+escapeText(message.asset)+"</b><button id='openPayment'>REVIEW AND PAY</button></div>":"<div class='chat-bubble "+(message.direction==="out"?"out":"")+"'>"+escapeText(message.body)+"</div>").join("");
 q("#appContent").innerHTML="<div class='secure-strip'>PRIVATE SESSION / KEYS VERIFIED</div><div class='conversation'><div class='chat-list'>"+(content||"<div class='loading-state'>NO MESSAGES YET</div>")+"</div><form class='message-form' id='messageForm'><input id='messageInput' maxlength='4000' placeholder='Message "+escapeText(name)+"'><button aria-label='Send'>&uarr;</button></form></div>";
 const pay=q("#openPayment");if(pay)pay.onclick=()=>q("#paySheet").classList.add("open");
 q("#messageForm").onsubmit=async event=>{event.preventDefault();const input=q("#messageInput"),value=input.value.trim();if(!value)return;input.disabled=true;try{await api("/api/messages",{method:"POST",body:JSON.stringify({contactId,body:value})});await openConversation(contactId,name);notify("ENCRYPTED MESSAGE SAVED")}catch(error){input.disabled=false;notify(error.message.toUpperCase())}};
}
async function hydrateWallet(){
 const state=await api("/api/system"),usdc=Number(state.balances.USDC||0),eth=Number(state.balances.ETH||0);
 q("#walletScreen").className="";
 q("#walletScreen").innerHTML="<section class='wallet-hero'><header><span>TOTAL ACCOUNT VALUE</span><span>CHAIN "+state.identity.chainId+"</span></header><h3>$"+(usdc+eth*2600).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})+"</h3><p>"+escapeText(shortAccount(state.identity.account))+"</p></section><div class='wallet-actions'><button id='walletSend'>SEND</button><button id='walletRequest'>REQUEST</button></div><div class='detail-group'><div class='detail-row'><i>US</i><span><b>USD Coin</b><small>Robinhood Chain</small></span><strong>"+usdc.toFixed(2)+"</strong></div><div class='detail-row'><i>ET</i><span><b>Ethereum</b><small>Network balance</small></span><strong>"+eth.toFixed(3)+"</strong></div></div>";
 q("#walletSend").onclick=()=>q("#paySheet").classList.add("open");q("#walletRequest").onclick=()=>notify("PAYMENT LINK CREATED");
}
async function hydratePermissions(){
 const policies=await api("/api/policies"),list=q("#policyList");
 list.innerHTML=policies.map(policy=>"<label class='policy-card'><header><span><b>"+escapeText(policy.app)+"</b><small>"+escapeText(policy.scope)+"</small></span><input data-policy='"+escapeText(policy.id)+"' type='checkbox' "+(policy.active?"checked":"")+"></header><p>"+(policy.spendLimit?("LIMIT "+policy.spendLimit+" "+escapeText(policy.asset)+" / ACTION"):"NO PAYMENT ACCESS")+" / EXPIRES DEC 31</p></label>").join("");
 qa("#appContent input[data-policy]").forEach(input=>input.onchange=()=>updatePolicies(input));q("#appState").textContent=policies.filter(policy=>policy.active).length+" ACTIVE";
}
async function hydrateActivity(){
 const [transactions,policies]=await Promise.all([api("/api/transactions"),api("/api/policies")]),events=[];
 transactions.slice(0,2).forEach(tx=>events.push({time:new Date(tx.createdAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),title:"Payment confirmed",detail:tx.amount+" "+tx.asset+" to "+tx.contactId+" / "+shortAccount(tx.hash)}));
 policies.forEach(policy=>events.push({time:policy.active?"ACTIVE":"REVOKED",title:policy.app+" permission",detail:policy.scope}));
 q("#activityTimeline").innerHTML=events.map(event=>"<div class='timeline-item'><time>"+escapeText(event.time)+"</time><b>"+escapeText(event.title)+"</b><p>"+escapeText(event.detail)+"</p></div>").join("");
}
async function hydrateProductScreen(name){
 try{
  if(name==="identity")await hydrateIdentity();
  if(name==="contacts")await hydrateContacts();
  if(name==="messages")await hydrateMessages();
  if(name==="wallet")await hydrateWallet();
  if(name==="permissions")await hydratePermissions();
  if(name==="activity")await hydrateActivity();
  if(name==="applications")qa("[data-service]").forEach(button=>button.onclick=()=>notify(button.dataset.service.toUpperCase()+" CAPABILITIES VERIFIED"));
  if(name==="recovery")q("#recoveryCheck").onclick=()=>{q("#recoveryCheck").textContent="RECOVERY PLAN VERIFIED";notify("2 OF 3 FACTORS READY")};
 }catch(error){q("#appContent").innerHTML="<div class='loading-state'>"+escapeText(error.message.toUpperCase())+"</div>"}
}
async function openApp(name){const a=productApps[name]||apps[name];q("#phoneBack").onclick=home;q("#appTitle").textContent=a.title;q("#appState").textContent=a.state;q("#appContent").innerHTML=a.html;qa(".phone-view").forEach(view=>view.classList.toggle("active",view.dataset.phone==="app"));await hydrateProductScreen(name)}
qa("[data-app]").forEach(b=>b.onclick=()=>openApp(b.dataset.app));q("#phoneBack").onclick=home;q("#homebar").onclick=home;q("#closePay").onclick=()=>q("#paySheet").classList.remove("open");
const requestedScreen=new URLSearchParams(location.search).get("screen");if(requestedScreen&&productApps[requestedScreen])openApp(requestedScreen);
async function updatePolicies(input){try{await api(`/api/policies/${encodeURIComponent(input.dataset.policy)}`,{method:"PATCH",body:JSON.stringify({active:input.checked})});const n=qa("#appContent input:checked").length;q("#appState").textContent=n;notify("POLICY UPDATED")}catch(error){input.checked=!input.checked;notify(error.message.toUpperCase())}}
let hold;const confirm=q("#confirmPay");function cancel(){clearTimeout(hold);confirm.classList.remove("holding")}confirm.onpointerdown=()=>{confirm.classList.add("holding");hold=setTimeout(async()=>{try{const tx=await api("/api/payments",{method:"POST",body:JSON.stringify({contactId:"mira",amount:12,asset:"USDC",memo:"Shared relay"})});q("#paySheet").classList.remove("open");notify(`CONFIRMED · ${tx.hash.slice(0,8)}`);await refreshSystem()}catch(error){notify(error.message.toUpperCase())}cancel()},800)};confirm.onpointerup=cancel;confirm.onpointerleave=cancel;
function clock(){q("#clock").textContent=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",hour12:false})}clock();setInterval(clock,30000);

const sources={
manifest:{path:"runtime / system.manifest",lang:"MANIFEST",code:`system Sideband v0.1 {
  network       robinhood-chain:4663
  execution     local-first
  account       erc-4337
  identity      user-owned

  services {
    contacts     encrypted:local
    messages     e2ee:relay
    applications capability:sandboxed
    payments     policy:explicit
  }

  invariant {
    private_data never_onchain
    permission   always_revocable
    signer       never_exported
  }
}`},
shell:{path:"ios / SidebandApp.swift",lang:"SWIFT",code:`import SwiftUI

@main
struct SidebandApp: App {
    @State private var system = SystemState()

    var body: some Scene {
        WindowGroup {
            PhoneShell()
                .environment(system)
                .task { await system.bootstrap() }
        }
    }
}

struct PhoneShell: View {
    @Environment(SystemState.self) private var system

    var body: some View {
        SystemGrid(modules: system.authorizedModules)
            .safeAreaInset(edge: .top) { IdentityBar() }
            .environment(\.account, system.smartAccount)
    }
}`},
vault:{path:"ios / LocalVault.swift",lang:"SWIFT",code:`import CryptoKit
import Security

actor LocalVault {
    private let store: KeychainStore
    private let database: EncryptedDatabase

    func seal(_ payload: Data, for scope: Scope) throws -> Data {
        let key = try store.symmetricKey(for: scope.identifier)
        return try ChaChaPoly.seal(payload, using: key).combined
    }

    func open(_ envelope: Data, for scope: Scope) throws -> Data {
        guard scope.isAuthorized else { throw VaultError.denied }
        let key = try store.symmetricKey(for: scope.identifier)
        return try ChaChaPoly.open(.init(combined: envelope), using: key)
    }
}`},
contacts:{path:"ios / ContactService.swift",lang:"SWIFT",code:`import Contacts

actor ContactService {
    private let vault: LocalVault
    private let identities: IdentityResolver

    func resolve(_ contact: LocalContact) async throws -> Contact {
        let account = try await identities.account(for: contact.publicName)
        return Contact(local: contact, account: account)
    }

    // Names and phone numbers never leave the encrypted local vault.
    func syncProof(for contact: Contact) async throws -> Data {
        try await vault.commitment(contact.relationship)
    }
}`},
messages:{path:"ios / MessageService.swift",lang:"SWIFT",code:`actor MessageService {
    let relay: EncryptedRelay
    let sessions: SessionStore

    func send(_ plaintext: Data, to peer: Identity) async throws {
        let session = try await sessions.session(for: peer.deviceKey)
        let envelope = try session.encrypt(plaintext)
        try await relay.publish(envelope, inbox: peer.inbox)
    }

    // APNs carries only an opaque wake-up signal.
    // Message plaintext is decrypted on the device.
}`},
account:{path:"contracts / SidebandAccount.sol",lang:"SOLIDITY",code:`contract SidebandAccount {
    address public owner;
    mapping(bytes32 => Policy) public policies;

    function execute(
        Intent calldata intent,
        bytes calldata signature
    ) external returns (bytes memory result) {
        _verifyDeviceSignature(intent, signature);
        _enforcePolicy(intent);
        (bool ok, bytes memory data) = intent.target.call(intent.data);
        require(ok, "execution failed");
        return data;
    }

    function revoke(bytes32 capability) external onlyOwner {
        policies[capability].active = false;
        emit CapabilityRevoked(capability);
    }
}`},
registry:{path:"contracts / IdentityRegistry.sol",lang:"SOLIDITY",code:`contract IdentityRegistry {
    mapping(bytes32 => Identity) public identities;

    function register(
        bytes32 name,
        address account,
        bytes32 deviceCommitment
    ) external {
        require(identities[name].account == address(0), "name taken");
        identities[name] = Identity(account, deviceCommitment, block.number);
        emit IdentityRegistered(name, account);
    }

    function rotateDevice(bytes32 name, bytes32 next) external {
        require(msg.sender == identities[name].account, "unauthorized");
        identities[name].deviceCommitment = next;
    }
}`},
permission:{path:"contracts / PermissionPolicy.sol",lang:"SOLIDITY",code:`struct Policy {
    address application;
    uint48 expiresAt;
    uint96 spendLimit;
    address allowedAsset;
    bool active;
}

library PermissionPolicy {
    function enforce(Policy memory self, Intent memory intent) internal view {
        require(self.active, "revoked");
        require(self.expiresAt > block.timestamp, "expired");
        require(intent.origin == self.application, "invalid origin");
        require(intent.value <= self.spendLimit, "limit exceeded");
    }
}`},
policy:{path:"runtime / policy-engine.ts",lang:"TYPESCRIPT",code:`export async function authorize(intent: Intent, policy: Policy) {
  assert(policy.active, "capability revoked");
  assert(policy.origin === intent.origin, "origin mismatch");
  assert(policy.expiresAt > Date.now(), "session expired");

  if (intent.kind === "payment") {
    assert(intent.value <= policy.spendLimit);
    assert(policy.assets.includes(intent.asset));
  }

  return deviceSigner.confirm({
    title: describe(intent),
    scope: policy.scope,
    once: intent.requiresPresence
  });
}`},
envelope:{path:"runtime / message-envelope.ts",lang:"TYPESCRIPT",code:`export async function sealMessage(
  plaintext: Uint8Array,
  recipient: DeviceIdentity
) {
  const session = await sessions.for(recipient);
  const envelope = await session.encrypt(plaintext);

  return relay.publish({
    inbox: recipient.inbox,
    ciphertext: envelope.ciphertext,
    ratchetKey: envelope.publicKey,
    // No plaintext or social graph is written onchain.
    chainReceipt: null
  });
}`},
architecture:{path:"docs / ARCHITECTURE.md",lang:"MARKDOWN",code:`# Sideband Architecture

Sideband separates private execution from public verification.

## 1. Phone shell
The interface owns no user data. It requests narrowly scoped
capabilities from the runtime.

## 2. Local runtime
Keys, contacts, messages and files remain encrypted on device.
Relays transport opaque envelopes and cannot read their contents.

## 3. Robinhood Chain
Smart accounts express ownership, permissions and settlement.
The chain never stores contact graphs or message plaintext.

> The chain is not the computer. It is the shared trust layer.`},
threat:{path:"docs / THREAT-MODEL.md",lang:"MARKDOWN",code:`# Threat Model

## Protected assets
- Device signing authority
- Recovery shares
- Contact relationships
- Message plaintext
- Application capabilities

## System invariants
1. Applications never receive the root signing key.
2. A session key is scoped, limited and revocable.
3. Private social data is never committed in plaintext.
4. Every financial intent is human-readable before signing.
5. Account recovery cannot silently transfer data custody.`}
};
const escape=s=>s.replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
function highlight(code){return escape(code).split("\n").map(line=>{let text=line.replace(/(\/\/.*|# .*)$/g,'<b class="comment">$1</b>').replace(/\b(contract|function|public|external|returns|return|require|import|struct|actor|func|let|private|async|throws|export|const|if|null|true|false|mapping|address|library|internal|view|memory)\b/g,'<b class="key">$1</b>').replace(/\b(SidebandAccount|IdentityRegistry|PermissionPolicy|LocalVault|MessageService|PhoneShell|authorize|sealMessage|system|services|invariant)\b/g,'<b class="fn">$1</b>').replace(/("[^"]*")/g,'<b class="value">$1</b>');return `<span class="line">${text||" "}</span>`}).join("")}
let activeFile="manifest";
function renderFile(key){const file=sources[key];if(!file||!q("#codeView"))return;activeFile=key;q("#currentPath").textContent=file.path;q("#language").textContent=file.lang;q("#lineCount").textContent=file.code.split("\n").length+" LINES";q("#codeView").innerHTML=highlight(file.code);qa("[data-file]").forEach(b=>b.classList.toggle("active",b.dataset.file===key));q("#readState").textContent="OBJECT READY"}
qa("[data-file]").forEach(b=>b.onclick=()=>{q("#readState").textContent="READING OBJECT";setTimeout(()=>renderFile(b.dataset.file),90)});
qa("[data-folder]").forEach(b=>b.onclick=()=>{const body=q(`[data-folder-body="${b.dataset.folder}"]`);body.classList.toggle("closed");b.querySelector("i").textContent=body.classList.contains("closed")?"▸":"▾"});
let expanded=true;q("#expandAll").onclick=()=>{expanded=!expanded;qa("[data-folder-body]").forEach(x=>x.classList.toggle("closed",!expanded));qa("[data-folder] i").forEach(i=>i.textContent=expanded?"▾":"▸");q("#expandAll").textContent=expanded?"COLLAPSE ALL":"EXPAND ALL"};
if(q("#copyCode"))q("#copyCode").onclick=async()=>{await navigator.clipboard.writeText(sources[activeFile].code);q("#copyCode").textContent="COPIED";setTimeout(()=>q("#copyCode").textContent="COPY",1200)};
q("#copyAddress").onclick=async()=>{if(!SIDEBAND_CA){notify("CONTRACT ADDRESS TBA");return}await navigator.clipboard.writeText(SIDEBAND_CA);q("#copyAddress").textContent="CA / COPIED";setTimeout(()=>q("#copyAddress").textContent=`CA / ${SIDEBAND_CA.slice(0,6)}...${SIDEBAND_CA.slice(-4)}`,1200)};
renderFile("manifest");
sources.readme={path:"README.md",lang:"MARKDOWN",code:`# Sideband

Sideband is a user-owned system layer for the iPhone.

It connects six primitives:
- identity
- contacts
- encrypted messages
- applications
- payments
- permissions

Private execution stays on device. Robinhood Chain provides
shared ownership, authorization and settlement.

## Run locally

    npm run dev

No dependencies or build step are required.`};
sources.package={path:"package.json",lang:"JSON",code:`{
  "name": "sideband-system",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node server.mjs",
    "start": "node server.mjs"
  }
}`};
const repository={
 root:[
  {type:"folder",name:"ios",note:"Build native iPhone system interface",time:"2 min ago"},
  {type:"folder",name:"contracts",note:"Add smart account and permission contracts",time:"18 min ago"},
  {type:"folder",name:"runtime",note:"Define local-first capability runtime",time:"32 min ago"},
  {type:"folder",name:"docs",note:"Document architecture and threat model",time:"1 hour ago"},
  {type:"file",name:"README.md",key:"readme",note:"Explain the Sideband system",time:"1 hour ago"},
  {type:"file",name:"package.json",key:"package",note:"Configure dependency-free local server",time:"2 hours ago"}
 ],
 ios:[
  {type:"back",name:"..",note:"Return to repository root",time:""},
  {type:"file",name:"SidebandApp.swift",key:"shell",note:"Compose the native phone shell",time:"2 min ago"},
  {type:"file",name:"LocalVault.swift",key:"vault",note:"Protect local keys and private state",time:"7 min ago"},
  {type:"file",name:"ContactService.swift",key:"contacts",note:"Resolve private contacts to identities",time:"9 min ago"},
  {type:"file",name:"MessageService.swift",key:"messages",note:"Send encrypted message envelopes",time:"12 min ago"}
 ],
 contracts:[
  {type:"back",name:"..",note:"Return to repository root",time:""},
  {type:"file",name:"SidebandAccount.sol",key:"account",note:"Execute intents through a smart account",time:"18 min ago"},
  {type:"file",name:"IdentityRegistry.sol",key:"registry",note:"Register public identity commitments",time:"21 min ago"},
  {type:"file",name:"PermissionPolicy.sol",key:"permission",note:"Enforce scoped application access",time:"24 min ago"}
 ],
 runtime:[
  {type:"back",name:"..",note:"Return to repository root",time:""},
  {type:"file",name:"system.manifest",key:"manifest",note:"Declare system services and invariants",time:"32 min ago"},
  {type:"file",name:"policy-engine.ts",key:"policy",note:"Authorize local application intents",time:"38 min ago"},
  {type:"file",name:"message-envelope.ts",key:"envelope",note:"Seal messages for relay transport",time:"42 min ago"}
 ],
 docs:[
  {type:"back",name:"..",note:"Return to repository root",time:""},
  {type:"file",name:"ARCHITECTURE.md",key:"architecture",note:"Describe the three system layers",time:"1 hour ago"},
  {type:"file",name:"THREAT-MODEL.md",key:"threat",note:"Define protected assets and invariants",time:"1 hour ago"}
 ]
};
let currentDirectory="root";
function renderRepository(directory="root"){
 currentDirectory=directory;
 const rows=repository[directory];
 q("#repoList").className="repo-list";
 q("#repoPath").textContent=directory==="root"?"sideband-system /":`sideband-system / ${directory} /`;
 q("#repoCount").textContent=rows.length+" ITEMS";
 q("#repoList").innerHTML=rows.map(row=>`<button class="repo-row ${row.type}" data-kind="${row.type}" data-name="${row.name}" ${row.key?`data-key="${row.key}"`:""}><i>${row.type==="folder"?"▰":row.type==="back"?"↰":"◇"}</i><span><b>${row.name}</b><em>${row.note}</em></span><time>${row.time}</time></button>`).join("");
 qa(".repo-row").forEach(row=>row.onclick=()=>{
  if(row.dataset.kind==="folder")renderRepository(row.dataset.name);
  else if(row.dataset.kind==="back")renderRepository("root");
  else openRepositoryFile(row.dataset.key)
 });
}
async function openRepositoryFile(key){
 const file=sources[key];if(!file)return;
 const returnDirectory=currentDirectory;
 const sourcePaths={shell:"ios/Sideband/SidebandApp.swift",vault:"ios/Sideband/LocalVault.swift",contacts:"ios/Sideband/ContactService.swift",messages:"ios/Sideband/MessageService.swift",account:"contracts/SidebandAccount.sol",registry:"contracts/IdentityRegistry.sol",permission:"contracts/PermissionPolicy.sol",manifest:"config/network.json",policy:"src/core/policy.mjs",envelope:"src/core/message.mjs",architecture:"README.md",threat:"src/core/identity.mjs",readme:"README.md",package:"package.json"};
 const path=sourcePaths[key]||file.path.replaceAll(" / ","/");
 let code=file.code;
 try{const result=await api(`/api/source?path=${encodeURIComponent(path)}`);code=result.source}catch(error){notify(error.message.toUpperCase())}
 q("#repoPath").textContent=path;
 q("#repoCount").textContent=code.split("\n").length+" LINES";
 const list=q("#repoList");list.className="repo-list file-open";
 list.innerHTML=`<div class="inline-file-head"><button id="repoBack">&larr; ${returnDirectory==="root"?"ROOT":returnDirectory.toUpperCase()}</button><span>${file.lang}</span><button id="repoCopy">COPY</button></div><pre class="inline-code">${highlight(code)}</pre>`;
 q("#repoBack").onclick=()=>renderRepository(returnDirectory);
 q("#repoCopy").onclick=async()=>{await navigator.clipboard.writeText(code);q("#repoCopy").textContent="COPIED";setTimeout(()=>{if(q("#repoCopy"))q("#repoCopy").textContent="COPY"},1200)};
}
q("#expandAll").onclick=()=>renderRepository("root");
renderRepository();
let liveRepositoryTree=null;
function languageFor(path){const ext=path.split(".").pop().toLowerCase();return({swift:"SWIFT",sol:"SOLIDITY",mjs:"JAVASCRIPT",js:"JAVASCRIPT",json:"JSON",md:"MARKDOWN",css:"CSS",html:"HTML"}[ext]||"TEXT")}
function noteFor(path,type){if(type==="directory")return "Source directory";const ext=path.split(".").pop();return({swift:"Native iPhone source",sol:"EVM smart contract",mjs:"Node runtime module",js:"Browser application",json:"Configuration and state",md:"Project documentation",css:"Interface styles",html:"Application shell"}[ext]||"Project source file")}
function renderLiveDirectory(node,parts=[]){
 const entries=Object.entries(node).sort((a,b)=>(a[1].type===b[1].type?a[0].localeCompare(b[0]):a[1].type==="directory"?-1:1));
 q("#repoList").className="repo-list";
 q("#repoPath").textContent=`sideband-system / ${parts.join(" / ")}`;
 q("#repoCount").textContent=entries.length+" ITEMS";
 const back=parts.length?`<button class="repo-row back" data-live-back><i>↰</i><span><b>..</b><em>Return to parent directory</em></span><time></time></button>`:"";
 q("#repoList").innerHTML=back+entries.map(([name,item])=>`<button class="repo-row ${item.type}" data-live-name="${name}"><i>${item.type==="directory"?"▰":"◇"}</i><span><b>${name}</b><em>${noteFor(name,item.type)}</em></span><time>WORKTREE</time></button>`).join("");
 if(parts.length)q("[data-live-back]").onclick=()=>{const parentParts=parts.slice(0,-1);let parent=liveRepositoryTree;parentParts.forEach(part=>parent=parent[part].children);renderLiveDirectory(parent,parentParts)};
 qa("[data-live-name]").forEach(button=>button.onclick=()=>{const name=button.dataset.liveName,item=node[name];if(item.type==="directory")renderLiveDirectory(item.children,[...parts,name]);else openLiveFile(item.path,node,parts)});
 q("#expandAll").onclick=()=>renderLiveDirectory(liveRepositoryTree,[]);
}
async function openLiveFile(path,parentNode,parentParts){
 try{
  const result=await api(`/api/source?path=${encodeURIComponent(path)}`),code=result.source,lang=languageFor(path);
  q("#repoPath").textContent=path;q("#repoCount").textContent=code.split("\n").length+" LINES";
  const list=q("#repoList");list.className="repo-list file-open";
  list.innerHTML=`<div class="inline-file-head"><button id="repoBack">&larr; ${parentParts.length?parentParts.at(-1).toUpperCase():"ROOT"}</button><span>${lang}</span><button id="repoCopy">COPY</button></div><pre class="inline-code">${highlight(code)}</pre>`;
  q("#repoBack").onclick=()=>renderLiveDirectory(parentNode,parentParts);
  q("#repoCopy").onclick=async()=>{await navigator.clipboard.writeText(code);q("#repoCopy").textContent="COPIED";setTimeout(()=>{if(q("#repoCopy"))q("#repoCopy").textContent="COPY"},1200)};
 }catch(error){notify(error.message.toUpperCase())}
}
async function loadLiveRepository(){try{liveRepositoryTree=await api("/api/repository");renderLiveDirectory(liveRepositoryTree,[])}catch{notify("REPOSITORY API OFFLINE")}}
loadLiveRepository();
