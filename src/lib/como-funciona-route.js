// The route lives apart from the concept data so the router can recognise #como-funciona
// without pulling the whole catalogue into the first load.
export function comoFuncionaRoute(hash = '') {
    if (hash === '#como-funciona') return { id: null };
    const match = /^#como-funciona=([a-z0-9-]+)$/.exec(hash);
    return match ? { id: match[1] } : null;
}
