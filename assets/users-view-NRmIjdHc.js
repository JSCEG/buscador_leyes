import{s as v}from"./index-C9dQWQPz.js";const p=864e5,d=t=>String(t??"").replace(/[&<>"']/g,l=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[l]),f=t=>String(t??"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();function b(t,l=Date.now()){if(!t)return"Nunca";const i=new Date(t).getTime();if(Number.isNaN(i))return"Nunca";const e=Math.max(0,l-i),n=Math.floor(e/6e4);if(n<1)return"Ahora";if(n<60)return`Hace ${n} min`;const c=Math.floor(n/60);if(c<24)return`Hace ${c} h`;const s=Math.floor(e/p);if(s===1)return"Ayer";if(s<30)return`Hace ${s} días`;const o=Math.floor(s/30.44);if(o<12)return`Hace ${o} ${o===1?"mes":"meses"}`;const r=Math.floor(s/365.25);return`Hace ${r} ${r===1?"año":"años"}`}function g(t,l=Date.now()){const i=e=>t.filter(n=>n.ultima_actividad&&l-new Date(n.ultima_actividad).getTime()<=e*p).length;return{total:t.length,confirmados:t.filter(e=>e.confirmado).length,activos7:i(7),activos30:i(30)}}const m=t=>t?new Date(t).toLocaleString("es-MX",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}):"Sin registro",$=t=>t?new Date(t).toLocaleDateString("es-MX",{day:"numeric",month:"short",year:"numeric"}):"—";function _(t){let l=!0,i=[];t.innerHTML=`
        <section class="us-view" aria-labelledby="us-title">
            <header class="us-head">
                <p class="us-kicker">Solo visible para tu cuenta</p>
                <h1 id="us-title">Usuarios registrados</h1>
                <p class="us-intro">Quién tiene cuenta en el buscador y cuándo fue la última vez que entró.</p>
            </header>
            <div class="us-tiles" data-tiles></div>
            <div class="us-tools">
                <label class="us-search"><span class="us-sr">Buscar usuario</span>
                    <input type="search" placeholder="Buscar por correo o nombre" autocomplete="off" data-q></label>
                <button type="button" class="us-btn" data-reload>Actualizar</button>
            </div>
            <div data-list><p class="us-muted">Cargando usuarios…</p></div>
            <p class="us-note"><b>Último acceso</b>: última vez que inició sesión. <b>Última actividad</b>: última vez que usó el sitio con su sesión abierta (quien se queda conectado no vuelve a iniciar sesión).</p>
        </section>`;const e=s=>t.querySelector(s);function n(){const s=Date.now(),o=g(i,s);e("[data-tiles]").innerHTML=[["Registrados",o.total],["Correo confirmado",o.confirmados],["Activos 7 días",o.activos7],["Activos 30 días",o.activos30]].map(([a,u])=>`<div class="us-tile"><b>${u.toLocaleString("es-MX")}</b><span>${a}</span></div>`).join("");const r=f(e("[data-q]").value.trim()),h=r?i.filter(a=>f(`${a.email} ${a.nombre}`).includes(r)):i;if(!h.length){e("[data-list]").innerHTML=`<p class="us-muted">${i.length?"Ningún usuario coincide.":"Todavía no hay usuarios registrados."}</p>`;return}e("[data-list]").innerHTML=`
            <table class="us-table">
                <thead><tr><th scope="col">Usuario</th><th scope="col">Registro</th><th scope="col">Último acceso</th><th scope="col">Última actividad</th><th scope="col">Estado</th></tr></thead>
                <tbody>${h.map(a=>{const u=a.ultima_actividad&&s-new Date(a.ultima_actividad).getTime()<=7*p;return`<tr>
                        <td data-label="Usuario"><strong>${d(a.nombre||a.email)}</strong>${a.nombre?`<small>${d(a.email)}</small>`:""}</td>
                        <td data-label="Registro">${$(a.registrado)}</td>
                        <td data-label="Último acceso"><span title="${d(m(a.ultimo_acceso))}">${b(a.ultimo_acceso,s)}</span><small>${d(m(a.ultimo_acceso))}</small></td>
                        <td data-label="Última actividad"><span class="${u?"us-recent":""}" title="${d(m(a.ultima_actividad))}">${b(a.ultima_actividad,s)}</span>${a.sesiones_abiertas?`<small>${a.sesiones_abiertas} ${a.sesiones_abiertas===1?"sesión abierta":"sesiones abiertas"}</small>`:""}</td>
                        <td data-label="Estado">${a.confirmado?'<span class="us-chip is-ok">Confirmado</span>':'<span class="us-chip">Sin confirmar</span>'}</td>
                    </tr>`}).join("")}</tbody>
            </table>`}async function c(){e("[data-reload]").disabled=!0;const{data:s,error:o}=await v.rpc("site_list_users");if(l){if(e("[data-reload]").disabled=!1,o){const r=o.code==="42501"||/SITE_OWNER_REQUIRED/.test(o.message||"");e("[data-tiles]").innerHTML="",e("[data-list]").innerHTML=`<p class="us-muted">${r?"Esta sección solo está disponible para la cuenta dueña del sitio.":"No se pudo cargar la lista. Intenta de nuevo."}</p>`;return}i=s||[],n()}}return e("[data-q]").addEventListener("input",()=>{i.length&&n()}),e("[data-reload]").addEventListener("click",c),c(),{destroy(){l=!1,t.replaceChildren()}}}export{b as relativeTime,_ as renderUsersView,g as summarizeUsers};
