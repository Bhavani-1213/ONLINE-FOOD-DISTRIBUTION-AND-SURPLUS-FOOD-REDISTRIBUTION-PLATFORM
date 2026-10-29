const API = "/api";
let token = localStorage.getItem("foodshare_token");
let user = JSON.parse(localStorage.getItem("foodshare_user") || "null");

const $ = id => document.getElementById(id);
const pages = ["home","auth","food","dashboard","create"];

function escapeHtml(value="") {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function showPage(id) {
  pages.forEach(p => $(p)?.classList.toggle("hidden", p !== id));
  if (id === "food") loadFood();
  if (id === "dashboard") loadDashboard();
  if (id === "home") loadStats();
  window.scrollTo({top:0, behavior:"smooth"});
}
function toast(msg){$("toast").textContent=msg;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2600)}
function setAuthMessage(msg, ok=false){$("auth-message").textContent=msg;$("auth-message").classList.toggle("success",ok)}
async function api(path, options={}) {
  const headers = {"Content-Type":"application/json", ...(options.headers||{})};
  if(token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(API+path,{...options,headers});
  const data = await res.json().catch(()=>({message:"Invalid server response"}));
  if(!res.ok) throw new Error(data.message || "Request failed");
  return data;
}
function updateNav(){
  const nav = $("nav");
  nav.innerHTML = user
    ? `<a href="#food" data-action="show-food">Browse</a><a href="#dashboard" data-action="show-dashboard">Dashboard</a><span class="muted">${escapeHtml(user.name)}</span><button data-action="logout">Logout</button>`
    : `<a href="#food" data-action="show-food">Browse</a><button data-action="show-login">Login</button>`;
}
document.addEventListener("click", e=>{
  const action=e.target.closest("[data-action]")?.dataset.action;
  if(!action)return;
  if(action==="show-login"){showPage("auth");setTab("login")}
  if(action==="show-register"){showPage("auth");setTab("register")}
  if(action==="show-food"){showPage("food")}
  if(action==="show-dashboard"){if(!user){showPage("auth");setTab("login")}else showPage("dashboard")}
  if(action==="show-create"){if(!user){showPage("auth");setTab("login")}else showPage("create")}
  if(action==="logout"){token=null;user=null;localStorage.clear();updateNav();showPage("home");toast("Logged out")}
  if(action==="claim") claimFood(e.target.closest("[data-id]").dataset.id)
  if(action==="cancel-claim") cancelClaim(e.target.closest("[data-id]").dataset.id)
});
function setTab(tab){
  $("login-form").classList.toggle("hidden",tab!=="login");
  $("register-form").classList.toggle("hidden",tab!=="register");
  document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.dataset.tab===tab));
}
document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>setTab(t.dataset.tab)));

$("login-form").addEventListener("submit",async e=>{
  e.preventDefault(); setAuthMessage("");
  try{
    const d=await api("/auth/login",{method:"POST",body:JSON.stringify({email:$("login-email").value,password:$("login-password").value})});
    token=d.token;user=d.user;localStorage.setItem("foodshare_token",token);localStorage.setItem("foodshare_user",JSON.stringify(user));
    updateNav();toast("Welcome back");showPage("dashboard");
  }catch(err){setAuthMessage(err.message)}
});
$("register-form").addEventListener("submit",async e=>{
  e.preventDefault();setAuthMessage("");
  try{
    const d=await api("/auth/register",{method:"POST",body:JSON.stringify({name:$("reg-name").value,email:$("reg-email").value,password:$("reg-password").value,role:$("reg-role").value})});
    token=d.token;user=d.user;localStorage.setItem("foodshare_token",token);localStorage.setItem("foodshare_user",JSON.stringify(user));
    updateNav();toast("Account created");showPage("dashboard");
  }catch(err){setAuthMessage(err.message)}
});
$("food-form").addEventListener("submit",async e=>{
  e.preventDefault();$("food-message").textContent="";
  try{
    await api("/food",{method:"POST",body:JSON.stringify({
      title:$("food-name").value,category:$("food-category").value,quantity:Number($("food-quantity").value),
      expiry_at:new Date($("food-expiry").value).toISOString(),pickup_location:$("food-location").value,description:$("food-description").value
    })});
    e.target.reset();$("food-message").textContent="Food listing published successfully."; $("food-message").classList.add("success");toast("Food listed");showPage("food");
  }catch(err){$("food-message").textContent=err.message}
});
$("search-food").addEventListener("input",loadFood);
$("status-filter").addEventListener("change",loadFood);

async function loadStats(){
  try{const d=await api("/stats");$("stat-meals").textContent=d.availableMeals;$("stat-donors").textContent=d.donors;$("stat-claimed").textContent=d.redistributedMeals}catch{}
}
async function loadFood(){
  try{
    const q=encodeURIComponent($("search-food").value||"");
    const status=encodeURIComponent($("status-filter").value||"");
    const d=await api(`/food?search=${q}&status=${status}`);
    $("food-list").innerHTML=d.items.length?d.items.map(f=>`
      <article class="card">
        <span class="badge">${escapeHtml(f.category)} · ${escapeHtml(f.status)}</span>
        <h3>${escapeHtml(f.title)}</h3>
        <p><strong>${f.quantity}</strong> servings</p>
        <p>Pickup: ${escapeHtml(f.pickup_location)}</p>
        <p>Best before: ${new Date(f.expiry_at).toLocaleString()}</p>
        <p>${escapeHtml(f.description||"No description provided.")}</p>
        ${user && f.status==="available" && user.role!=="donor" ? `<button class="btn primary" data-action="claim" data-id="${f.id}">Request Food</button>` : ""}
        ${user && user.id===f.donor_id ? `<small class="muted">Your listing</small>` : ""}
      </article>`).join(""):`<div class="empty">No matching food listings found.</div>`;
  }catch(err){$("food-list").innerHTML=`<div class="empty">${escapeHtml(err.message)}</div>`}
}
async function claimFood(id){
  if(!confirm("Request this food for redistribution?"))return;
  try{await api(`/food/${id}/claim`,{method:"POST"});toast("Request submitted");loadFood();}catch(err){toast(err.message)}
}
async function cancelClaim(id){
  if(!confirm("Cancel this request?"))return;
  try{await api(`/claims/${id}/cancel`,{method:"PATCH"});toast("Request cancelled");loadDashboard();}catch(err){toast(err.message)}
}
async function loadDashboard(){
  if(!user)return;
  $("dashboard-title").textContent=`Hello, ${user.name}`;
  try{
    const d=await api("/dashboard");
    const cards=`<div class="dashboard-grid"><div class="metric"><span>Role</span><strong>${escapeHtml(user.role)}</strong></div><div class="metric"><span>My listings</span><strong>${d.listings.length}</strong></div><div class="metric"><span>My requests</span><strong>${d.claims.length}</strong></div></div>`;
    const listings=d.listings.length?`<h3>My food listings</h3><div class="table-wrap"><table><thead><tr><th>Food</th><th>Quantity</th><th>Status</th><th>Pickup</th></tr></thead><tbody>${d.listings.map(x=>`<tr><td>${escapeHtml(x.title)}</td><td>${x.quantity}</td><td>${escapeHtml(x.status)}</td><td>${escapeHtml(x.pickup_location)}</td></tr>`).join("")}</tbody></table></div>`:"";
    const claims=d.claims.length?`<h3>My requests</h3><div class="table-wrap"><table><thead><tr><th>Food</th><th>Quantity</th><th>Status</th><th>Action</th></tr></thead><tbody>${d.claims.map(x=>`<tr><td>${escapeHtml(x.food_title)}</td><td>${x.quantity}</td><td>${escapeHtml(x.status)}</td><td>${x.status==="requested"?`<button class="btn secondary" data-action="cancel-claim" data-id="${x.id}">Cancel</button>`:"—"}</td></tr>`).join("")}</tbody></table></div>`:"";
    $("dashboard-content").innerHTML=cards+listings+claims;
  }catch(err){$("dashboard-content").innerHTML=`<div class="panel">${escapeHtml(err.message)}</div>`}
}
updateNav();loadStats();
showPage("home");
